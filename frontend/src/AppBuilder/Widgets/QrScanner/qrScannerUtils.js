/**
 * Styles the box that wraps react-qr-reader.
 *
 * The library renders `width: 100%; padding-top: 100%`, so its rendered height
 * is always equal to its rendered width — the authored widget height has no
 * say in it. Constraining the wrapper's WIDTH by the available height is what
 * turns that square into min(width, height) and keeps it inside the widget box
 * on wide canvases.
 *
 * @param {number|string|undefined} height widget height in px, or a `<n>px` string
 */
export function qrScannerFrameStyle(height) {
  const pixels = typeof height === 'string' ? parseFloat(height) : height;
  const hasUsableHeight = Number.isFinite(pixels) && pixels > 0;

  return {
    width: hasUsableHeight ? `min(100%, ${pixels}px)` : '100%',
    margin: '0 auto',
  };
}
