export function snapToGrid(x, y) {
  const snappedX = Math.round(x / 30) * 30;
  const snappedY = Math.round(y / 10) * 10;
  return [snappedX, snappedY];
}
