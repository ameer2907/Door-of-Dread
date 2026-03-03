import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GhostState } from '@/game/types';

interface Props {
  visible: boolean;
  state: GhostState;
  roomIndex: number;
}

export default function Ghost3D({ visible, state, roomIndex }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const floatOffset = useRef(0);

  // Position ghost based on state
  const getBasePosition = (): [number, number, number] => {
    switch (state) {
      case 'watching': return [0, 0, -3];
      case 'close': return [0, 0, 1];
      case 'attack': return [0, 0, 2];
      default: return [0, 0, -8];
    }
  };

  useFrame((_, delta) => {
    if (!groupRef.current || !visible) return;

    floatOffset.current += delta * 3;
    groupRef.current.position.y = Math.sin(floatOffset.current) * 0.05;

    if (state === 'attack') {
      // Rush toward player
      const dir = new THREE.Vector3()
        .subVectors(camera.position, groupRef.current.position)
        .normalize();
      dir.y = 0;
      groupRef.current.position.addScaledVector(dir, delta * 4);
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.5, camera.position.z);
    } else if (state === 'close' || state === 'watching') {
      // Face the player
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.5, camera.position.z);
    }
  });

  if (!visible) return null;

  const basePos = getBasePosition();

  return (
    <group ref={groupRef} position={basePos}>
      {/* Robe / Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <coneGeometry args={[0.7, 2.2, 8]} />
        <meshStandardMaterial
          color="#080808"
          transparent
          opacity={state === 'watching' ? 0.6 : 0.9}
          roughness={1}
        />
      </mesh>

      {/* Inner robe detail */}
      <mesh position={[0, 0.8, 0.05]}>
        <coneGeometry args={[0.5, 1.8, 6]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color="#c8b898"
          emissive="#221100"
          emissiveIntensity={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Veil */}
      <mesh position={[0, 2.5, -0.05]}>
        <coneGeometry args={[0.3, 0.7, 8]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.07, 2.22, 0.18]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={state === 'attack' ? 5 : 2}
        />
      </mesh>
      <mesh position={[0.07, 2.22, 0.18]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={state === 'attack' ? 5 : 2}
        />
      </mesh>

      {/* Hands reaching out (attack) */}
      {state === 'attack' && (
        <>
          <mesh position={[-0.4, 1.5, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#c8b898" emissive="#110800" />
          </mesh>
          <mesh position={[0.4, 1.5, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#c8b898" emissive="#110800" />
          </mesh>
        </>
      )}

      {/* Eerie glow */}
      <pointLight
        position={[0, 1.5, 0.5]}
        color={state === 'attack' ? '#ff0000' : '#4444ff'}
        intensity={state === 'attack' ? 0.5 : 0.15}
        distance={4}
      />
    </group>
  );
}
