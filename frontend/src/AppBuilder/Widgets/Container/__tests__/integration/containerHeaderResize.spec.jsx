/**
 * Container header slot stays drag-resizable after `HorizontalSlot` gained `isResizable` (default true)
 * for the ListView header (Listview-HDR-008). The ListView side is asserted in
 * `Widgets/Listview/__tests__/integration/Listview.spec.jsx`.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'c1c1c1c1-0000-4000-8000-0000000000aa';

const widget = createWidgetHarness({
  componentType: 'Container',
  handle: 'container1',
  id: ID,
  defaultProperties: {
    showHeader: binding('{{true}}'),
    headerHeight: binding('{{80}}'),
    visibility: binding('{{true}}'),
  },
  capabilities: { dnd: true },
  widgetHeight: 300,
  widgetWidth: 400,
});

describe('Container header resize', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-HDR-008] a Container header keeps its resize handle in the builder, so it is still drag-resizable', async () => {
    // Break this catches: `HorizontalSlot` defaulting `isResizable` to false (or Container passing
    // false), which silently removes header resizing from every Container, Form and Accordion.
    widget.render({ currentMode: 'edit' });
    await waitFor(() => expect(document.getElementById(ID)).toBeInTheDocument());

    expect(document.querySelector('.jet-container-header .resize-handle')).toBeInTheDocument();
  });

  test('[Listview-HDR-008] a Container header has no resize handle in view mode', async () => {
    // Break this catches: the handle rendered outside the builder.
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(document.getElementById(ID)).toBeInTheDocument());

    expect(document.querySelector('.jet-container-header')).toBeInTheDocument();
    expect(document.querySelector('.resize-handle')).toBeNull();
  });
});
