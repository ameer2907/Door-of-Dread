import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/game/store';

/**
 * UI overlays for random horror events:
 * - Cold breath fog on screen edges
 * - Sudden shadow flicker across screen
 * - Subliminal flash frames
 */
export default function RandomHorrorUI() {
  const { phase, currentRoom, ghostVisible } = useGame();
  const [coldBreath, setColdBreath] = useState(false);
  const [screenShadow, setScreenShadow] = useState(false);
  const [subliminalFlash, setSubliminalFlash] = useState(false);
  const eventTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (phase !== 'playing' || ghostVisible) return;

    const scheduleUIEvent = () => {
      const delay = 15000 + Math.random() * 25000 - currentRoom * 1000;
      eventTimer.current = setTimeout(() => {
        if (ghostVisible) { scheduleUIEvent(); return; }

        const roll = Math.random();
        if (roll < 0.4) {
          // Cold breath effect
          setColdBreath(true);
          setTimeout(() => setColdBreath(false), 3000);
        } else if (roll < 0.7) {
          // Shadow sweep across screen
          setScreenShadow(true);
          setTimeout(() => setScreenShadow(false), 800);
        } else {
          // Subliminal horror flash
          setSubliminalFlash(true);
          setTimeout(() => setSubliminalFlash(false), 80);
        }
        scheduleUIEvent();
      }, Math.max(8000, delay));
    };

    scheduleUIEvent();
    return () => { if (eventTimer.current) clearTimeout(eventTimer.current); };
  }, [phase, currentRoom, ghostVisible]);

  if (phase !== 'playing') return null;

  return (
    <>
      {/* Cold breath - frost on screen edges */}
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

      {/* Shadow sweep across screen */}
      {screenShadow && (
        <div
          className="fixed inset-0 pointer-events-none z-[31]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.7) 60%, transparent 100%)',
            animation: 'shadow-sweep 0.8s ease-in-out forwards',
          }}
        />
      )}

      {/* Subliminal horror flash */}
      {subliminalFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-[36]"
          style={{
            backgroundColor: 'rgba(80, 0, 0, 0.4)',
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </>
  );
}
