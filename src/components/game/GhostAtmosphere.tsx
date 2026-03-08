import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GhostState } from '@/game/types';

interface Props {
  ghostVisible: boolean;
  ghostState: GhostState;
  roomDarkness: number;
  approachProgress: number;
}

/** Floating ember/dust particles that intensify during ghost encounters */
function HorrorParticles({ intensity }: { intensity: number }) {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const offsets = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 10,
        y: Math.random() * 4,
        z: (Math.random() - 0.5) * 10,
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.3,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || intensity < 0.01) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const o = offsets[i];
      dummy.position.set(
        o.x + Math.sin(t * o.drift + o.phase) * 1.5,
        o.y + Math.sin(t * o.speed + o.phase) * 0.5,
        o.z + Math.cos(t * o.drift * 0.7 + o.phase) * 1.5
      );
      const scale = (0.01 + Math.sin(t * 2 + o.phase) * 0.005) * intensity;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (intensity < 0.01) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ff2200" transparent opacity={0.6 * intensity} />
    </instancedMesh>
  );
}

/** Pulsing red/purple environmental lights during ghost encounters */
function HorrorLighting({ ghostState, darkness }: { ghostState: GhostState; darkness: number }) {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light1Ref.current) {
      const pulse = Math.sin(t * 3) * 0.5 + 0.5;
      const baseIntensity = ghostState === 'attack' ? 2 : ghostState === 'close' ? 1.2 : ghostState === 'approaching' ? 0.6 : 0.2;
      light1Ref.current.intensity = baseIntensity * (0.7 + pulse * 0.3) * darkness;
    }
    if (light2Ref.current) {
      const pulse2 = Math.cos(t * 2.3 + 1) * 0.5 + 0.5;
      const baseIntensity = ghostState === 'attack' ? 1.5 : ghostState === 'close' ? 0.8 : 0.3;
      light2Ref.current.intensity = baseIntensity * (0.6 + pulse2 * 0.4) * darkness;
    }
  });

  if (darkness < 0.05) return null;

  return (
    <>
      <pointLight ref={light1Ref} position={[3, 3, -2]} color="#880000" distance={12} decay={2} />
      <pointLight ref={light2Ref} position={[-3, 2, 2]} color="#220044" distance={10} decay={2} />
      {ghostState === 'attack' && (
        <>
          <pointLight position={[0, 1, 0]} color="#ff0000" intensity={3 * darkness} distance={8} />
          <pointLight position={[0, 3, -3]} color="#ff2200" intensity={2 * darkness} distance={10} />
        </>
      )}
    </>
  );
}

export default function GhostAtmosphere({ ghostVisible, ghostState, roomDarkness, approachProgress }: Props) {
  const particleIntensity = ghostVisible
    ? (ghostState === 'attack' ? 3 : ghostState === 'close' ? 2 : ghostState === 'approaching' ? 1.2 : 0.5)
    : 0;

  return (
    <>
      <HorrorParticles intensity={particleIntensity * roomDarkness} />
      <HorrorLighting ghostState={ghostState} darkness={roomDarkness} />
    </>
  );
}
