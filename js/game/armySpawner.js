// armySpawner.js
// Розставляє стартовий набір юнітів для команди на валідній місцевості:
// флот шукає океан, наземна техніка й піхота уникають океану й гір,
// авіація літає над будь-якою точкою (просто вища за землю).
// Детерміновано за seed — обидва гравці порахують однакову розстановку локально.

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createUnitMesh } from './units.js';
import { UNIT_TYPES } from '../data/unitDefinitions.js';
import { createRng } from './noise.js';
import { MAP_SIZE, HEIGHT_SCALE } from '../data/terrainDefinitions.js';

const STARTER_LOADOUT = ['tank', 'tank', 'apc', 'rifleman', 'rifleman', 'sniper', 'fighter', 'destroyer'];
const AIR_ALTITUDE = 9;
const MIN_UNIT_SPACING = 4;
const SPAWN_SEED_OFFSET = { blue: 1111, red: 2222 };
const MAX_PLACEMENT_ATTEMPTS = 60;

function requiresWater(unitTypeId) {
  return UNIT_TYPES[unitTypeId].category === 'fleet';
}

function isAirborne(unitTypeId) {
  return UNIT_TYPES[unitTypeId].category === 'air';
}

function findSpawnSpot(sampler, rng, baseX, placed, needsWater) {
  const half = MAP_SIZE / 2;

  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const rawX = baseX + (rng() - 0.5) * 26;
    const rawZ = (rng() - 0.5) * half * 1.3;
    const x = Math.max(-half + 5, Math.min(half - 5, rawX));
    const z = Math.max(-half + 5, Math.min(half - 5, rawZ));

    const biome = sampler.biomeAt(x, z);
    const onWater = biome === 'ocean';
    if (needsWater !== onWater) continue;
    if (!needsWater && biome === 'mountain') continue;

    const tooClose = placed.some((p) => Math.hypot(p.x - x, p.z - z) < MIN_UNIT_SPACING);
    if (tooClose) continue;

    return { x, z };
  }

  // Не знайшли ідеальне місце за розумну кількість спроб —
  // краще поставити юніт десь, ніж пропустити його.
  return { x: baseX, z: (rng() - 0.5) * 40 };
}

/**
 * Повертає THREE.Group зі стартовою армією команди ('blue' | 'red'),
 * розставленою на карті, згенерованій із того самого sampler/seed.
 */
export function spawnArmy(sampler, seed, team) {
  const group = new THREE.Group();
  group.name = `army-${team}`;

  const baseX = team === 'blue' ? -MAP_SIZE * 0.35 : MAP_SIZE * 0.35;
  const rng = createRng(seed + SPAWN_SEED_OFFSET[team]);
  const placed = [];

  for (const unitTypeId of STARTER_LOADOUT) {
    const needsWater = requiresWater(unitTypeId);
    const spot = findSpawnSpot(sampler, rng, baseX, placed, needsWater);
    placed.push(spot);

    const mesh = createUnitMesh(unitTypeId, team);
    const groundY = sampler.elevationAt(spot.x, spot.z) * HEIGHT_SCALE;
    mesh.position.set(spot.x, isAirborne(unitTypeId) ? groundY + AIR_ALTITUDE : groundY, spot.z);
    // Розвертаємо фронтом один до одного (по -Z дивиться "вперед" у моделях технік).
    mesh.rotation.y = team === 'blue' ? -Math.PI / 2 : Math.PI / 2;

    group.add(mesh);
  }

  return group;
}
