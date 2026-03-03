import React from 'react';
import { Text } from '@react-three/drei';

interface TransformerProps {
    status: 'ON' | 'TRIPPED';
    position: [number, number, number];
    onClick: () => void;
}

export const Transformer: React.FC<TransformerProps> = ({ status, position, onClick }) => {
    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {/* Main Tank */}
            <mesh castShadow receiveShadow position={[0, 3, 0]}>
                <boxGeometry args={[4, 6, 4]} />
                <meshStandardMaterial color="#444" />
            </mesh>

            {/* Bushings */}
            <mesh position={[1, 6.5, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 1.6]} />
                <meshStandardMaterial color="#724e43" />
            </mesh>
            <mesh position={[-1, 6.5, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 1.6]} />
                <meshStandardMaterial color="#724e43" />
            </mesh>

            {/* Cooling Fins */}
            <mesh position={[2.2, 3, 0]}>
                <boxGeometry args={[0.4, 5, 3.6]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-2.2, 3, 0]}>
                <boxGeometry args={[0.4, 5, 3.6]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Status Light */}
            <mesh position={[0, 5, 2.05]}>
                <circleGeometry args={[0.6]} />
                <meshBasicMaterial color={status === 'ON' ? '#00ff00' : '#ff0000'} />
            </mesh>

            {/* Label */}
            <Text
                position={[0, 7.5, 0]}
                fontSize={0.8}
                color="white"
                outlineWidth={0.05}
                outlineColor="#000"
            >
                TRANSFORMER
            </Text>
            <Text
                position={[0, 6.8, 0]}
                fontSize={0.6}
                color={status === 'ON' ? '#4ade80' : '#f87171'}
                outlineWidth={0.05}
                outlineColor="#000"
            >
                {status}
            </Text>
        </group>
    );
};
