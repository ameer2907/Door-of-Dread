import { useState } from 'react';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS } from '@/game/rooms';
import { audioManager } from '@/game/audio';

function Crosshair() {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-10">
      <div className="relative w-6 h-6">
        <div className="absolute top-1/2 left-0 w-full h-px bg-foreground/40" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-foreground/40" />
      </div>
    </div>
  );
}

function InteractPrompt() {
  const { targetedDoor } = useGame();
  if (targetedDoor === null) return null;
  return (
    <div className="fixed bottom-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-20
                    bg-background/70 px-4 py-2 rounded-md border border-border">
      <p className="text-foreground text-sm font-body">
        Press <span className="font-bold text-primary">E</span> to open door
      </p>
    </div>
  );
}

function FearOverlay() {
  const { fear } = useGame();
  const intensity = fear / 100;

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Permanent subtle vignette for atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 ${100 + intensity * 120}px rgba(0, 0, 0, ${0.4 + intensity * 0.4}),
                      inset 0 0 ${50 + intensity * 80}px rgba(80, 0, 0, ${0.05 + intensity * 0.4})`,
        }}
      />

      {/* Distortion at high fear */}
      {fear > 60 && (
        <div className="absolute inset-0 screen-distort opacity-30" />
      )}

      {/* Red pulse at very high fear */}
      {fear > 80 && (
        <div
          className="absolute inset-0"
          style={{ animation: 'pulse-red 1s infinite', opacity: (fear - 80) / 40 }}
        />
      )}
    </div>
  );
}

function FlickerOverlay() {
  const { flickering } = useGame();
  if (!flickering) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-25 flicker-overlay bg-foreground" />
  );
}

function HUD() {
  const { currentRoom, fear, wrongCount, pointerLocked, phase } = useGame();
  const config = ROOM_CONFIGS[currentRoom];

  if (phase !== 'playing') return null;

  return (
    <>
      {/* Room name */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
        <h2 className="font-horror text-2xl text-primary tracking-wider opacity-70">
          {config.name}
        </h2>
        <p className="text-center text-muted-foreground text-xs">
          Room {currentRoom + 1} / 7
        </p>
      </div>

      {/* Fear meter */}
      <div className="fixed top-4 right-4 pointer-events-none z-20 w-32">
        <p className="text-xs text-muted-foreground mb-1">FEAR</p>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${fear}%`,
              backgroundColor: fear > 70 ? 'hsl(0, 80%, 45%)' : fear > 40 ? 'hsl(30, 70%, 45%)' : 'hsl(50, 60%, 45%)',
            }}
          />
        </div>
      </div>

      {/* Wrong attempts */}
      {wrongCount > 0 && (
        <div className="fixed top-4 left-4 pointer-events-none z-20">
          <p className="text-xs text-primary">
            Wrong: {wrongCount} / 3
          </p>
        </div>
      )}

      {/* Click to lock message */}
      {!pointerLocked && (
        <div className="fixed inset-0 flex items-center justify-center z-40 bg-background/50 cursor-pointer pointer-events-none">
          <p className="text-foreground text-lg animate-pulse font-body">
            Click to look around
          </p>
        </div>
      )}
    </>
  );
}

