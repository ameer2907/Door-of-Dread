export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover' | 'win' | 'settings';
export type GhostState = 'hidden' | 'watching' | 'close' | 'attack';

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
  isTransitioning: boolean;
  settings: GameSettings;
  targetedDoor: number | null;
  flickering: boolean;
  ghostVisible: boolean;
  openingDoor: number | null;
  pointerLocked: boolean;
}
