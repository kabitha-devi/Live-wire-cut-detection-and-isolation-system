import { create } from 'zustand';

export type PoleData = {
    id: number;
    position: [number, number, number];
    voltage: number;
    current: number;
    name: string;
    status: 'NORMAL' | 'WARNING' | 'TRIPPED';
    faultTimer: number;
};

export type WireData = {
    id: number;
    from: number; // Pole ID
    to: number;   // Pole ID
    phase: 0 | 1 | 2;
    status: 'CONNECTED' | 'BROKEN';
};

interface SimulationState {
    transformerStatus: 'ON' | 'TRIPPED';
    poles: PoleData[];
    wires: WireData[];
    logs: string[];
    lastSms: string | null;

    // Actions
    toggleTransformer: () => void;
    resetSimulation: () => void;
    breakWire: (wireId: number) => void;
    repairWire: (wireId: number) => void;
    addLog: (msg: string) => void;
    clearSms: () => void;

    // Physics Tick
    updatePhysics: (dt: number) => void;
}

// Configuration
const POLE_COUNT = 10;
const POLE_SPACING = 10;
const START_X = -45; // Center the line roughly around 0

// Generate Poles
const INITIAL_POLES: PoleData[] = Array.from({ length: POLE_COUNT }, (_, i) => {
    const id = i + 1;
    return {
        id,
        position: [START_X + i * POLE_SPACING, 0, 0],
        voltage: 0,
        current: 0,
        name: `Pole ${id}`,
        status: 'NORMAL',
        faultTimer: 0
    };
});

// Generate Wires (3 phases per span)
const INITIAL_WIRES: WireData[] = [];
let wireIdCounter = 1;

