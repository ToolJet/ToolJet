import { screen } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'pdf1';

const widget = createWidgetHarness({
  componentType: 'PDF',
  handle: 'pdf1',
  id: ID,
  defaultProperties: {
    url: binding(''),
    scale: binding('{{true}}'),
    pageControls: binding('{{true}}'),
    showDownloadOption: binding('{{true}}'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    borderColor: binding('rgb(1, 2, 3)'),
    borderRadius: binding('{{6}}'),
  },
});

// PDF's own outer node carries display/boxShadow (data-cy = component name);
// its first child div carries the border. RenderWidget's wrapper is the
// separate `draggable-widget-<name>` node.
const outer = () => document.querySelector(`[data-cy="${ID}"]`);
const inner = () => document.querySelector(`[data-cy="${ID}"] > div`);

describe('PDF widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[PDF-RENDER-001] an empty url shows the "No PDF file specified" placeholder', async () => {
    // Break this catches: dropping the empty-url guard (PDF.jsx:202) so an unset
    // {{url}} binding mounts <Document file=""> instead of the placeholder, which
    // blanks the widget for every app that has not yet set a file.
    widget.render({ properties: { url: binding('') } });

    expect(await screen.findByText('No PDF file specified')).toBeInTheDocument();
  });

  test('[PDF-STYLE-001] the container is hidden (display:none) when visibility is false', async () => {
    // Break this catches: dropping the `visibility ? 'flex' : 'none'` mapping
    // (PDF.jsx:197) so a hidden PDF stays on screen in the running app.
    widget.render({ styles: { visibility: binding('{{false}}') } });

    await screen.findByText('No PDF file specified');
    expect(outer()).toHaveStyle({ display: 'none' });
  });

  test('[PDF-STYLE-002] boxShadow is applied to the outer container', async () => {
    // Break this catches: not forwarding the universal `boxShadow` style to the
    // outer node (PDF.jsx:16,197), so shadow styling silently no-ops on PDF.
    widget.render({ styles: { boxShadow: binding('0px 0px 5px red') } });

    await screen.findByText('No PDF file specified');
    expect(outer()).toHaveStyle({ boxShadow: '0px 0px 5px red' });
  });

  test('[PDF-STYLE-003] borderColor is applied to the inner container', async () => {
    // Break this catches: dropping `borderColor` from the inner border
    // (PDF.jsx:189), so the configured border colour never renders.
    widget.render({ styles: { borderColor: binding('rgb(1, 2, 3)') } });

    await screen.findByText('No PDF file specified');
    expect(inner()).toHaveStyle({ border: '1px solid rgb(1, 2, 3)' });
  });

  test('[PDF-STYLE-004] borderRadius is applied to the inner container', async () => {
    // Break this catches: dropping `borderRadius` from the inner container
    // (PDF.jsx:189), so the configured corner radius never renders.
    widget.render({ styles: { borderRadius: binding('{{8}}') } });

    await screen.findByText('No PDF file specified');
    expect(inner()).toHaveStyle({ borderRadius: '8px' });
  });
});
