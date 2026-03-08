import { Canvas } from '@react-three/fiber';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS, DOOR_POSITIONS } from '@/game/rooms';
import Room3D from './Room3D';
import Ghost3D from './Ghost3D';
import PlayerController from './PlayerController';
import NextRoomPortal from './NextRoomPortal';
import GhostAtmosphere from './GhostAtmosphere';
import RandomHorrorEvents from './RandomHorrorEvents';

export default function GameCanvas() { // v3
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
        <fogExp2 attach="fog" args={[config.fogColor, 0.04 + (1 - config.fogFar / 25) * 0.06]} />

        {/* Current room */}
        <Room3D
          config={config}
          roomIndex={currentRoom}
          correctDoorIndex={correctDoorIndex}
          openingDoor={openingDoor}
          flickering={flickering}
          onSelectDoor={selectDoor}
          darkness={roomDarkness}
        />

        {/* Next room visible through the portal door — with god ray light cone */}
        {showNextRoom && (
          <>
            <NextRoomPortal
              nextRoomIndex={portal.nextRoomIndex}
              doorIndex={portal.doorIndex}
              portalPhase={portal.phase}
            />
            {/* God ray volumetric light through doorway */}
            <spotLight
              position={[DOOR_POSITIONS[portal.doorIndex][0], 3.5, DOOR_POSITIONS[portal.doorIndex][2] - 1]}
              target-position={[DOOR_POSITIONS[portal.doorIndex][0], 0, DOOR_POSITIONS[portal.doorIndex][2] + 2]}
              angle={0.4}
              penumbra={0.8}
              intensity={portal.phase === 'walkThrough' ? 3 : 1.5}
              color="#ffddaa"
              distance={10}
              castShadow
            />
          </>
        )}

        <Ghost3D
          visible={ghostVisible}
          state={ghostState}
          roomIndex={currentRoom}
          spawnDoorIndex={openingDoor}
          spawnType={ghostSpawnType}
          approachProgress={ghostApproachProgress}
        />

        {/* Atmospheric horror effects during ghost encounters */}
        <GhostAtmosphere
          ghostVisible={ghostVisible}
          ghostState={ghostState}
          roomDarkness={roomDarkness}
          approachProgress={ghostApproachProgress}
        />

        {/* Random horror events - shadows, sounds, flickers */}
        <RandomHorrorEvents />

        {/* Room darkness overlay light - dims during ghost encounters */}
        {roomDarkness > 0 && (
          <ambientLight color="#000000" intensity={-roomDarkness * 2} />
        )}

        <PlayerController />
      </Canvas>
    </div>
  );
}
