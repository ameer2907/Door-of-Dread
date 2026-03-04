import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomConfig } from '@/game/types';
import Door3D from './Door3D';
import { DOOR_POSITIONS } from '@/game/rooms';

interface Props {
  config: RoomConfig;
  roomIndex: number;
  correctDoorIndex: number;
  openingDoor: number | null;
  flickering: boolean;
  onSelectDoor: (index: number) => void;
}

function RoomLight({ config, flickering }: { config: RoomConfig; flickering: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    if (flickering) {
      lightRef.current.intensity = Math.random() * config.pointLightIntensity;
    } else if (config.lightFailure) {
      lightRef.current.intensity = config.pointLightIntensity * (0.7 + Math.sin(Date.now() * 0.005) * 0.3);
    } else {
      lightRef.current.intensity = config.pointLightIntensity;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 3.5, 0]}
      color={config.pointLightColor}
      intensity={config.pointLightIntensity}
      distance={20}
      castShadow
      shadow-mapSize-width={512}
      shadow-mapSize-height={512}
    />
  );
}

function WallPlane({ position, rotation, size, color }: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function RoomDecorations({ roomIndex }: { roomIndex: number }) {
  switch (roomIndex) {
    case 0: // Hallway - coat rack, frames
      return (
        <group>
          <mesh position={[-4, 1.5, -3]} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 3]} />
            <meshStandardMaterial color="#3a2510" />
          </mesh>
          <mesh position={[4, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[1.2, 0.8, 0.05]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
        </group>
      );
    case 1: // Living room - fireplace
      return (
        <group>
          <mesh position={[4.8, 1.2, 0]}>
            <boxGeometry args={[0.3, 2.4, 2.5]} />
            <meshStandardMaterial color="#1a1008" />
          </mesh>
          <pointLight position={[4.5, 0.5, 0]} color="#ff4400" intensity={0.4} distance={4} />
          <mesh position={[-3, 0.4, 2]}>
            <boxGeometry args={[2.5, 0.8, 1]} />
            <meshStandardMaterial color="#2a1a10" />
          </mesh>
        </group>
      );
    case 2: // Stairs - steps
      return (
        <group>
          {[0, 1, 2, 3].map(i => (
            <mesh key={i} position={[3.5, i * 0.3, 2 - i * 0.8]} castShadow receiveShadow>
              <boxGeometry args={[2, 0.15, 0.8]} />
              <meshStandardMaterial color="#1a1a28" />
            </mesh>
          ))}
        </group>
      );
    case 3: // Bedroom - bed
      return (
        <group>
          <mesh position={[-3, 0.4, 0]} castShadow>
            <boxGeometry args={[2, 0.5, 3]} />
            <meshStandardMaterial color="#2a1515" />
          </mesh>
          <mesh position={[-3, 0.7, -1.4]}>
            <boxGeometry args={[2, 0.6, 0.15]} />
            <meshStandardMaterial color="#1a0a0a" />
          </mesh>
          <mesh position={[3, 0.5, 3]} castShadow>
            <boxGeometry args={[0.6, 1, 0.6]} />
            <meshStandardMaterial color="#251010" />
          </mesh>
        </group>
      );
    case 4: // Basement - pipes, crate
      return (
        <group>
          <mesh position={[0, 3.8, 2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 9]} />
            <meshStandardMaterial color="#3a3a2a" metalness={0.6} />
          </mesh>
          <mesh position={[3, 0.4, 3]} castShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#2a2a15" />
          </mesh>
          <mesh position={[3.9, 0.3, -2]} castShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#222210" />
          </mesh>
        </group>
      );
    case 5: // Chapel - pews, altar, candles
      return (
        <group>
          {[-1.5, 1.5].map((x, i) => (
            <group key={i}>
              {[0, 1.5, 3].map((z, j) => (
                <mesh key={j} position={[x, 0.35, z]} castShadow>
                  <boxGeometry args={[1.2, 0.7, 0.5]} />
                  <meshStandardMaterial color="#1a0f0a" />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, 0.8, -4]} castShadow>
            <boxGeometry args={[2, 1.2, 0.8]} />
            <meshStandardMaterial color="#2a1515" />
          </mesh>
          {[-0.5, 0.5].map((x, i) => (
            <group key={`candle-${i}`} position={[x, 1.5, -4]}>
              <mesh>
                <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                <meshStandardMaterial color="#ccaa66" />
              </mesh>
              <pointLight position={[0, 0.25, 0]} color="#ffaa33" intensity={0.3} distance={3} />
            </group>
          ))}
        </group>
      );
    case 6: // Exit corridor - bare, emergency light
      return (
        <group>
          <pointLight position={[0, 3.5, 0]} color="#ff0000" intensity={0.2} distance={8} />
          <mesh position={[0, 3.8, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.15]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

export default function Room3D({ config, roomIndex, correctDoorIndex, openingDoor, flickering, onSelectDoor }: Props) {
  return (
    <group>
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />
      <RoomLight config={config} flickering={flickering} />

      {/* Fill lights for visibility */}
      <pointLight position={[-4, 1.5, 0]} color={config.pointLightColor} intensity={0.6} distance={12} />
      <pointLight position={[4, 1.5, 0]} color={config.pointLightColor} intensity={0.6} distance={12} />
      <pointLight position={[0, 0.3, 0]} color="#ffddaa" intensity={0.35} distance={10} />
      {/* Warm wall-wash lights near floor */}
      <pointLight position={[-3, 0.5, -3]} color="#ffcc88" intensity={0.3} distance={6} />
      <pointLight position={[3, 0.5, -3]} color="#ffcc88" intensity={0.3} distance={6} />
      <pointLight position={[0, 0.5, 3]} color="#ffcc88" intensity={0.2} distance={6} />
      {/* Hemisphere light for general fill */}
      <hemisphereLight args={['#555555', '#1a1a1a', 0.6]} />

      {/* Floor */}
      <WallPlane position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} size={[10, 10]} color={config.floorColor} />
      {/* Ceiling */}
      <WallPlane position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} size={[10, 10]} color={config.ceilingColor} />
      {/* Back wall */}
      <WallPlane position={[0, 2, 5]} rotation={[0, Math.PI, 0]} size={[10, 4]} color={config.wallColor} />
      {/* Left wall */}
      <WallPlane position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[10, 4]} color={config.wallColor} />
      {/* Right wall */}
      <WallPlane position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[10, 4]} color={config.wallColor} />
      {/* Front wall */}
      <WallPlane position={[0, 2, -5]} rotation={[0, 0, 0]} size={[10, 4]} color={config.wallColor} />

      {/* Doors */}
      {DOOR_POSITIONS.map((pos, i) => (
        <Door3D
          key={`${roomIndex}-${i}`}
          position={pos}
          index={i}
          isCorrect={i === correctDoorIndex}
          isOpening={openingDoor === i}
          onSelect={onSelectDoor}
          roomIndex={roomIndex}
        />
      ))}

      <RoomDecorations roomIndex={roomIndex} />
    </group>
  );
}
