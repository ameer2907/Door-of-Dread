import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GhostState } from '@/game/types';
import { DOOR_POSITIONS } from '@/game/rooms';

interface Props {
  visible: boolean;
  state: GhostState;
  roomIndex: number;
  spawnDoorIndex?: number | null;
}

function GhostBody({ opacity }: { opacity: number }) {
  return (
    <>
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.9, 3.2, 8]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={opacity} roughness={1} side={THREE.DoubleSide} />
      </mesh>
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

      {[-0.1, 0.1].map((x, i) => (
        <mesh key={`ring-${i}`} position={[x, 2.98, 0.18]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#1a1020" transparent opacity={opacity * 0.8} />
        </mesh>
      ))}

      {[-0.1, 0.1].map((x, i) => (
        <group key={`eye-${i}`} position={[x, 2.98, 0.22]}>
          <mesh>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
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

      {[-0.14, 0.14].map((x, i) => (
        <mesh key={`cheek-${i}`} position={[x, 2.86, 0.14]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial color="#1a1018" transparent opacity={opacity * 0.6} />
        </mesh>
      ))}

      <mesh position={[0, 2.78, 0.2]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {[-0.04, -0.015, 0.015, 0.04].map((x, i) => (
        <mesh key={`tooth-${i}`} position={[x, 2.8, 0.25]}>
          <coneGeometry args={[0.008, 0.03, 4]} />
          <meshStandardMaterial color="#d8d0b8" emissive="#1a1a0a" emissiveIntensity={0.3} />
        </mesh>
      ))}

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
      <mesh position={[0, 3.3, -0.06]}>
        <coneGeometry args={[0.38, 0.9, 8]} />
        <meshStandardMaterial color="#030303" roughness={1} transparent opacity={opacity} />
      </mesh>
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={`veil-${i}`} position={[x, 2.65, -0.06]}>
          <boxGeometry args={[0.08, 0.8, 0.04]} />
          <meshStandardMaterial color="#040404" transparent opacity={opacity * 0.85} />
        </mesh>
      ))}
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

export default function Ghost3D({ visible, state, roomIndex, spawnDoorIndex }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const floatOffset = useRef(0);
  const fadeIn = useRef(0);
  const clothOffset = useRef(0);
  const spawnTime = useRef(0);
  const hasSpawned = useRef(false);
  const spawnPos = useRef(new THREE.Vector3());

  // Calculate spawn position from door
  const getDoorSpawnPosition = (): [number, number, number] => {
    if (spawnDoorIndex !== null && spawnDoorIndex !== undefined && DOOR_POSITIONS[spawnDoorIndex]) {
      const doorPos = DOOR_POSITIONS[spawnDoorIndex];
      // Start behind the door (further back on Z), at door's X position
      return [doorPos[0], 0, doorPos[2] - 1.5];
    }
    return [0, 0, -4.5];
  };

  const getTargetPosition = (): [number, number, number] => {
    if (spawnDoorIndex !== null && spawnDoorIndex !== undefined && DOOR_POSITIONS[spawnDoorIndex]) {
      const doorPos = DOOR_POSITIONS[spawnDoorIndex];
      switch (state) {
        case 'watching': return [doorPos[0], 0, doorPos[2] + 0.5];
        case 'close': return [doorPos[0], 0, doorPos[2] + 2.5];
        case 'attack': return [doorPos[0], 0, doorPos[2] + 2.5];
        default: return [doorPos[0], 0, doorPos[2] - 1.5];
      }
    }
    // Fallback if no door index
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
      spawnTime.current = 0;
      hasSpawned.current = false;
      return;
    }

    // Initialize spawn position on first visible frame
    if (!hasSpawned.current) {
      hasSpawned.current = true;
      const sp = getDoorSpawnPosition();
      spawnPos.current.set(sp[0], sp[1], sp[2]);
      groupRef.current.position.set(sp[0], sp[1], sp[2]);
    }

    spawnTime.current += delta;
    fadeIn.current = Math.min(fadeIn.current + delta * 2.5, 1);
    floatOffset.current += delta * 1.5;
    clothOffset.current += delta * 3;

    // Eerie float
    const floatY = Math.sin(floatOffset.current) * 0.1;

    const target = getTargetPosition();
    const targetVec = new THREE.Vector3(target[0], target[1], target[2]);

    if (state === 'attack') {
      // Phase 1: Emerge from door (first ~0.8s), then rush toward player
      if (spawnTime.current < 0.8) {
        // Slowly step through the doorway
        const emergeProgress = Math.min(spawnTime.current / 0.8, 1);
        const easeOut = 1 - Math.pow(1 - emergeProgress, 2);
        groupRef.current.position.lerpVectors(spawnPos.current, targetVec, easeOut);
        groupRef.current.position.y = floatY;
      } else {
        // Rush toward the player
        const dir = new THREE.Vector3()
          .subVectors(camera.position, groupRef.current.position)
          .normalize();
        dir.y = 0;
        groupRef.current.position.addScaledVector(dir, delta * 5);
        groupRef.current.position.y = floatY;
      }
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.8, camera.position.z);
    } else if (state === 'close' || state === 'watching') {
      // Smoothly emerge from door toward target
      const emergeSpeed = state === 'close' ? 1.5 : 0.8;
      const emergeProgress = Math.min(spawnTime.current * emergeSpeed / 1.5, 1);
      const easeOut = 1 - Math.pow(1 - emergeProgress, 3);
      groupRef.current.position.lerpVectors(spawnPos.current, targetVec, easeOut);
      groupRef.current.position.y = floatY;
      groupRef.current.lookAt(camera.position.x, groupRef.current.position.y + 1.8, camera.position.z);
    }
  });

  if (!visible) return null;

  const startPos = getDoorSpawnPosition();
  const opacity = Math.min(fadeIn.current, state === 'watching' ? 0.55 : 0.95);

  return (
    <group ref={groupRef} position={startPos}>
      <GhostBody opacity={opacity} />
      <GhostCloth opacity={opacity} clothOffset={clothOffset.current} />
      <GhostHead opacity={opacity} state={state} />
      <GhostVeil opacity={opacity} />
      <GhostHands state={state} opacity={opacity} />

      <pointLight
        position={[0, 3.0, 0.4]}
        color={state === 'attack' ? '#ffff00' : '#ff2200'}
        intensity={state === 'attack' ? 0.8 : 0.2}
        distance={4}
      />
      <pointLight
        position={[0, 2.0, 0.5]}
        color={state === 'attack' ? '#ff0000' : '#1a1a66'}
        intensity={state === 'attack' ? 0.5 : 0.1}
        distance={5}
      />
      <pointLight
        position={[0, 2.5, 0.3]}
        color="#221100"
        intensity={0.2}
        distance={2}
      />
    </group>
  );
}
