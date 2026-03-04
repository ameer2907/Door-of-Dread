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
  const fadeIn = useRef(0);
  const clothOffset = useRef(0);

  const getBasePosition = (): [number, number, number] => {
    switch (state) {
      case 'watching': return [0, 0, -3];
      case 'close': return [0, 0, 0.5];
      case 'attack': return [0, 0, 2];
      default: return [0, 0, -8];
    }
  };

  useFrame((_, delta) => {
    if (!groupRef.current || !visible) {
      fadeIn.current = 0;
      return;
    }

    // Fade in effect
    fadeIn.current = Math.min(fadeIn.current + delta * 2, 1);
    floatOffset.current += delta * 2;
    clothOffset.current += delta * 3;

    // Slow eerie float
    groupRef.current.position.y = Math.sin(floatOffset.current) * 0.08;

    if (state === 'attack') {
      const dir = new THREE.Vector3()
        .subVectors(camera.position, groupRef.current.position)
        .normalize();
      dir.y = 0;
      groupRef.current.position.addScaledVector(dir, delta * 3.5);
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.8, camera.position.z);
    } else if (state === 'close' || state === 'watching') {
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.8, camera.position.z);
    }
  });

  if (!visible) return null;

  const basePos = getBasePosition();
  const opacity = Math.min(fadeIn.current, state === 'watching' ? 0.6 : 0.95);

  return (
    <group ref={groupRef} position={basePos}>
      {/* Tall robed body - nun demon */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.8, 3.0, 8]} />
        <meshStandardMaterial
          color="#050505"
          transparent
          opacity={opacity}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner robe layer for depth */}
      <mesh position={[0, 1.2, 0.06]}>
        <coneGeometry args={[0.6, 2.6, 6]} />
        <meshStandardMaterial color="#080808" transparent opacity={opacity * 0.8} />
      </mesh>

      {/* Cloth tendrils hanging (simulated movement via multiple pieces) */}
      {[-0.3, 0.3, -0.15, 0.15].map((x, i) => (
        <mesh
          key={`cloth-${i}`}
          position={[
            x + Math.sin(clothOffset.current + i * 1.5) * 0.03,
            0.15,
            0.1 + Math.cos(clothOffset.current + i) * 0.02
          ]}
        >
          <boxGeometry args={[0.12, 0.6, 0.02]} />
          <meshStandardMaterial color="#0a0a0a" transparent opacity={opacity * 0.7} />
        </mesh>
      ))}

      {/* Pale gaunt head */}
      <mesh position={[0, 2.95, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color="#d4c4a8"
          emissive="#1a0a00"
          emissiveIntensity={0.4}
          roughness={0.9}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Sunken cheeks */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={`cheek-${i}`} position={[x, 2.88, 0.12]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#2a1a10" transparent opacity={opacity * 0.5} />
        </mesh>
      ))}

      {/* Veil / wimple */}
      <mesh position={[0, 3.25, -0.05]}>
        <coneGeometry args={[0.35, 0.8, 8]} />
        <meshStandardMaterial color="#030303" roughness={1} transparent opacity={opacity} />
      </mesh>
      {/* Side veil drapes */}
      {[-0.22, 0.22].map((x, i) => (
        <mesh key={`veil-${i}`} position={[x, 2.7, -0.05]}>
          <boxGeometry args={[0.08, 0.7, 0.04]} />
          <meshStandardMaterial color="#040404" transparent opacity={opacity * 0.8} />
        </mesh>
      ))}

      {/* Hollow dark eye sockets */}
      {[-0.08, 0.08].map((x, i) => (
        <group key={`eye-${i}`} position={[x, 2.98, 0.2]}>
          {/* Dark socket */}
          <mesh>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          {/* Glowing pupil deep inside */}
          <mesh position={[0, 0, 0.01]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial
              color={state === 'attack' ? '#ff0000' : '#ff3300'}
              emissive={state === 'attack' ? '#ff0000' : '#ff2200'}
              emissiveIntensity={state === 'attack' ? 8 : 3}
            />
          </mesh>
        </group>
      ))}

      {/* Gaping mouth */}
      <mesh position={[0, 2.82, 0.2]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Bony reaching hands (attack state) */}
      {state === 'attack' && (
        <>
          {[-0.5, 0.5].map((x, i) => (
            <group key={`hand-${i}`} position={[x, 2.0, 0.5]}>
              <mesh>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#c8b090" emissive="#0a0500" />
              </mesh>
              {/* Fingers */}
              {[0, 1, 2].map((f) => (
                <mesh key={f} position={[(f - 1) * 0.03, 0.08, 0.02]} rotation={[0.3, 0, 0]}>
                  <cylinderGeometry args={[0.008, 0.006, 0.08]} />
                  <meshStandardMaterial color="#c8b090" />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )}

      {/* Close state - one hand reaching */}
      {state === 'close' && (
        <group position={[0.35, 1.8, 0.4]}>
          <mesh>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#c8b090" transparent opacity={opacity} />
          </mesh>
        </group>
      )}

      {/* Eerie glow */}
      <pointLight
        position={[0, 2.0, 0.5]}
        color={state === 'attack' ? '#ff0000' : '#2222aa'}
        intensity={state === 'attack' ? 0.6 : 0.12}
        distance={5}
      />

      {/* Under-lighting for creepy face illumination */}
      <pointLight
        position={[0, 2.5, 0.3]}
        color="#331100"
        intensity={0.15}
        distance={2}
      />
    </group>
  );
}
