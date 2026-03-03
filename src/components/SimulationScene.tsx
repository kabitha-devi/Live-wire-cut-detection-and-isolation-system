import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '../store/useSimulationStore';
import { Pole } from './Pole';
import { Wire } from './Wire';
import { Transformer } from './Transformer';

export const SimulationScene: React.FC = () => {
    const { poles, wires, transformerStatus, updatePhysics, toggleTransformer, breakWire, repairWire } = useSimulationStore();

    useFrame((_, dt) => {
        // Run the simulation 10x faster
        updatePhysics(dt * 10);
    });

    // Pole 1 is at -45. Let's put Transformer at -55.
    const TRANSFORMER_POS: [number, number, number] = [-55, 0, 0];

    return (
        <group>
            {/* Transformer Source */}
            <Transformer
                status={transformerStatus}
                position={TRANSFORMER_POS}
                onClick={toggleTransformer}
            />

            {/* Poles */}
            {poles.map(pole => (
                <Pole key={pole.id} data={pole} />
            ))}

            {/* Wires */}
            {wires.map(wire => {
                const startPole = poles.find(p => p.id === wire.from);
                const endPole = poles.find(p => p.id === wire.to);

                if (!startPole || !endPole) return null;

                // 3 Phases with offsets along Z axis
                const offsetZ = [-1.2, 0, 1.2][wire.phase];
                const offset: [number, number, number] = [0, 0, offsetZ];

                return (
                    <Wire
                        key={wire.id}
                        data={wire}
                        startPole={startPole}
                        endPole={endPole}
                        offset={offset}
                        onClick={() => {
                            if (wire.status === 'CONNECTED') breakWire(wire.id);
                            else repairWire(wire.id);
                        }}
                    />
                );
            })}

            {/* Connection from Transformer to Pole 1 (Visual only, always connected, 3 phases) */}
            <group>
                {[[-1.2], [0], [1.2]].map((zOffset, i) => (
                    <Wire
                        key={`source-${i}`}
                        data={{ id: 0, from: 0, to: 1, phase: i as any, status: 'CONNECTED' }}
                        startPole={{
                            id: 0,
                            position: TRANSFORMER_POS,
                            voltage: transformerStatus === 'ON' ? 230 : 0,
                            current: poles[0] ? poles[0].current : 0,
                            name: "Source",
                            status: 'NORMAL',
                            faultTimer: 0
                        }}
                        endPole={poles[0]}
                        offset={[0, 0, zOffset[0]]}
                        onClick={() => { }}
                    />
                ))}
            </group>

        </group>
    );
};
