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

  it('[LibraryComponent-IDENT-001] stamps libraryId/correlationId/libraryName/componentName from the drag payload', () => {
    // Break this catches: dropping (or renaming) any of the four
    // `componentData.definition.properties.<key> = { value: ... }` assignments in
    // `addNewWidgetToTheEditor`'s libraryComponentInfo branch — the new instance
    // would land with blank identity and render the unconfigured Slot forever.
    // Note: `revisionId` is deliberately NOT stamped — the effective revision
    // comes only from the library-level pin (globalSettings.customComponentLibraries),
    // never from a per-instance value (see useEffectiveLibraryRevision).
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
    expect(props.revisionId).toBeUndefined();
  });

  it('[LibraryComponent-DROP-001] applies manifest prop defaults and the manifest default size, falling back to 12 x 200', () => {
    // Break this catches: dropping the manifest-defaults loop or the defaultSize override —
    // the Inspector would open with empty fields, and every component would land at 12 x 200
    // regardless of the size its author declared.
    const baseInfo = {
      libraryId: 'lib-42',
      correlationId: '11111111-2222-3333-4444-555555555555',
      libraryName: 'My UI Library',
      componentName: 'StatusBadge',
    };

    const sized = addNewWidgetToTheEditor('LibraryComponent', 'desktop', realCanvas, 'canvas', undefined, {
      ...baseInfo,
      props: [
        { name: 'label', type: 'string', default: 'Hi' },
        { name: 'count', type: 'number', default: 3 },
        { name: 'isOpen', type: 'boolean', default: true },
        { name: 'isCompact', type: 'boolean' },
      ],
      defaultSize: { width: 6, height: 300 },
    });

    const props = sized.component.definition.properties;
    expect(props.label.value).toBe('Hi');
    expect(props.count.value).toBe('{{3}}');
    expect(props.isOpen.value).toBe('{{true}}');
    expect(props.isCompact.value).toBe('{{false}}');
    expect(sized.layouts.desktop).toMatchObject({ width: 6, height: 300 });

    const unsized = addNewWidgetToTheEditor('LibraryComponent', 'desktop', realCanvas, 'canvas', undefined, {
      ...baseInfo,
      props: [],
    });
    expect(unsized.layouts.desktop).toMatchObject({ width: 12, height: 200 });
  });
});