function PauseMenu() {
  const { phase, resume, restart, setPhase } = useGame();
  if (phase !== 'paused') return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/80">
      <div className="text-center space-y-6">
        <h2 className="font-horror text-5xl text-primary">PAUSED</h2>
        <div className="space-y-3">
          <button
            onClick={resume}
            className="block w-48 mx-auto py-3 bg-secondary hover:bg-primary hover:text-primary-foreground
                       text-foreground rounded-md transition-colors font-body"
          >
            Resume
          </button>
          <button
            onClick={restart}
            className="block w-48 mx-auto py-3 bg-secondary hover:bg-primary hover:text-primary-foreground
                       text-foreground rounded-md transition-colors font-body"
          >
            Restart
          </button>
          <button
            onClick={() => setPhase('settings')}
            className="block w-48 mx-auto py-3 bg-secondary hover:bg-primary hover:text-primary-foreground
                       text-foreground rounded-md transition-colors font-body"
          >
            Settings
          </button>
          <button
            onClick={() => setPhase('menu')}
            className="block w-48 mx-auto py-3 bg-secondary hover:bg-muted
                       text-muted-foreground rounded-md transition-colors font-body"
          >
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function GameOverScreen() {
  const { phase, restart, setPhase } = useGame();
  if (phase !== 'gameover') return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/90">
      <div className="text-center space-y-6">
        <h2 className="font-horror text-7xl text-primary tracking-widest">GAME OVER</h2>
        <p className="text-muted-foreground font-body">The darkness consumed you.</p>
        <div className="space-y-3 pt-4">
          <button
            onClick={restart}
            className="block w-48 mx-auto py-3 bg-primary text-primary-foreground
                       rounded-md transition-colors hover:opacity-80 font-body"
          >
            Try Again
          </button>
          <button
            onClick={() => setPhase('menu')}
            className="block w-48 mx-auto py-3 bg-secondary text-foreground
                       rounded-md transition-colors hover:bg-muted font-body"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function WinScreen() {
  const { phase, setPhase } = useGame();
  if (phase !== 'win') return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/95">
      <div className="text-center space-y-6 max-w-md">
        <h2 className="font-horror text-6xl text-accent tracking-widest">ESCAPED</h2>
        <p className="text-foreground font-body text-lg">
          You found the right doors and escaped the haunted house.
        </p>
        <p className="text-muted-foreground font-body text-sm">
          The whispers fade behind you... for now.
        </p>
        <div className="pt-6 space-y-2 text-muted-foreground text-xs font-body">
          <p>THE WRONG DOOR</p>
          <p>A Horror Experience</p>
          <p className="pt-2">Built with React Three Fiber</p>
        </div>
        <button
          onClick={() => setPhase('menu')}
          className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-md
                     transition-colors hover:opacity-80 font-body"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}

function SettingsMenu() {
  const { phase, settings, updateSettings, setPhase } = useGame();
  if (phase !== 'settings') return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/90">
      <div className="text-center space-y-6 w-80">
        <h2 className="font-horror text-4xl text-primary">SETTINGS</h2>

        <div className="space-y-4 text-left">
          <div>
            <label className="text-sm text-muted-foreground font-body">Volume: {settings.volume}%</label>
            <input
              type="range" min="0" max="100" value={settings.volume}
              onChange={e => updateSettings({ volume: Number(e.target.value) })}
              className="w-full mt-1 accent-primary"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body">Sensitivity: {settings.sensitivity}</label>
            <input
              type="range" min="1" max="10" value={settings.sensitivity}
              onChange={e => updateSettings({ sensitivity: Number(e.target.value) })}
              className="w-full mt-1 accent-primary"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body">Graphics</label>
            <div className="flex gap-2 mt-1">
              {(['low', 'medium', 'high'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => updateSettings({ graphics: g })}
                  className={`flex-1 py-2 rounded text-sm font-body transition-colors ${
                    settings.graphics === g
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-muted'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setPhase('paused')}
          className="w-full py-3 bg-secondary text-foreground rounded-md
                     hover:bg-muted transition-colors font-body"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function TransitionOverlay() {
  const { isTransitioning } = useGame();
  return (
    <div
      className={`fixed inset-0 bg-background z-40 pointer-events-none transition-opacity duration-700 ${
        isTransitioning ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}

function MusicToggle() {
  const { phase } = useGame();
  const [musicOn, setMusicOn] = useState(true);

  if (phase !== 'playing') return null;

  const toggle = () => {
    const enabled = audioManager.toggleMusic();
    setMusicOn(enabled);
  };

  return (
    <button
      onClick={toggle}
      className="fixed top-14 right-4 z-20 px-3 py-1.5 rounded bg-secondary/80 hover:bg-secondary
                 text-xs text-muted-foreground hover:text-foreground transition-colors font-body
                 border border-border/50 backdrop-blur-sm"
    >
      ♪ {musicOn ? 'ON' : 'OFF'}
    </button>
  );
}

export default function GameUI() {
  return (
    <>
      <Crosshair />
      <InteractPrompt />
      <FearOverlay />
      <FlickerOverlay />
      <HUD />
      <MusicToggle />
      <PauseMenu />
      <GameOverScreen />
      <WinScreen />
      <SettingsMenu />
      <TransitionOverlay />
    </>
  );
}
