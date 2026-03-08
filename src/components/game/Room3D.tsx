import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomConfig } from '@/game/types';
import Door3D from './Door3D';
import DustParticles from './DustParticles';
import RoomDecorations from './RoomDecorations';
import { DOOR_POSITIONS } from '@/game/rooms';

interface Props {
  config: RoomConfig;
  roomIndex: number;
  correctDoorIndex: number;
  openingDoor: number | null;
  flickering: boolean;
  onSelectDoor: (index: number) => void;
}

function RoomLight({ config, flickering, darkness }: { config: RoomConfig; flickering: boolean; darkness: number }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const darkenMult = 1 - darkness * 0.7;
    if (flickering) {
      lightRef.current.intensity = Math.random() * config.pointLightIntensity * darkenMult;
    } else if (config.lightFailure) {
      lightRef.current.intensity = config.pointLightIntensity * (0.7 + Math.sin(Date.now() * 0.005) * 0.3) * darkenMult;
    } else {
      lightRef.current.intensity = config.pointLightIntensity * darkenMult;
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

export default function Room3D({ config, roomIndex, correctDoorIndex, openingDoor, flickering, onSelectDoor, darkness = 0 }: Props & { darkness?: number }) {
  const dustCount = Math.floor(config.dustDensity * 80);

  return (
    <group>
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity * (1 - darkness * 0.6)} />
      <RoomLight config={config} flickering={flickering} darkness={darkness} />

      {/* Fill lights */}
      <pointLight position={[-4, 1.5, 0]} color={config.pointLightColor} intensity={0.6} distance={12} />
      <pointLight position={[4, 1.5, 0]} color={config.pointLightColor} intensity={0.6} distance={12} />
      <pointLight position={[0, 0.3, 0]} color="#ffddaa" intensity={0.35} distance={10} />
      <pointLight position={[-3, 0.5, -3]} color="#ffcc88" intensity={0.3} distance={6} />
      <pointLight position={[3, 0.5, -3]} color="#ffcc88" intensity={0.3} distance={6} />
      <pointLight position={[0, 0.5, 3]} color="#ffcc88" intensity={0.2} distance={6} />
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

      {/* Dust particles */}
      {dustCount > 0 && (
        <DustParticles count={dustCount} color={config.dustColor} />
      )}

      {/* Room-specific decorations */}
      <RoomDecorations roomTheme={config.roomTheme} roomIndex={roomIndex} />
    </group>
  );
}
