import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sky } from '@react-three/drei';
import { SimulationScene } from './components/SimulationScene';
import { UIOverlay } from './components/UIOverlay';

function App() {
    return (
        <div className="w-full h-screen bg-gray-900 text-white relative">
            <Canvas shadows camera={{ position: [0, 10, 25], fov: 50 }}>
                <Suspense fallback={null}>
                    <Sky sunPosition={[100, 20, 100]} />
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} castShadow />

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                        <planeGeometry args={[1000, 1000]} />
                        <meshStandardMaterial color="#1a1a1a" />
                    </mesh>

                    <gridHelper args={[100, 100, 0x444444, 0x222222]} position={[0, -0.4, 0]} />

                    <SimulationScene />

                    <OrbitControls target={[0, 4, 0]} maxPolarAngle={Math.PI / 2.1} />
                </Suspense>
            </Canvas>

            <UIOverlay />
        </div>
    );
}

export default App;
