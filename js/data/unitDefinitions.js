// unitDefinitions.js
// 4 групи юнітів із запиту: піхота / наземна техніка / повітряна техніка / флот.
// Значення статів для "tank" навмисно збігаються з референсним скріншотом
// (Health 450, Damage 400, Range 0.32, Speed 0.34, Cost 7800), решта підібрані
// за тією ж логікою відносно один одного. Баланс уточнюватиметься на кроці 6.

export const UNIT_CATEGORIES = {
  infantry: { id: 'infantry', label: 'Піхота' },
  ground: { id: 'ground', label: 'Наземна техніка' },
  air: { id: 'air', label: 'Повітряна техніка' },
  fleet: { id: 'fleet', label: 'Флот' },
};

export const UNIT_TYPES = {
  rifleman: {
    id: 'rifleman',
    category: 'infantry',
    label: 'Стрілецький загін',
    stats: { health: 120, damage: 18, range: 0.14, speed: 0.09, cost: 400 },
  },
  sniper: {
    id: 'sniper',
    category: 'infantry',
    label: 'Снайпер',
    stats: { health: 80, damage: 55, range: 0.32, speed: 0.08, cost: 900 },
  },
  tank: {
    id: 'tank',
    category: 'ground',
    label: 'Танк',
    stats: { health: 450, damage: 400, range: 0.32, speed: 0.34, cost: 7800 },
  },
  apc: {
    id: 'apc',
    category: 'ground',
    label: 'БТР',
    stats: { health: 260, damage: 120, range: 0.18, speed: 0.42, cost: 3200 },
  },
  fighter: {
    id: 'fighter',
    category: 'air',
    label: 'Винищувач',
    stats: { health: 150, damage: 90, range: 0.5, speed: 0.9, cost: 5200 },
  },
  bomber: {
    id: 'bomber',
    category: 'air',
    label: 'Бомбардувальник',
    stats: { health: 220, damage: 260, range: 0.45, speed: 0.55, cost: 8800 },
  },
  destroyer: {
    id: 'destroyer',
    category: 'fleet',
    label: 'Есмінець',
    stats: { health: 520, damage: 210, range: 0.4, speed: 0.3, cost: 9600 },
  },
  patrolBoat: {
    id: 'patrolBoat',
    category: 'fleet',
    label: 'Патрульний катер',
    stats: { health: 180, damage: 70, range: 0.22, speed: 0.5, cost: 2400 },
  },
};
