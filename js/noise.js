// noise.js
// Детермінований 2D Perlin-шум на власному seed, без зовнішніх залежностей.
// Один і той самий seed завжди дає ту саму карту — критично для мультиплеєра
// (обидва гравці рахують ідентичну карту локально за mapSeed з кімнати).

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  return mulberry32(seed);
}

function buildPermutation(seed) {
  const rand = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

const GRADIENTS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
];

function grad(hash, x, y) {
  const [gx, gy] = GRADIENTS[hash & 7];
  return gx * x + gy * y;
}

function perlin2(perm, x, y) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[X] + Y];
  const ba = perm[perm[X + 1] + Y];
  const ab = perm[perm[X] + Y + 1];
  const bb = perm[perm[X + 1] + Y + 1];

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
  return lerp(x1, x2, v); // приблизно в діапазоні -1..1
}

export function createNoise2D(seed) {
  const perm = buildPermutation(seed);
  return (x, y) => perlin2(perm, x, y);
}

/**
 * Fractal Brownian Motion — накладає кілька "шарів" шуму різної частоти,
 * щоб рельєф мав і великі плавні пагорби, і дрібні деталі одночасно.
 */
export function createFBM(noise2D, { octaves = 4, lacunarity = 2, persistence = 0.5 } = {}) {
  return (x, y) => {
    let amplitude = 1;
    let frequency = 1;
    let sum = 0;
    let maxAmplitude = 0;

    for (let o = 0; o < octaves; o++) {
      sum += noise2D(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return sum / maxAmplitude;
  };
}
