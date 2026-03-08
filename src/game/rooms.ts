import { RoomConfig } from './types';

export const ROOM_CONFIGS: RoomConfig[] = [
  // 1. The Hallway (intro)
  {
    name: 'The Hallway',
    wallColor: '#7a6850', floorColor: '#4a3f34', ceilingColor: '#5a4a3a',
    ambientColor: '#ffcc88', ambientIntensity: 0.8,
    pointLightColor: '#ffbb66', pointLightIntensity: 2.2,
    fogColor: '#3a2f20', fogNear: 6, fogFar: 22,
    ghostLevel: 0, fearMultiplier: 1, hasWhispers: false, lightFailure: false,
    dustDensity: 0.3, dustColor: '#aa9966',
    ambientSoundType: 'wind', roomTheme: 'hallway',
  },
  // 2. Blood Corridor
  {
    name: 'Blood Corridor',
    wallColor: '#4a1515', floorColor: '#2a0808', ceilingColor: '#3a1010',
    ambientColor: '#ff4444', ambientIntensity: 0.7,
    pointLightColor: '#ff5533', pointLightIntensity: 2.0,
    fogColor: '#1a0505', fogNear: 4, fogFar: 18,
    ghostLevel: 1, fearMultiplier: 1.5, hasWhispers: true, lightFailure: true,
    dustDensity: 0.6, dustColor: '#ff4444',
    ambientSoundType: 'drip', roomTheme: 'corridor',
  },
  // 3. Abandoned Hospital
  {
    name: 'Abandoned Hospital',
    wallColor: '#5a6a5a', floorColor: '#3a4a3a', ceilingColor: '#4a5a4a',
    ambientColor: '#88ccaa', ambientIntensity: 0.7,
    pointLightColor: '#66ffaa', pointLightIntensity: 2.0,
    fogColor: '#1a2a1a', fogNear: 5, fogFar: 20,
    ghostLevel: 1, fearMultiplier: 1.6, hasWhispers: true, lightFailure: true,
    dustDensity: 0.5, dustColor: '#88aa88',
    ambientSoundType: 'whisper', roomTheme: 'hospital',
  },
  // 4. Cursed Library
  {
    name: 'Cursed Library',
    wallColor: '#4a3825', floorColor: '#3a2a18', ceilingColor: '#5a4830',
    ambientColor: '#ccaa55', ambientIntensity: 0.7,
    pointLightColor: '#ffcc44', pointLightIntensity: 2.0,
    fogColor: '#2a1a08', fogNear: 5, fogFar: 19,
    ghostLevel: 2, fearMultiplier: 1.7, hasWhispers: true, lightFailure: false,
    dustDensity: 0.7, dustColor: '#ccaa55',
    ambientSoundType: 'whisper', roomTheme: 'library',
  },
  // 5. Ritual Chamber
  {
    name: 'Ritual Chamber',
    wallColor: '#3a1a2a', floorColor: '#2a0a1a', ceilingColor: '#4a1a30',
    ambientColor: '#cc33ff', ambientIntensity: 0.65,
    pointLightColor: '#bb44ee', pointLightIntensity: 1.9,
    fogColor: '#1a0818', fogNear: 4, fogFar: 17,
    ghostLevel: 2, fearMultiplier: 2.0, hasWhispers: true, lightFailure: true,
    dustDensity: 0.8, dustColor: '#cc44ff',
    ambientSoundType: 'ritual', roomTheme: 'ritual',
  },
  // 6. Mirror Hallway
  {
    name: 'Mirror Hallway',
    wallColor: '#3a3a4a', floorColor: '#2a2a3a', ceilingColor: '#4a4a5a',
    ambientColor: '#aaaaff', ambientIntensity: 0.7,
    pointLightColor: '#9999ff', pointLightIntensity: 2.0,
    fogColor: '#1a1a2a', fogNear: 5, fogFar: 20,
    ghostLevel: 2, fearMultiplier: 1.8, hasWhispers: true, lightFailure: false,
    dustDensity: 0.4, dustColor: '#8888cc',
    ambientSoundType: 'whisper', roomTheme: 'mirror',
  },
  // 7. Underground Basement
  {
    name: 'Underground Basement',
    wallColor: '#2a3a2a', floorColor: '#1a2a1a', ceilingColor: '#253025',
    ambientColor: '#55aa55', ambientIntensity: 0.6,
    pointLightColor: '#55cc55', pointLightIntensity: 1.8,
    fogColor: '#0a1a0a', fogNear: 3, fogFar: 16,
    ghostLevel: 2, fearMultiplier: 2.0, hasWhispers: true, lightFailure: true,
    dustDensity: 0.9, dustColor: '#556655',
    ambientSoundType: 'drip', roomTheme: 'basement',
  },
  // 8. Haunted Child Bedroom
  {
    name: 'Haunted Child\'s Room',
    wallColor: '#5a4a5a', floorColor: '#4a3a4a', ceilingColor: '#5a4a58',
    ambientColor: '#ffaacc', ambientIntensity: 0.65,
    pointLightColor: '#ff99bb', pointLightIntensity: 1.9,
    fogColor: '#2a1a2a', fogNear: 4, fogFar: 18,
    ghostLevel: 3, fearMultiplier: 2.2, hasWhispers: true, lightFailure: true,
    dustDensity: 0.5, dustColor: '#cc88aa',
    ambientSoundType: 'child', roomTheme: 'child',
  },
  // 9. The Chapel
  {
    name: 'The Chapel',
    wallColor: '#4a3a3a', floorColor: '#3a2a2a', ceilingColor: '#4a3333',
    ambientColor: '#cc9955', ambientIntensity: 0.7,
    pointLightColor: '#ffbb55', pointLightIntensity: 2.0,
    fogColor: '#2a1818', fogNear: 4, fogFar: 18,
    ghostLevel: 3, fearMultiplier: 2.3, hasWhispers: true, lightFailure: true,
    dustDensity: 0.6, dustColor: '#aa8844',
    ambientSoundType: 'ritual', roomTheme: 'chapel',
  },
  // 10. The Exit Corridor (final)
  {
    name: 'The Exit Corridor',
    wallColor: '#4a2828', floorColor: '#3a1a1a', ceilingColor: '#422020',
    ambientColor: '#ee4444', ambientIntensity: 0.6,
    pointLightColor: '#ff5555', pointLightIntensity: 1.7,
    fogColor: '#200808', fogNear: 3, fogFar: 14,
    ghostLevel: 3, fearMultiplier: 2.8, hasWhispers: true, lightFailure: true,
    dustDensity: 1.0, dustColor: '#ff2222',
    ambientSoundType: 'scream', roomTheme: 'exit',
  },
];

export const DOOR_POSITIONS: [number, number, number][] = [
  [-3, 1.25, -4.95],
  [0, 1.25, -4.95],
  [3, 1.25, -4.95],
];
