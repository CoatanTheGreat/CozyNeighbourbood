// Isometrische projectie en basisvormen. Eén tegel = 64 x 32 pixels.

import { shade } from '../game/util.js';

export const TW = 64;
export const TH = 32;

export const iso = (x, y, z = 0) => [((x - y) * TW) / 2, ((x + y) * TH) / 2 - z];

const fmt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
export const poly = (...points) => points.map(fmt).join(' ');

export const topPts = (x, y, w, d, z = 0) =>
  poly(iso(x, y, z), iso(x + w, y, z), iso(x + w, y + d, z), iso(x, y + d, z));

// Gevel aan de +y-kant (links-voor op het scherm)
export const leftPts = (x, y, w, d, z0, z1) =>
  poly(iso(x, y + d, z1), iso(x + w, y + d, z1), iso(x + w, y + d, z0), iso(x, y + d, z0));

// Gevel aan de +x-kant (rechts-voor op het scherm)
export const rightPts = (x, y, w, d, z0, z1) =>
  poly(iso(x + w, y + d, z1), iso(x + w, y, z1), iso(x + w, y, z0), iso(x + w, y + d, z0));

// Rechthoek op de linkergevel: u loopt langs x vanaf box.x
export const onLeft = (box, u, uw, z0, z1) => {
  const Y = box.y + box.d;
  return poly(iso(box.x + u, Y, z1), iso(box.x + u + uw, Y, z1), iso(box.x + u + uw, Y, z0), iso(box.x + u, Y, z0));
};

// Rechthoek op de rechtergevel: u loopt vanaf de voorhoek naar achteren
export const onRight = (box, u, uw, z0, z1) => {
  const X = box.x + box.w;
  const Yf = box.y + box.d;
  return poly(iso(X, Yf - u, z1), iso(X, Yf - u - uw, z1), iso(X, Yf - u - uw, z0), iso(X, Yf - u, z0));
};

// Tekst die plat op een gevel ligt
export const matLeft = (x, y, z) => {
  const [ex, ey] = iso(x, y, z);
  return `matrix(0.894,0.447,0,1,${ex.toFixed(1)},${ey.toFixed(1)})`;
};
export const matRight = (x, y, z) => {
  const [ex, ey] = iso(x, y, z);
  return `matrix(0.894,-0.447,0,1,${ex.toFixed(1)},${ey.toFixed(1)})`;
};

export function Prism({ box, z0 = 0, z1, color, top, left, right, line, sw = 0.7, opacity }) {
  const { x, y, w, d } = box;
  const L = left || color;
  const R = right || shade(color, -0.2);
  const T = top || shade(color, 0.12);
  const stroke = line || shade(L, -0.45);
  return (
    <g opacity={opacity}>
      <polygon points={leftPts(x, y, w, d, z0, z1)} fill={L} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={rightPts(x, y, w, d, z0, z1)} fill={R} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={topPts(x, y, w, d, z1)} fill={T} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    </g>
  );
}
