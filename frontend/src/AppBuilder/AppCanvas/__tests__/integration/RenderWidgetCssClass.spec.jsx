import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Html',
  handle: 'html1',
  id: 'html1',
  defaultProperties: {
    rawHtml: binding('<p>CSS class target</p>'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: { cssClass: binding('  alpha\t beta   gamma  ') },
});

describe('RenderWidget CSS class', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Html-CSS-001] universal CSS classes are normalized and gated by the custom-styling license', async () => {
    // Break this catches: bypassing the license gate or whitespace normalization leaks saved classes or emits invalid class tokens.
    const { container } = widget.render({ afterSeed: () => widget.setLicenseFeatures({ customStyling: true }) });
    const innerWidget = container.querySelector('[data-cy="draggable-widget-html1"]');

    await waitFor(() => expect(innerWidget).toHaveClass('alpha', 'beta', 'gamma'));
    expect(innerWidget.className).toContain('alpha beta gamma');

    await widget.session.store.act(() => widget.setLicenseFeatures({ customStyling: false }));
    await waitFor(() => expect(innerWidget).not.toHaveClass('alpha', 'beta', 'gamma'));

    await widget.session.store.act(() => widget.setLicenseFeatures({ customStyling: true }));
    await waitFor(() => expect(innerWidget).toHaveClass('alpha', 'beta', 'gamma'));
  });
});
