export function snapToGrid(x, y) {
    const snappedX = Math.round(x / 8) * 8
    const snappedY = Math.round(y / 8) * 8
    return [snappedX, snappedY]
  }
  