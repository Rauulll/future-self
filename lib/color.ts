// Interpolates between the "near" and "deep" dusk tones based on how far
// out a letter's timeline reaches. Used only for the time-depth marker.
const NEAR = [124, 137, 168]; // #7C89A8
const DEEP = [28, 26, 56]; // #1C1A38

export function depthColor(depth: number): string {
  const t = Math.min(1, Math.max(0, depth));
  const rgb = NEAR.map((n, i) => Math.round(n + (DEEP[i] - n) * t));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
