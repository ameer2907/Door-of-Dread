import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GhostState } from '@/game/types';

interface Props {
  visible: boolean;
  state: GhostState;
  roomIndex: number;
}

function GhostBody({ opacity }: { opacity: number }) {
  return (
    <>
      {/* Tall robed body */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.9, 3.2, 8]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={opacity} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner robe */}
      <mesh position={[0, 1.2, 0.06]}>
        <coneGeometry args={[0.65, 2.8, 6]} />
        <meshStandardMaterial color="#080808" transparent opacity={opacity * 0.8} />
      </mesh>
    </>
  );
}

function GhostCloth({ opacity, clothOffset }: { opacity: number; clothOffset: number }) {
  return (
    <>
      {[-0.35, 0.35, -0.18, 0.18, 0].map((x, i) => (
        <mesh
          key={`cloth-${i}`}
          position={[
            x + Math.sin(clothOffset + i * 1.5) * 0.04,
            0.1,
            0.1 + Math.cos(clothOffset + i) * 0.03
          ]}
        >
          <boxGeometry args={[0.1, 0.7, 0.02]} />
          <meshStandardMaterial color="#0a0a0a" transparent opacity={opacity * 0.6} />
        </mesh>
      ))}
    </>
  );
}

function GhostHead({ opacity, state }: { opacity: number; state: GhostState }) {
  const isAttacking = state === 'attack';
  
  return (
    <group>
      {/* Pale blue-white head - Valak style */}
      <mesh position={[0, 2.95, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial
          color="#c8ccd8"
          emissive="#0a0a20"
          emissiveIntensity={0.5}
          roughness={0.85}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Dark circles around eyes */}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={`ring-${i}`} position={[x, 2.98, 0.18]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#1a1020" transparent opacity={opacity * 0.8} />
        </mesh>
      ))}

      {/* Deep hollow eye sockets */}
      {[-0.1, 0.1].map((x, i) => (
        <group key={`eye-${i}`} position={[x, 2.98, 0.22]}>
          <mesh>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          {/* Glowing pupils */}
          <mesh position={[0, 0, 0.015]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial
              color={isAttacking ? '#ffff00' : '#ff4400'}
              emissive={isAttacking ? '#ffff00' : '#ff2200'}
              emissiveIntensity={isAttacking ? 12 : 4}
            />
          </mesh>
        </group>
      ))}

      {/* Sunken cheeks */}
      {[-0.14, 0.14].map((x, i) => (
        <mesh key={`cheek-${i}`} position={[x, 2.86, 0.14]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial color="#1a1018" transparent opacity={opacity * 0.6} />
        </mesh>
      ))}

      {/* Wide gaping mouth with teeth */}
      <mesh position={[0, 2.78, 0.2]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Upper teeth */}
      {[-0.04, -0.015, 0.015, 0.04].map((x, i) => (
        <mesh key={`tooth-${i}`} position={[x, 2.8, 0.25]}>
          <coneGeometry args={[0.008, 0.03, 4]} />
          <meshStandardMaterial color="#d8d0b8" emissive="#1a1a0a" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Dark veins on face */}
      {[[-0.17, 2.92, 0.15], [0.17, 2.94, 0.14], [-0.05, 2.82, 0.22], [0.06, 2.83, 0.21]].map((pos, i) => (
        <mesh key={`vein-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[0.015, 0.06, 0.005]} />
          <meshStandardMaterial color="#3a2030" transparent opacity={opacity * 0.5} />
        </mesh>
      ))}
    </group>
  );
}

function GhostVeil({ opacity }: { opacity: number }) {
  return (
    <group>
      {/* Wimple / hood */}
      <mesh position={[0, 3.3, -0.06]}>
        <coneGeometry args={[0.38, 0.9, 8]} />
        <meshStandardMaterial color="#030303" roughness={1} transparent opacity={opacity} />
      </mesh>
      {/* Side veil drapes */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={`veil-${i}`} position={[x, 2.65, -0.06]}>
          <boxGeometry args={[0.08, 0.8, 0.04]} />
          <meshStandardMaterial color="#040404" transparent opacity={opacity * 0.85} />
        </mesh>
      ))}
      {/* Front veil edge */}
      <mesh position={[0, 3.05, 0.15]}>
        <boxGeometry args={[0.5, 0.05, 0.02]} />
        <meshStandardMaterial color="#020202" transparent opacity={opacity * 0.7} />
      </mesh>
    </group>
  );
}

function GhostHands({ state, opacity }: { state: GhostState; opacity: number }) {
  if (state === 'attack') {
    return (
      <>
        {[-0.55, 0.55].map((x, i) => (
          <group key={`hand-${i}`} position={[x, 2.0, 0.6]}>
            <mesh>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color="#c0c4d0" emissive="#0a0510" />
            </mesh>
            {[0, 1, 2, 3].map((f) => (
              <mesh key={f} position={[(f - 1.5) * 0.025, 0.1, 0.02]} rotation={[0.4, 0, (f - 1.5) * 0.1]}>
                <cylinderGeometry args={[0.007, 0.005, 0.1]} />
                <meshStandardMaterial color="#c0c4d0" />
              </mesh>
            ))}
          </group>
        ))}
      </>
    );
  }
  if (state === 'close') {
    return (
      <group position={[0.4, 1.9, 0.5]}>
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#c0c4d0" transparent opacity={opacity} />
        </mesh>
        {[0, 1, 2].map((f) => (
          <mesh key={f} position={[(f - 1) * 0.025, 0.08, 0.01]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.007, 0.005, 0.08]} />
            <meshStandardMaterial color="#c0c4d0" transparent opacity={opacity} />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
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

    fadeIn.current = Math.min(fadeIn.current + delta * 2.5, 1);
    floatOffset.current += delta * 1.5;
    clothOffset.current += delta * 3;

    // Eerie slow float
    groupRef.current.position.y = Math.sin(floatOffset.current) * 0.1;

    if (state === 'attack') {
      const dir = new THREE.Vector3()
        .subVectors(camera.position, groupRef.current.position)
        .normalize();
      dir.y = 0;
      groupRef.current.position.addScaledVector(dir, delta * 4);
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.8, camera.position.z);
    } else if (state === 'close' || state === 'watching') {
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.8, camera.position.z);
    }
  });

  if (!visible) return null;

  const basePos = getBasePosition();
  const opacity = Math.min(fadeIn.current, state === 'watching' ? 0.55 : 0.95);

  return (
    <group ref={groupRef} position={basePos}>
      <GhostBody opacity={opacity} />
      <GhostCloth opacity={opacity} clothOffset={clothOffset.current} />
      <GhostHead opacity={opacity} state={state} />
      <GhostVeil opacity={opacity} />
      <GhostHands state={state} opacity={opacity} />

      {/* Eye glow light */}
      <pointLight
        position={[0, 3.0, 0.4]}
        color={state === 'attack' ? '#ffff00' : '#ff2200'}
        intensity={state === 'attack' ? 0.8 : 0.2}
        distance={4}
      />

      {/* Eerie body glow */}
      <pointLight
        position={[0, 2.0, 0.5]}
        color={state === 'attack' ? '#ff0000' : '#1a1a66'}
        intensity={state === 'attack' ? 0.5 : 0.1}
        distance={5}
      />

      {/* Under-face creepy illumination */}
      <pointLight
        position={[0, 2.5, 0.3]}
        color="#221100"
        intensity={0.2}
        distance={2}
      />
    </group>
  );
}
