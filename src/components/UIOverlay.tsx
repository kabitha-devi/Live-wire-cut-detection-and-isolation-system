import React, { useEffect, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { AlertTriangle, Wifi, RotateCcw, Power, Terminal, Smartphone, MessageSquare } from 'lucide-react';

export const UIOverlay: React.FC = () => {
    const { transformerStatus, faultLocation, faultTimer, resetSimulation, toggleTransformer, logs, lastSms, clearSms } = useSimulationStore();
    const [showPhone, setShowPhone] = useState(true);

    // Auto-open phone when SMS arrives
    useEffect(() => {
        if (lastSms) setShowPhone(true);
    }, [lastSms]);

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex justify-between items-start pointer-events-auto">
                <div className="bg-black/70 p-4 rounded-lg backdrop-blur text-white border border-gray-700">
                    <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                        <Wifi className="w-6 h-6" />
                        Smart Grid Guard
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Distributed Live Wire Cut Detection System</p>
                </div>

                <div className="bg-black/70 p-4 rounded-lg backdrop-blur text-white border border-gray-700 min-w-[200px]">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">System Status</h2>

                    {transformerStatus === 'ON' && !faultLocation && (
                        <div className="flex items-center gap-2 text-green-400 font-bold">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            NORMAL OPERATION
                        </div>
                    )}

                    {transformerStatus === 'ON' && faultLocation && (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                <AlertTriangle className="w-5 h-5" />
                                FAULT DETECTED
                            </div>
                            <div className="text-xs text-yellow-200 pl-7">
                                Scanning Logic... ({faultTimer.toFixed(1)}s / 3.0s)
                            </div>
                        </div>
                    )}

                    {transformerStatus === 'TRIPPED' && (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-red-500 font-bold">
                                <Power className="w-5 h-5" />
                                TRANSFORMER TRIPPED
                            </div>
                            <div className="text-xs text-red-200 pl-7">
                                Protective relay activated.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Log Panel */}
            <div className="absolute top-32 right-6 pointer-events-auto w-80">
                <div className="bg-black/80 rounded-lg border border-gray-700 text-white overflow-hidden flex flex-col max-h-[300px]">
                    <div className="p-2 border-b border-gray-700 bg-gray-900/50 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-green-400" />
                        <span className="font-mono text-xs font-bold text-gray-300">SYSTEM LOG</span>
                    </div>
                    <div className="p-3 overflow-y-auto font-mono text-[10px] space-y-1 h-full scrollbar-thin scrollbar-thumb-gray-600">
                        {logs.length === 0 && <p className="text-gray-500 italic">No events recorded.</p>}
                        {logs.map((log, i) => (
                            <div key={i} className="border-l-2 border-green-500 pl-2 py-0.5 animate-in fade-in slide-in-from-right-2 duration-300">
                                <span className={log.includes('CRITICAL') || log.includes('BROKEN') ? 'text-red-400' : log.includes('WARNING') ? 'text-yellow-400' : 'text-gray-300'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Authority Phone Simulation */}
            <div className={`absolute bottom-6 right-6 pointer-events-auto transition-transform duration-500 ${showPhone ? 'translate-y-0' : 'translate-y-[120%]'}`}>
                <div className="relative w-64 h-[500px] bg-gray-900 rounded-[2rem] border-4 border-gray-800 shadow-2xl overflow-hidden flex flex-col">
                    {/* Phone Notch/Header */}
                    <div className="absolute top-0 w-full h-6 bg-black z-10 flex justify-center">
                        <div className="w-20 h-4 bg-gray-800 rounded-b-lg"></div>
                    </div>

                    {/* Screen Content */}
                    <div className="flex-1 bg-slate-100 flex flex-col p-4 pt-10 font-sans text-gray-800">
                        <div className="text-center text-xs text-gray-500 mb-4">Authority Mobile</div>

                        {/* Message List */}
                        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                            {!lastSms && <p className="text-center text-gray-400 text-sm mt-10">No new messages</p>}

                            {lastSms && (
                                <div className="bg-gray-200 p-3 rounded-lg rounded-tl-none self-start relative animate-in zoom-in duration-300">
                                    <div className="absolute -top-3 left-0 text-[10px] text-gray-400">System Alert</div>
                                    <p className="text-sm font-medium text-red-600">
                                        {lastSms}
                                    </p>
                                    <div className="text-[10px] text-right text-gray-500 mt-1">Now</div>
                                </div>
                            )}
                        </div>

                        {/* Phone Nav Bar */}
                        <div className="mt-auto pt-4 border-t border-gray-300 flex justify-center">
                            <div className="w-16 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                    </div>

                    {/* Notification Overlay if phone is closed but active? (Not needed if we force open) */}
                </div>
            </div>


            {/* Sidebar / Controls */}
            <div className="pointer-events-auto self-end flex flex-col gap-2 mr-80">
                {/* Offset to avoid phone overlap */}
                <button
                    onClick={resetSimulation}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                    Reset System
                </button>
            </div>

            {/* Instruction Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-2 rounded-full">
                Click on a WIRE to simulate a cut/break. Watch the Phone!
            </div>

        </div>
    );
};
