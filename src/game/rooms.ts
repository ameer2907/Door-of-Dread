import { RoomConfig } from './types';

export const ROOM_CONFIGS: RoomConfig[] = [
  {
    name: 'The Hallway',
    wallColor: '#7a6850', floorColor: '#4a3f34', ceilingColor: '#5a4a3a',
    ambientColor: '#ffcc88', ambientIntensity: 0.8,
    pointLightColor: '#ffbb66', pointLightIntensity: 2.2,
    fogColor: '#3a2f20', fogNear: 6, fogFar: 22,
    ghostLevel: 0, fearMultiplier: 1, hasWhispers: false, lightFailure: false,
  },
  {
    name: 'The Living Room',
    wallColor: '#6d5b4f', floorColor: '#453a30', ceilingColor: '#534232',
    ambientColor: '#ff9955', ambientIntensity: 0.7,
    pointLightColor: '#ff8844', pointLightIntensity: 2.0,
    fogColor: '#352a1a', fogNear: 5, fogFar: 20,
    ghostLevel: 0, fearMultiplier: 1.2, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Stair Landing',
    wallColor: '#4a4a5a', floorColor: '#3a3a4a', ceilingColor: '#424254',
    ambientColor: '#8888cc', ambientIntensity: 0.7,
    pointLightColor: '#aaaaee', pointLightIntensity: 1.8,
    fogColor: '#2a2a35', fogNear: 5, fogFar: 20,
    ghostLevel: 1, fearMultiplier: 1.4, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Bedroom',
    wallColor: '#5a4242', floorColor: '#4a3535', ceilingColor: '#4a3838',
    ambientColor: '#886666', ambientIntensity: 0.6,
    pointLightColor: '#aa6666', pointLightIntensity: 1.5,
    fogColor: '#301818', fogNear: 4, fogFar: 18,
    ghostLevel: 2, fearMultiplier: 1.6, hasWhispers: true, lightFailure: false,
  },
  {
    name: 'The Basement',
    wallColor: '#3a4a3a', floorColor: '#2a3a2a', ceilingColor: '#354035',
    ambientColor: '#66bb66', ambientIntensity: 0.5,
    pointLightColor: '#55cc55', pointLightIntensity: 1.3,
    fogColor: '#1a2a1a', fogNear: 3, fogFar: 16,
    ghostLevel: 2, fearMultiplier: 1.8, hasWhispers: true, lightFailure: true,
  },
  {
    name: 'The Chapel',
    wallColor: '#4a3a3a', floorColor: '#3a2a2a', ceilingColor: '#4a3333',
    ambientColor: '#cc9955', ambientIntensity: 0.5,
    pointLightColor: '#ffbb55', pointLightIntensity: 1.4,
    fogColor: '#2a1818', fogNear: 3, fogFar: 16,
    ghostLevel: 3, fearMultiplier: 2.0, hasWhispers: true, lightFailure: true,
  },
  {
    name: 'The Exit Corridor',
    wallColor: '#4a2828', floorColor: '#3a1a1a', ceilingColor: '#422020',
    ambientColor: '#ee4444', ambientIntensity: 0.45,
    pointLightColor: '#ff4444', pointLightIntensity: 1.2,
    fogColor: '#200808', fogNear: 3, fogFar: 15,
    ghostLevel: 3, fearMultiplier: 2.5, hasWhispers: true, lightFailure: true,
  },
];

export const DOOR_POSITIONS: [number, number, number][] = [
  [-3, 1.25, -4.95],
  [0, 1.25, -4.95],
  [3, 1.25, -4.95],
];
