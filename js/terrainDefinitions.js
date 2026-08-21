// terrainDefinitions.js
// Єдине джерело правди для порогів рельєфу — використовується і для
// зафарбовування меша карти, і для розстановки лісу, і пізніше (крок 5+)
// для перевірки прохідності клітинок юнітами (вода/суходіл/гори).

export const MAP_SIZE = 200; // світові одиниці (сторона квадратної карти)
export const MAP_SEGMENTS = 96; // роздільність сітки рельєфу
export const HEIGHT_SCALE = 16; // множник висоти над/під рівнем моря

// Пороги в "нормалізованих" одиницях fBm-шуму (приблизно -1..1).
export const OCEAN_THRESHOLD = -0.12;
export const SHORE_THRESHOLD = -0.02;
export const MOUNTAIN_THRESHOLD = 0.32;
export const FOREST_VEGETATION_THRESHOLD = 0.12;

export const BIOME_COLORS = {
  ocean: 0x16323d, // морське дно під водою (сама вода — окрема напівпрозора площина)
  shore: 0xc9b27c,
  plains: 0x4f8a52,
  forest: 0x2c5c38,
  mountain: 0x746a5c,
};

export const BIOME_LABELS = {
  ocean: 'Океан',
  shore: 'Узбережжя',
  plains: 'Рівнина',
  forest: 'Ліс',
  mountain: 'Гори',
};

export const BIOME_LEGEND_ORDER = ['ocean', 'shore', 'plains', 'forest', 'mountain'];
