export type GamePhase = 'menu' | 'intro' | 'playing' | 'paused' | 'gameover' | 'win' | 'settings';
export type GhostState = 'hidden' | 'watching' | 'close' | 'attack';
export type GhostType = 'stalker' | 'shadow' | 'jumpscare' | 'corridor' | 'nun';

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
  // New fields
  dustDensity: number;       // 0-1 density of floating dust particles
  dustColor: string;
  ambientSoundType: 'wind' | 'drip' | 'whisper' | 'scream' | 'child' | 'ritual' | 'silence';
  roomTheme: 'corridor' | 'hospital' | 'library' | 'ritual' | 'mirror' | 'basement' | 'child' | 'chapel' | 'hallway' | 'living' | 'stairs' | 'bedroom' | 'exit';
}

export interface GameSettings {
  volume: number;
  sensitivity: number;
  graphics: 'low' | 'medium' | 'high';
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
  screenShake: number;       // 0-1 shake intensity
  filmGrain: boolean;
  chromaticAberration: number; // 0-1
}
