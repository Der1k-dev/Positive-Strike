// terrain.js
// Єдина функція "що тут за місцевість" — використовується і генератором
// меша карти, і розстановкою лісу, і пізніше (крок 5+) перевіркою
// прохідності клітинок для різних типів юнітів (флот тільки по воді, etc).

import { createNoise2D, createFBM } from './noise.js';
import {
  OCEAN_THRESHOLD,
  SHORE_THRESHOLD,
  MOUNTAIN_THRESHOLD,
  FOREST_VEGETATION_THRESHOLD,
} from '../data/terrainDefinitions.js';

const ELEVATION_FREQUENCY = 0.02; // "масштаб" великих форм рельєфу відносно світових одиниць
const VEGETATION_FREQUENCY = 0.05;
const VEGETATION_SEED_OFFSET = 9973; // щоб поле рослинності не повторювало поле висоти

export function createTerrainSampler(seed) {
  const elevationNoise = createNoise2D(seed);
  const elevationFbm = createFBM(elevationNoise, { octaves: 5, lacunarity: 2, persistence: 0.5 });

  const vegetationNoise = createNoise2D(seed + VEGETATION_SEED_OFFSET);
  const vegetationFbm = createFBM(vegetationNoise, { octaves: 3, lacunarity: 2.2, persistence: 0.55 });

  function elevationAt(worldX, worldZ) {
    return elevationFbm(worldX * ELEVATION_FREQUENCY, worldZ * ELEVATION_FREQUENCY);
  }

  function vegetationAt(worldX, worldZ) {
    return vegetationFbm(worldX * VEGETATION_FREQUENCY, worldZ * VEGETATION_FREQUENCY);
  }

  function biomeAt(worldX, worldZ) {
    const elevation = elevationAt(worldX, worldZ);
    if (elevation < OCEAN_THRESHOLD) return 'ocean';
    if (elevation < SHORE_THRESHOLD) return 'shore';
    if (elevation > MOUNTAIN_THRESHOLD) return 'mountain';
    return vegetationAt(worldX, worldZ) > FOREST_VEGETATION_THRESHOLD ? 'forest' : 'plains';
  }

  return { elevationAt, vegetationAt, biomeAt };
}
