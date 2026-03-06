import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS } from '@/game/rooms';
import { joystickState } from './JoystickControl';

export default function PlayerController() {
  const { phase, selectDoor, pause, setTargetedDoor, setPointerLocked, getState, increaseFear, setPhase } = useGame();
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const keys = useRef<Record<string, boolean>>({});
  const moveDir = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const center = useRef(new THREE.Vector2(0, 0));
  const targetedRef = useRef<number | null>(null);
  const prevTargeted = useRef<number | null>(null);
  const fearTimer = useRef(0);
  const shakeOffset = useRef({ x: 0, y: 0 });
  const introTime = useRef(0);
  const introStarted = useRef(false);

  const currentRoom = getState().currentRoom;
  useEffect(() => {
    const gs = getState();
    if (gs.phase === 'intro') {
      // Start lying down on the floor
      camera.position.set(0, 0.2, 3);
      camera.rotation.set(-Math.PI / 2, 0, 0); // Looking up at ceiling
      introTime.current = 0;
      introStarted.current = true;
    } else {
      camera.position.set(0, 1.7, 3);
      camera.lookAt(0, 1.7, -5);
    }
  }, [currentRoom, camera, phase, getState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keys.current[e.code] = true;
    if (e.code === 'KeyE' && targetedRef.current !== null) {
      selectDoor(targetedRef.current);
    }
  }, [selectDoor]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current[e.code] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const onChange = () => {
      const locked = !!document.pointerLockElement;
      setPointerLocked(locked);
      if (!locked && getState().phase === 'playing') {
        pause();
      }
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, [pause, setPointerLocked, getState]);

  useFrame((state, delta) => {
    const gs = getState();
    
    // Intro wake-up animation
    if (gs.phase === 'intro' && introStarted.current) {
      introTime.current += delta;
      const t = introTime.current;
      const duration = 4.0; // total intro duration in seconds
      
      if (t < duration) {
        const progress = Math.min(t / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        
        // Rise from floor (0.2) to standing (1.7)
        camera.position.y = 0.2 + ease * 1.5;
        
        // Rotate from looking at ceiling (-PI/2) to looking forward (0)
        camera.rotation.x = -Math.PI / 2 + ease * Math.PI / 2;
        
        // Slight sway during waking up
        if (t > 0.5) {
          const sway = Math.sin(t * 2) * 0.02 * (1 - ease);
          camera.rotation.z = sway;
        }
        
        // Blurry vision clear-up is handled by the UI overlay
      } else {
        // Intro done, switch to playing
        camera.position.set(0, 1.7, 3);
        camera.rotation.set(0, 0, 0);
        camera.lookAt(0, 1.7, -5);
        introStarted.current = false;
        setPhase('playing');
      }
      return;
    }
    
    if (gs.phase !== 'playing') return;

    // Movement (WASD + Arrow keys + Joystick)
    const speed = (keys.current['ShiftLeft'] || keys.current['ShiftRight']) ? 6 : 3;
    const dir = moveDir.current.set(0, 0, 0);
    if (keys.current['KeyW'] || keys.current['ArrowUp']) dir.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) dir.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) dir.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dir.x += 1;

    // Joystick input
    if (joystickState.active) {
      dir.x += joystickState.x;
      dir.z += joystickState.y;
    }

    if (dir.length() > 0) {
      dir.normalize();
      dir.applyQuaternion(camera.quaternion);
      dir.y = 0;
      dir.normalize();
      camera.position.addScaledVector(dir, speed * delta);
    }

    // Clamp to room
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -4.5, 4.5);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -4.2, 4.5);

    // Breathing + camera shake during ghost attack
    const breathe = Math.sin(state.clock.elapsedTime * 1.2) * 0.008;
    
    if (gs.ghostState === 'attack') {
      // Intense camera shake
      const shakeIntensity = 0.06;
      shakeOffset.current.x = (Math.random() - 0.5) * shakeIntensity;
      shakeOffset.current.y = (Math.random() - 0.5) * shakeIntensity;
      camera.position.y = 1.7 + shakeOffset.current.y;
      camera.position.x += shakeOffset.current.x;
    } else if (gs.ghostState === 'close') {
      // Mild shake
      const mild = 0.015;
      shakeOffset.current.x = (Math.random() - 0.5) * mild;
      shakeOffset.current.y = (Math.random() - 0.5) * mild;
      camera.position.y = 1.7 + breathe + shakeOffset.current.y;
    } else {
      camera.position.y = 1.7 + breathe;
    }

    // Raycast for door targeting
    raycaster.current.setFromCamera(center.current, camera);
    raycaster.current.far = 5;
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    let foundDoor: number | null = null;
    for (const hit of intersects) {
      if (hit.object.userData?.isDoor) {
        foundDoor = hit.object.userData.doorIndex;
        break;
      }
    }
    targetedRef.current = foundDoor;
    if (foundDoor !== prevTargeted.current) {
      prevTargeted.current = foundDoor;
      setTargetedDoor(foundDoor);
    }

    // Passive fear increase in later rooms
    if (gs.currentRoom >= 3) {
      fearTimer.current += delta;
      if (fearTimer.current >= 2) {
        fearTimer.current = 0;
        const mult = ROOM_CONFIGS[gs.currentRoom].fearMultiplier;
        increaseFear(0.5 * mult);
      }
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
