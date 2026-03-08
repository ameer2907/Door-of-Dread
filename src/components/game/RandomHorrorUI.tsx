import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/game/store';

export default function RandomHorrorUI() {
  const { phase, currentRoom, ghostVisible, chaseMode, chaseDoorIndex, trapDoorActive, mirrorGhostVisible } = useGame();
  const [coldBreath, setColdBreath] = useState(false);
  const [screenShadow, setScreenShadow] = useState(false);
  const [subliminalFlash, setSubliminalFlash] = useState(false);
  const eventTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (phase !== 'playing' || ghostVisible) return;

    const scheduleUIEvent = () => {
      const delay = 15000 + Math.random() * 25000 - currentRoom * 1000;
      eventTimer.current = setTimeout(() => {
        if (ghostVisible || chaseMode) { scheduleUIEvent(); return; }

        const roll = Math.random();
        if (roll < 0.4) {
          setColdBreath(true);
          setTimeout(() => setColdBreath(false), 3000);
        } else if (roll < 0.7) {
          setScreenShadow(true);
          setTimeout(() => setScreenShadow(false), 800);
        } else {
          setSubliminalFlash(true);
          setTimeout(() => setSubliminalFlash(false), 80);
        }
        scheduleUIEvent();
      }, Math.max(8000, delay));
    };

    scheduleUIEvent();
    return () => { if (eventTimer.current) clearTimeout(eventTimer.current); };
  }, [phase, currentRoom, ghostVisible, chaseMode]);

  if (phase !== 'playing') return null;

  return (
    <>
      {/* Cold breath */}
      {coldBreath && (
        <div className="fixed inset-0 pointer-events-none z-[32]"
          style={{
            background: `
              radial-gradient(ellipse at 50% 100%, rgba(180,200,220,0.08) 0%, transparent 40%),
              radial-gradient(ellipse at 30% 90%, rgba(150,180,200,0.06) 0%, transparent 30%),
              radial-gradient(ellipse at 70% 95%, rgba(160,190,210,0.05) 0%, transparent 25%)
            `,
            animation: 'fade-in 1.5s ease-out',
          }}
        />
      )}

      {/* Shadow sweep */}
      {screenShadow && (
        <div
          className="fixed inset-0 pointer-events-none z-[31]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.7) 60%, transparent 100%)',
            animation: 'shadow-sweep 0.8s ease-in-out forwards',
          }}
        />
      )}

      {/* Subliminal flash */}
      {subliminalFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-[36]"
          style={{
            backgroundColor: 'rgba(80, 0, 0, 0.4)',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* === CHASE MODE OVERLAY === */}
      {chaseMode && (
        <div className="fixed inset-0 pointer-events-none z-[34]">
          {/* Intense red pulsing border */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 100px rgba(200, 0, 0, 0.6), inset 0 0 200px rgba(100, 0, 0, 0.4)',
              animation: 'chase-pulse 0.3s ease-in-out infinite alternate',
            }}
          />
          {/* "RUN!" text */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2">
            <p
              className="font-horror text-3xl sm:text-5xl tracking-[0.4em]"
              style={{
                color: 'hsl(0, 80%, 50%)',
                textShadow: '0 0 30px rgba(255,0,0,0.8), 0 0 60px rgba(200,0,0,0.5)',
                animation: 'flicker-text 0.5s infinite',
              }}
            >
              RUN!
            </p>
          </div>
          {/* Safe door hint */}
          {chaseDoorIndex !== null && (
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2">
              <p
                className="font-body text-xs sm:text-sm tracking-[0.3em] uppercase"
                style={{
                  color: 'hsl(0, 30%, 60%)',
                  textShadow: '0 0 10px rgba(200,50,50,0.3)',
                  animation: 'fade-in 0.5s ease-out',
                }}
              >
                Find the right door — NOW
              </p>
            </div>
          )}
          {/* Speed lines effect */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: `${10 + Math.random() * 80}%`,
                  left: '-10%',
                  right: '-10%',
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, rgba(255,50,50,${0.1 + Math.random() * 0.15}), transparent)`,
                  animation: `speed-line ${0.3 + Math.random() * 0.5}s linear infinite`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* === TRAP DOOR WARNING === */}
      {trapDoorActive && (
        <div className="fixed inset-0 pointer-events-none z-[33]">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, transparent 50%, rgba(40, 0, 0, 0.3) 100%)',
              animation: 'blood-pulse 1s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}

      {/* === MIRROR GHOST INDICATOR === */}
      {mirrorGhostVisible && (
        <div className="fixed inset-0 pointer-events-none z-[32]">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(100, 0, 150, 0.08) 0%, transparent 60%)',
              animation: 'fade-in 0.5s ease-out',
            }}
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <p
              className="font-horror text-xs tracking-[0.5em] uppercase"
              style={{
                color: 'hsl(270, 40%, 50%)',
                textShadow: '0 0 15px rgba(150, 0, 200, 0.4)',
                animation: 'flicker-text 2s infinite',
              }}
            >
              Don't look behind you...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
