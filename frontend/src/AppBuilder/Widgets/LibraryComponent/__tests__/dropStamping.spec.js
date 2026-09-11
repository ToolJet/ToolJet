import { addNewWidgetToTheEditor } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { useGridStore } from '@/_stores/gridStore';

describe('LibraryComponent drop-time identity stamping', () => {
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

  it('[LibraryComponent-IDENT-001] stamps libraryId/correlationId/libraryName/componentName/revisionId from the drag payload', () => {
    // Break this catches: dropping (or renaming) any of the five
    // `componentData.definition.properties.<key> = { value: ... }` assignments in
    // `addNewWidgetToTheEditor`'s libraryComponentInfo branch — the new instance
    // would land with blank identity and render the unconfigured Slot forever.
    const libraryComponentInfo = {
      libraryId: 'lib-42',
      correlationId: '11111111-2222-3333-4444-555555555555',
      libraryName: 'My UI Library',
      componentName: 'StatusBadge',
      revisionId: 'v3',
      props: [],
    };

    const newComponent = addNewWidgetToTheEditor(
      'LibraryComponent',
      'desktop',
      realCanvas,
      'canvas',
      undefined,
      libraryComponentInfo
    );

    const props = newComponent.component.definition.properties;
    expect(props.libraryId.value).toBe('lib-42');
    expect(props.correlationId.value).toBe('11111111-2222-3333-4444-555555555555');
    expect(props.libraryName.value).toBe('My UI Library');
    expect(props.componentName.value).toBe('StatusBadge');
    expect(props.revisionId.value).toBe('v3');
  });
});
