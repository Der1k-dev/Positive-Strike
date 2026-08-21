// scene.js
// Базова 3D-сцена: рендерер + камера + вільна орбіта-камера + освітлення.
// Не знає нічого про карту чи юніти — лише "порожня студія", у яку
// інші модулі додають об'єкти через scene.add(...).

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const BACKGROUND_COLOR = 0x0a0e14; // збігається з --bg у css/main.css

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND_COLOR);
  scene.fog = new THREE.Fog(BACKGROUND_COLOR, 160, 340);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    1000
  );
  camera.position.set(0, 95, 115);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 25;
  controls.maxDistance = 230;
  controls.maxPolarAngle = Math.PI * 0.49; // не даємо камері пірнути під землю
  controls.target.set(0, 0, 0);
  controls.update();

  const hemiLight = new THREE.HemisphereLight(0x8fb2d9, 0x33291f, 0.9);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff2d9, 1.15);
  sunLight.position.set(80, 130, 40);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -120;
  sunLight.shadow.camera.right = 120;
  sunLight.shadow.camera.top = 120;
  sunLight.shadow.camera.bottom = -120;
  sunLight.shadow.camera.far = 320;
  scene.add(sunLight);

  function handleResize() {
    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', handleResize);

  let animationHandle = null;
  function startLoop(onFrame) {
    function tick() {
      animationHandle = requestAnimationFrame(tick);
      controls.update();
      if (onFrame) onFrame();
      renderer.render(scene, camera);
    }
    tick();
  }

  function dispose() {
    if (animationHandle) cancelAnimationFrame(animationHandle);
    window.removeEventListener('resize', handleResize);
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { scene, camera, renderer, controls, startLoop, dispose };
}
