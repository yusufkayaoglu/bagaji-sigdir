export function insideTrunk({ x, y }) {
  return x >= 26 && x <= 74 && y >= 32 && y <= 51;
}
export function pointerPosition(event, bounds) {
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * 100,
    y: ((event.clientY - bounds.top) / bounds.height) * 100,
  };
}
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
