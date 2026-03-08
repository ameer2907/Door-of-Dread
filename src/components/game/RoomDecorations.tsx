import * as THREE from 'three';

interface Props {
  roomTheme: string;
  roomIndex: number;
}

function BloodSplatter({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
      <circleGeometry args={[0.3 * scale, 8]} />
      <meshStandardMaterial color="#3a0808" transparent opacity={0.7} />
    </mesh>
  );
}

function HospitalBed({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.1, 2.4]} />
        <meshStandardMaterial color="#556655" metalness={0.3} />
      </mesh>
      {[[-0.5, 0, -1], [0.5, 0, -1], [-0.5, 0, 1], [0.5, 0, 1]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.8]} />
          <meshStandardMaterial color="#445544" metalness={0.5} />
        </mesh>
      ))}
      {/* Dirty sheet */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[1.1, 0.02, 2.2]} />
        <meshStandardMaterial color="#8a8878" roughness={1} />
      </mesh>
    </group>
  );
}

function Bookshelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 3, 0.4]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
      {[0.4, 1.0, 1.6, 2.2].map((y, i) => (
        <mesh key={i} position={[0, y - 1.5, 0.05]}>
          <boxGeometry args={[1.3, 0.05, 0.3]} />
          <meshStandardMaterial color="#1a0a00" />
        </mesh>
      ))}
      {/* Random books */}
      {Array.from({ length: 8 }).map((_, i) => {
        const shelf = Math.floor(i / 2);
        const x = -0.4 + (i % 4) * 0.25 + Math.random() * 0.1;
        const colors = ['#3a1a0a', '#1a2a1a', '#2a1a2a', '#1a1a3a', '#3a2a0a'];
        return (
          <mesh key={i} position={[x, (shelf * 0.6) - 1.1, 0.08]} castShadow>
            <boxGeometry args={[0.08 + Math.random() * 0.06, 0.25 + Math.random() * 0.1, 0.2]} />
            <meshStandardMaterial color={colors[i % colors.length]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Pentagram({ position }: { position: [number, number, number] }) {
  const points: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    points.push([Math.cos(angle) * 1.5, Math.sin(angle) * 1.5]);
  }
  
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Circle */}
      <mesh>
        <ringGeometry args={[1.4, 1.55, 32]} />
        <meshStandardMaterial color="#880000" emissive="#440000" emissiveIntensity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Candles at points */}
      {points.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.25]} />
            <meshStandardMaterial color="#cc9944" emissive="#ffaa33" emissiveIntensity={0.3} />
          </mesh>
          <pointLight position={[x, 0.3, z]} color="#ff8833" intensity={0.2} distance={2} />
        </group>
      ))}
    </group>
  );
}

function Mirror({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[1.2, 2, 0.08]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      {/* Mirror surface */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[1, 1.8]} />
        <meshStandardMaterial
          color="#4a5a6a"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* Crack overlay */}
      <mesh position={[0.1, 0.2, 0.06]}>
        <boxGeometry args={[0.01, 0.8, 0.001]} />
        <meshStandardMaterial color="#222222" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Crib({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 1.2]} />
        <meshStandardMaterial color="#5a4a3a" />
      </mesh>
      {/* Rails */}
      {[[-0.38, 0], [0.38, 0], [0, -0.58], [0, 0.58]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.55, z]} castShadow>
          <boxGeometry args={[i < 2 ? 0.04 : 0.72, 0.5, i < 2 ? 1.12 : 0.04]} />
          <meshStandardMaterial color="#4a3a2a" />
        </mesh>
      ))}
      {/* Creepy doll */}
      <mesh position={[0.1, 0.4, 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#d8c8b0" />
      </mesh>
      <mesh position={[0.1, 0.35, 0.2]}>
        <cylinderGeometry args={[0.05, 0.04, 0.15]} />
        <meshStandardMaterial color="#5a3a5a" />
      </mesh>
    </group>
  );
}

