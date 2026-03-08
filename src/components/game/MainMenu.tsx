import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/game/store';
import { audioManager } from '@/game/audio';
import menuBg from '@/assets/menu-bg.jpg';

const TITLE_WORDS = ['DOOR', 'OF', 'DREAD'];

function LightningFlash() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 4000 + Math.random() * 10000;
      timer = setTimeout(() => {
        setFlash(true);
        audioManager.playLightningCrack();
        setTimeout(() => setFlash(false), 70);
        setTimeout(() => {
          setFlash(true);
          setTimeout(() => setFlash(false), 30);
        }, 130);
        if (Math.random() > 0.6) {
          setTimeout(() => {
            setFlash(true);
            setTimeout(() => setFlash(false), 50);
          }, 400);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  if (!flash) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-20"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(200,200,255,0.25) 0%, rgba(150,150,200,0.08) 40%, transparent 70%)',
      }}
    />
  );
}

function FogLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-[250%] h-full"
          style={{
            background: `radial-gradient(ellipse at ${20 + i * 12}% ${40 + i * 8}%, rgba(80,20,20,0.2) 0%, transparent 55%)`,
            animation: `fog-drift ${18 + i * 4}s ease-in-out infinite alternate`,
            animationDelay: `${i * 2.5}s`,
            opacity: 0.3 + (i % 2) * 0.1,
          }}
        />
      ))}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%]"
        style={{
          background: 'linear-gradient(to top, rgba(15,5,5,0.9) 0%, rgba(30,10,10,0.4) 40%, transparent 100%)',
          animation: 'fog-drift 25s ease-in-out infinite alternate',
        }}
      />
    </div>
  );
}

