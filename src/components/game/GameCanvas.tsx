import { Canvas } from '@react-three/fiber';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS } from '@/game/rooms';
import Room3D from './Room3D';
import Ghost3D from './Ghost3D';
import PlayerController from './PlayerController';

export default function GameCanvas() {
  const { currentRoom, correctDoorIndex, openingDoor, flickering, ghostVisible, ghostState, selectDoor, phase } = useGame();
  const config = ROOM_CONFIGS[currentRoom];

  if (phase === 'menu' || phase === 'settings') return null;

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 50, position: [0, 1.7, 3] }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.9 }}
      >
        <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />

        <Room3D
          config={config}
          roomIndex={currentRoom}
          correctDoorIndex={correctDoorIndex}
          openingDoor={openingDoor}
          flickering={flickering}
          onSelectDoor={selectDoor}
        />

        <Ghost3D
          visible={ghostVisible}
          state={ghostState}
          roomIndex={currentRoom}
        />

        <PlayerController />
      </Canvas>
    </div>
  );
}
