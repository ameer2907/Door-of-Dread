import { RoomConfig } from './types';

export const ROOM_CONFIGS: RoomConfig[] = [
  {
    name: 'The Hallway',
    wallColor: '#6a5740', floorColor: '#3a2f24', ceilingColor: '#4a3a2a',
    ambientColor: '#ffcc88', ambientIntensity: 0.6,
    pointLightColor: '#ffaa55', pointLightIntensity: 1.8,
    fogColor: '#2a1f15', fogNear: 4, fogFar: 18,
    ghostLevel: 0, fearMultiplier: 1, hasWhispers: false, lightFailure: false,
  },
  {
    name: 'The Living Room',
    wallColor: '#5d4b3f', floorColor: '#352a20', ceilingColor: '#433222',
    ambientColor: '#ff8844', ambientIntensity: 0.5,
    pointLightColor: '#ff7733', pointLightIntensity: 1.5,
    fogColor: '#251a10', fogNear: 4, fogFar: 17,
    ghostLevel: 0, fearMultiplier: 1.2, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Stair Landing',
    wallColor: '#3a3a4a', floorColor: '#2a2a3a', ceilingColor: '#323244',
    ambientColor: '#7777bb', ambientIntensity: 0.45,
    pointLightColor: '#9999dd', pointLightIntensity: 1.2,
    fogColor: '#1a1a25', fogNear: 3, fogFar: 16,
    ghostLevel: 1, fearMultiplier: 1.4, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Bedroom',
    wallColor: '#4a3232', floorColor: '#3a2525', ceilingColor: '#3a2828',
    ambientColor: '#775555', ambientIntensity: 0.4,
    pointLightColor: '#995555', pointLightIntensity: 1.0,
    fogColor: '#201010', fogNear: 3, fogFar: 15,
    ghostLevel: 2, fearMultiplier: 1.6, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Basement',
    wallColor: '#2a3a2a', floorColor: '#1a2a1a', ceilingColor: '#253025',
    ambientColor: '#55aa55', ambientIntensity: 0.35,
    pointLightColor: '#44bb44', pointLightIntensity: 0.9,
    fogColor: '#101a10', fogNear: 2, fogFar: 14,
    ghostLevel: 2, fearMultiplier: 1.8, hasWhispers: true, lightFailure: true,
  },
  {
    name: 'The Chapel',
    wallColor: '#3a3030', floorColor: '#2a2020', ceilingColor: '#3a2a2a',
    ambientColor: '#cc8844', ambientIntensity: 0.35,
    pointLightColor: '#ffaa44', pointLightIntensity: 1.0,
    fogColor: '#1a1010', fogNear: 2, fogFar: 14,
    ghostLevel: 3, fearMultiplier: 2.0, hasWhispers: true, lightFailure: true,
  },
  {
    name: 'The Exit Corridor',
    wallColor: '#3a2020', floorColor: '#2a1515', ceilingColor: '#321818',
    ambientColor: '#dd3333', ambientIntensity: 0.3,
    pointLightColor: '#ff3333', pointLightIntensity: 0.8,
    fogColor: '#150505', fogNear: 2, fogFar: 13,
    ghostLevel: 3, fearMultiplier: 2.5, hasWhispers: true, lightFailure: true,
  },
];

export const DOOR_POSITIONS: [number, number, number][] = [
  [-3, 1.25, -4.95],
  [0, 1.25, -4.95],
  [3, 1.25, -4.95],
];
