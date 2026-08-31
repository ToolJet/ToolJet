/** @jest-environment node */
import { qrScannerFrameStyle } from '../qrScannerUtils';

// react-qr-reader sizes itself with `width: 100%; padding-top: 100%`, so its
// rendered height always equals its rendered WIDTH. QrScanner never applied the
// widget's height at all, which meant the scanner was square-by-width and spilled
// out of the widget box on any canvas wider than the authored height — worse in
// preview (no sidebars) and worse again on large monitors. Capping the frame's
// width by the available height makes the square min(width, height) instead.
describe('qrScannerFrameStyle', () => {
  it('caps the frame width by the widget height so the square cannot overflow', () => {
    expect(qrScannerFrameStyle(300)).toEqual({ width: 'min(100%, 300px)', margin: '0 auto' });
  });

  it('never falls back to a bare full width when a height is known', () => {
    // The regression: an unconstrained 100% makes the square track the canvas.
    expect(qrScannerFrameStyle(420).width).not.toBe('100%');
  });

  it('fills the available width when no usable height is given', () => {
    expect(qrScannerFrameStyle(undefined)).toEqual({ width: '100%', margin: '0 auto' });
    expect(qrScannerFrameStyle(null)).toEqual({ width: '100%', margin: '0 auto' });
    expect(qrScannerFrameStyle(0)).toEqual({ width: '100%', margin: '0 auto' });
    expect(qrScannerFrameStyle(-10)).toEqual({ width: '100%', margin: '0 auto' });
  });

  it('accepts a pixel string height, which is how widget styles are often passed', () => {
    expect(qrScannerFrameStyle('300px')).toEqual({ width: 'min(100%, 300px)', margin: '0 auto' });
  });
});
