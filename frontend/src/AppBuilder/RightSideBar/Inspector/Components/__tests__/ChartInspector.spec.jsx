/**
 * Chart has its own inspector panel that lists its accordions by hand. Visibility, Collapse when
 * hidden, Disable, Loading and Tooltip live in Properties → Additional Actions, so the panel must
 * draw that section from the config — and Loading must no longer be drawn in the Options section.
 * The real panel, accordion and controls render against the real store.
 */
import { Chart } from '../Chart';
import { createInspectorPanelHarness, renderedControls } from './inspectorPanelHarness';

const panel = createInspectorPanelHarness({ componentType: 'Chart', Panel: Chart });

describe('Chart inspector', () => {
  beforeEach(() => panel.setup());

  test('draws an Additional Actions section with every state toggle and the tooltip', async () => {
    panel.render();

    const controls = await renderedControls('additional-actions');
    expect(controls).toEqual(['loading-state', 'visibility', 'collapse-when-hidden', 'disable', 'tooltip']);
  });

  test('no longer draws Loading in the Options section', async () => {
    panel.render();

    const options = await renderedControls('options');
    expect(options).not.toContain('loading-state');
  });
});
