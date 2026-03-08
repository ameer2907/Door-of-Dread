import { useState, useEffect } from 'react';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS } from '@/game/rooms';
import { audioManager } from '@/game/audio';
import ghostNunImg from '@/assets/ghost-nun.jpg';
import RandomHorrorUI from './RandomHorrorUI';

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

function GhostApproachOverlay() {
  const { ghostState, ghostVisible, roomDarkness } = useGame();
  
  if (!ghostVisible) return null;
  if (ghostState !== 'approaching' && ghostState !== 'close') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[33]">
      {/* Building darkness */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${roomDarkness * 0.4})`,
        }}
      />
      {/* Edge darkness - tunnel vision */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 ${100 + roomDarkness * 150}px rgba(0, 0, 0, ${0.4 + roomDarkness * 0.5})`,
        }}
      />
      {/* Subtle red pulse when close */}
      {ghostState === 'close' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle, transparent 30%, rgba(80, 0, 0, 0.3) 100%)',
            animation: 'blood-pulse 0.8s infinite alternate',
          }}
        />
      )}
      {/* Breathing vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 ${80 + Math.sin(Date.now() * 0.003) * 30}px rgba(20, 0, 40, ${0.2 + roomDarkness * 0.3})`,
        }}
      />
    </div>
  );
}

function GhostAttackOverlay() {
  const { ghostState, ghostVisible } = useGame();
  const [scarePhase, setScarePhase] = useState(0);

  useEffect(() => {
    if (ghostState === 'attack' && ghostVisible) {
      setScarePhase(1);
      const t1 = setTimeout(() => setScarePhase(2), 300);
      const t2 = setTimeout(() => setScarePhase(3), 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setScarePhase(0);
    }
  }, [ghostState, ghostVisible]);

  if (!ghostVisible || ghostState !== 'attack') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[35]">
      {/* Sudden screen blackout flash */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          opacity: scarePhase >= 1 ? 1 : 0,
          transition: 'opacity 0.1s',
        }}
      />

      {/* Ghost nun image - scales up rapidly */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          animation: scarePhase >= 1 ? 'ghost-rush 2s ease-in forwards' : 'none',
          opacity: scarePhase >= 1 ? 1 : 0,
        }}
      >
        <img
          src={ghostNunImg}
          alt=""
          className="min-w-full min-h-full object-cover"
          style={{
            filter: `brightness(${scarePhase >= 2 ? 1.6 : 0.5}) contrast(1.8) saturate(0.1)`,
          }}
        />
      </div>

      {/* Blood red flashes - more intense */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, transparent 5%, rgba(150, 0, 0, 0.95) 100%)',
          animation: 'blood-pulse 0.08s infinite alternate',
          opacity: scarePhase >= 2 ? 0.9 : 0,
        }}
      />

      {/* Heavy static glitch */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ opacity: scarePhase >= 1 ? 0.6 : 0, mixBlendMode: 'overlay' }}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full"
            style={{
              height: `${Math.random() * 6 + 1}px`,
              top: `${Math.random() * 100}%`,
              backgroundColor: `rgba(255,255,255,${0.15 + Math.random() * 0.4})`,
              animation: `glitch-line ${0.03 + Math.random() * 0.06}s infinite`,
              animationDelay: `${Math.random() * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Death vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 200px rgba(100, 0, 0, 0.9), inset 0 0 80px rgba(0, 0, 0, 0.95)',
          animation: 'pulse 0.15s infinite alternate',
        }}
      />
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
      <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
        <h2 className="font-horror text-lg sm:text-2xl text-primary tracking-wider opacity-70">
          {config.name}
        </h2>
        <p className="text-center text-muted-foreground text-[10px] sm:text-xs">
          Room {currentRoom + 1} / 10
        </p>
      </div>

      {/* Fear meter */}
      <div className="fixed top-3 sm:top-4 right-3 sm:right-4 pointer-events-none z-20 w-20 sm:w-32">
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">FEAR</p>
        <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
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
        <div className="fixed top-3 sm:top-4 left-3 sm:left-4 pointer-events-none z-20">
          <p className="text-[10px] sm:text-xs text-primary">
            Wrong: {wrongCount} / 2
          </p>
        </div>
      )}

      {/* Click to lock message */}
      {!pointerLocked && (
        <div className="fixed inset-0 flex items-center justify-center z-40 bg-background/50 cursor-pointer pointer-events-none">
          <p className="text-foreground text-sm sm:text-lg animate-pulse font-body">
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
  const [letterReveal, setLetterReveal] = useState(0);

  useEffect(() => {
    if (phase === 'gameover') {
      setFadeGhost(true);
      setShowUI(false);
      setLetterReveal(0);
      const t1 = setTimeout(() => setFadeGhost(false), 2000);
      const t2 = setTimeout(() => setShowUI(true), 2800);
      const t3 = setTimeout(() => setLetterReveal(1), 3000);
      const t4 = setTimeout(() => setLetterReveal(2), 3300);
      const t5 = setTimeout(() => setLetterReveal(3), 3600);
      const t6 = setTimeout(() => setLetterReveal(4), 3900);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
    }
  }, [phase]);

  if (phase !== 'gameover') return null;

  const deadLetters = ['D', 'E', 'A', 'D'];

  return (
    <div className="fixed inset-0 z-50 bg-black">
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

      {showUI && (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center space-y-4 sm:space-y-6 animate-fade-in relative z-10 w-full max-w-lg">
            <p className="font-horror text-sm sm:text-lg md:text-2xl tracking-[0.3em] sm:tracking-[0.6em] uppercase"
               style={{
                 color: 'hsl(0, 60%, 50%)',
                 animation: 'flicker-text 3s infinite',
                 textShadow: '0 0 20px rgba(200, 0, 0, 0.5)',
               }}>
              Your soul has been consumed
            </p>

            <div className="flex justify-center gap-1 sm:gap-2 md:gap-4">
              {deadLetters.map((letter, i) => (
                <div
                  key={i}
                  className="relative"
                  style={{
                    opacity: i < letterReveal ? 1 : 0,
                    transform: i < letterReveal ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(1.3)',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  <span
                    className="font-horror text-5xl sm:text-7xl md:text-[10rem] inline-block"
                    style={{
                      color: 'hsl(0, 85%, 30%)',
                      textShadow: `0 0 40px rgba(200, 0, 0, 0.9),
                                   0 0 80px rgba(150, 0, 0, 0.5),
                                   0 0 120px rgba(100, 0, 0, 0.3),
                                   0 4px 20px rgba(0,0,0,0.95)`,
                      animation: i < letterReveal ? 'death-text-pulse 2s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  >
                    {letter}
                  </span>
                  {i < letterReveal && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full"
                      style={{
                        top: '85%',
                        height: `${20 + Math.random() * 30}px`,
                        background: 'linear-gradient(to bottom, hsl(0, 80%, 30%), transparent)',
                        animation: 'blood-drip 2s ease-in forwards',
                        animationDelay: `${0.3 + i * 0.2}s`,
                        opacity: 0.7,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-muted-foreground/40 font-body text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.5em] uppercase"
                 style={{ animation: 'flicker-text 4s infinite 1s' }}>
                Darkness has claimed another wanderer
              </p>
              <p className="font-horror text-xs sm:text-sm md:text-base tracking-widest pt-1"
                 style={{
                   color: 'hsl(0, 50%, 40%)',
                   textShadow: '0 0 15px rgba(200, 0, 0, 0.4)',
                 }}>
                The nun feasts on your eternal fear...
              </p>
            </div>

            <div className="space-y-3 pt-6 sm:pt-10">
              <button
                onClick={restart}
                className="group block w-48 sm:w-64 mx-auto py-3 sm:py-4 border-2 rounded-lg transition-all duration-300
                           font-horror text-lg sm:text-2xl tracking-[0.3em] relative overflow-hidden"
                style={{
                  borderColor: 'hsl(0, 60%, 25%)',
                  backgroundColor: 'hsla(0, 80%, 15%, 0.4)',
                  color: 'hsl(0, 50%, 60%)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(0, 70%, 40%)';
                  e.currentTarget.style.backgroundColor = 'hsla(0, 80%, 20%, 0.6)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(200, 0, 0, 0.3), inset 0 0 20px rgba(200, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(0, 60%, 25%)';
                  e.currentTarget.style.backgroundColor = 'hsla(0, 80%, 15%, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span className="relative z-10">FACE IT AGAIN</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
              <button
                onClick={() => setPhase('menu')}
                className="block w-48 sm:w-64 mx-auto py-2 sm:py-2.5 bg-transparent text-muted-foreground/40
                           rounded transition-colors hover:text-muted-foreground/70 font-body text-[10px] sm:text-xs tracking-widest"
              >
                flee to safety
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
          onClick={() => setPhase('menu')}
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
  const { isTransitioning, portal } = useGame();
  
  // Portal-based fog transition (not abrupt black)
  const isPortal = portal.phase !== 'none';
  const portalFog = portal.phase === 'arriving' ? 1 : portal.phase === 'walkThrough' ? 0.3 : 0;
  
  if (isPortal) {
    return (
      <div
        className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-500"
        style={{ opacity: portalFog }}
      >
        {/* Fog gradient instead of solid black */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 100%)',
        }} />
        {/* Subtle entering-room text */}
        {portal.phase === 'walkThrough' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground/20 text-xs font-body tracking-[0.5em] animate-pulse">
              entering...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback for non-portal transitions (win, etc.)
  return (
    <div
      className={`fixed inset-0 bg-background z-40 pointer-events-none transition-opacity duration-700 ${
        isTransitioning ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}

function IntroOverlay() {
  const { phase } = useGame();
  const [blackOpacity, setBlackOpacity] = useState(1);
  const [eyeOpenAmount, setEyeOpenAmount] = useState(0); // 0 = closed, 1 = fully open
  const [blurAmount, setBlurAmount] = useState(20);
  const [textPhase, setTextPhase] = useState(0); // 0=none, 1="...", 2="Wake up...", 3="Where am I...", 4="Something is wrong", 5=none
  const [heartbeatPulse, setHeartbeatPulse] = useState(false);

  useEffect(() => {
    if (phase === 'intro') {
      setBlackOpacity(1);
      setEyeOpenAmount(0);
      setBlurAmount(20);
      setTextPhase(0);
      setHeartbeatPulse(false);

      const timers: ReturnType<typeof setTimeout>[] = [];

      // Phase 1 (0-1.5s): Darkness, first blink attempt
      timers.push(setTimeout(() => { setEyeOpenAmount(0.1); setBlackOpacity(0.9); }, 800));
      timers.push(setTimeout(() => { setEyeOpenAmount(0); setBlackOpacity(1); }, 1100)); // blink shut
      timers.push(setTimeout(() => setTextPhase(1), 1000)); // "..."

      // Phase 2 (1.5-3.5s): Eyes start opening, blurry
      timers.push(setTimeout(() => { setEyeOpenAmount(0.25); setBlackOpacity(0.7); setBlurAmount(15); }, 1500));
      timers.push(setTimeout(() => { setEyeOpenAmount(0.15); }, 1900)); // flutter
      timers.push(setTimeout(() => { setEyeOpenAmount(0.35); setBlackOpacity(0.5); setBlurAmount(12); }, 2200));
      timers.push(setTimeout(() => { setTextPhase(2); setHeartbeatPulse(true); }, 2000)); // "Wake up..."

      // Phase 3 (3.5-5.5s): Eyes opening more, vision clearing
      timers.push(setTimeout(() => { setEyeOpenAmount(0.55); setBlackOpacity(0.3); setBlurAmount(8); }, 3500));
      timers.push(setTimeout(() => { setTextPhase(3); }, 3800)); // "Where am I..."
      timers.push(setTimeout(() => { setEyeOpenAmount(0.7); setBlurAmount(5); }, 4200));

      // Phase 4 (5.5-7s): Standing up, vision nearly clear
      timers.push(setTimeout(() => { setEyeOpenAmount(0.85); setBlackOpacity(0.15); setBlurAmount(3); }, 5500));
      timers.push(setTimeout(() => { setTextPhase(4); }, 5800)); // "Something is wrong"
      timers.push(setTimeout(() => { setEyeOpenAmount(0.95); setBlurAmount(1); }, 6500));

      // Phase 5 (7-8s): Fully awake
      timers.push(setTimeout(() => { setTextPhase(5); }, 7000)); // clear text
      timers.push(setTimeout(() => { setEyeOpenAmount(1); setBlackOpacity(0); setBlurAmount(0); setHeartbeatPulse(false); }, 7500));

      return () => timers.forEach(clearTimeout);
    }
  }, [phase]);

  if (phase !== 'intro' && phase !== 'playing') return null;
  if (phase === 'playing' && blackOpacity === 0 && eyeOpenAmount >= 1) return null;

  const eyeBarHeight = `${Math.max(0, (1 - eyeOpenAmount) * 50)}%`;

  const introTexts = ['', '...', 'Wake up...', 'Where am I...', 'Something is wrong', ''];
  const currentText = introTexts[textPhase] || '';

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none"
      style={{ transition: 'opacity 0.5s' }}
    >
      {/* Overall darkness */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-700"
        style={{ opacity: blackOpacity }}
      />

      {/* Eye-opening effect - top eyelid */}
      <div
        className="absolute top-0 left-0 right-0 bg-black z-[41] transition-all duration-700"
        style={{ height: eyeBarHeight }}
      />
      {/* Eye-opening effect - bottom eyelid */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-black z-[41] transition-all duration-700"
        style={{ height: eyeBarHeight }}
      />

      {/* Blur / unfocused vision */}
      {blurAmount > 0 && (
        <div
          className="absolute inset-0 z-[42] transition-all duration-1000"
          style={{
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          }}
        />
      )}

      {/* Vignette that intensifies when waking */}
      <div
        className="absolute inset-0 z-[43]"
        style={{
          boxShadow: `inset 0 0 ${150 + (1 - eyeOpenAmount) * 200}px rgba(0, 0, 0, ${0.5 + (1 - eyeOpenAmount) * 0.5})`,
          transition: 'box-shadow 0.8s',
        }}
      />

      {/* Heartbeat red pulse */}
      {heartbeatPulse && (
        <div
          className="absolute inset-0 z-[44]"
          style={{
            background: 'radial-gradient(circle, transparent 40%, rgba(80, 0, 0, 0.15) 100%)',
            animation: 'blood-pulse 1.2s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Text overlay */}
      {currentText && (
        <div className="absolute inset-0 z-[45] flex items-center justify-center">
          <div className="text-center space-y-2">
            <p
              className="font-horror text-lg sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em]"
              style={{
                color: textPhase === 4 ? 'hsl(0, 60%, 50%)' : 'hsl(0, 10%, 50%)',
                textShadow: textPhase === 4
                  ? '0 0 20px rgba(200, 0, 0, 0.5), 0 0 40px rgba(150, 0, 0, 0.3)'
                  : '0 0 10px rgba(150, 150, 150, 0.2)',
                animation: 'flicker-text 3s infinite',
                transition: 'color 0.5s',
              }}
            >
              {currentText}
            </p>
            {textPhase >= 3 && (
              <p
                className="text-xs font-body tracking-[0.3em] uppercase"
                style={{
                  color: 'hsl(0, 0%, 30%)',
                  animation: 'fade-in 1s ease-out',
                }}
              >
                {textPhase === 4 ? 'Find the way out' : 'The air is cold...'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
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
      <GhostApproachOverlay />
      <GhostAttackOverlay />
      <HUD />
      <MusicToggle />
      <PauseMenu />
      <GameOverScreen />
      <WinScreen />
      <SettingsMenu />
      <TransitionOverlay />
      <IntroOverlay />
    </>
  );
}
