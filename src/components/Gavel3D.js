import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Float, Cylinder } from '@react-three/drei';

function GavelModel() {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Animate the gavel based on interaction
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle floating and subtle rotation tracking
      groupRef.current.rotation.y = hovered ? Math.sin(t * 2) * 0.2 : 0;
      
      // "Strike" animation on click
      if (clicked) {
        groupRef.current.rotation.z = -Math.PI / 4; // Slam down
        setTimeout(() => setClicked(false), 150); // Bounce back up
      } else {
        groupRef.current.rotation.z = Math.sin(t) * 0.05; // Idle wobble
      }
    }
  });

  return (
    <group 
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked(true)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Gavel Head */}
      <Cylinder args={[0.3, 0.3, 1.2, 32]} rotation={[0, 0, Math.PI / 2]} position={[0, 1, 0]}>
        <meshStandardMaterial color={hovered ? "#D4AF37" : "#5C4033"} roughness={0.2} metalness={0.8} />
      </Cylinder>
      {/* Gavel Handle */}
      <Cylinder args={[0.1, 0.1, 2, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3E2723" roughness={0.5} />
      </Cylinder>
    </group>
  );
}

export default function InteractiveGavel() {
  return (
    <div style={{ height: '200px', width: '200px', cursor: 'pointer' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <PresentationControls global polar={[-0.4, 0.2]} azimuth={[-0.4, 0.2]}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <GavelModel />
          </Float>
        </PresentationControls>
      </Canvas>
    </div>
  );
}