export function snapToGrid(x, y) {
    const snappedX = Math.round(x / 16) * 16
    const snappedY = Math.round(y / 16) * 16
    return [snappedX, snappedY]
  }
  