export default function RoomDecorations({ roomTheme, roomIndex }: Props) {
  switch (roomTheme) {
    case 'corridor':
      return (
        <group>
          <BloodSplatter position={[-1, 0.01, 1]} scale={1.5} />
          <BloodSplatter position={[2, 0.01, -2]} scale={1} />
          <BloodSplatter position={[-3, 0.01, 3]} scale={2} />
          {/* Blood drips on walls */}
          {[-3, 0, 3].map((x, i) => (
            <mesh key={i} position={[x, 1.5, -4.9]}>
              <boxGeometry args={[0.05, 1.5 + Math.random(), 0.01]} />
              <meshStandardMaterial color="#3a0000" transparent opacity={0.6} />
            </mesh>
          ))}
          {/* Flickering emergency light */}
          <pointLight position={[0, 3.8, 0]} color="#ff0000" intensity={0.4} distance={8} />
          <mesh position={[0, 3.9, 0]}>
            <boxGeometry args={[0.4, 0.05, 0.15]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );

    case 'hospital':
      return (
        <group>
          <HospitalBed position={[-3, 0, 0]} />
          <HospitalBed position={[-3, 0, 3]} />
          {/* IV stand */}
          <mesh position={[-1.5, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 2.4]} />
            <meshStandardMaterial color="#556655" metalness={0.5} />
          </mesh>
          {/* Wheelchair */}
          <mesh position={[3, 0.4, 2]} castShadow>
            <boxGeometry args={[0.7, 0.05, 0.7]} />
            <meshStandardMaterial color="#333333" metalness={0.4} />
          </mesh>
          {/* Medical chart on wall */}
          <mesh position={[4.9, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[0.6, 0.8, 0.02]} />
            <meshStandardMaterial color="#ddd8cc" />
          </mesh>
          <BloodSplatter position={[1, 0.01, -1]} scale={0.8} />
        </group>
      );

    case 'library':
      return (
        <group>
          <Bookshelf position={[-4.7, 1.5, -2]} rotation={Math.PI / 2} />
          <Bookshelf position={[-4.7, 1.5, 2]} rotation={Math.PI / 2} />
          <Bookshelf position={[4.7, 1.5, -2]} rotation={-Math.PI / 2} />
          <Bookshelf position={[4.7, 1.5, 2]} rotation={-Math.PI / 2} />
          {/* Reading desk */}
          <mesh position={[0, 0.6, 1]} castShadow>
            <boxGeometry args={[1.5, 0.06, 1]} />
            <meshStandardMaterial color="#3a2a15" />
          </mesh>
          <mesh position={[0, 0.3, 1]}>
            <boxGeometry args={[0.08, 0.6, 0.08]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
          {/* Candle on desk */}
          <mesh position={[0.3, 0.72, 1]}>
            <cylinderGeometry args={[0.03, 0.03, 0.2]} />
            <meshStandardMaterial color="#ccaa55" emissive="#ffaa33" emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[0.3, 0.9, 1]} color="#ffaa33" intensity={0.3} distance={3} />
          {/* Fallen books on floor */}
          {[[-2, 0, 0], [1.5, 0, -2], [3, 0, 3]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} rotation={[0, Math.random() * Math.PI, Math.random() * 0.3]}>
              <boxGeometry args={[0.15, 0.03, 0.2]} />
              <meshStandardMaterial color="#2a1a1a" />
            </mesh>
          ))}
        </group>
      );

    case 'ritual':
      return (
        <group>
          <Pentagram position={[0, 0.02, 0.5]} />
          {/* Altar */}
          <mesh position={[0, 0.5, -3.5]} castShadow>
            <boxGeometry args={[2, 1, 0.8]} />
            <meshStandardMaterial color="#1a0a1a" />
          </mesh>
          {/* Skull on altar */}
          <mesh position={[0, 1.15, -3.5]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#d8d0b8" />
          </mesh>
          {/* Dark cloth drapes */}
          {[-4.8, 4.8].map((x, i) => (
            <mesh key={i} position={[x, 2, 0]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <planeGeometry args={[10, 4]} />
              <meshStandardMaterial color="#0a0008" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* Eerie purple glow */}
          <pointLight position={[0, 0.5, 0.5]} color="#8800ff" intensity={0.5} distance={5} />
        </group>
      );

    case 'mirror':
      return (
        <group>
          <Mirror position={[-4.9, 1.8, -2]} rotation={[0, Math.PI / 2, 0]} />
          <Mirror position={[-4.9, 1.8, 2]} rotation={[0, Math.PI / 2, 0]} />
          <Mirror position={[4.9, 1.8, -2]} rotation={[0, -Math.PI / 2, 0]} />
          <Mirror position={[4.9, 1.8, 2]} rotation={[0, -Math.PI / 2, 0]} />
          <Mirror position={[0, 1.8, 4.9]} rotation={[0, Math.PI, 0]} />
          {/* Eerie blue lighting */}
          <pointLight position={[0, 3.5, 0]} color="#4444ff" intensity={0.3} distance={8} />
          {/* Shattered mirror pieces on floor */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 6, 0.01, (Math.random() - 0.5) * 6]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
              <planeGeometry args={[0.1 + Math.random() * 0.1, 0.15 + Math.random() * 0.1]} />
              <meshStandardMaterial color="#6a7a8a" metalness={0.8} roughness={0.1} />
            </mesh>
          ))}
        </group>
      );

    case 'basement':
      return (
        <group>
          {/* Pipes */}
          <mesh position={[0, 3.8, 2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 9]} />
            <meshStandardMaterial color="#3a3a2a" metalness={0.6} />
          </mesh>
          <mesh position={[3, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 8]} />
            <meshStandardMaterial color="#2a3a2a" metalness={0.5} />
          </mesh>
          {/* Crates */}
          <mesh position={[3.5, 0.4, 3]} castShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#2a2a15" />
          </mesh>
          <mesh position={[3.9, 0.3, -2]} castShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#222210" />
          </mesh>
          {/* Water puddle */}
          <mesh position={[-2, 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.8, 12]} />
            <meshStandardMaterial color="#1a2a2a" transparent opacity={0.5} metalness={0.3} />
          </mesh>
          {/* Dripping water light effect */}
          <pointLight position={[-2, 0.3, 1]} color="#22aaaa" intensity={0.15} distance={3} />
          {/* Chains */}
          {[-3, 2].map((x, i) => (
            <mesh key={i} position={[x, 2.5, -4]}>
              <cylinderGeometry args={[0.02, 0.02, 2]} />
              <meshStandardMaterial color="#555544" metalness={0.7} />
            </mesh>
          ))}
        </group>
      );

    case 'child':
      return (
        <group>
          <Crib position={[-3, 0, 0]} />
          {/* Toy blocks scattered */}
          {[[-1, 0, 2], [2, 0, 1], [0.5, 0, 3]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} rotation={[0, Math.random() * Math.PI, 0]} castShadow>
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial color={['#aa4444', '#4444aa', '#44aa44'][i]} />
            </mesh>
          ))}
          {/* Rocking chair */}
          <group position={[3, 0, -2]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.6, 0.05, 0.6]} />
              <meshStandardMaterial color="#3a2a1a" />
            </mesh>
            <mesh position={[0, 0.8, -0.28]}>
              <boxGeometry args={[0.6, 0.6, 0.04]} />
              <meshStandardMaterial color="#3a2a1a" />
            </mesh>
            {/* Rockers */}
            <mesh position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.5, 0.5, 0.6, 8, 1, false, 0, Math.PI * 0.15]} />
              <meshStandardMaterial color="#2a1a0a" />
            </mesh>
          </group>
          {/* Music box */}
          <mesh position={[2, 0.5, 3]} castShadow>
            <boxGeometry args={[0.2, 0.15, 0.2]} />
            <meshStandardMaterial color="#aa8844" metalness={0.3} />
          </mesh>
          {/* Creepy drawing on wall */}
          <mesh position={[-4.9, 1.5, 2]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.6, 0.4]} />
            <meshStandardMaterial color="#ddd8cc" />
          </mesh>
          {/* Nightlight glow */}
          <pointLight position={[3, 0.3, 3]} color="#ffaacc" intensity={0.2} distance={3} />
        </group>
      );

    case 'chapel':
      return (
        <group>
          {[-1.5, 1.5].map((x, i) => (
            <group key={i}>
              {[0, 1.5, 3].map((z, j) => (
                <mesh key={j} position={[x, 0.35, z]} castShadow>
                  <boxGeometry args={[1.2, 0.7, 0.5]} />
                  <meshStandardMaterial color="#1a0f0a" />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, 0.8, -4]} castShadow>
            <boxGeometry args={[2, 1.2, 0.8]} />
            <meshStandardMaterial color="#2a1515" />
          </mesh>
          {[-0.5, 0.5].map((x, i) => (
            <group key={`candle-${i}`} position={[x, 1.5, -4]}>
              <mesh>
                <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                <meshStandardMaterial color="#ccaa66" />
              </mesh>
              <pointLight position={[0, 0.25, 0]} color="#ffaa33" intensity={0.3} distance={3} />
            </group>
          ))}
          {/* Cross */}
          <group position={[0, 3, -4.9]}>
            <mesh>
              <boxGeometry args={[0.08, 1.2, 0.04]} />
              <meshStandardMaterial color="#2a1a0a" />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.7, 0.08, 0.04]} />
              <meshStandardMaterial color="#2a1a0a" />
            </mesh>
          </group>
        </group>
      );

    case 'exit':
      return (
        <group>
          <pointLight position={[0, 3.5, 0]} color="#ff0000" intensity={0.3} distance={8} />
          <mesh position={[0, 3.8, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.15]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
          </mesh>
          {/* EXIT sign */}
          <mesh position={[0, 3.5, -4.9]}>
            <boxGeometry args={[0.8, 0.3, 0.02]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
          <BloodSplatter position={[0, 0.01, 0]} scale={2} />
          <BloodSplatter position={[-2, 0.01, 2]} scale={1.5} />
        </group>
      );

    case 'hallway':
      return (
        <group>
          {/* Coat rack */}
          <mesh position={[-4, 1.5, -3]} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 3]} />
            <meshStandardMaterial color="#3a2510" />
          </mesh>
          {/* Coat hooks */}
          {[-0.2, 0.2].map((x, i) => (
            <mesh key={`hook-${i}`} position={[-4 + x, 2.6, -3]} rotation={[0, 0, i === 0 ? 0.4 : -0.4]}>
              <cylinderGeometry args={[0.01, 0.01, 0.15]} />
              <meshStandardMaterial color="#555533" metalness={0.6} />
            </mesh>
          ))}
          {/* Framed painting */}
          <mesh position={[4.9, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[1.2, 0.8, 0.05]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
          {/* Painting canvas */}
          <mesh position={[4.88, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.0, 0.6]} />
            <meshStandardMaterial color="#1a1510" />
          </mesh>
          {/* Console table */}
          <mesh position={[3.5, 0.4, 4]} castShadow>
            <boxGeometry args={[1.2, 0.04, 0.5]} />
            <meshStandardMaterial color="#3a2a15" roughness={0.9} />
          </mesh>
          {[[-0.5, 0], [0.5, 0]].map(([x, z], i) => (
            <mesh key={`leg-${i}`} position={[3.5 + x, 0.2, 4 + z]}>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshStandardMaterial color="#2a1a0a" />
            </mesh>
          ))}
          {/* Candle on table */}
          <mesh position={[3.5, 0.5, 4]}>
            <cylinderGeometry args={[0.025, 0.025, 0.15]} />
            <meshStandardMaterial color="#ccaa55" emissive="#ffaa33" emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[3.5, 0.65, 4]} color="#ffaa33" intensity={0.15} distance={2.5} />
          {/* Umbrella stand */}
          <mesh position={[-3.8, 0.3, 4]} castShadow>
            <cylinderGeometry args={[0.15, 0.12, 0.6, 8]} />
            <meshStandardMaterial color="#2a2a1a" />
          </mesh>
          {/* Old rug on floor */}
          <mesh position={[0, 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 4]} />
            <meshStandardMaterial color="#3a2a1a" transparent opacity={0.6} />
          </mesh>
          {/* Scratch marks on floor */}
          {[[1.5, 0.01, 2], [-1, 0.01, -1], [0.5, 0.01, 3]].map((p, i) => (
            <mesh key={`scratch-${i}`} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
              <planeGeometry args={[0.04, 0.6 + Math.random() * 0.4]} />
              <meshStandardMaterial color="#1a1008" transparent opacity={0.5} />
            </mesh>
          ))}
          {/* Cobwebs in corners */}
          <mesh position={[-4.8, 3.8, -4.8]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial color="#888877" transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[4.8, 3.8, -4.8]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial color="#888877" transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
          {/* Wall crack */}
          <mesh position={[-2, 2.5, -4.94]}>
            <boxGeometry args={[0.02, 1.5, 0.01]} />
            <meshStandardMaterial color="#1a1008" transparent opacity={0.4} />
          </mesh>
          <mesh position={[-2.1, 2.0, -4.94]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.015, 0.8, 0.01]} />
            <meshStandardMaterial color="#1a1008" transparent opacity={0.3} />
          </mesh>
        </group>
      );

    default:
      return null;
  }
}
