import React from 'react';
import { Text, Cylinder } from '@react-three/drei';
import { PoleData } from '../store/useSimulationStore';

interface PoleProps {
    data: PoleData;
}

export const Pole: React.FC<PoleProps> = ({ data }) => {
    return (
        <group position={data.position}>
            {/* Pole Body */}
            <Cylinder args={[0.2, 0.25, 8, 16]} position={[0, 4, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#8B4513" />
            </Cylinder>

            {/* Crossarm - Rotated 90deg to be perpendicular to line (which is along X) */}
            <mesh position={[0, 7.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
                <boxGeometry args={[3.5, 0.2, 0.2]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>

            {/* Insulators x3 */}
            <group position={[0, 7.6, 0]} rotation={[0, Math.PI / 2, 0]}>
                <mesh position={[-1.2, 0.1, 0]}>
                    <cylinderGeometry args={[0.08, 0.15, 0.3]} />
                    <meshStandardMaterial color="#eee" />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.08, 0.15, 0.3]} />
                    <meshStandardMaterial color="#eee" />
                </mesh>
                <mesh position={[1.2, 0.1, 0]}>
                    <cylinderGeometry args={[0.08, 0.15, 0.3]} />
                    <meshStandardMaterial color="#eee" />
                </mesh>
            </group>

            {/* Sensor Box - White */}
            <mesh position={[0.4, 6, 0]}>
                <boxGeometry args={[0.4, 0.6, 0.4]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Sensor Status Light */}
            <mesh position={[0.61, 6.1, 0]}>
                <circleGeometry args={[0.05]} />
                <meshBasicMaterial
                    color={
                        data.status === 'TRIPPED' ? '#ef4444' : // Red
                            data.status === 'WARNING' ? '#eab308' : // Yellow
                                '#22c55e' // Green
                    }
                />
            </mesh>

            {/* Data Display */}
            <group position={[0, 9, 0]}>
                <Text
                    color="white"
                    fontSize={0.5}
                    anchorY="bottom"
                    outlineWidth={0.05}
                    outlineColor="#000"
                >
                    {data.name}
                </Text>
                <Text
                    position={[0, -0.6, 0]}
                    // If tripped, label is Red. Else green if voltage > 0.
                    color={data.status === 'TRIPPED' ? "#ef4444" : (data.voltage > 0 ? "#4ade80" : "#9ca3af")}
                    fontSize={0.35}
                    anchorY="top"
                    outlineWidth={0.03}
                    outlineColor="#000"
                >
                    {data.status === 'TRIPPED' ? 'TRIPPED!' : `${data.voltage}V | ${data.current}A`}
                </Text>
            </group>
        </group>
    );
};