function FloatingEmbers() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
      {Array.from({ length: 35 }).map((_, i) => {
        const size = 1 + Math.random() * 3;
        const isEmber = Math.random() > 0.5;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
              backgroundColor: isEmber
                ? `rgba(255, ${60 + Math.random() * 80}, 0, ${0.4 + Math.random() * 0.4})`
                : `rgba(200, 180, 160, ${0.1 + Math.random() * 0.15})`,
              animation: `float-particle ${6 + Math.random() * 14}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
              boxShadow: isEmber ? `0 0 ${4 + Math.random() * 6}px rgba(255, 80, 0, 0.6)` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

function ScreenGrain() {
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeed(Math.random()), 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[3] mix-blend-overlay"
      style={{
        opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='${Math.floor(seed * 100)}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }}
    />
  );
}

function BloodDripLetter({ char, delay, isDread }: { char: string; delay: number; isDread: boolean }) {
  const dripCount = isDread ? 4 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 3);
  return (
    <span className="relative inline-block">
      {char}
      {/* Blood film on letter bottom */}
      <span
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: '0%',
          height: '35%',
          background: 'linear-gradient(to top, hsla(0, 90%, 30%, 0.7), transparent)',
          opacity: 0,
          animation: `fade-in 1.5s ease-in ${delay + 0.5}s forwards`,
          borderRadius: '0 0 2px 2px',
        }}
      />
      {/* Multiple drip streams */}
      {Array.from({ length: dripCount }).map((_, i) => {
        const left = 5 + Math.random() * 90;
        const h = 20 + Math.random() * (isDread ? 90 : 55);
        const w = 1.5 + Math.random() * 2.5;
        const d = delay + 1.0 + i * 0.4 + Math.random() * 2;
        const dur = 3 + Math.random() * 4;
        return (
          <span key={`drip-${i}`} className="absolute pointer-events-none" style={{ left: `${left}%`, top: '90%' }}>
            {/* Main drip stream */}
            <span
              className="absolute"
              style={{
                width: `${w}px`,
                height: `${h}px`,
                borderRadius: '0 0 50% 50%',
                background: `linear-gradient(to bottom, hsl(0, 85%, 38%), hsl(0, 90%, 22%), hsl(0, 85%, 15%), transparent)`,
                opacity: 0,
                animation: `title-blood-drip ${dur}s ease-in ${d}s forwards`,
                filter: 'blur(0.3px)',
              }}
            />
            {/* Droplet at the tip */}
            <span
              className="absolute rounded-full"
              style={{
                width: `${w + 2}px`,
                height: `${w + 2}px`,
                left: `-1px`,
                top: `${h - 2}px`,
                background: 'radial-gradient(circle, hsl(0, 90%, 35%), hsl(0, 85%, 18%))',
                boxShadow: '0 2px 6px rgba(150, 0, 0, 0.5)',
                opacity: 0,
                animation: `title-blood-drip ${dur}s ease-in ${d + dur * 0.4}s forwards`,
              }}
            />
          </span>
        );
      })}
      {/* Slow secondary drip that starts later */}
      {isDread && (
        <span
          className="absolute pointer-events-none"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: '92%',
            width: '3px',
            height: `${60 + Math.random() * 50}px`,
            borderRadius: '0 0 50% 50%',
            background: `linear-gradient(to bottom, hsl(0, 80%, 35%), hsl(0, 90%, 20%), hsl(0, 80%, 12%), transparent)`,
            opacity: 0,
            animation: `title-blood-drip 6s ease-in ${delay + 4 + Math.random() * 3}s forwards`,
            filter: 'blur(0.5px)',
          }}
        />
      )}
    </span>
  );
}

function NeonTitle({ visibleWords, glitch }: { visibleWords: number; glitch: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-0">
      {TITLE_WORDS.map((word, i) => {
        const isVisible = i < visibleWords;
        const isDread = word === 'DREAD';
        const isOf = word === 'OF';

        return (
          <div
            key={word}
            className={`transition-all duration-1000 leading-none ${
              isVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-12 scale-110'
            }`}
            style={{
              transitionDelay: `${i * 150}ms`,
              marginTop: isOf ? '-0.1em' : isDread ? '-0.15em' : 0,
              marginBottom: isOf ? '-0.1em' : 0,
            }}
          >
            <h1
              className={`select-none leading-[0.85] ${glitch ? 'animate-title-glitch' : ''}`}
              style={{
                fontFamily: isDread ? "'Nosifer', cursive" : "'Creepster', cursive",
                fontSize: isDread
                  ? 'clamp(3rem, 10vw, 11rem)'
                  : isOf
                  ? 'clamp(1.2rem, 3vw, 3.5rem)'
                  : 'clamp(2.5rem, 8vw, 9rem)',
                color: isDread
                  ? 'hsl(0, 85%, 50%)'
                  : isOf
                  ? 'hsl(0, 40%, 40%)'
                  : 'hsl(0, 70%, 45%)',
                textShadow: isDread
                  ? `0 0 10px rgba(255,30,30,0.9),
                     0 0 30px rgba(255,30,30,0.6),
                     0 0 60px rgba(255,0,0,0.4),
                     0 0 100px rgba(200,0,0,0.3),
                     0 0 150px rgba(150,0,0,0.15),
                     0 2px 4px rgba(0,0,0,0.9)`
                  : isOf
                  ? '0 0 15px rgba(200,50,50,0.3), 0 2px 4px rgba(0,0,0,0.8)'
                  : `0 0 20px rgba(255,50,50,0.7),
                     0 0 50px rgba(255,20,20,0.4),
                     0 0 90px rgba(200,0,0,0.2),
                     0 2px 4px rgba(0,0,0,0.9)`,
                letterSpacing: isDread ? '0.12em' : isOf ? '0.5em' : '0.08em',
                animation: isVisible
                  ? isDread
                    ? 'neon-flicker 4s ease-in-out infinite, neon-pulse 2s ease-in-out infinite'
                    : 'neon-pulse 3s ease-in-out infinite'
                  : 'none',
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {isVisible && !isOf
                ? word.split('').map((char, ci) => (
                    <BloodDripLetter key={ci} char={char} delay={i * 1.4 + ci * 0.3} isDread={isDread} />
                  ))
                : word}
            </h1>
          </div>
        );
      })}

      {/* Subtitle */}
      <div className={`mt-3 sm:mt-5 transition-all duration-1500 delay-700 ${
        visibleWords >= 3 ? 'opacity-100' : 'opacity-0'
      }`}>
        <p
          className="tracking-[0.5em] sm:tracking-[0.8em] uppercase"
          style={{
            fontSize: 'clamp(0.55rem, 1.2vw, 0.8rem)',
            color: 'hsl(0, 30%, 35%)',
            textShadow: '0 0 10px rgba(200,50,50,0.3)',
            animation: visibleWords >= 3 ? 'flicker-text 5s infinite 2s' : 'none',
          }}
        >
          A Horror Experience
        </p>
      </div>
    </div>
  );
}

export default function MainMenu() {
  const { phase, startGame, setPhase } = useGame();
  const [introPhase, setIntroPhase] = useState<'dark' | 'ambient' | 'title' | 'ready'>('dark');
  const [visibleWords, setVisibleWords] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [entering, setEntering] = useState(false);
  const audioStarted = useRef(false);
  const hoverTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoverStart = useRef(0);

  useEffect(() => {
    if (phase !== 'menu') return;

    setIntroPhase('dark');
    setVisibleWords(0);
    setShowButtons(false);
    setShowControls(false);
    setGlitch(false);
    setEntering(false);
    audioStarted.current = false;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      setIntroPhase('ambient');
      if (!audioStarted.current) {
        audioStarted.current = true;
        audioManager.init();
        audioManager.resume();
        audioManager.playTitleIntro();
        audioManager.playMenuAmbience();
      }
    }, 500));

    timers.push(setTimeout(() => {
      setIntroPhase('title');
    }, 1800));

    TITLE_WORDS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleWords(i + 1);
        audioManager.playTitleHit(i);
      }, 3000 + i * 1400));
    });

    const glitchTime = 3000 + TITLE_WORDS.length * 1400 + 600;
    timers.push(setTimeout(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 300);
    }, glitchTime));

    timers.push(setTimeout(() => {
      setIntroPhase('ready');
      setShowButtons(true);
    }, glitchTime + 800));

    timers.push(setTimeout(() => setShowControls(true), glitchTime + 1400));

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const handleEnter = useCallback(() => {
    if (entering) return;
    setEntering(true);
    audioManager.stopHeartbeat();
    if (hoverTimer.current) { clearInterval(hoverTimer.current); hoverTimer.current = null; }
    audioManager.playHorrorDoorOpen();

    setTimeout(() => {
      audioManager.stopMenuAmbience();
      startGame();
    }, 1200);
  }, [entering, startGame]);

  if (phase !== 'menu') return null;

  const bgOpacity = introPhase === 'dark' ? 0 : introPhase === 'ambient' ? 0.3 : 1;
  const screenDark = entering ? 1 : introPhase === 'dark' ? 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2500ms]"
        style={{
          backgroundImage: `url(${menuBg})`,
          filter: 'brightness(0.15) saturate(0.2) contrast(1.3) hue-rotate(-10deg)',
          opacity: bgOpacity,
          animation: bgOpacity > 0 ? 'menu-bg-breathe 10s ease-in-out infinite' : 'none',
        }}
      />

      {/* Red ambient light overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{
          opacity: bgOpacity * 0.6,
          background: `
            radial-gradient(ellipse at 30% 70%, rgba(120,10,10,0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 30%, rgba(100,5,5,0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(80,0,0,0.35) 0%, transparent 40%)
          `,
        }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 40%, transparent 25%, rgba(0,0,0,0.9) 100%)',
      }} />

      {/* Atmospheric layers */}
      <FogLayer />
      <LightningFlash />
      <FloatingEmbers />
      <ScreenGrain />

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none z-[4]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 6px)',
        opacity: 0.5,
      }} />

      {/* Flickering red rim light */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          boxShadow: 'inset 0 0 200px rgba(80,0,0,0.4), inset 0 0 80px rgba(40,0,0,0.6)',
          animation: 'red-rim-flicker 6s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div className={`relative z-10 text-center w-full max-w-3xl mx-auto px-4 space-y-4 sm:space-y-6 transition-all duration-1000 ${
        introPhase === 'dark' ? 'opacity-0' : 'opacity-100'
      }`}>
        <NeonTitle visibleWords={visibleWords} glitch={glitch} />

        {/* Tagline */}
        <p
          className={`font-body text-[10px] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.4em] uppercase transition-all duration-1000 px-4 ${
            showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{
            color: 'hsl(0, 20%, 40%)',
            textShadow: '0 0 8px rgba(150,30,30,0.3)',
          }}
        >
          Choose wisely. The wrong door could be your last.
        </p>

        {/* Buttons */}
        <div
          className={`space-y-3 sm:space-y-4 pt-4 sm:pt-6 transition-all duration-700 ${
            showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <button
            onClick={handleEnter}
            disabled={entering}
            className="group block w-56 sm:w-64 md:w-72 mx-auto py-3 sm:py-4 md:py-5 rounded-lg relative overflow-hidden
                       transition-all duration-500 hover:scale-105 active:scale-100
                       border-2"
            style={{
              borderColor: entering ? 'hsl(0, 70%, 25%)' : 'hsl(0, 70%, 35%)',
              backgroundColor: entering ? 'hsla(0, 80%, 15%, 0.8)' : 'hsla(0, 80%, 20%, 0.6)',
              boxShadow: `0 0 20px rgba(200,30,30,0.3), 
                          0 0 60px rgba(150,0,0,0.15),
                          inset 0 0 20px rgba(200,30,30,0.1)`,
              animation: !entering ? 'enter-btn-pulse 2.5s ease-in-out infinite' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!entering) {
                e.currentTarget.style.boxShadow = `0 0 40px rgba(255,40,40,0.5), 
                  0 0 80px rgba(200,0,0,0.3), 
                  0 0 120px rgba(150,0,0,0.15),
                  inset 0 0 30px rgba(255,40,40,0.15)`;
                e.currentTarget.style.borderColor = 'hsl(0, 80%, 50%)';
                // Start heartbeat that intensifies over time
                hoverStart.current = Date.now();
                audioManager.startHeartbeat(1200);
                hoverTimer.current = setInterval(() => {
                  const elapsed = (Date.now() - hoverStart.current) / 1000;
                  const rate = Math.max(350, 1200 - elapsed * 150);
                  audioManager.stopHeartbeat();
                  audioManager.startHeartbeat(rate);
                }, 1500);
              }
            }}
            onMouseLeave={(e) => {
              if (!entering) {
                e.currentTarget.style.boxShadow = `0 0 20px rgba(200,30,30,0.3), 
                  0 0 60px rgba(150,0,0,0.15),
                  inset 0 0 20px rgba(200,30,30,0.1)`;
                e.currentTarget.style.borderColor = 'hsl(0, 70%, 35%)';
                audioManager.stopHeartbeat();
                if (hoverTimer.current) { clearInterval(hoverTimer.current); hoverTimer.current = null; }
              }
            }}
          >
            <span
              className="relative z-10 text-xl sm:text-2xl md:text-3xl tracking-[0.3em] sm:tracking-[0.4em]"
              style={{
                fontFamily: "'Creepster', cursive",
                color: entering ? 'hsl(0, 60%, 35%)' : 'hsl(0, 70%, 60%)',
                textShadow: `0 0 15px rgba(255,50,50,0.8), 0 0 30px rgba(255,30,30,0.4)`,
              }}
            >
              {entering ? 'ENTERING...' : 'ENTER'}
            </span>
            {/* Shine sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            {/* Bottom glow line */}
            <div className="absolute bottom-0 left-[10%] right-[10%] h-[2px] rounded-full"
              style={{
                background: 'linear-gradient(to right, transparent, hsl(0, 80%, 45%), transparent)',
                boxShadow: '0 0 10px rgba(255,40,40,0.5)',
                animation: 'glow-line-pulse 2s ease-in-out infinite',
              }}
            />
          </button>

          <button
            onClick={() => setPhase('lore')}
            className="block w-56 sm:w-64 md:w-72 mx-auto py-2 sm:py-3 rounded-lg font-body text-xs sm:text-sm tracking-[0.3em] uppercase
                       transition-all duration-300 border backdrop-blur-sm
                       hover:scale-[1.02]"
            style={{
              borderColor: 'hsl(0, 30%, 18%)',
              backgroundColor: 'hsla(0, 20%, 8%, 0.6)',
              color: 'hsl(0, 20%, 42%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'hsl(0, 50%, 30%)';
              e.currentTarget.style.color = 'hsl(0, 30%, 60%)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(150,20,20,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'hsl(0, 30%, 18%)';
              e.currentTarget.style.color = 'hsl(0, 20%, 42%)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            The Lore
          </button>

          <button
            onClick={() => setPhase('settings')}
            className="block w-56 sm:w-64 md:w-72 mx-auto py-2 sm:py-3 rounded-lg font-body text-xs sm:text-sm tracking-[0.3em] uppercase
                       transition-all duration-300 border backdrop-blur-sm
                       hover:scale-[1.02]"
            style={{
              borderColor: 'hsl(0, 0%, 18%)',
              backgroundColor: 'hsla(0, 0%, 8%, 0.6)',
              color: 'hsl(0, 0%, 45%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'hsl(0, 40%, 30%)';
              e.currentTarget.style.color = 'hsl(0, 20%, 60%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'hsl(0, 0%, 18%)';
              e.currentTarget.style.color = 'hsl(0, 0%, 45%)';
            }}
          >
            Settings
          </button>
        </div>

        {/* Controls info - hidden on very small screens */}
        <div
          className={`pt-4 sm:pt-8 space-y-1 sm:space-y-2 transition-all duration-700 hidden sm:block ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-[10px] sm:text-xs font-body tracking-[0.15em] sm:tracking-[0.2em]"
             style={{ color: 'hsl(0, 0%, 25%)' }}>
            WASD / Arrow Keys to move · Mouse to look · E to interact
          </p>
          <p className="text-[10px] sm:text-xs font-body tracking-[0.15em] sm:tracking-[0.2em]"
             style={{ color: 'hsl(0, 0%, 25%)' }}>
            ESC to pause · SHIFT to sprint · Touch joystick on mobile
          </p>
        </div>

        {/* Mobile-only touch hint */}
        <div className={`pt-4 sm:hidden transition-all duration-700 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-[10px] font-body tracking-[0.15em]"
             style={{ color: 'hsl(0, 0%, 25%)' }}>
            Tap doors to open · Use joystick to move
          </p>
        </div>
      </div>

      {/* Dark overlay for intro/exit transitions */}
      <div
        className="absolute inset-0 bg-black pointer-events-none z-30 transition-opacity duration-[1500ms]"
        style={{ opacity: screenDark }}
      />

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none z-[6]" />
    </div>
  );
}
