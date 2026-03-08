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
  chaseMode: false,
  chaseDoorIndex: null,
  trapDoorActive: false,
  ghostBehindPlayer: false,
  mirrorGhostVisible: false,
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
  triggerChaseMode: () => void;
  triggerGhostBehind: () => void;
  setMirrorGhost: (visible: boolean) => void;
}

const GameContext = createContext<(GameState & GameActions) | null>(null); // v3

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
      chaseMode: false,
      chaseDoorIndex: null,
      trapDoorActive: false,
      ghostBehindPlayer: false,
      mirrorGhostVisible: false,
    });
    update();
  }, [update, s.settings.volume]);

  const selectDoor = useCallback((index: number) => {
    const st = stateRef.current;
    if (st.isTransitioning || st.openingDoor !== null || st.phase !== 'playing') return;
    if (st.portal.phase !== 'none') return;

    // === CHASE MODE: only the safe door works ===
    if (st.chaseMode) {
      st.openingDoor = index;
      audioManager.playHorrorDoorOpen();
      update();

      setTimeout(() => {
        const st2 = stateRef.current;
        if (index === st2.chaseDoorIndex) {
          // Escaped the chase!
          st2.chaseMode = false;
          st2.chaseDoorIndex = null;
          st2.ghostVisible = false;
          st2.ghostState = 'hidden';
          st2.screenShake = 0;
          st2.chromaticAberration = 0;
          st2.roomDarkness = 0;
          st2.flickering = false;
          audioManager.stopHeartbeat();
          audioManager.playCorrectDoor();

          // Proceed to next room
          const totalRooms = ROOM_CONFIGS.length;
          if (st2.currentRoom >= totalRooms - 1) {
            st2.phase = 'win';
            st2.openingDoor = null;
            audioManager.stopAll();
            audioManager.playChurchBell();
            update();
            return;
          }

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

          setTimeout(() => { stateRef.current.portal.phase = 'walkThrough'; update(); }, 1200);
          setTimeout(() => { stateRef.current.portal.phase = 'arriving'; stateRef.current.portal.fogDensity = 1; update(); }, 3200);
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.currentRoom = st3.portal.nextRoomIndex;
            st3.wrongCount = 0;
            st3.correctDoorIndex = randomDoor();
            st3.openingDoor = null;
            st3.isTransitioning = false;
            st3.portal = { ...defaultPortal };
            audioManager.startRoomAmbience(ROOM_CONFIGS[st3.currentRoom].ambientSoundType);
            update();
          }, 4200);
        } else {
          // Wrong door during chase = instant death
          st2.ghostState = 'attack';
          st2.ghostApproachProgress = 1;
          st2.roomDarkness = 0.9;
          st2.screenShake = 1;
          st2.chromaticAberration = 1;
          st2.chaseMode = false;
          audioManager.playGhostScream();
          audioManager.playJumpscareStinger();
          update();

          setTimeout(() => {
            stateRef.current.phase = 'gameover';
            stateRef.current.roomDarkness = 0;
            audioManager.stopAll();
            update();
          }, 3000);
        }
      }, 800);
      return;
    }

    st.openingDoor = index;
    audioManager.playHorrorDoorOpen();
    audioManager.setAudioMixState('discovery');
    audioManager.playShepardTone(5);
    update();

    setTimeout(() => {
      const st2 = stateRef.current;
      if (index === st2.correctDoorIndex) {
        // === FAKE SAFE DOOR TRAP (chance-based, rooms 3+) ===
        const trapChance = st2.currentRoom >= 5 ? 0.25 : st2.currentRoom >= 3 ? 0.15 : 0;
        if (Math.random() < trapChance && !st2.trapDoorActive) {
          st2.trapDoorActive = true;
          audioManager.playCorrectDoor();
          update();

          // Looks safe for 2 seconds...
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.flickering = true;
            st3.screenShake = 0.15;
            audioManager.playFlicker();
            audioManager.playDistantDoorSlam();
            update();
          }, 2000);

          // Then horror strikes
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostSpawnType = 'behind';
            st3.ghostVisible = true;
            st3.ghostState = 'watching';
            st3.roomDarkness = 0.4;
            st3.chromaticAberration = 0.5;
            audioManager.playGhostBehindReveal();
            audioManager.playGhostPresenceDrone();
            audioManager.startHeartbeat(700);
            update();
          }, 3000);

          // Ghost approaches
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostState = 'approaching';
            st3.roomDarkness = 0.6;
            st3.screenShake = 0.2;
            audioManager.stopHeartbeat();
            audioManager.startHeartbeat(450);
            audioManager.playApproachDrone();
            update();
          }, 4500);

          // Ghost vanishes — you survived the trap
          setTimeout(() => {
            const st3 = stateRef.current;
            st3.ghostVisible = false;
            st3.ghostState = 'hidden';
            st3.flickering = false;
            st3.screenShake = 0;
            st3.chromaticAberration = 0;
            st3.roomDarkness = 0;
            st3.trapDoorActive = false;
            st3.openingDoor = null;
            st3.correctDoorIndex = randomDoor();
            st3.fear = Math.min(100, st3.fear + 20);
            audioManager.stopHeartbeat();
            audioManager.playRandomWhisper();
            update();
          }, 6500);

          return;
        }

        // === NORMAL PORTAL TRANSITION ===
        const totalRooms = ROOM_CONFIGS.length;
        if (st2.currentRoom >= totalRooms - 1) {
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

        audioManager.playCorrectDoor();
        audioManager.playTransitionWind();
        audioManager.playGodRayHum();
        audioManager.stopShepardTone();
        audioManager.setAudioMixState('safe');
        st2.isTransitioning = true;
        st2.portal = {
          phase: 'doorOpening',
          doorIndex: index,
          nextRoomIndex: st2.currentRoom + 1,
          progress: 0,
          fogDensity: 0,
        };
        update();

        setTimeout(() => {
          const st3 = stateRef.current;
          st3.portal.phase = 'walkThrough';
          st3.portal.progress = 0;
          st3.screenShake = 0.05;
          audioManager.playWhisper();
          update();
        }, 1200);

        setTimeout(() => {
          const st3 = stateRef.current;
          st3.portal.phase = 'arriving';
          st3.portal.fogDensity = 1;
          update();
        }, 3200);

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
        audioManager.stopShepardTone();
        audioManager.setAudioMixState('safe');
        const roomCfg = ROOM_CONFIGS[st2.currentRoom];
        st2.wrongCount++;
        st2.fear = Math.min(100, st2.fear + 15 * roomCfg.fearMultiplier);
        st2.flickering = true;
        st2.screenShake = 0.3;
        st2.chromaticAberration = 0.4;
        audioManager.playFlicker();

        // Weighted spawn — now includes 'ceiling'
        const spawnWeights: [GhostSpawnType, number][] = [
          ['doorway', 3], ['behind', 4], ['corridor', 2], ['shadows', 1], ['ceiling', st2.currentRoom >= 4 ? 2 : 0]
        ];
        const totalWeight = spawnWeights.reduce((sum, [, w]) => sum + w, 0);
        let rand = Math.random() * totalWeight;
        let randomSpawn: GhostSpawnType = 'doorway';
        for (const [type, weight] of spawnWeights) {
          rand -= weight;
          if (rand <= 0) { randomSpawn = type; break; }
        }
        st2.ghostSpawnType = randomSpawn;
        st2.ghostApproachProgress = 0;

        if (randomSpawn === 'behind') {
          audioManager.playGhostBehindReveal();
        }

        const ghostTypes: GhostType[] = ['shadow', 'corridor', 'stalker', 'jumpscare', 'nun'];
        const selectedGhost = st2.wrongCount >= 2
          ? 'nun'
          : ghostTypes[Math.min(st2.currentRoom, ghostTypes.length - 1)];
        st2.ghostType = selectedGhost;
        update();

        // === LETHAL SEQUENCE (2 wrong or fear maxed) ===
        if (st2.wrongCount >= 2 || st2.fear >= 100) {
          st2.ghostState = 'watching';
          st2.ghostType = 'nun';
          st2.ghostVisible = true;
          st2.roomDarkness = 0.3;
          audioManager.playGhostArrivalScream();
          audioManager.playGhostSting();
          audioManager.playGhostPresenceDrone();
          audioManager.startHeartbeat(900);
          update();

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

          setTimeout(() => {
            stateRef.current.phase = 'gameover';
            stateRef.current.roomDarkness = 0;
            stateRef.current.ghostApproachProgress = 0;
            audioManager.stopAll();
            update();
          }, 8500);

        } else if (roomCfg.ghostLevel > 0) {
          st2.ghostVisible = true;
          st2.ghostState = 'watching';
          st2.roomDarkness = 0.2;
          audioManager.playGhostArrivalScream();
          audioManager.playGhostSting();
          audioManager.playGhostPresenceDrone();
          update();

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
          audioManager.playGhostArrivalScream();
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

  // === GHOST CHASE MODE ===
  const triggerChaseMode = useCallback(() => {
    const st = stateRef.current;
    if (st.chaseMode || st.ghostVisible || st.isTransitioning || st.phase !== 'playing') return;

    st.chaseMode = true;
    st.chaseDoorIndex = randomDoor();
    st.ghostVisible = true;
    st.ghostState = 'approaching';
    st.ghostSpawnType = 'corridor';
    st.roomDarkness = 0.5;
    st.screenShake = 0.3;
    st.chromaticAberration = 0.6;
    st.flickering = true;

    audioManager.playGhostScream();
    audioManager.playChaseMusic();
    audioManager.startHeartbeat(300);
    audioManager.setAudioMixState('chase');
    update();

    // If player doesn't escape in 8 seconds, game over
    setTimeout(() => {
      const st2 = stateRef.current;
      if (st2.chaseMode) {
        st2.ghostState = 'attack';
        st2.screenShake = 1;
        st2.chromaticAberration = 1;
        st2.roomDarkness = 0.9;
        audioManager.playGhostScream();
        audioManager.playJumpscareStinger();
        update();

        setTimeout(() => {
          stateRef.current.phase = 'gameover';
          stateRef.current.chaseMode = false;
          stateRef.current.roomDarkness = 0;
          audioManager.stopAll();
          update();
        }, 3000);
      }
    }, 8000);
  }, [update]);

  // === GHOST BEHIND PLAYER (silent scare) ===
  const triggerGhostBehind = useCallback(() => {
    const st = stateRef.current;
    if (st.ghostVisible || st.chaseMode || st.phase !== 'playing') return;

    st.ghostBehindPlayer = true;
    st.ghostVisible = true;
    st.ghostState = 'watching';
    st.ghostSpawnType = 'behind';
    st.roomDarkness = 0.15;
    update();

    // Ghost stands still for 2s then vanishes with whisper
    setTimeout(() => {
      const st2 = stateRef.current;
      if (st2.ghostBehindPlayer) {
        st2.ghostBehindPlayer = false;
        st2.ghostVisible = false;
        st2.ghostState = 'hidden';
        st2.roomDarkness = 0;
        st2.fear = Math.min(100, st2.fear + 8);
        audioManager.playRandomWhisper();
        update();
      }
    }, 2500);
  }, [update]);

  // === MIRROR GHOST ===
  const setMirrorGhost = useCallback((visible: boolean) => {
    stateRef.current.mirrorGhostVisible = visible;
    if (visible) {
      stateRef.current.fear = Math.min(100, stateRef.current.fear + 5);
      audioManager.playRandomWhisper();
    }
    update();
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
    if (st.fear >= 100 && st.phase === 'playing' && !st.chaseMode) {
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
    triggerChaseMode, triggerGhostBehind, setMirrorGhost,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
