import { addNewWidgetToTheEditor } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { useGridStore } from '@/_stores/gridStore';

describe('Table shadcn look preset', () => {
  let realCanvas;

  beforeEach(() => {
    realCanvas = document.createElement('div');
    realCanvas.id = 'real-canvas';
    document.body.appendChild(realCanvas);
    const dropTarget = document.createElement('div');
    document.body.appendChild(dropTarget);
    useGridStore.getState().actions.setGhostDragPosition({ e: { target: dropTarget } });
  });

  afterEach(() => {
    realCanvas.remove();
    useGridStore.getState().actions.setGhostDragPosition(null);
  });

  it('drops a native Table with the shadcn look when the palette entry carries the preset', () => {
    const table = addNewWidgetToTheEditor('Table', 'desktop', realCanvas, 'canvas', undefined, undefined, {
      tableLook: 'shadcn',
    });
    expect(table.component.component).toBe('Table');
    expect(table.component.definition.styles.tableLook.value).toBe('shadcn');
    // The rest of the Table's defaults are untouched.
    expect(table.component.definition.styles.tableType.value).toBe('table-classic');
  });

  it('keeps the ToolJet look for a plain Table drop', () => {
    const table = addNewWidgetToTheEditor('Table', 'desktop', realCanvas, 'canvas');
    expect(table.component.definition.styles.tableLook.value).toBe('default');
  });
});
