import { useRef, useCallback, useEffect, useState } from 'react';
import { useGame } from '@/game/store';

interface JoystickState {
  x: number; // -1 to 1
  y: number; // -1 to 1
  active: boolean;
}

// Export joystick state for PlayerController to read
export const joystickState: JoystickState = { x: 0, y: 0, active: false };

export default function JoystickControl() {
  const { phase } = useGame();
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const basePos = useRef({ x: 0, y: 0 });
  const [touching, setTouching] = useState(false);
  const maxDist = 40;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    basePos.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setTouching(true);
    joystickState.active = true;
    updateKnob(clientX, clientY);
  }, []);

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - basePos.current.x;
    const dy = clientY - basePos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    joystickState.x = nx / maxDist;
    joystickState.y = ny / maxDist;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
  }, []);

  const handleEnd = useCallback(() => {
    setTouching(false);
    joystickState.x = 0;
    joystickState.y = 0;
    joystickState.active = false;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, []);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!touching) return;
      e.preventDefault();
      const touch = e.touches[0];
      updateKnob(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [touching, updateKnob, handleEnd]);

  if (phase !== 'playing' && phase !== 'intro') return null;

  return (
    <div className="fixed bottom-8 left-8 z-30 touch-none select-none md:hidden">
      <div
        ref={stickRef}
        className="relative w-28 h-28 rounded-full border-2 border-foreground/20 bg-background/30 backdrop-blur-sm
                   flex items-center justify-center"
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
      >
        <div
          ref={knobRef}
          className={`w-12 h-12 rounded-full transition-colors duration-150 ${
            touching
              ? 'bg-primary/60 border-primary/80 shadow-[0_0_15px_rgba(200,50,50,0.3)]'
              : 'bg-foreground/20 border-foreground/30'
          } border-2`}
          style={{ willChange: 'transform' }}
        />
      </div>

      {/* Interact button */}
      <button
        className="absolute -right-20 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full
                   bg-primary/40 border-2 border-primary/60 text-primary-foreground font-horror text-lg
                   active:bg-primary/80 active:scale-95 transition-all flex items-center justify-center"
        onTouchStart={(e) => {
          e.preventDefault();
          // Dispatch E key press
          window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
        }}
        onTouchEnd={() => {
          window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }));
        }}
      >
        E
      </button>
    </div>
  );
}
