import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/game/store';
import { audioManager } from '@/game/audio';

const LORE_PARAGRAPHS = [
  {
    title: 'The House on Hollow Hill',
    text: 'In 1887, architect Alistair Vane built a grand manor atop Hollow Hill for his wife, Eleanora. The house was unlike anything the town had seen — labyrinthine corridors, rooms with no windows, and doors that opened onto brick walls. The townsfolk whispered that Vane had gone mad.',
  },
  {
    title: 'The Vanishing',
    text: 'On the night of their anniversary, Eleanora was found dead at the foot of the cellar stairs. Vane claimed she had been lured there by whispers only she could hear. Within a week, he vanished. The doors of the manor were found locked from the inside. No body was ever recovered.',
  },
  {
    title: 'The Doors',
    text: 'Over the decades, curious souls entered the house. Few returned. Those who did spoke of endless rooms connected by three doors — always three. They said only one door led forward. The others led to something worse than death. Something that watched. Something that waited behind the wrong door.',
  },
  {
    title: 'The Nun',
    text: 'In 1923, a group of nuns attempted to exorcise the house. Sister Marguerite entered alone, carrying only a crucifix and a candle. The candle was found extinguished at the entrance the next morning. Sister Marguerite was never seen again — at least, not alive. Visitors now report a pale figure in black robes drifting through the hallways, her face frozen in a silent scream.',
  },
  {
    title: 'The Curse',
    text: 'Local legend says Vane made a pact with something beneath the hill. The house feeds on fear. Each wrong choice strengthens it. Each terrified heartbeat opens a crack between worlds. The doors are not doors at all — they are mouths. And the house is always hungry.',
  },
  {
    title: 'Your Turn',
    text: 'Tonight, you wake on the cold stone floor of the first room. You do not remember how you arrived. The air smells of rot and old wood. Three doors stand before you. Behind one lies the next room. Behind the others... she waits. Choose wisely. The wrong door could be your last.',
  },
];

function BloodDrip({ delay }: { delay: number }) {
  return (
    <div
      className="absolute w-[2px] rounded-full"
      style={{
        height: `${20 + Math.random() * 40}px`,
        left: `${Math.random() * 100}%`,
        top: 0,
        background: 'linear-gradient(to bottom, hsl(0, 80%, 30%), transparent)',
        opacity: 0.3 + Math.random() * 0.3,
        animation: `blood-drip ${4 + Math.random() * 6}s ease-in infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function LoreScreen() {
  const { phase, setPhase } = useGame();
  const [visibleCount, setVisibleCount] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== 'lore') return;
    setVisibleCount(0);
    setFadeIn(false);

    const t1 = setTimeout(() => setFadeIn(true), 100);

    const timers: ReturnType<typeof setTimeout>[] = [t1];
    LORE_PARAGRAPHS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleCount(i + 1);
        // Eerie piano note per paragraph
        audioManager.playTitleHit(i % 3);
      }, 800 + i * 2200));
    });

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  if (phase !== 'lore') return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, hsl(0, 0%, 2%), hsl(0, 10%, 4%), hsl(0, 0%, 2%))' }}
    >
      {/* Blood drips */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <BloodDrip key={i} delay={i * 0.8} />
        ))}
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.8), inset 0 0 80px rgba(40,0,0,0.4)' }}
      />

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 6px)',
        opacity: 0.4,
      }} />

      {/* Header */}
      <div className={`relative z-10 pt-8 sm:pt-12 pb-4 text-center transition-all duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl tracking-[0.15em]"
          style={{
            fontFamily: "'Nosifer', cursive",
            color: 'hsl(0, 80%, 40%)',
            textShadow: '0 0 15px rgba(255,30,30,0.6), 0 0 40px rgba(200,0,0,0.3), 0 2px 4px rgba(0,0,0,0.9)',
          }}
        >
          THE LORE
        </h1>
        <div className="mt-3 mx-auto w-32 sm:w-48 h-[1px]"
          style={{ background: 'linear-gradient(to right, transparent, hsl(0, 70%, 35%), transparent)' }}
        />
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={`relative z-10 flex-1 overflow-y-auto px-6 sm:px-10 md:px-16 pb-24 w-full max-w-3xl
                     transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 60px), transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 60px), transparent)',
        }}
      >
        <div className="space-y-8 sm:space-y-10 pt-4">
          {LORE_PARAGRAPHS.map((para, i) => {
            const isVisible = i < visibleCount;
            return (
              <div
                key={i}
                className={`transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <h2
                  className="text-sm sm:text-base md:text-lg tracking-[0.3em] uppercase mb-2 sm:mb-3"
                  style={{
                    fontFamily: "'Creepster', cursive",
                    color: 'hsl(0, 60%, 45%)',
                    textShadow: '0 0 10px rgba(200,40,40,0.4)',
                  }}
                >
                  {para.title}
                </h2>
                <p
                  className="text-xs sm:text-sm md:text-base leading-relaxed sm:leading-loose tracking-wide"
                  style={{
                    color: 'hsl(0, 5%, 50%)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {para.text}
                </p>
                {i < LORE_PARAGRAPHS.length - 1 && (
                  <div className="mt-6 sm:mt-8 mx-auto w-16 h-[1px]"
                    style={{ background: 'linear-gradient(to right, transparent, hsl(0, 50%, 25%), transparent)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Back button */}
      <div className={`relative z-10 pb-6 sm:pb-10 transition-all duration-700 ${
        fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <button
          onClick={() => setPhase('menu')}
          className="px-8 sm:px-12 py-2.5 sm:py-3 rounded-lg font-body text-xs sm:text-sm tracking-[0.3em] uppercase
                     transition-all duration-300 border backdrop-blur-sm hover:scale-[1.03]"
          style={{
            borderColor: 'hsl(0, 30%, 20%)',
            backgroundColor: 'hsla(0, 20%, 8%, 0.8)',
            color: 'hsl(0, 10%, 50%)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'hsl(0, 50%, 35%)';
            e.currentTarget.style.color = 'hsl(0, 20%, 65%)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(150,20,20,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'hsl(0, 30%, 20%)';
            e.currentTarget.style.color = 'hsl(0, 10%, 50%)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Return
        </button>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-[5]" />
    </div>
  );
}
