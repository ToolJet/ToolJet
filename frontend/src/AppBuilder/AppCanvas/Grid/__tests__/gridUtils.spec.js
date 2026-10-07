import { showGridLines } from '../gridUtils';

describe('showGridLines', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('[Table-BUG-032] skips a real-canvas flagged data-row-scoped-readonly, so a non-first row-scoped container (e.g. a Table expanded row past the first) never shows the grid/drop-pattern overlay', () => {
    document.body.innerHTML = `
      <div class="real-canvas" id="canvas-editable"></div>
      <div class="real-canvas" data-row-scoped-readonly="true" id="canvas-readonly"></div>
    `;

    showGridLines();

    expect(document.getElementById('canvas-editable').classList.contains('show-grid')).toBe(true);
    expect(document.getElementById('canvas-readonly').classList.contains('show-grid')).toBe(false);
  });
});
