export function snapToGrid(x, y) {
    const snappedX = Math.round(x / 40) * 40
    const snappedY = Math.round(y / 40) * 40
    return [snappedX, snappedY]
  }
  