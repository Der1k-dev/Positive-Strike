// mapGenerator.js
// Детермінована генерація 3D-місцевості: той самий mapSeed завжди дає
// той самий рельєф, тому обом гравцям у кімнаті не потрібно передавати
// карту по мережі — досить синхронізувати лише число (seed).

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createTerrainSampler } from './terrain.js';
import { createRng } from './noise.js';
import {
  MAP_SIZE,
  MAP_SEGMENTS,
  HEIGHT_SCALE,
  OCEAN_THRESHOLD,
  BIOME_COLORS,
} from '../data/terrainDefinitions.js';

const TREE_SPACING = 6; // світових одиниць між кандидатами на дерево
const TREE_JITTER = 2.2;
const TREE_DENSITY = 0.55; // частка лісових клітинок, що справді отримують дерево
const TREE_SEED_OFFSET = 4242;

const tmpColor = new THREE.Color();

/**
 * Генерує групу Three.js-об'єктів: рельєф з кольором за біомом,
 * напівпрозору воду поверх океанських западин, і ліс з InstancedMesh.
 * Приймає опційний вже створений sampler, щоб не рахувати шум двічі,
 * коли той самий seed потрібен ще й для розстановки юнітів.
 */
export function generateMap(seed, sampler = createTerrainSampler(seed)) {
  const group = new THREE.Group();
  group.name = 'map';
  group.add(generateTerrainMesh(sampler));
  group.add(generateOceanMesh());
  group.add(generateForest(sampler, seed));

  return group;
}

function generateTerrainMesh(sampler) {
  const geometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, MAP_SEGMENTS, MAP_SEGMENTS);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i++) {
    // До обертання геометрії локальні (x, y) відповідають світовим (x, -z) —
    // саме так рахуємо тут, щоб рельєф і подальше розміщення лісу
    // використовували ідентичну систему координат (див. коментар нижче).
    const localX = position.getX(i);
    const localY = position.getY(i);
    const worldX = localX;
    const worldZ = -localY;

    const elevation = sampler.elevationAt(worldX, worldZ);
    position.setZ(i, elevation * HEIGHT_SCALE);

    const biome = sampler.biomeAt(worldX, worldZ);
    tmpColor.set(BIOME_COLORS[biome]);
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  // rotateX(-90°) переводить площину з XY у XZ (землю "вгору"): у three.js
  // це математично означає, що вихідний локальний Y стає світовим -Z,
  // а виставлене вище значення Z (висота) стає світовим Y (верх).
  // Саме тому вище worldZ = -localY — це те, чим localY стане ПІСЛЯ обертання.
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = 'terrainMesh';
  return mesh;
}

function generateOceanMesh() {
  const geometry = new THREE.PlaneGeometry(MAP_SIZE * 1.08, MAP_SIZE * 1.08);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshPhongMaterial({
    color: 0x1c5c78,
    transparent: true,
    opacity: 0.72,
    shininess: 90,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = OCEAN_THRESHOLD * HEIGHT_SCALE;
  mesh.name = 'oceanMesh';
  return mesh;
}

function generateForest(sampler, seed) {
  const treeRng = createRng(seed + TREE_SEED_OFFSET);
  const half = MAP_SIZE / 2;
  const positions = [];

  for (let x = -half; x < half; x += TREE_SPACING) {
    for (let z = -half; z < half; z += TREE_SPACING) {
      const worldX = x + (treeRng() - 0.5) * TREE_JITTER;
      const worldZ = z + (treeRng() - 0.5) * TREE_JITTER;

      if (sampler.biomeAt(worldX, worldZ) !== 'forest') continue;
      if (treeRng() > TREE_DENSITY) continue; // не кожна лісова клітинка — так виглядає природніше

      positions.push({
        x: worldX,
        z: worldZ,
        y: sampler.elevationAt(worldX, worldZ) * HEIGHT_SCALE,
      });
    }
  }

  const group = new THREE.Group();
  group.name = 'forest';
  if (!positions.length) return group;

  const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.22, 1.1, 6);
  const foliageGeometry = new THREE.ConeGeometry(0.9, 1.8, 6);
  const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5b4632, flatShading: true });
  const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x1f4a2c, flatShading: true });

  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, positions.length);
  const foliage = new THREE.InstancedMesh(foliageGeometry, foliageMaterial, positions.length);
  trunks.castShadow = true;
  foliage.castShadow = true;

  const dummy = new THREE.Object3D();
  positions.forEach((p, i) => {
    const scale = 0.8 + treeRng() * 0.5;
    const rotationY = treeRng() * Math.PI * 2;

    dummy.position.set(p.x, p.y + 0.55 * scale, p.z);
    dummy.scale.setScalar(scale);
    dummy.rotation.y = rotationY;
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, p.y + 1.5 * scale, p.z);
    dummy.updateMatrix();
    foliage.setMatrixAt(i, dummy.matrix);
  });
  trunks.instanceMatrix.needsUpdate = true;
  foliage.instanceMatrix.needsUpdate = true;

  group.add(trunks, foliage);
  return group;
}

/**
 * Генерує стабільний числовий seed для нової кімнати.
 */
export function generateMapSeed() {
  return Math.floor(Math.random() * 0x7fffffff);
}
