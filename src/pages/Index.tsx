import { GameProvider } from '@/game/store';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/game/GameUI';
import MainMenu from '@/components/game/MainMenu';
import JoystickControl from '@/components/game/JoystickControl';
import PostProcessing from '@/components/game/PostProcessing';

export default function Index() { // Door of Dread
  return (
    <GameProvider>
      <div className="w-screen h-screen bg-background overflow-hidden relative">
        <GameCanvas />
        <PostProcessing />
        <GameUI />
        <MainMenu />
        <JoystickControl />
      </div>
    </GameProvider>
  );
}
