import { useMemo } from 'react';
import { ROOM_CONFIGS, DOOR_POSITIONS } from '@/game/rooms';
import { PortalPhase } from '@/game/types';
import DustParticles from './DustParticles';
import RoomDecorations from './RoomDecorations';

interface Props {
  nextRoomIndex: number;
  doorIndex: number;
  portalPhase: PortalPhase;
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

export default function NextRoomPortal({ nextRoomIndex, doorIndex, portalPhase }: Props) {
  const config = ROOM_CONFIGS[nextRoomIndex];
  if (!config) return null;

  // Position the next room behind the selected door
  // The door is at DOOR_POSITIONS[doorIndex], which is on the front wall at z = -4.95
  // We place the next room so its back wall aligns with the door position
  // Next room center is 10 units further (room depth) behind the door
  const doorPos = DOOR_POSITIONS[doorIndex];
  const nextRoomOffset: [number, number, number] = [doorPos[0], 0, doorPos[2] - 10];

  const dustCount = Math.floor(config.dustDensity * 40); // fewer particles for perf

  return (
    <group position={nextRoomOffset}>
      {/* Lighting for next room */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity * 0.7} />
      <pointLight
        position={[0, 3.5, 0]}
        color={config.pointLightColor}
        intensity={config.pointLightIntensity * 0.8}
        distance={20}
      />
      <pointLight position={[-3, 1.5, 0]} color={config.pointLightColor} intensity={0.4} distance={10} />
      <pointLight position={[3, 1.5, 0]} color={config.pointLightColor} intensity={0.4} distance={10} />

      {/* Floor */}
      <WallPlane position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} size={[10, 10]} color={config.floorColor} />
      {/* Ceiling */}
      <WallPlane position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} size={[10, 10]} color={config.ceilingColor} />
      {/* Back wall (far end) */}
      <WallPlane position={[0, 2, -5]} rotation={[0, 0, 0]} size={[10, 4]} color={config.wallColor} />
      {/* Left wall */}
      <WallPlane position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[10, 4]} color={config.wallColor} />
      {/* Right wall */}
      <WallPlane position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[10, 4]} color={config.wallColor} />
      {/* Front wall (entry side - has doorway hole, approximated by leaving gap) */}
      {/* Left section of front wall */}
      <WallPlane position={[-3.5, 2, 5]} rotation={[0, Math.PI, 0]} size={[3, 4]} color={config.wallColor} />
      {/* Right section of front wall */}
      <WallPlane position={[3.5, 2, 5]} rotation={[0, Math.PI, 0]} size={[3, 4]} color={config.wallColor} />
      {/* Top section above doorway */}
      <WallPlane position={[0, 3.5, 5]} rotation={[0, Math.PI, 0]} size={[4, 1]} color={config.wallColor} />

      {/* Dust particles (reduced) */}
      {dustCount > 0 && (
        <DustParticles count={dustCount} color={config.dustColor} />
      )}

      {/* Room decorations */}
      <RoomDecorations roomTheme={config.roomTheme} roomIndex={nextRoomIndex} />

      {/* Volumetric light beam through doorway */}
      <mesh position={[0, 1.5, 4]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.5, 6, 8, 1, true]} />
        <meshBasicMaterial
          color={config.pointLightColor}
          transparent
          opacity={0.03}
          side={2}
        />
      </mesh>
    </group>
  );
}
