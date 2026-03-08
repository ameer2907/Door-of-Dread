import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  position: [number, number, number];
  index: number;
  isCorrect: boolean;
  isOpening: boolean;
  onSelect: (index: number) => void;
  roomIndex: number;
}

export default function Door3D({ position, index, isCorrect, isOpening, onSelect, roomIndex }: Props) {
  const pivotRef = useRef<THREE.Group>(null);
  const handleRef = useRef<THREE.Mesh>(null);
  const openAngle = useRef(0);
  const handleAngle = useRef(0);
  const doorWidth = 1.2;
  const doorHeight = 2.5;

  const hintType = useMemo(() => {
    const seed = roomIndex * 7 + index * 13;
    return seed % 3;
  }, [roomIndex, index]);

  // Suspense delay state
  const suspensePhase = useRef<'idle' | 'handle' | 'breath' | 'opening'>('idle');
  const suspenseTimer = useRef(0);
  const breathPlayed = useRef(false);

  useFrame((state, delta) => {
    if (!pivotRef.current) return;

    if (isOpening) {
      suspenseTimer.current += delta;

      // Phase 1: Handle rotation (0–0.5s)
      if (suspensePhase.current === 'idle') {
        suspensePhase.current = 'handle';
        suspenseTimer.current = 0;
        breathPlayed.current = false;
      }

      if (suspensePhase.current === 'handle') {
        handleAngle.current = Math.min(handleAngle.current + delta * 3, Math.PI / 4);
        if (handleAngle.current >= Math.PI / 4 - 0.01) {
          suspensePhase.current = 'breath';
          suspenseTimer.current = 0;
        }
      }

      // Phase 2: 1.5s suspense silence with heavy breath (handle down, door still closed)
      if (suspensePhase.current === 'breath') {
        if (!breathPlayed.current) {
          breathPlayed.current = true;
          // Heavy breath sound will be triggered from audio system
          import('@/game/audio').then(m => m.audioManager.playHeavyBreath());
        }
        if (suspenseTimer.current >= 1.5) {
          suspensePhase.current = 'opening';
          suspenseTimer.current = 0;
        }
        // Door stays closed during breath phase
      }

      // Phase 3: Door swings open
      if (suspensePhase.current === 'opening') {
        const targetAngle = Math.PI / 2;
        const remaining = targetAngle - openAngle.current;
        const speed = 0.3 + (openAngle.current / targetAngle) * 1.5;
        openAngle.current = Math.min(openAngle.current + delta * speed, targetAngle);
        const wobble = Math.sin(state.clock.elapsedTime * 8) * 0.005 * (remaining / targetAngle);
        pivotRef.current.rotation.y = -(openAngle.current + wobble);
      }
    } else {
      // Close door & reset
      suspensePhase.current = 'idle';
      suspenseTimer.current = 0;
      breathPlayed.current = false;
      handleAngle.current = Math.max(handleAngle.current - delta * 4, 0);
      openAngle.current = Math.max(openAngle.current - delta * 4, 0);
      pivotRef.current.rotation.y = -openAngle.current;
    }

    // Apply handle rotation
    if (handleRef.current) {
      handleRef.current.rotation.z = -handleAngle.current;
    }
  });

  return (
    <group position={position}>
      {/* Door frame */}
      <mesh position={[0, doorHeight / 2 + 0.08, 0.02]}>
        <boxGeometry args={[doorWidth + 0.2, 0.1, 0.12]} />
        <meshStandardMaterial color="#3a2510" />
      </mesh>
      <mesh position={[-doorWidth / 2 - 0.06, 0, 0.02]}>
        <boxGeometry args={[0.1, doorHeight, 0.12]} />
        <meshStandardMaterial color="#3a2510" />
      </mesh>
      <mesh position={[doorWidth / 2 + 0.06, 0, 0.02]}>
        <boxGeometry args={[0.1, doorHeight, 0.12]} />
        <meshStandardMaterial color="#3a2510" />
      </mesh>

      {/* Hinge pins */}
      {[0.3, 1.2, 2.1].map((y, i) => (
        <mesh key={`hinge-${i}`} position={[-doorWidth / 2 - 0.02, y - doorHeight / 2, 0.04]}>
          <cylinderGeometry args={[0.02, 0.02, 0.08]} />
          <meshStandardMaterial color="#665533" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Door pivot (hinged on left) */}
      <group position={[-doorWidth / 2, -doorHeight / 2, 0]} ref={pivotRef}>
        <mesh
          position={[doorWidth / 2, doorHeight / 2, 0.04]}
          castShadow
          userData={{ isDoor: true, doorIndex: index }}
        >
          <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
          <meshStandardMaterial color="#5a3a1a" roughness={0.85} />
        </mesh>

        {/* Handle - with rotation */}
        <group position={[doorWidth - 0.15, doorHeight / 2, 0.1]}>
          {/* Handle base plate */}
          <mesh>
            <boxGeometry args={[0.06, 0.12, 0.02]} />
            <meshStandardMaterial color="#aa8833" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Handle lever */}
          <mesh ref={handleRef} position={[0, 0, 0.03]}>
            <group>
              <mesh position={[0.06, 0, 0]}>
                <boxGeometry args={[0.1, 0.025, 0.025]} />
                <meshStandardMaterial color="#aa8833" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#998822" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          </mesh>
        </group>

        {/* Door panels */}
        {[0.5, 1.5].map((y, i) => (
          <mesh key={i} position={[doorWidth / 2, y, 0.09]}>
            <boxGeometry args={[doorWidth * 0.6, 0.6, 0.01]} />
            <meshStandardMaterial color="#4a2a12" />
          </mesh>
        ))}

        {/* Door edge detail */}
        <mesh position={[doorWidth, doorHeight / 2, 0.04]}>
          <boxGeometry args={[0.01, doorHeight, 0.08]} />
          <meshStandardMaterial color="#4a2a10" />
        </mesh>
      </group>

      {/* Hints for correct door */}
      {isCorrect && (
        <>
          <pointLight
            position={[0, -doorHeight / 2 + 0.1, 0.2]}
            color="#ffcc66"
            intensity={0.25}
            distance={1.5}
          />
          {hintType === 1 && (
            <group position={[doorWidth / 2 + 0.2, 0.5, 0.08]}>
              <mesh>
                <boxGeometry args={[0.02, 0.2, 0.01]} />
                <meshStandardMaterial color="#888866" />
              </mesh>
              <mesh>
                <boxGeometry args={[0.12, 0.02, 0.01]} />
                <meshStandardMaterial color="#888866" />
              </mesh>
            </group>
          )}
          {hintType === 2 && (
            <mesh position={[0, -doorHeight / 2 + 0.02, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.3, 0.8]} />
              <meshStandardMaterial color="#1a1008" transparent opacity={0.6} />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}
