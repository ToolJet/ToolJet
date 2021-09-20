export function snapToGrid(x, y) {
  const snappedX = Math.round(x / 30) * 30;
  const snappedY = Math.round(y / 30) * 30;
  return [snappedX, snappedY];
}

export function resizeToGrid(x, y) {
  const snappedX = Math.round(x / 30) * 30;
  const snappedY = Math.round(y / 10) * 10;

  return {snappedX: snappedX, snappedY: snappedY}
}