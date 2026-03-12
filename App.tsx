import React, { useState, useCallback } from 'react';
import { Experience } from './components/Experience';
import { UI } from './components/UI';
import { HandController } from './components/HandController';
import { ParticleState } from './types';

function App() {
  const [particleState, setParticleState] = useState<ParticleState>(ParticleState.TREE_SHAPE);
  const [handRotation, setHandRotation] = useState(0);
  
  const photoPaths = [
    'photo1.jpg',
    'photo2.jpg',
    'photo3.jpg',
    'photo4.jpg',
    'photo5.jpg',
    'photo6.jpg',
    'photo7.jpg',
    'photo8.jpg',
    'photo9.jpg',
    'photo10.jpg',
    'photo11.jpg',
    'photo12.jpg',
  ];

  const handleToggle = () => {
    setParticleState((prev) => 
      prev === ParticleState.SCATTERED 
        ? ParticleState.TREE_SHAPE 
        : ParticleState.SCATTERED
    );
  };

  const handleGesture = useCallback((newState: ParticleState | null) => {
    if (newState) {
      setParticleState(newState);
    }
  }, []);

  const handleRotation = useCallback((val: number) => {
    setHandRotation(val);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0d1520]">
      <div className="absolute inset-0 z-0">
        <Experience state={particleState} handRotation={handRotation} photoPaths={photoPaths} />
      </div>
      
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UI currentState={particleState} onToggle={handleToggle} />
      </div>

      <HandController onGesture={handleGesture} onRotation={handleRotation} />
    </div>
  );
}

export default App;
