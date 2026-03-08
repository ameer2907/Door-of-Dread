import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { GamePhase, GhostState, GhostType, GhostSpawnType, GameSettings, GameState, PortalTransition } from './types';
import { ROOM_CONFIGS } from './rooms';
import { audioManager } from './audio';

const randomDoor = () => Math.floor(Math.random() * 3);

const defaultPortal: PortalTransition = {
  phase: 'none',
  doorIndex: 0,
  nextRoomIndex: 1,
  progress: 0,
  fogDensity: 0,
};

const initialState: GameState = {
  phase: 'menu',
  currentRoom: 0,
  fear: 0,
  wrongCount: 0,
  correctDoorIndex: randomDoor(),
  ghostState: 'hidden',
  ghostType: 'nun',
  isTransitioning: false,
  settings: { volume: 50, sensitivity: 5, graphics: 'medium' },
  targetedDoor: null,
  flickering: false,
  ghostVisible: false,
  openingDoor: null,
  pointerLocked: false,
  screenShake: 0,
  filmGrain: true,
  chromaticAberration: 0,
  portal: { ...defaultPortal },
  ghostSpawnType: 'doorway',
  ghostApproachProgress: 0,
  roomDarkness: 0,
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
  const stateRef = useRef<GameState>({ ...initialState, correctDoorIndex: randomDoor(), portal: { ...defaultPortal } });
  const [, setTick] = useState(0);
  const update = useCallback(() => setTick(n => n + 1), []);

  const s = stateRef.current;

  const startGame = useCallback(() => {
    audioManager.init();
    audioManager.resume();
    audioManager.setVolume(s.settings.volume);
    audioManager.startAmbient();
    audioManager.startMusic();
    audioManager.startRoomAmbience(ROOM_CONFIGS[0].ambientSoundType);
    Object.assign(stateRef.current, {
      phase: 'intro' as GamePhase,
      currentRoom: 0,
      fear: 0,
      wrongCount: 0,
      correctDoorIndex: randomDoor(),
      ghostState: 'hidden' as GhostState,
      ghostType: 'nun' as GhostType,
      isTransitioning: false,
      targetedDoor: null,
      flickering: false,
      ghostVisible: false,
      openingDoor: null,
      screenShake: 0,
      filmGrain: true,
      chromaticAberration: 0,
      portal: { ...defaultPortal },
      ghostSpawnType: 'doorway' as GhostSpawnType,
      ghostApproachProgress: 0,
      roomDarkness: 0,
    });
    update();
  }, [update, s.settings.volume]);

  const selectDoor = useCallback((index: number) => {
    const st = stateRef.current;
    if (st.isTransitioning || st.openingDoor !== null || st.phase !== 'playing') return;
    if (st.portal.phase !== 'none') return;

    st.openingDoor = index;
    audioManager.playHorrorDoorOpen();
    update();

    setTimeout(() => {
      const st2 = stateRef.current;
      if (index === st2.correctDoorIndex) {
        // === PORTAL TRANSITION: Correct door ===
        const totalRooms = ROOM_CONFIGS.length;
        if (st2.currentRoom >= totalRooms - 1) {
          // Win condition
          st2.isTransitioning = true;
          audioManager.playCorrectDoor();
          update();
          setTimeout(() => {
            stateRef.current.phase = 'win';
            stateRef.current.openingDoor = null;
            stateRef.current.isTransitioning = false;
            stateRef.current.portal = { ...defaultPortal };
            audioManager.stopAll();
            audioManager.playChurchBell();
            update();
          }, 1500);
          return;
        }

        // Start portal transition - door is already opening
        audioManager.playCorrectDoor();
        audioManager.playTransitionWind();
        st2.isTransitioning = true;
        st2.portal = {
          phase: 'doorOpening',
          doorIndex: index,
          nextRoomIndex: st2.currentRoom + 1,
          progress: 0,
          fogDensity: 0,
        };
        update();

        // Phase 2: Walk through (after door is open enough ~1.2s)
        setTimeout(() => {
          const st3 = stateRef.current;
          st3.portal.phase = 'walkThrough';
          st3.portal.progress = 0;
          st3.screenShake = 0.05;
          audioManager.playWhisper();
          update();
        }, 1200);

        // Phase 3: Arriving in new room (camera has crossed threshold ~3.5s total)
        setTimeout(() => {
          const st3 = stateRef.current;
          st3.portal.phase = 'arriving';
          st3.portal.fogDensity = 1;
          update();
        }, 3200);

        // Phase 4: Complete - swap rooms
        setTimeout(() => {
          const st3 = stateRef.current;
          st3.currentRoom = st3.portal.nextRoomIndex;
          st3.wrongCount = 0;
          st3.correctDoorIndex = randomDoor();
          st3.ghostState = 'hidden';
          st3.ghostVisible = false;
          st3.fear = Math.max(0, st3.fear - 10);
          st3.screenShake = 0;
          st3.chromaticAberration = 0;
          st3.openingDoor = null;
          st3.isTransitioning = false;
          st3.portal = { ...defaultPortal };
          audioManager.startRoomAmbience(ROOM_CONFIGS[st3.currentRoom].ambientSoundType);
          if (ROOM_CONFIGS[st3.currentRoom].hasWhispers) {
            audioManager.playWhisper();
          }
          update();
        }, 4200);
      } else {
        // === WRONG DOOR: CINEMATIC HORROR SEQUENCE ===
        audioManager.playWrongDoor();
        const roomCfg = ROOM_CONFIGS[st2.currentRoom];
        st2.wrongCount++;
        st2.fear = Math.min(100, st2.fear + 15 * roomCfg.fearMultiplier);
        st2.flickering = true;
        st2.screenShake = 0.3;
        st2.chromaticAberration = 0.4;
        audioManager.playFlicker();

        // Random spawn type
        const spawnTypes: GhostSpawnType[] = ['doorway', 'behind', 'corridor', 'shadows'];
        const randomSpawn = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];
        st2.ghostSpawnType = randomSpawn;
        st2.ghostApproachProgress = 0;

        const ghostTypes: GhostType[] = ['shadow', 'corridor', 'stalker', 'jumpscare', 'nun'];
        const selectedGhost = st2.wrongCount >= 2
          ? 'nun'
          : ghostTypes[Math.min(st2.currentRoom, ghostTypes.length - 1)];
        st2.ghostType = selectedGhost;
        update();

        // === LETHAL SEQUENCE (2 wrong or fear maxed) ===
        if (st2.wrongCount >= 2 || st2.fear >= 100) {
          // Phase 1: Door opens to reveal ghost silhouette (0-1.5s)
          st2.ghostState = 'watching';
          st2.ghostType = 'nun';
          st2.ghostVisible = true;
          st2.roomDarkness = 0.3;
          audioManager.playGhostSting();
          audioManager.startHeartbeat(900);
          update();

          // Phase 2: Ghost slowly approaches (1.5-4.5s)
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostState = 'approaching';
            st3.roomDarkness = 0.5;
            st3.screenShake = 0.1;
            st3.chromaticAberration = 0.5;
            audioManager.stopHeartbeat();
            audioManager.startHeartbeat(600);
            audioManager.playApproachDrone();
            audioManager.playWhisper();
            update();
          }, 1500);

          // Phase 3: Ghost gets close - tension peak (4.5-6s)
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostState = 'close';
            st3.ghostApproachProgress = 0.7;
            st3.roomDarkness = 0.7;
            st3.screenShake = 0.25;
            st3.chromaticAberration = 0.7;
            audioManager.stopHeartbeat();
            audioManager.startHeartbeat(350);
            audioManager.playBreathingSound();
            update();
          }, 4500);

          // Phase 4: JUMPSCARE LUNGE (6s)
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostState = 'attack';
            st3.ghostApproachProgress = 1;
            st3.roomDarkness = 0.9;
            st3.screenShake = 1;
            st3.chromaticAberration = 1;
            audioManager.playGhostScream();
            audioManager.playJumpscareStinger();
            update();
          }, 6000);

          // Phase 5: Game over
          setTimeout(() => {
            stateRef.current.phase = 'gameover';
            stateRef.current.roomDarkness = 0;
            stateRef.current.ghostApproachProgress = 0;
            audioManager.stopAll();
            update();
          }, 8500);

        } else if (roomCfg.ghostLevel > 0) {
          // === NON-LETHAL GHOST SIGHTING ===
          st2.ghostVisible = true;
          st2.ghostState = 'watching';
          st2.roomDarkness = 0.2;
          audioManager.playGhostSting();
          update();

          // Brief approach
          if (roomCfg.ghostLevel >= 2) {
            setTimeout(() => {
              const st3 = stateRef.current;
              st3.ghostState = 'approaching';
              st3.roomDarkness = 0.35;
              st3.screenShake = 0.08;
              audioManager.startHeartbeat(800 - st3.fear * 4);
              update();
            }, 800);
          }

          if (selectedGhost === 'jumpscare') {
            audioManager.playJumpscareStinger();
            st2.screenShake = 0.6;
          }
          update();

          // Dismiss after approach
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostVisible = false;
            st3.flickering = false;
            st3.ghostState = 'hidden';
            st3.correctDoorIndex = randomDoor();
            st3.openingDoor = null;
            st3.screenShake = 0;
            st3.chromaticAberration = Math.max(0, st3.chromaticAberration - 0.3);
            st3.roomDarkness = 0;
            st3.ghostApproachProgress = 0;
            audioManager.stopHeartbeat();
            update();
          }, roomCfg.ghostLevel >= 2 ? 3500 : 2500);
        } else {
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.flickering = false;
            st3.correctDoorIndex = randomDoor();
            st3.openingDoor = null;
            st3.screenShake = 0;
            st3.chromaticAberration = 0;
            st3.roomDarkness = 0;
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
    st.chromaticAberration = Math.min(1, st.fear / 100);
    if (st.fear >= 100 && st.phase === 'playing') {
      st.ghostState = 'attack';
      st.ghostType = 'nun';
      st.ghostVisible = true;
      st.screenShake = 1;
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
