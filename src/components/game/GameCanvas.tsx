import { Canvas } from '@react-three/fiber';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS, DOOR_POSITIONS } from '@/game/rooms';
import Room3D from './Room3D';
import Ghost3D from './Ghost3D';
import PlayerController from './PlayerController';
import NextRoomPortal from './NextRoomPortal';

export default function GameCanvas() {
  const { currentRoom, correctDoorIndex, openingDoor, flickering, ghostVisible, ghostState, ghostSpawnType, ghostApproachProgress, roomDarkness, selectDoor, phase, portal } = useGame();
  const config = ROOM_CONFIGS[currentRoom];

  if (phase === 'menu') return null;

  const showNextRoom = portal.phase !== 'none' && portal.nextRoomIndex < ROOM_CONFIGS.length;

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 50, position: [0, 1.7, 3] }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.9 }}
      >
        <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />

        {/* Current room */}
        <Room3D
          config={config}
          roomIndex={currentRoom}
          correctDoorIndex={correctDoorIndex}
          openingDoor={openingDoor}
          flickering={flickering}
          onSelectDoor={selectDoor}
        />

        {/* Next room visible through the portal door */}
        {showNextRoom && (
          <NextRoomPortal
            nextRoomIndex={portal.nextRoomIndex}
            doorIndex={portal.doorIndex}
            portalPhase={portal.phase}
          />
        )}

        <Ghost3D
          visible={ghostVisible}
          state={ghostState}
          roomIndex={currentRoom}
          spawnDoorIndex={openingDoor}
          spawnType={ghostSpawnType}
          approachProgress={ghostApproachProgress}
        />

        {/* Room darkness overlay light - dims during ghost encounters */}
        {roomDarkness > 0 && (
          <ambientLight color="#000000" intensity={-roomDarkness * 2} />
        )}

        <PlayerController />
      </Canvas>
    </div>
  );
}
