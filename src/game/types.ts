export type GamePhase = 'menu' | 'intro' | 'playing' | 'paused' | 'gameover' | 'win' | 'settings' | 'lore';
export type GhostState = 'hidden' | 'watching' | 'approaching' | 'close' | 'attack';
export type GhostSpawnType = 'doorway' | 'behind' | 'corridor' | 'shadows' | 'ceiling';
export type GhostType = 'stalker' | 'shadow' | 'jumpscare' | 'corridor' | 'nun';
export type PortalPhase = 'none' | 'doorOpening' | 'walkThrough' | 'arriving';

export interface RoomConfig {
  name: string;
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  ambientColor: string;
  ambientIntensity: number;
  pointLightColor: string;
  pointLightIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ghostLevel: number;
  fearMultiplier: number;
  hasWhispers: boolean;
  lightFailure: boolean;
  dustDensity: number;
  dustColor: string;
  ambientSoundType: 'wind' | 'drip' | 'whisper' | 'scream' | 'child' | 'ritual' | 'silence';
  roomTheme: 'corridor' | 'hospital' | 'library' | 'ritual' | 'mirror' | 'basement' | 'child' | 'chapel' | 'hallway' | 'living' | 'stairs' | 'bedroom' | 'exit';
}

export interface GameSettings {
  volume: number;
  sensitivity: number;
  graphics: 'low' | 'medium' | 'high';
}

export interface PortalTransition {
  phase: PortalPhase;
  doorIndex: number;
  nextRoomIndex: number;
  progress: number;
  fogDensity: number;
}

export interface GameState {
  phase: GamePhase;
  currentRoom: number;
  fear: number;
  wrongCount: number;
  correctDoorIndex: number;
  ghostState: GhostState;
  ghostType: GhostType;
  isTransitioning: boolean;
  settings: GameSettings;
  targetedDoor: number | null;
  flickering: boolean;
  ghostVisible: boolean;
  openingDoor: number | null;
  pointerLocked: boolean;
  screenShake: number;
  filmGrain: boolean;
  chromaticAberration: number;
  portal: PortalTransition;
  ghostSpawnType: GhostSpawnType;
  ghostApproachProgress: number;
  roomDarkness: number;
  // Advanced mechanics
  chaseMode: boolean;           // ghost chase active
  chaseDoorIndex: number | null; // which door is safe during chase
  trapDoorActive: boolean;       // fake safe door trap in progress
  ghostBehindPlayer: boolean;    // ghost silently behind player
  mirrorGhostVisible: boolean;   // ghost visible in mirror reflection
}
