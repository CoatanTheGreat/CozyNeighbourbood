// Kleine hulpfuncties: getallen, kleuren en een vaste "toeval"-hash.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const round1 = (v) => Math.round(v * 10) / 10;
export const smooth = (t) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (r, g, b) =>
  '#' +
  [r, g, b]
    .map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0'))
    .join('');

export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const k = clamp(t, 0, 1);
  return toHex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k);
}

// Donkerder richting diep indigo (zachter dan zwart) of lichter richting wit
export function shade(hex, amt) {
  return amt < 0 ? mix(hex, '#211a3a', -amt) : mix(hex, '#ffffff', amt);
}

export function desaturate(hex, t) {
  const [r, g, b] = hexToRgb(hex);
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  return toHex(r + (l - r) * t, g + (l - g) * t, b + (l - b) * t);
}

// Vast getal tussen 0 en 1 op basis van een tekst
export function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
