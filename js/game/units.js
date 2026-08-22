// units.js
// Низько-полігональні 3D-моделі юнітів із простих примітивів — той самий
// лаконічний стиль, що й на референсних скріншотах (кольорові грані, без текстур).

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const TEAM_COLORS = { blue: 0x2f6fed, red: 0xd6473f };

function buildTank(material) {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.2), material);
  hull.position.y = 0.45;
  const turret = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 1.4), material);
  turret.position.set(0, 0.95, -0.1);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 6), material);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.95, -1.1);
  group.add(hull, turret, barrel);
  return group;
}

function buildApc(material) {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 3.4), material);
  hull.position.y = 0.5;
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.9), material);
  hatch.position.set(0, 1.05, 0.2);
  group.add(hull, hatch);
  return group;
}

function buildFigure() {
  const figure = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 4, 6));
  body.position.y = 0.55;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6));
  head.position.y = 1.0;
  figure.add(body, head);
  return figure;
}

function buildRifleman(material) {
  // "Загін", а не одна фігура — бо піхота в запиті це саме групи.
  const group = new THREE.Group();
  const offsets = [
    [-0.4, 0],
    [0.4, 0.15],
    [0, -0.4],
  ];
  for (const [dx, dz] of offsets) {
    const figure = buildFigure();
    figure.traverse((o) => { if (o.isMesh) o.material = material; });
    figure.position.set(dx, 0, dz);
    group.add(figure);
  }
  return group;
}

function buildSniper(material) {
  const group = new THREE.Group();
  const figure = buildFigure();
  figure.traverse((o) => { if (o.isMesh) o.material = material; });
  group.add(figure);
  const rifle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5), material);
  rifle.rotation.z = Math.PI / 2.4;
  rifle.position.set(0.35, 0.7, 0);
  group.add(rifle);
  return group;
}

function buildFighter(material) {
  const group = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 6), material);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.y = 1.4;
  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.6), material);
  wings.position.y = 1.4;
  group.add(fuselage, wings);
  return group;
}

function buildBomber(material) {
  const group = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3.2, 8), material);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.y = 1.6;
  const wings = new THREE.Mesh(new THREE.BoxGeometry(4, 0.16, 0.9), material);
  wings.position.y = 1.5;
  group.add(fuselage, wings);
  return group;
}

function buildDestroyer(material) {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 6), material);
  hull.position.y = 0.4;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 2.2), material);
  deck.position.set(0, 0.95, 0.5);
  group.add(hull, deck);
  return group;
}

function buildPatrolBoat(material) {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 3), material);
  hull.position.y = 0.3;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.9), material);
  cabin.position.set(0, 0.75, 0.3);
  group.add(hull, cabin);
  return group;
}

const BUILDERS = {
  tank: buildTank,
  apc: buildApc,
  rifleman: buildRifleman,
  sniper: buildSniper,
  fighter: buildFighter,
  bomber: buildBomber,
  destroyer: buildDestroyer,
  patrolBoat: buildPatrolBoat,
};

/**
 * Створює 3D-меш юніта заданого підтипу, пофарбований у колір команди.
 */
export function createUnitMesh(unitTypeId, team) {
  const material = new THREE.MeshLambertMaterial({
    color: TEAM_COLORS[team] || TEAM_COLORS.blue,
    flatShading: true,
  });

  const builder = BUILDERS[unitTypeId] || buildTank;
  const group = builder(material);
  group.name = `unit-${unitTypeId}`;
  group.userData.unitTypeId = unitTypeId;
  group.userData.team = team;

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}

/**
 * Кільце виділення під обраним юнітом.
 */
export function createSelectionRing() {
  const geometry = new THREE.RingGeometry(1.3, 1.55, 24);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.name = 'selectionRing';
  ring.renderOrder = 10;
  return ring;
}
