import { useGame } from '@/game/store';
import menuBg from '@/assets/menu-bg.jpg';

export default function MainMenu() {
  const { phase, startGame, setPhase } = useGame();

  if (phase !== 'menu') return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${menuBg})`,
          filter: 'brightness(0.4) saturate(0.7)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        <div>
          <h1 className="font-horror text-7xl md:text-9xl text-primary tracking-widest drop-shadow-lg"
              style={{ textShadow: '0 0 40px hsl(0, 65%, 42%), 0 0 80px hsl(0, 65%, 30%)' }}>
            DOOR OF
          </h1>
          <h1 className="font-horror text-8xl md:text-[10rem] text-foreground tracking-[0.3em] -mt-2"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
            DREAD
          </h1>
        </div>

        <p className="text-muted-foreground font-body text-sm tracking-widest uppercase">
          Choose wisely. The wrong door could be your last.
        </p>

        <div className="space-y-3 pt-4">
          <button
            onClick={startGame}
            className="block w-56 mx-auto py-3 bg-primary text-primary-foreground
                       rounded-md font-body text-lg tracking-wide
                       transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
          >
            Start Game
          </button>
          <button
            onClick={() => setPhase('settings')}
            className="block w-56 mx-auto py-3 bg-secondary/80 text-foreground
                       rounded-md font-body transition-colors hover:bg-secondary"
          >
            Settings
          </button>
        </div>

        <div className="pt-8 space-y-1">
          <p className="text-muted-foreground/50 text-xs font-body">WASD to move · Mouse to look · E to interact</p>
          <p className="text-muted-foreground/50 text-xs font-body">ESC to pause · SHIFT to sprint</p>
        </div>
      </div>
    </div>
  );
}
