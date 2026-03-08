import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '@/game/store';
import { ROOM_CONFIGS, DOOR_POSITIONS } from '@/game/rooms';
import { audioManager } from '@/game/audio';
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
  const footstepTimer = useRef(0);
  const breatheTime = useRef(0);

  // Portal walk-through state
  const portalStartPos = useRef(new THREE.Vector3());
  const portalStartRot = useRef(new THREE.Euler());
  const portalWalkStarted = useRef(false);
  const portalWalkTime = useRef(0);

  const currentRoom = getState().currentRoom;
  useEffect(() => {
    const gs = getState();
    if (gs.phase === 'intro') {
      // Start face-down on the floor
      camera.position.set(0, 0.15, 3);
      camera.rotation.set(-Math.PI / 2, 0, 0); // looking straight down
      introTime.current = 0;
      introStarted.current = true;
    } else if (gs.portal.phase === 'none') {
      camera.position.set(0, 1.7, 3);
      camera.lookAt(0, 1.7, -5);
    }
    portalWalkStarted.current = false;
    portalWalkTime.current = 0;
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
      if (!locked && getState().phase === 'playing') pause();
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
      const duration = 4.0;
      if (t < duration) {
        const progress = Math.min(t / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        camera.position.y = 0.2 + ease * 1.5;
        camera.rotation.x = -Math.PI / 2 + ease * Math.PI / 2;
        if (t > 0.5) {
          const sway = Math.sin(t * 2) * 0.02 * (1 - ease);
          camera.rotation.z = sway;
        }
      } else {
        camera.position.set(0, 1.7, 3);
        camera.rotation.set(0, 0, 0);
        camera.lookAt(0, 1.7, -5);
        introStarted.current = false;
        setPhase('playing');
      }
      return;
    }

    // === PORTAL WALK-THROUGH ANIMATION ===
    const portal = gs.portal;
    if (portal.phase === 'walkThrough' || portal.phase === 'arriving') {
      if (!portalWalkStarted.current) {
        portalWalkStarted.current = true;
        portalStartPos.current.copy(camera.position);
        portalStartRot.current.copy(camera.rotation);
        portalWalkTime.current = 0;
      }

      portalWalkTime.current += delta;
      const walkDuration = portal.phase === 'arriving' ? 1.0 : 2.0;
      const t = Math.min(portalWalkTime.current / walkDuration, 1);
      // Smooth ease-in-out
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const doorPos = DOOR_POSITIONS[portal.doorIndex];
      
      if (portal.phase === 'walkThrough') {
        // Walk from current position toward the door
        const targetX = doorPos[0];
        const targetZ = doorPos[2] - 2; // just past the door threshold
        
        camera.position.x = THREE.MathUtils.lerp(portalStartPos.current.x, targetX, ease);
        camera.position.z = THREE.MathUtils.lerp(portalStartPos.current.z, targetZ, ease);
        camera.position.y = 1.7 + Math.sin(portalWalkTime.current * 6) * 0.015; // subtle walk bob

        // Look toward the door
        const lookTarget = new THREE.Vector3(doorPos[0], 1.7, doorPos[2] - 10);
        const currentLook = new THREE.Vector3();
        camera.getWorldDirection(currentLook);
        const targetDir = lookTarget.sub(camera.position).normalize();
        const blendedDir = currentLook.lerp(targetDir, ease * 0.5);
        camera.lookAt(camera.position.clone().add(blendedDir.multiplyScalar(5)));

        // Subtle camera shake during walk
        camera.rotation.z = Math.sin(portalWalkTime.current * 4) * 0.005;
      } else if (portal.phase === 'arriving') {
        // Continue forward into the new room space, then the room swaps
        const targetZ = doorPos[2] - 6;
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, ease * 0.3);
        camera.position.y = 1.7 + Math.sin(portalWalkTime.current * 5) * 0.01;
      }

      // Play footstep during walk
      footstepTimer.current += delta;
      if (footstepTimer.current > 0.35) {
        footstepTimer.current = 0;
        audioManager.playFootstep();
      }

      return; // Skip normal movement during portal
    }

    // Reset portal walk state when portal is done
    if (portal.phase === 'none' && portalWalkStarted.current) {
      portalWalkStarted.current = false;
      portalWalkTime.current = 0;
    }

    // During doorOpening phase, stop player movement but allow looking
    if (portal.phase === 'doorOpening') {
      // Player can still look around but can't move
      const breathe = Math.sin(breatheTime.current * 1.2) * 0.008;
      breatheTime.current += delta;
      camera.position.y = 1.7 + breathe;
      return;
    }
    
    if (gs.phase !== 'playing') return;

    // Movement
    const sprinting = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const speed = sprinting ? 6 : 3;
    const dir = moveDir.current.set(0, 0, 0);
    if (keys.current['KeyW'] || keys.current['ArrowUp']) dir.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) dir.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) dir.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dir.x += 1;

    if (joystickState.active) {
      dir.x += joystickState.x;
      dir.z += joystickState.y;
    }

    const isMoving = dir.length() > 0.1;

    if (isMoving) {
      dir.normalize();
      dir.applyQuaternion(camera.quaternion);
      dir.y = 0;
      dir.normalize();
      camera.position.addScaledVector(dir, speed * delta);

      footstepTimer.current += delta * (sprinting ? 2 : 1);
      if (footstepTimer.current > 0.45) {
        footstepTimer.current = 0;
        audioManager.playFootstep();
      }
    }

    // Clamp to room
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -4.5, 4.5);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -4.2, 4.5);

    // Breathing
    breatheTime.current += delta;
    const fearFactor = gs.fear / 100;
    const breatheSpeed = 1.2 + fearFactor * 1.5;
    const breatheAmp = 0.008 + fearFactor * 0.015;
    const breathe = Math.sin(breatheTime.current * breatheSpeed) * breatheAmp;
    const headBob = isMoving ? Math.sin(state.clock.elapsedTime * (sprinting ? 12 : 8)) * 0.02 : 0;
    const instabilityX = fearFactor > 0.5 ? Math.sin(state.clock.elapsedTime * 3.7) * 0.003 * fearFactor : 0;
    const instabilityZ = fearFactor > 0.5 ? Math.cos(state.clock.elapsedTime * 2.3) * 0.002 * fearFactor : 0;

    if (gs.ghostState === 'attack') {
      const shakeIntensity = 0.08;
      shakeOffset.current.x = (Math.random() - 0.5) * shakeIntensity;
      shakeOffset.current.y = (Math.random() - 0.5) * shakeIntensity;
      camera.position.y = 1.7 + shakeOffset.current.y;
      camera.position.x += shakeOffset.current.x;
      camera.rotation.z = (Math.random() - 0.5) * 0.03;
    } else if (gs.ghostState === 'close') {
      const mild = 0.02;
      shakeOffset.current.x = (Math.random() - 0.5) * mild;
      shakeOffset.current.y = (Math.random() - 0.5) * mild;
      camera.position.y = 1.7 + breathe + headBob + shakeOffset.current.y;
    } else {
      camera.position.y = 1.7 + breathe + headBob;
      camera.position.x += instabilityX;
      camera.position.z += instabilityZ;
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

    // Passive fear
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
