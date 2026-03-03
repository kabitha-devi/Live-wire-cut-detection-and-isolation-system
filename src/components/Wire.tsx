import React, { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { Tube, Sparkles } from '@react-three/drei';
import { WireData, PoleData } from '../store/useSimulationStore';

interface WireProps {
    data: WireData;
    startPole: PoleData;
    endPole: PoleData;
    offset?: [number, number, number]; // [x, y, z] offset from pole center
    onClick: () => void;
}

export const Wire: React.FC<WireProps> = ({ data, startPole, endPole, offset = [0, 0, 0], onClick }) => {
    // Extract positions to ensure stable references for memoization
    // We use the values directly in the dependency array to be safe.

    const curve = useMemo(() => {
        // Adjust height for Transformer (ID 0) vs Poles
        const startY = startPole.id === 0 ? 6.0 : 7.8;
        const endY = endPole.id === 0 ? 6.0 : 7.8;

        // Apply offsets
        const offsetVec = new Vector3(...offset);

        // For transformer, maybe we need different offsets? 
        // Let's assume the passed offset works for poles. 
        // If start is transformer, we might need to clamp/adjust offset if bushings are closer.
        // For now, apply offset blindly.

        const start = new Vector3(startPole.position[0], startPole.position[1], startPole.position[2])
            .add(new Vector3(0, startY, 0))
            .add(offsetVec);

        const end = new Vector3(endPole.position[0], endPole.position[1], endPole.position[2])
            .add(new Vector3(0, endY, 0))
            .add(offsetVec);

        if (data.status === 'BROKEN') {
            // Broken wire visualization
            // Split into two dangling curves
            const mid = start.clone().lerp(end, 0.4);
            mid.y = 0; // Hits the ground

            const curve1 = new CatmullRomCurve3([
                start,
                start.clone().lerp(mid, 0.5).add(new Vector3(0, -2, 0)),
                mid
            ]);

            return { curve1, curve2: null };
        }

        const mid = start.clone().lerp(end, 0.5);
        mid.y -= 1.5; // Sag

        return {
            curve1: new CatmullRomCurve3([start, mid, end]),
            curve2: null
        };

    }, [startPole.position[0], startPole.position[2], endPole.position[0], endPole.position[2], data.status]);

    const isEnergized = startPole.voltage > 10;

    return (
        <group>
            <Tube args={[curve.curve1, 20, 0.05, 8, false]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <meshStandardMaterial
                    color={data.status === 'BROKEN' ? '#333' : (isEnergized ? '#fbbf24' : '#555')}
                    emissive={isEnergized && data.status !== 'BROKEN' ? '#fbbf24' : '#000'}
                    emissiveIntensity={data.status !== 'BROKEN' ? 0.5 : 0}
                />
            </Tube>

            {data.status === 'BROKEN' && isEnergized && (
                <group position={curve.curve1.getPoint(1)}>
                    {/* Electric Arc Effect */}
                    <Sparkles count={100} scale={3} size={5} speed={2} opacity={1} color="cyan" noise={2} />
                    <Sparkles count={50} scale={2} size={10} speed={1} opacity={0.5} color="white" noise={1} />
                </group>
            )}
        </group>
    );
};
