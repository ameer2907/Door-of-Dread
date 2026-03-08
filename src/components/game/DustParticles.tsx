import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  count: number;
  color: string;
  roomSize?: number;
}

export default function DustParticles({ count, color, roomSize = 10 }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * roomSize,
      y: Math.random() * 4,
      z: (Math.random() - 0.5) * roomSize,
      speedY: 0.05 + Math.random() * 0.15,
      speedX: (Math.random() - 0.5) * 0.1,
      drift: Math.random() * Math.PI * 2,
      scale: 0.01 + Math.random() * 0.025,
    }));
  }, [count, roomSize]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    
    particles.forEach((p, i) => {
      const y = (p.y + t * p.speedY) % 4;
      const x = p.x + Math.sin(t * 0.5 + p.drift) * 0.3;
      const z = p.z + Math.cos(t * 0.3 + p.drift) * 0.2;
      
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </instancedMesh>
  );
}
