import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/game/store';
import { audioManager } from '@/game/audio';
import menuBg from '@/assets/menu-bg.jpg';

const TITLE_WORDS = ['DOOR', 'OF', 'DREAD'];

function LightningFlash() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const schedule = () => {
      const delay = 5000 + Math.random() * 12000;
      return setTimeout(() => {
        setFlash(true);
        audioManager.playLightningCrack();
        setTimeout(() => setFlash(false), 80);
        setTimeout(() => {
          setFlash(true);
          setTimeout(() => setFlash(false), 40);
        }, 150);
        schedule();
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  if (!flash) return null;
  return <div className="absolute inset-0 bg-foreground/20 pointer-events-none z-20" />;
}

function FogLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-[200%] h-full opacity-20"
          style={{
            background: `radial-gradient(ellipse at ${30 + i * 15}% ${50 + i * 10}%, rgba(100,100,120,0.3) 0%, transparent 60%)`,
            animation: `fog-drift ${20 + i * 5}s ease-in-out infinite alternate`,
            animationDelay: `${i * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedTitle() {
  const [visibleWords, setVisibleWords] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    audioManager.init();
    audioManager.resume();
    audioManager.playTitleIntro();

    const timers: NodeJS.Timeout[] = [];
    TITLE_WORDS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleWords(i + 1);
        audioManager.playTitleHit(i);
      }, 800 + i * 1200));
    });

    timers.push(setTimeout(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 300);
    }, 800 + TITLE_WORDS.length * 1200 + 500));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative">
      {TITLE_WORDS.map((word, i) => (
        <div
          key={word}
          className={`transition-all duration-700 ${
            i < visibleWords
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-110'
          }`}
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          <h1
            className={`font-horror tracking-widest select-none ${
              word === 'DREAD'
                ? 'text-8xl md:text-[10rem] text-foreground -mt-4'
                : word === 'OF'
                ? 'text-4xl md:text-6xl text-primary/60 -mt-2'
                : 'text-7xl md:text-9xl text-primary'
            } ${glitch ? 'animate-title-glitch' : ''}`}
            style={{
              textShadow:
                word === 'DREAD'
                  ? '0 0 20px rgba(255,255,255,0.15), 0 0 60px rgba(255,50,50,0.2), 0 0 120px rgba(255,0,0,0.1)'
                  : '0 0 40px hsl(0, 65%, 42%), 0 0 80px hsl(0, 65%, 30%), 0 0 120px hsl(0, 65%, 20%)',
              letterSpacing: word === 'DREAD' ? '0.3em' : '0.15em',
            }}
          >
            {word}
          </h1>
        </div>
      ))}

      {/* Subtitle */}
      <div className={`mt-4 transition-all duration-1000 delay-500 ${
        visibleWords >= 3 ? 'opacity-60' : 'opacity-0'
      }`}>
        <p className="text-muted-foreground/50 font-body text-xs tracking-[0.8em] uppercase">
          A Horror Experience
        </p>
      </div>
    </div>
  );
}

export default function MainMenu() {
  const { phase, startGame, setPhase } = useGame();
  const [showButtons, setShowButtons] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (phase === 'menu') {
      setShowButtons(false);
      setShowControls(false);
      const t1 = setTimeout(() => setShowButtons(true), 800 + TITLE_WORDS.length * 1200 + 800);
      const t2 = setTimeout(() => setShowControls(true), 800 + TITLE_WORDS.length * 1200 + 1400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase]);

  if (phase !== 'menu') return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${menuBg})`,
          filter: 'brightness(0.2) saturate(0.3) contrast(1.2)',
          animation: 'menu-bg-pulse 8s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(0,0,0,0.85) 100%)',
      }} />

      {/* Fog effect */}
      <FogLayer />

      {/* Lightning */}
      <LightningFlash />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/15"
            style={{
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none z-[3]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
      }} />

      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        <AnimatedTitle />

        <p
          className={`text-muted-foreground font-body text-sm tracking-[0.4em] uppercase transition-all duration-1000 ${
            showButtons ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Choose wisely. The wrong door could be your last.
        </p>

        {/* Buttons */}
        <div
          className={`space-y-3 pt-4 transition-all duration-700 ${
            showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <button
            onClick={startGame}
            className="group block w-64 mx-auto py-4 bg-primary/90 text-primary-foreground
                       rounded-lg font-horror text-2xl tracking-wider
                       transition-all duration-300 hover:scale-105 hover:bg-primary
                       hover:shadow-[0_0_40px_rgba(200,50,50,0.5),0_0_80px_rgba(200,50,50,0.2)]
                       border border-primary/30 hover:border-primary/60 relative overflow-hidden"
          >
            <span className="relative z-10">ENTER</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
          <button
            onClick={() => setPhase('settings')}
            className="block w-64 mx-auto py-3 bg-secondary/60 text-foreground/80
                       rounded-lg font-body text-sm tracking-wider transition-all duration-300
                       hover:bg-secondary hover:text-foreground border border-border/30
                       hover:border-border/60 backdrop-blur-sm"
          >
            Settings
          </button>
        </div>

        {/* Controls info */}
        <div
          className={`pt-6 space-y-1.5 transition-all duration-700 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-muted-foreground/40 text-xs font-body tracking-wider">
            WASD / Arrow Keys to move · Mouse to look · E to interact
          </p>
          <p className="text-muted-foreground/40 text-xs font-body tracking-wider">
            ESC to pause · SHIFT to sprint · Touch joystick on mobile
          </p>
        </div>
      </div>

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-[4]" />
    </div>
  );
}
