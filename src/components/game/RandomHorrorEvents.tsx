import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/game/store';
import { audioManager } from '@/game/audio';
import { ROOM_CONFIGS } from '@/game/rooms';

interface ShadowFigure {
  active: boolean;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  opacity: number;
  speed: number;
  wallSide: 'left' | 'right' | 'back';
}

export default function RandomHorrorEvents() {
  const { phase, currentRoom, ghostVisible, getState, increaseFear, triggerChaseMode, triggerGhostBehind, setMirrorGhost } = useGame();
  const { camera } = useThree();

  const eventTimer = useRef(0);
  const nextEventTime = useRef(8 + Math.random() * 12);
  const shadowRef = useRef<THREE.Group>(null);
  const shadow = useRef<ShadowFigure>({
    active: false,
    position: new THREE.Vector3(-4.9, 1.5, 0),
    targetPosition: new THREE.Vector3(-4.9, 1.5, 4),
    opacity: 0,
    speed: 1.5,
    wallSide: 'left',
  });
  const shadowMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const shadowHeadMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightFlickerRef = useRef<THREE.PointLight>(null);
  const flickerActive = useRef(false);
  const flickerTimer = useRef(0);
  const flickerDuration = useRef(0);

  // Ghost-behind-player: track camera rotation for turn detection
  const lastCameraYaw = useRef(0);
  const totalTurnAccum = useRef(0);
  const ghostBehindCooldown = useRef(0);
  const chaseModeCooldown = useRef(0);

  // Mirror ghost detection
  const mirrorCheckTimer = useRef(0);

  useEffect(() => {
    eventTimer.current = 0;
    nextEventTime.current = 5 + Math.random() * 10;
    shadow.current.active = false;
    shadow.current.opacity = 0;
    flickerActive.current = false;
    totalTurnAccum.current = 0;
    ghostBehindCooldown.current = 0;
    chaseModeCooldown.current = 15;
  }, [currentRoom]);

  const triggerEvent = () => {
    const gs = getState();
    if (gs.ghostVisible || gs.isTransitioning || gs.portal.phase !== 'none' || gs.chaseMode) return;

    const roomConfig = ROOM_CONFIGS[gs.currentRoom];
    const fearMult = roomConfig.fearMultiplier;

    const events = [
      { type: 'shadow', weight: 3 },
      { type: 'whisper', weight: 4 },
      { type: 'lightDie', weight: 2 },
      { type: 'footsteps', weight: 3 },
      { type: 'doorCreak', weight: 2 },
      { type: 'breathOnNeck', weight: gs.currentRoom >= 3 ? 3 : 0 },
      { type: 'ghostBehind', weight: gs.currentRoom >= 2 ? 2 : 0 },
      { type: 'chase', weight: gs.currentRoom >= 4 && chaseModeCooldown.current <= 0 ? 1 : 0 },
    ];

    const totalWeight = events.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let selectedEvent = 'whisper';
    for (const e of events) {
      roll -= e.weight;
      if (roll <= 0) { selectedEvent = e.type; break; }
    }

    switch (selectedEvent) {
      case 'shadow':
        triggerShadowFigure();
        increaseFear(2 * fearMult);
        break;
      case 'whisper':
        audioManager.playRandomWhisper();
        increaseFear(1 * fearMult);
        break;
      case 'lightDie':
        triggerLightFlicker();
        audioManager.playFlicker();
        increaseFear(3 * fearMult);
        break;
      case 'footsteps':
        audioManager.playDistantFootsteps();
        increaseFear(1.5 * fearMult);
        break;
      case 'doorCreak':
        audioManager.playDistantDoorSlam();
        increaseFear(2 * fearMult);
        break;
      case 'breathOnNeck':
        audioManager.playBreathOnNeck();
        increaseFear(4 * fearMult);
        break;
      case 'ghostBehind':
        if (ghostBehindCooldown.current <= 0) {
          triggerGhostBehind();
          ghostBehindCooldown.current = 30;
          increaseFear(5 * fearMult);
        }
        break;
      case 'chase':
        triggerChaseMode();
        chaseModeCooldown.current = 60;
        break;
    }
  };

  const triggerShadowFigure = () => {
    const sides: ('left' | 'right' | 'back')[] = ['left', 'right', 'back'];
    const side = sides[Math.floor(Math.random() * sides.length)];
    const s = shadow.current;
    s.active = true;
    s.wallSide = side;
    s.speed = 1.2 + Math.random() * 1.5;
    s.opacity = 0;

    switch (side) {
      case 'left':
        s.position.set(-4.85, 1.5, -4);
        s.targetPosition.set(-4.85, 1.5, 4.5);
        break;
      case 'right':
        s.position.set(4.85, 1.5, -4);
        s.targetPosition.set(4.85, 1.5, 4.5);
        break;
      case 'back':
        s.position.set(-4, 1.5, -4.85);
        s.targetPosition.set(4.5, 1.5, -4.85);
        break;
    }

    audioManager.playShadowMovement();
  };

  const triggerLightFlicker = () => {
    flickerActive.current = true;
    flickerTimer.current = 0;
    flickerDuration.current = 1.5 + Math.random() * 2;
  };

  useFrame((_, delta) => {
    if (phase !== 'playing') return;
    const gs = getState();
    if (gs.isTransitioning || gs.portal.phase !== 'none') return;

    // Cooldown timers
    if (ghostBehindCooldown.current > 0) ghostBehindCooldown.current -= delta;
    if (chaseModeCooldown.current > 0) chaseModeCooldown.current -= delta;

    // === GHOST BEHIND ON CAMERA TURN ===
    const currentYaw = camera.rotation.y;
    const yawDelta = Math.abs(currentYaw - lastCameraYaw.current);
    if (yawDelta > 0.05 && yawDelta < Math.PI) {
      totalTurnAccum.current += yawDelta;
    }
    lastCameraYaw.current = currentYaw;

    // If player turns >180 degrees rapidly, chance to spawn ghost behind
    if (totalTurnAccum.current > Math.PI && !gs.ghostVisible && !gs.chaseMode && ghostBehindCooldown.current <= 0 && gs.currentRoom >= 2) {
      if (Math.random() < 0.15) {
        triggerGhostBehind();
        ghostBehindCooldown.current = 40;
        totalTurnAccum.current = 0;
      } else {
        totalTurnAccum.current = 0;
      }
    }
    // Decay accumulator
    totalTurnAccum.current = Math.max(0, totalTurnAccum.current - delta * 0.5);

    // === MIRROR GHOST DETECTION — "Look-Away" mechanic ===
    // Ghost in mirror only moves/appears when camera is NOT facing it
    if (ROOM_CONFIGS[gs.currentRoom].roomTheme === 'mirror' && !gs.ghostVisible) {
      mirrorCheckTimer.current += delta;
      if (mirrorCheckTimer.current > 2) {
        mirrorCheckTimer.current = 0;
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const facingLeft = fwd.x < -0.6;
        const facingRight = fwd.x > 0.6;
        const facingBack = fwd.z > 0.6;
        const facingMirrorWall = facingLeft || facingRight || facingBack;

        if (facingMirrorWall && Math.random() < 0.2) {
          setMirrorGhost(true);
          // Ghost only disappears when player turns to look directly at it
          const checkLookAway = () => {
            const nowFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const nowFacing = nowFwd.x < -0.6 || nowFwd.x > 0.6 || nowFwd.z > 0.6;
            if (!nowFacing) {
              // Player looked away — ghost advances/stays
              setTimeout(() => setMirrorGhost(false), 1500 + Math.random() * 1500);
            } else {
              // Player still looking at mirror — ghost frozen, check again
              setTimeout(checkLookAway, 300);
            }
          };
          setTimeout(checkLookAway, 800);
        }
      }
    }

    // Skip event scheduling if ghost is active
    if (gs.ghostVisible || gs.chaseMode) return;

    // Event scheduling
    eventTimer.current += delta;
    if (eventTimer.current >= nextEventTime.current) {
      eventTimer.current = 0;
      const roomFactor = Math.max(0.3, 1 - gs.currentRoom * 0.06);
      nextEventTime.current = (6 + Math.random() * 15) * roomFactor;
      triggerEvent();
    }

    // Animate shadow figure
    const s = shadow.current;
    if (s.active) {
      const dir = new THREE.Vector3().subVectors(s.targetPosition, s.position).normalize();
      s.position.addScaledVector(dir, delta * s.speed);

      const dist = s.position.distanceTo(s.targetPosition);
      const totalDist = 8;
      const progress = 1 - dist / totalDist;
      if (progress < 0.15) {
        s.opacity = Math.min(s.opacity + delta * 3, 0.6);
      } else if (progress > 0.85) {
        s.opacity = Math.max(s.opacity - delta * 4, 0);
        if (s.opacity <= 0) s.active = false;
      } else {
        s.opacity = Math.min(s.opacity + delta * 2, 0.5);
      }

      if (shadowRef.current) {
        shadowRef.current.position.copy(s.position);
        switch (s.wallSide) {
          case 'left': shadowRef.current.rotation.set(0, Math.PI / 2, 0); break;
          case 'right': shadowRef.current.rotation.set(0, -Math.PI / 2, 0); break;
          case 'back': shadowRef.current.rotation.set(0, 0, 0); break;
        }
      }
      if (shadowMaterialRef.current) {
        shadowMaterialRef.current.opacity = s.opacity;
      }
      if (shadowHeadMaterialRef.current) {
        shadowHeadMaterialRef.current.opacity = s.opacity * 0.8;
      }
    }

    // Light flicker
    if (flickerActive.current && lightFlickerRef.current) {
      flickerTimer.current += delta;
      if (flickerTimer.current < flickerDuration.current) {
        lightFlickerRef.current.intensity = Math.random() > 0.5 ? 0 : Math.random() * 3;
      } else {
        lightFlickerRef.current.intensity = 0;
        flickerActive.current = false;
      }
    }
  });

  if (phase !== 'playing') return null;

  return (
    <group>
      {/* Shadow figure on wall */}
      <group ref={shadowRef}>
        <mesh>
          <planeGeometry args={[0.8, 2.5]} />
          <meshStandardMaterial
            ref={shadowMaterialRef}
            color="#000000"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 1.0, 0.01]}>
          <circleGeometry args={[0.2, 12]} />
          <meshStandardMaterial
            ref={shadowHeadMaterialRef}
            color="#000000"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      <pointLight
        ref={lightFlickerRef}
        position={[0, 3.5, 0]}
        color="#000000"
        intensity={0}
        distance={15}
      />
    </group>
  );
}
