/**
 * CustomComponent has its own inspector panel that lists its accordions by hand. Its Visibility, Collapse
 * when hidden and Tooltip toggles live in Properties → Additional Actions, so the panel must draw that
 * section from the config. The real panel, accordion and controls render against the real store.
 */
import { CustomComponent } from '../CustomComponent';
import { createInspectorPanelHarness, renderedControls } from './inspectorPanelHarness';

const panel = createInspectorPanelHarness({ componentType: 'CustomComponent', Panel: CustomComponent });

describe('CustomComponent inspector', () => {
  beforeEach(() => panel.setup());

  test('draws an Additional Actions section with Visibility, Collapse when hidden and Tooltip', async () => {
    panel.render();

    const controls = await renderedControls('additional-actions');
    expect(controls).toEqual(['visibility', 'collapse-when-hidden', 'tooltip']);
  });
});
