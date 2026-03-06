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
  const openAngle = useRef(0);
  const doorWidth = 1.2;
  const doorHeight = 2.5;

  // Randomize hint type per room+door combo
  const hintType = useMemo(() => {
    const seed = roomIndex * 7 + index * 13;
    return seed % 3; // 0: light under door, 1: cross mark, 2: scratch marks
  }, [roomIndex, index]);

  useFrame((state, delta) => {
    if (!pivotRef.current) return;
    if (isOpening) {
      // Slow creepy door opening - starts slow, then opens wider
      const targetAngle = Math.PI / 2;
      const remaining = targetAngle - openAngle.current;
      // Ease-in: starts very slow, accelerates
      const speed = 0.3 + (openAngle.current / targetAngle) * 1.5;
      openAngle.current = Math.min(openAngle.current + delta * speed, targetAngle);
      // Add subtle creaking wobble during opening
      const wobble = Math.sin(state.clock.elapsedTime * 8) * 0.005 * (remaining / targetAngle);
      pivotRef.current.rotation.y = -(openAngle.current + wobble);
    } else {
      openAngle.current = Math.max(openAngle.current - delta * 4, 0);
      pivotRef.current.rotation.y = -openAngle.current;
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

        {/* Handle */}
        <mesh position={[doorWidth - 0.15, doorHeight / 2, 0.12]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#aa8833" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Door panels (decorative insets) */}
        {[0.5, 1.5].map((y, i) => (
          <mesh key={i} position={[doorWidth / 2, y, 0.09]}>
            <boxGeometry args={[doorWidth * 0.6, 0.6, 0.01]} />
            <meshStandardMaterial color="#4a2a12" />
          </mesh>
        ))}
      </group>

      {/* Hints for correct door */}
      {isCorrect && (
        <>
          {/* Light leak under door */}
          {(hintType === 0 || true) && (
            <pointLight
              position={[0, -doorHeight / 2 + 0.1, 0.2]}
              color="#ffcc66"
              intensity={0.25}
              distance={1.5}
            />
          )}

          {/* Faint cross scratch (for chapel or general hint) */}
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

          {/* Floor scratch marks */}
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
