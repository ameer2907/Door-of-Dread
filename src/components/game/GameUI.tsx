import { useState, useEffect } from 'react';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS } from '@/game/rooms';
import { audioManager } from '@/game/audio';
import ghostNunImg from '@/assets/ghost-nun.jpg';

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

function GhostAttackOverlay() {
  const { ghostState, ghostVisible } = useGame();
  const [scarePhase, setScarePhase] = useState(0);

  useEffect(() => {
    if (ghostState === 'attack' && ghostVisible) {
      setScarePhase(1);
      const t1 = setTimeout(() => setScarePhase(2), 400);
      const t2 = setTimeout(() => setScarePhase(3), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setScarePhase(0);
    }
  }, [ghostState, ghostVisible]);

  if (!ghostVisible || (ghostState !== 'attack' && ghostState !== 'close')) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[35]">
      {/* Screen darkening */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: ghostState === 'attack' ? 1 : 0.3,
        }}
      />

      {ghostState === 'attack' && (
        <>
          {/* Ghost nun image - scales up rapidly toward player */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              animation: scarePhase >= 1 ? 'ghost-rush 2.5s ease-in forwards' : 'none',
              opacity: scarePhase >= 1 ? 1 : 0,
            }}
          >
            <img
              src={ghostNunImg}
              alt=""
              className="min-w-full min-h-full object-cover"
              style={{
                filter: `brightness(${scarePhase >= 2 ? 1.4 : 0.7}) contrast(1.5) saturate(0.2)`,
              }}
            />
          </div>

          {/* Blood red flashes */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, transparent 10%, rgba(120, 0, 0, 0.9) 100%)',
              animation: 'blood-pulse 0.12s infinite alternate',
              opacity: scarePhase >= 2 ? 0.8 : 0,
            }}
          />

          {/* Static glitch lines */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ opacity: scarePhase >= 1 ? 0.5 : 0, mixBlendMode: 'overlay' }}
          >
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full"
                style={{
                  height: `${Math.random() * 4 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: `rgba(255,255,255,${0.1 + Math.random() * 0.3})`,
                  animation: `glitch-line ${0.04 + Math.random() * 0.08}s infinite`,
                  animationDelay: `${Math.random() * 0.3}s`,
                }}
              />
            ))}
          </div>

          {/* Death vignette */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 200px rgba(100, 0, 0, 0.9), inset 0 0 80px rgba(0, 0, 0, 0.95)',
              animation: 'pulse 0.2s infinite alternate',
            }}
          />
        </>
      )}

      {ghostState === 'close' && (
        <div
          className="absolute inset-0"
          style={{ boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.6)' }}
        />
      )}
    </div>
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
  const [showUI, setShowUI] = useState(false);
  const [fadeGhost, setFadeGhost] = useState(true);

  useEffect(() => {
    if (phase === 'gameover') {
      setFadeGhost(true);
      setShowUI(false);
      const t1 = setTimeout(() => setFadeGhost(false), 2000);
      const t2 = setTimeout(() => setShowUI(true), 2800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase]);

  if (phase !== 'gameover') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Ghost face lingering after death */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000"
        style={{ opacity: fadeGhost ? 1 : 0 }}
      >
        <img
          src={ghostNunImg}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(0.4) contrast(1.6) saturate(0.1)',
            animation: 'death-shake 0.1s infinite',
          }}
        />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(80, 0, 0, 0.9) 100%)',
        }} />
      </div>

      {/* Death message */}
      {showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 animate-fade-in relative z-10">
            <p className="font-horror text-2xl tracking-[0.5em] text-red-400/80 uppercase"
               style={{ animation: 'flicker-text 3s infinite' }}>
              You didn't survive
            </p>
            <h2
              className="font-horror text-8xl md:text-9xl tracking-widest"
              style={{
                color: 'hsl(0, 80%, 35%)',
                textShadow: '0 0 40px rgba(200, 0, 0, 0.8), 0 0 80px rgba(150, 0, 0, 0.4), 0 4px 20px rgba(0,0,0,0.9)',
                animation: 'death-text-pulse 2s ease-in-out infinite',
              }}
            >
              DEAD
            </h2>
            <p className="text-muted-foreground/60 font-body text-sm tracking-widest pt-2">
              The nun claimed your soul...
            </p>
            <div className="space-y-3 pt-8">
              <button
                onClick={restart}
                className="block w-56 mx-auto py-3 border-2 border-red-800/60 bg-red-950/30
                           text-red-300 rounded transition-all hover:bg-red-900/50 hover:border-red-600
                           hover:text-red-200 font-horror text-xl tracking-wider"
              >
                FACE IT AGAIN
              </button>
              <button
                onClick={() => setPhase('menu')}
                className="block w-56 mx-auto py-2.5 bg-transparent text-muted-foreground/50
                           rounded transition-colors hover:text-muted-foreground font-body text-sm"
              >
                Escape to Menu
              </button>
            </div>
          </div>
        </div>
      )}
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
          <p>DOOR OF DREAD</p>
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
      <GhostAttackOverlay />
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
