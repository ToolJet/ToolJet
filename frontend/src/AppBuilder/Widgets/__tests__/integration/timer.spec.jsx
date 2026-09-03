/**
 * Behaviour spec for the real Timer widget (AppBuilder/Widgets/Timer.jsx),
 * rendered through the real RenderWidget against the real composed store.
 * Nothing about the widget is mocked. Shared setup lives in ./widgetHarness.js.
 *
 * Scope here is the `format` property (WidgetManager/widgets/timer.js): the
 * displayed value honours the configured time format, defaults to
 * hh:mm:ss:SSS, and an empty format falls back to that same default. The
 * millisecond-accurate tick loop and the Start/Pause/Reset events are owned by
 * the Cypress suite (see src/test/README.md "What NOT to unit test"); the pure
 * token replacement is proven in isolation by
 * ../utils.formatTimerValue.spec.js. What this spec adds is that the format
 * reaches the DOM through the real resolver, from a `{{ }}` binding travelling
 * the live dependency graph — the thing a mocked store cannot express.
 *
 * The widget sits at state `initial` on mount (no interval is started), so the
 * rendered counter is a stable projection of `properties.value` through
 * `properties.format` — exactly what these assertions read.
 */
import { screen } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const TIMER = 'timer';

const widget = createWidgetHarness({
  componentType: 'Timer',
  handle: 'timer1',
  id: TIMER,
  defaultProperties: {
    value: binding('01:02:03:456'),
    type: binding('countUp'),
    format: binding('hh:mm:ss:SSS'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  widgetHeight: 128,
  widgetWidth: 300,
});

describe('Timer widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('renders the default value using the full hh:mm:ss:SSS format', async () => {
    widget.render();

    expect(await screen.findByText('01:02:03:456')).toBeInTheDocument();
  });

  test('hides milliseconds when the format omits SSS', async () => {
    widget.render({ properties: { format: binding('hh:mm:ss') } });

    expect(await screen.findByText('01:02:03')).toBeInTheDocument();
    expect(screen.queryByText('01:02:03:456')).not.toBeInTheDocument();
  });

  test('renders only minutes and seconds with a mm:ss format', async () => {
    widget.render({ properties: { format: binding('mm:ss') } });

    expect(await screen.findByText('02:03')).toBeInTheDocument();
  });

  test('falls back to hh:mm:ss:SSS when the format is blank', async () => {
    widget.render({ properties: { format: binding('') } });

    expect(await screen.findByText('01:02:03:456')).toBeInTheDocument();
  });
});
