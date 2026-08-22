// gameLoop.js
// ЕТАП 5: карта + розставлені армії обох команд + клік-вибір юніта
// з показом характеристик. Рух і бій — наступні кроки.

import * as THREE from "three";
import { createScene } from './scene.js';
import { generateMap } from './mapGenerator.js';
import { createTerrainSampler } from './terrain.js';
import { spawnArmy } from './armySpawner.js';
import { createSelectionRing } from './units.js';
import { setupSelection } from './selection.js';
import { UNIT_TYPES } from '../data/unitDefinitions.js';

/**
 * @param {HTMLElement} container
 * @param {number} seed
 * @param {object} [options]
 * @param {(info: {unitTypeId:string, team:string, label:string, stats:object} | null) => void} [options.onSelectUnit]
 * @param {'blue'|'red'} [options.cameraSide] - з чийого боку стартує камера
 */
export function initGame(container, seed, options = {}) {
  const { onSelectUnit, cameraSide = 'blue' } = options;

  const { scene, camera, renderer, startLoop, dispose: disposeScene } = createScene(container, { cameraSide });

  const sampler = createTerrainSampler(seed);
  scene.add(generateMap(seed, sampler));

  const unitsGroup = new THREE.Group();
  unitsGroup.name = 'units';
  unitsGroup.add(spawnArmy(sampler, seed, 'blue'));
  unitsGroup.add(spawnArmy(sampler, seed, 'red'));
  scene.add(unitsGroup);

  const selectionRing = createSelectionRing();
  selectionRing.visible = false;
  scene.add(selectionRing);

  function handleSelect(unit) {
    if (unit) {
      selectionRing.visible = true;
      selectionRing.position.set(unit.position.x, unit.position.y + 0.06, unit.position.z);
    } else {
      selectionRing.visible = false;
    }

    if (!onSelectUnit) return;

    if (!unit) {
      onSelectUnit(null);
      return;
    }

    const def = UNIT_TYPES[unit.userData.unitTypeId];
    onSelectUnit({
      unitTypeId: unit.userData.unitTypeId,
      team: unit.userData.team,
      label: def.label,
      stats: def.stats,
    });
  }

  const disposeSelection = setupSelection({
    camera,
    domElement: renderer.domElement,
    targetsGroup: unitsGroup,
    onSelect: handleSelect,
  });

  startLoop();

  function dispose() {
    disposeSelection();
    disposeScene();
  }

  return { dispose };
}
