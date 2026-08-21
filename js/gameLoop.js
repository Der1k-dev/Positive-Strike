// gameLoop.js
// ЕТАП 4: 3D-сцена з процедурною картою (рельєф, океан, ліс) і вільною
// орбіта-камерою. Юніти, будівлі, економіка й бій — на наступних кроках.

import { createScene } from './scene.js';
import { generateMap } from './mapGenerator.js';

/**
 * Ініціалізує 3D-сцену з картою в переданому контейнері.
 * Повертає { dispose }, щоб можна було коректно прибрати сцену
 * перед повторною ініціалізацією (напр. кнопка "Нова випадкова карта").
 */
export function initGame(container, seed) {
  const { scene, startLoop, dispose } = createScene(container);

  const map = generateMap(seed);
  scene.add(map);

  startLoop();

  return { dispose };
}
