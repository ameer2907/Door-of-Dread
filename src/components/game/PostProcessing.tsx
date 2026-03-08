import { useState, useEffect } from 'react';
import { useGame } from '@/game/store';

export default function PostProcessing() {
  const { phase, fear, ghostState, screenShake, filmGrain, chromaticAberration } = useGame();
  const [grainSeed, setGrainSeed] = useState(0);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'intro') return;
    const interval = setInterval(() => setGrainSeed(Math.random()), 50);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase !== 'playing' && phase !== 'intro') return null;

  const intensity = fear / 100;
  const shakeX = screenShake * (Math.random() - 0.5) * 10;
  const shakeY = screenShake * (Math.random() - 0.5) * 10;
  const aberration = chromaticAberration || intensity * 0.3;

  return (
    <div className="fixed inset-0 pointer-events-none z-[5]" style={{
      transform: screenShake > 0 ? `translate(${shakeX}px, ${shakeY}px)` : undefined,
    }}>
      {/* Film grain overlay */}
      {filmGrain && (
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.08 + intensity * 0.12,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${Math.floor(grainSeed * 100)}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
          }}
        />
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 ${120 + intensity * 100}px rgba(0,0,0,${0.5 + intensity * 0.3}),
                      inset 0 0 ${60 + intensity * 60}px rgba(0,0,0,${0.3 + intensity * 0.3})`,
        }}
      />

      {/* Chromatic aberration */}
      {aberration > 0.05 && (
        <>
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              background: 'transparent',
              boxShadow: `inset ${aberration * 3}px 0 ${aberration * 8}px rgba(255,0,0,${aberration * 0.15})`,
            }}
          />
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              background: 'transparent',
              boxShadow: `inset -${aberration * 3}px 0 ${aberration * 8}px rgba(0,0,255,${aberration * 0.15})`,
            }}
          />
        </>
      )}

      {/* Scan lines */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          opacity: 0.3 + intensity * 0.4,
        }}
      />

      {/* Ghost proximity distortion */}
      {ghostState === 'close' && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${50 + Math.sin(Date.now() * 0.002) * 10}% ${50 + Math.cos(Date.now() * 0.003) * 10}%, rgba(100,0,150,0.1) 0%, transparent 50%)`,
          }}
        />
      )}
    </div>
  );
}
