import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/game/store';
import { audioManager } from '@/game/audio';
import menuBg from '@/assets/menu-bg.jpg';

const TITLE_WORDS = ['DOOR', 'OF', 'DREAD'];

function AnimatedTitle() {
  const [visibleWords, setVisibleWords] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    // Start music intro for title
    audioManager.init();
    audioManager.resume();
    audioManager.playTitleIntro();

    const timers: NodeJS.Timeout[] = [];
    TITLE_WORDS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleWords(i + 1);
        // Play a hit sound for each word
        audioManager.playTitleHit(i);
      }, 800 + i * 1200));
    });

    // Glitch effect after all words
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
          style={{
            transitionDelay: `${i * 100}ms`,
          }}
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
                  ? '0 0 20px rgba(255,255,255,0.15), 0 0 60px rgba(255,50,50,0.2)'
                  : '0 0 40px hsl(0, 65%, 42%), 0 0 80px hsl(0, 65%, 30%)',
              letterSpacing: word === 'DREAD' ? '0.3em' : '0.15em',
            }}
          >
            {word}
          </h1>
        </div>
      ))}
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
          filter: 'brightness(0.3) saturate(0.5)',
          animation: 'menu-bg-pulse 8s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(0,0,0,0.8) 100%)',
      }} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

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
                       hover:shadow-[0_0_40px_rgba(200,50,50,0.5)] border border-primary/30
                       hover:border-primary/60 relative overflow-hidden"
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
    </div>
  );
}
