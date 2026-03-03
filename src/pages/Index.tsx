import { GameProvider } from '@/game/store';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/game/GameUI';
import MainMenu from '@/components/game/MainMenu';

export default function Index() {
  return (
    <GameProvider>
      <div className="w-screen h-screen bg-background overflow-hidden relative">
        <GameCanvas />
        <GameUI />
        <MainMenu />
      </div>
    </GameProvider>
  );
}