for (let i = 0; i < POLE_COUNT - 1; i++) {
    const fromPole = i + 1;
    const toPole = i + 2;
    // 3 phases
    for (let phase = 0; phase < 3; phase++) {
        INITIAL_WIRES.push({
            id: wireIdCounter++,
            from: fromPole,
            to: toPole,
            phase: phase as 0 | 1 | 2,
            status: 'CONNECTED'
        });
    }
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
    transformerStatus: 'ON',
    poles: JSON.parse(JSON.stringify(INITIAL_POLES)),
    wires: JSON.parse(JSON.stringify(INITIAL_WIRES)),
    logs: [],
    lastSms: null,

    toggleTransformer: () => set((state) => ({
        transformerStatus: state.transformerStatus === 'ON' ? 'TRIPPED' : 'ON',
        poles: state.poles.map(p => ({ ...p, status: 'NORMAL', faultTimer: 0 })),
        logs: [`[${new Date().toLocaleTimeString()}] Transformer toggled to ${state.transformerStatus === 'ON' ? 'TRIPPED' : 'ON'}`, ...state.logs],
        lastSms: null
    })),

    resetSimulation: () => set({
        transformerStatus: 'ON',
        poles: JSON.parse(JSON.stringify(INITIAL_POLES)),
        wires: JSON.parse(JSON.stringify(INITIAL_WIRES)),
        logs: [`[${new Date().toLocaleTimeString()}] System Reset`],
        lastSms: null
    }),

    addLog: (msg) => set(state => ({ logs: [msg, ...state.logs].slice(0, 50) })),

    clearSms: () => set({ lastSms: null }),

    breakWire: (wireId) => {
        const { wires, addLog } = get();
        const wire = wires.find(w => w.id === wireId);
        if (wire) {
            set((state) => ({
                wires: state.wires.map(w => w.id === wireId ? { ...w, status: 'BROKEN' } : w)
            }));
            addLog(`[${new Date().toLocaleTimeString()}] Wire BROKEN: Pole ${wire.from} -> Pole ${wire.to} (Phase ${wire.phase})`);
        }
    },

    repairWire: (wireId) => {
        const { wires, addLog } = get();
        const wire = wires.find(w => w.id === wireId);
        if (wire) {
            set((state) => ({
                wires: state.wires.map(w => w.id === wireId ? { ...w, status: 'CONNECTED' } : w),
                poles: state.poles.map(p => ({ ...p, status: 'NORMAL', faultTimer: 0 })),
                lastSms: null // Clear SMS on repair
            }));
            addLog(`[${new Date().toLocaleTimeString()}] Wire REPAIRED: Pole ${wire.from} -> Pole ${wire.to} (Phase ${wire.phase})`);
        }
    },

    updatePhysics: (dt) => {
        const { transformerStatus, wires, poles, logs } = get();
        let newLogs: string[] = [];
        let smsTriggered = false;
        let smsContent = "";

        // 1. Initial State Check
        if (transformerStatus === 'TRIPPED') {
            set({ poles: poles.map(p => ({ ...p, voltage: 0, current: 0 })) });
            return;
        }

        // 2. Voltage Propagation (Series from Pole 1 to N)
        const SOURCE_VOLTAGE = 230;

        const isConnected = (idFrom: number, idTo: number) => {
            const spanLimit = wires.filter(w => w.from === idFrom && w.to === idTo);
            return spanLimit.some(w => w.status === 'CONNECTED');
        };

        const newPoles = [...poles];

        // Pole 1 (Source)
        if (newPoles[0].status !== 'TRIPPED') {
            newPoles[0].voltage = SOURCE_VOLTAGE;
        } else {
            newPoles[0].voltage = 0;
        }

        // Propagate Voltage downstream
        for (let i = 1; i < newPoles.length; i++) {
            const prevPole = newPoles[i - 1];
            const currPole = newPoles[i];

            // If previous has voltage, connection exists, and current is not tripped
            if (prevPole.voltage > 0 && isConnected(prevPole.id, currPole.id) && currPole.status !== 'TRIPPED') {
                currPole.voltage = SOURCE_VOLTAGE;
            } else {
                currPole.voltage = 0;
            }
        }

        // 3. Current Propagation (Distributed Load)
        // Iterate BACKWARDS from end (Pole N) to start (Pole 1)
        const LOAD_PER_POLE = 5; // 5 Amps per pole

        for (let i = newPoles.length - 1; i >= 0; i--) {
            const currPole = newPoles[i];

            // Base load if energized
            let load = currPole.voltage > 0 ? LOAD_PER_POLE : 0;
            let outgoingCurrent = 0;

            // Check connection to next pole (if exists)
            if (i < newPoles.length - 1) {
                const nextPole = newPoles[i + 1];
                // If connected to next pole, pass its current upstream
                if (isConnected(currPole.id, nextPole.id)) {
                    outgoingCurrent = nextPole.current;
                }
            }

            currPole.current = load + outgoingCurrent;
        }


        // 4. Fault Detection (Per Pole)
        // Iterate through all spans (Pole 1 to N-1)

        for (let i = 0; i < newPoles.length - 1; i++) {
            const currPole = newPoles[i];
            const nextPole = newPoles[i + 1];

            const prevStatus = currPole.status;

            if (currPole.status === 'TRIPPED') continue;

            if (currPole.voltage === 0) {
                currPole.status = 'NORMAL';
                currPole.faultTimer = 0;
                continue;
            }

            // Check outgoing wires to next pole
            const spanWires = wires.filter(w => w.from === currPole.id && w.to === nextPole.id);
            const hasBreak = spanWires.some(w => w.status === 'BROKEN');

            if (hasBreak) {
                currPole.faultTimer += dt;
                currPole.status = 'WARNING';

                if (currPole.faultTimer > 3) {
                    currPole.status = 'TRIPPED';
                    currPole.faultTimer = 0;

                    const logMsg = `[${new Date().toLocaleTimeString()}] CRITICAL: Pole ${currPole.id} TRIPPED! Fault isolated.`;
                    // Prevent duplicate logs if multiple logic ticks hit same frame (though unlikely with state diff)
                    if (!logs.includes(logMsg)) newLogs.push(logMsg);

                    smsTriggered = true;
                    smsContent = `ALERT: FAULT DETECTED AT POLE ${currPole.id}. POWER TRIP INITIATED. DISPATCH CREW IMMEDIATELY.`;
                } else if (prevStatus === 'NORMAL') {
                    newLogs.push(`[${new Date().toLocaleTimeString()}] WARNING: Fault detected at Pole ${currPole.id}. Timer started.`);
                }
            } else {
                currPole.status = 'NORMAL';
                currPole.faultTimer = 0;
            }
        }

        if (newLogs.length > 0 || smsTriggered) {
            set((state) => ({
                poles: newPoles,
                logs: [...newLogs, ...logs].slice(0, 50),
                lastSms: smsTriggered ? smsContent : state.lastSms
            }));
        } else {
            set({ poles: newPoles });
        }
    }
}));
