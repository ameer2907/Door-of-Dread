import { RoomConfig } from './types';

export const ROOM_CONFIGS: RoomConfig[] = [
  {
    name: 'The Hallway',
    wallColor: '#4a3728', floorColor: '#2a1f14', ceilingColor: '#3a2a1a',
    ambientColor: '#ffcc88', ambientIntensity: 0.3,
    pointLightColor: '#ffaa55', pointLightIntensity: 0.8,
    fogColor: '#1a0f05', fogNear: 1, fogFar: 15,
    ghostLevel: 0, fearMultiplier: 1, hasWhispers: false, lightFailure: false,
  },
  {
    name: 'The Living Room',
    wallColor: '#3d2b1f', floorColor: '#251a10', ceilingColor: '#332211',
    ambientColor: '#ff8844', ambientIntensity: 0.25,
    pointLightColor: '#ff6622', pointLightIntensity: 0.7,
    fogColor: '#150a00', fogNear: 1, fogFar: 14,
    ghostLevel: 0, fearMultiplier: 1.2, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Stair Landing',
    wallColor: '#2a2a3a', floorColor: '#1a1a2a', ceilingColor: '#222233',
    ambientColor: '#6666aa', ambientIntensity: 0.2,
    pointLightColor: '#8888cc', pointLightIntensity: 0.5,
    fogColor: '#0a0a15', fogNear: 1, fogFar: 13,
    ghostLevel: 1, fearMultiplier: 1.4, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Bedroom',
    wallColor: '#3a2222', floorColor: '#2a1515', ceilingColor: '#2a1818',
    ambientColor: '#664444', ambientIntensity: 0.15,
    pointLightColor: '#884444', pointLightIntensity: 0.4,
    fogColor: '#100505', fogNear: 1, fogFar: 12,
    ghostLevel: 2, fearMultiplier: 1.6, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Basement',
    wallColor: '#1a2a1a', floorColor: '#111a11', ceilingColor: '#152015',
    ambientColor: '#44aa44', ambientIntensity: 0.1,
    pointLightColor: '#33aa33', pointLightIntensity: 0.3,
    fogColor: '#050a05', fogNear: 0.5, fogFar: 10,
    ghostLevel: 2, fearMultiplier: 1.8, hasWhispers: true, lightFailure: true,
  },
  {
    name: 'The Chapel',
    wallColor: '#2a2020', floorColor: '#1a1212', ceilingColor: '#2a1a1a',
    ambientColor: '#cc8844', ambientIntensity: 0.12,
    pointLightColor: '#ffaa44', pointLightIntensity: 0.35,
    fogColor: '#0a0505', fogNear: 0.5, fogFar: 11,
    ghostLevel: 3, fearMultiplier: 2.0, hasWhispers: true, lightFailure: true,
  },
  {
    name: 'The Exit Corridor',
    wallColor: '#2a1515', floorColor: '#1a0a0a', ceilingColor: '#221010',
    ambientColor: '#cc2222', ambientIntensity: 0.1,
    pointLightColor: '#ff2222', pointLightIntensity: 0.3,
    fogColor: '#0a0000', fogNear: 0.5, fogFar: 9,
    ghostLevel: 3, fearMultiplier: 2.5, hasWhispers: true, lightFailure: true,
  },
];

export const DOOR_POSITIONS: [number, number, number][] = [
  [-3, 1.25, -4.95],
  [0, 1.25, -4.95],
  [3, 1.25, -4.95],
];
