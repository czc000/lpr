import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { MagicParticles } from './MagicParticles';
import { PhotoPlanes } from './PhotoPlanes';
import { ParticleState } from '../types';
import * as THREE from 'three';

interface ExperienceProps {
  state: ParticleState;
  handRotation: number;
  photoPaths?: string[];
}

const SceneContent: React.FC<{ state: ParticleState, handRotation: number, photoPaths?: string[] }> = ({ state, handRotation, photoPaths = [] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const rotationVelocityRef = useRef(0);
  const lastHandRotationRef = useRef(0);
  const isManualControlRef = useRef(false);
  const idleTimerRef = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const handRotationDelta = handRotation - lastHandRotationRef.current;
      lastHandRotationRef.current = handRotation;
      
      if (Math.abs(handRotationDelta) > 0.001) {
        rotationVelocityRef.current += handRotationDelta * 2.0;
        rotationVelocityRef.current = Math.max(-3, Math.min(3, rotationVelocityRef.current));
        isManualControlRef.current = true;
        idleTimerRef.current = 0;
      } else {
        idleTimerRef.current += delta;
      }
      
      groupRef.current.rotation.y += rotationVelocityRef.current * delta;
      rotationVelocityRef.current *= (1 - delta * 0.3);
      
      if (Math.abs(rotationVelocityRef.current) < 0.005) {
        rotationVelocityRef.current = 0;
      }
      
      if (Math.abs(rotationVelocityRef.current) < 0.01 && idleTimerRef.current > 2.0) {
        isManualControlRef.current = false;
        groupRef.current.rotation.y += 0.1 * delta;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]} scale={[0.5, 0.5, 0.5]}>
      <MagicParticles state={state} />
      {photoPaths.length > 0 && (
        <PhotoPlanes state={state} photoPaths={photoPaths} />
      )}
    </group>
  );
};

export const Experience: React.FC<ExperienceProps> = ({ state, handRotation, photoPaths = [] }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, toneMappingExposure: 1.1, powerPreference: "high-performance", alpha: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={['#0d1520']} />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <ambientLight intensity={0.4} color="#ffc0cb" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff0f5" />
      <pointLight position={[-10, -5, -10]} intensity={0.8} color="#ffb7c5" />
      
      <spotLight
        position={[5, 12, 5]}
        angle={0.4}
        penumbra={1}
        intensity={2.5}
        castShadow
        color="#fff8e7" 
      />

      <SceneContent state={state} handRotation={handRotation} photoPaths={photoPaths} />

      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={25}
        autoRotate={false} 
        dampingFactor={0.05}
      />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.5} 
          mipmapBlur={false} 
          intensity={0.8} 
          radius={0.3}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
};
