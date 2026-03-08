import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/game/store';
import { audioManager } from '@/game/audio';
import { ROOM_CONFIGS } from '@/game/rooms';

/**
 * Random horror events that occur unpredictably during gameplay:
 * - Shadow figure moving across walls
 * - Whisper sounds behind the player
 * - Lights briefly dying
 * - Distant footsteps
 * - Sudden cold breath (screen effect handled by UI)
 */

interface ShadowFigure {
  active: boolean;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  opacity: number;
  speed: number;
  wallSide: 'left' | 'right' | 'back';
}

export default function RandomHorrorEvents() {
  const { phase, currentRoom, ghostVisible, ghostState, getState, increaseFear } = useGame();
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
  const lightFlickerRef = useRef<THREE.PointLight>(null);
  const flickerActive = useRef(false);
  const flickerTimer = useRef(0);
  const flickerDuration = useRef(0);

  // Reset timers on room change
  useEffect(() => {
    eventTimer.current = 0;
    nextEventTime.current = 5 + Math.random() * 10;
    shadow.current.active = false;
    shadow.current.opacity = 0;
    flickerActive.current = false;
  }, [currentRoom]);

  const triggerEvent = () => {
    const gs = getState();
    if (gs.ghostVisible || gs.isTransitioning || gs.portal.phase !== 'none') return;

    const roomConfig = ROOM_CONFIGS[gs.currentRoom];
    const fearMult = roomConfig.fearMultiplier;

    // Weight events based on room progression
    const events = [
      { type: 'shadow', weight: 3 },
      { type: 'whisper', weight: 4 },
      { type: 'lightDie', weight: 2 },
      { type: 'footsteps', weight: 3 },
      { type: 'doorCreak', weight: 2 },
      { type: 'breathOnNeck', weight: gs.currentRoom >= 3 ? 3 : 0 },
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
    if (gs.ghostVisible || gs.isTransitioning || gs.portal.phase !== 'none') return;

    // Event scheduling
    eventTimer.current += delta;
    if (eventTimer.current >= nextEventTime.current) {
      eventTimer.current = 0;
      // Events happen more frequently in later rooms
      const roomFactor = Math.max(0.3, 1 - gs.currentRoom * 0.06);
      nextEventTime.current = (6 + Math.random() * 15) * roomFactor;
      triggerEvent();
    }

    // Animate shadow figure
    const s = shadow.current;
    if (s.active) {
      const dir = new THREE.Vector3().subVectors(s.targetPosition, s.position).normalize();
      s.position.addScaledVector(dir, delta * s.speed);

      // Fade in then out
      const dist = s.position.distanceTo(s.targetPosition);
      const totalDist = 8; // approximate wall length
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
        // Face the wall
        switch (s.wallSide) {
          case 'left': shadowRef.current.rotation.set(0, Math.PI / 2, 0); break;
          case 'right': shadowRef.current.rotation.set(0, -Math.PI / 2, 0); break;
          case 'back': shadowRef.current.rotation.set(0, 0, 0); break;
        }
      }
      if (shadowMaterialRef.current) {
        shadowMaterialRef.current.opacity = s.opacity;
      }
    }

    // Light flicker
    if (flickerActive.current && lightFlickerRef.current) {
      flickerTimer.current += delta;
      if (flickerTimer.current < flickerDuration.current) {
        // Random intense flickering
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
        {/* Humanoid shadow silhouette - flat against wall */}
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
        {/* Head */}
        <mesh position={[0, 1.0, 0.01]}>
          <circleGeometry args={[0.2, 12]} />
          <meshStandardMaterial
            color="#000000"
            transparent
            opacity={shadow.current.opacity * 0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Flicker override light - goes to 0 to create darkness */}
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
