// selection.js
// Клік по юніту на сцені -> знаходимо його через промінь від камери.
// Поки що це лише "огляд" (показ характеристик), без обмеження за власником —
// обмеження "можна клікати тільки по своїх" з'явиться разом із боєм (крок 7).

import * as THREE from "three";

/**
 * @param {object} params
 * @param {THREE.Camera} params.camera
 * @param {HTMLElement} params.domElement
 * @param {THREE.Object3D} params.targetsGroup - контейнер з юнітами (raycast шукає серед його дітей)
 * @param {(unit: THREE.Object3D | null) => void} params.onSelect
 * @returns {() => void} функція відписки
 */
export function setupSelection({ camera, domElement, targetsGroup, onSelect }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function handleClick(event) {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(targetsGroup.children, true);

    if (!intersects.length) {
      onSelect(null);
      return;
    }

    let obj = intersects[0].object;
    while (obj && !obj.userData.unitTypeId && obj.parent) {
      obj = obj.parent;
    }
    onSelect(obj && obj.userData.unitTypeId ? obj : null);
  }

  domElement.addEventListener('click', handleClick);
  return () => domElement.removeEventListener('click', handleClick);
}
