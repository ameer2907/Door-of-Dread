import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { GamePhase, GhostState, GameSettings, GameState } from './types';
import { ROOM_CONFIGS } from './rooms';
import { audioManager } from './audio';

const randomDoor = () => Math.floor(Math.random() * 3);

const initialState: GameState = {
  phase: 'menu',
  currentRoom: 0,
  fear: 0,
  wrongCount: 0,
  correctDoorIndex: randomDoor(),
  ghostState: 'hidden',
  isTransitioning: false,
  settings: { volume: 50, sensitivity: 5, graphics: 'medium' },
  targetedDoor: null,
  flickering: false,
  ghostVisible: false,
  openingDoor: null,
  pointerLocked: false,
};

interface GameActions {
  startGame: () => void;
  selectDoor: (index: number) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  setPhase: (phase: GamePhase) => void;
  setTargetedDoor: (index: number | null) => void;
  setPointerLocked: (locked: boolean) => void;
  updateSettings: (s: Partial<GameSettings>) => void;
  increaseFear: (amount: number) => void;
  getState: () => GameState;
}

const GameContext = createContext<(GameState & GameActions) | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<GameState>({ ...initialState, correctDoorIndex: randomDoor() });
  const [, setTick] = useState(0);
  const update = useCallback(() => setTick(n => n + 1), []);

  const s = stateRef.current;

  const startGame = useCallback(() => {
    audioManager.init();
    audioManager.resume();
    audioManager.setVolume(s.settings.volume);
    audioManager.startAmbient();
    audioManager.startMusic();
    Object.assign(stateRef.current, {
      phase: 'playing' as GamePhase,
      currentRoom: 0,
      fear: 0,
      wrongCount: 0,
      correctDoorIndex: randomDoor(),
      ghostState: 'hidden' as GhostState,
      isTransitioning: false,
      targetedDoor: null,
      flickering: false,
      ghostVisible: false,
      openingDoor: null,
    });
    update();
  }, [update, s.settings.volume]);

  const selectDoor = useCallback((index: number) => {
    const st = stateRef.current;
    if (st.isTransitioning || st.openingDoor !== null || st.phase !== 'playing') return;

    st.openingDoor = index;
    audioManager.playDoorCreak();
    update();

    setTimeout(() => {
      const st2 = stateRef.current;
      if (index === st2.correctDoorIndex) {
        audioManager.playCorrectDoor();
        st2.isTransitioning = true;
        update();

        setTimeout(() => {
          const st3 = stateRef.current;
          if (st3.currentRoom >= 6) {
            st3.phase = 'win';
            audioManager.stopAll();
            audioManager.playChurchBell();
          } else {
            st3.currentRoom++;
            st3.wrongCount = 0;
            st3.correctDoorIndex = randomDoor();
            st3.ghostState = 'hidden';
            st3.ghostVisible = false;
            st3.fear = Math.max(0, st3.fear - 10);
            if (ROOM_CONFIGS[st3.currentRoom].hasWhispers) {
              audioManager.playWhisper();
            }
          }
          st3.openingDoor = null;
          st3.isTransitioning = false;
          update();
        }, 1500);
      } else {
        audioManager.playWrongDoor();
        const roomCfg = ROOM_CONFIGS[st2.currentRoom];
        st2.wrongCount++;
        st2.fear = Math.min(100, st2.fear + 15 * roomCfg.fearMultiplier);
        st2.flickering = true;
        audioManager.playFlicker();
        update();

        if (st2.wrongCount >= 3 || st2.fear >= 100) {
          st2.ghostState = 'attack';
          st2.ghostVisible = true;
          audioManager.playGhostScream();
          audioManager.startHeartbeat(400);
          update();
          setTimeout(() => {
            stateRef.current.phase = 'gameover';
            audioManager.stopAll();
            update();
          }, 3000);
        } else if (roomCfg.ghostLevel > 0) {
          st2.ghostVisible = true;
          st2.ghostState = roomCfg.ghostLevel >= 2 ? 'close' : 'watching';
          audioManager.playGhostSting();
          update();

          if (st2.fear > 50) audioManager.startHeartbeat(800 - st2.fear * 4);

          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostVisible = false;
            st3.flickering = false;
            st3.ghostState = 'hidden';
            st3.correctDoorIndex = randomDoor();
            st3.openingDoor = null;
            audioManager.stopHeartbeat();
            update();
          }, 2000);
        } else {
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.flickering = false;
            st3.correctDoorIndex = randomDoor();
            st3.openingDoor = null;
            update();
          }, 1500);
        }
      }
    }, 800);
  }, [update]);

  const pause = useCallback(() => {
    stateRef.current.phase = 'paused';
    update();
  }, [update]);

  const resume = useCallback(() => {
    stateRef.current.phase = 'playing';
    update();
  }, [update]);

  const restart = useCallback(() => {
    audioManager.stopAll();
    startGame();
  }, [startGame]);

  const setPhase = useCallback((phase: GamePhase) => {
    stateRef.current.phase = phase;
    if (phase === 'menu') audioManager.stopAll();
    update();
  }, [update]);

  const setTargetedDoor = useCallback((index: number | null) => {
    if (stateRef.current.targetedDoor !== index) {
      stateRef.current.targetedDoor = index;
      update();
    }
  }, [update]);

  const setPointerLocked = useCallback((locked: boolean) => {
    stateRef.current.pointerLocked = locked;
    update();
  }, [update]);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    Object.assign(stateRef.current.settings, partial);
    if (partial.volume !== undefined) audioManager.setVolume(partial.volume);
    update();
  }, [update]);

  const increaseFear = useCallback((amount: number) => {
    const st = stateRef.current;
    st.fear = Math.min(100, st.fear + amount);
    if (st.fear >= 100 && st.phase === 'playing') {
      st.ghostState = 'attack';
      st.ghostVisible = true;
      audioManager.playGhostScream();
      update();
      setTimeout(() => {
        stateRef.current.phase = 'gameover';
        audioManager.stopAll();
        update();
      }, 3000);
    }
  }, [update]);

  const getState = useCallback(() => stateRef.current, []);

  const value: GameState & GameActions = {
    ...stateRef.current,
    startGame, selectDoor, pause, resume, restart,
    setPhase, setTargetedDoor, setPointerLocked,
    updateSettings, increaseFear, getState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
