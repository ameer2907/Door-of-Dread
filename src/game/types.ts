export type GamePhase = 'menu' | 'intro' | 'playing' | 'paused' | 'gameover' | 'win' | 'settings';
export type GhostState = 'hidden' | 'watching' | 'approaching' | 'close' | 'attack';
export type GhostSpawnType = 'doorway' | 'behind' | 'corridor' | 'shadows';
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
  doorIndex: number;         // which door was selected
  nextRoomIndex: number;     // next room to show behind door
  progress: number;          // 0-1 animation progress
  fogDensity: number;        // 0-1 transition fog
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
}
