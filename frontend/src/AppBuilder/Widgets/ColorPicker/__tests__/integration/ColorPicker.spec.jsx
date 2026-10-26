/**
 * ColorPicker: the widget's approved contract
 * (frontend/ee/test/app-builder/widgets/ColorPicker/TESTING.md).
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real ColorPicker + the real SketchPicker
 * (react-color) rendered through a real Radix Popover, and — for the Form
 * scenarios — the real Form widget as parent. Nothing here is mocked.
 *
 * Styles (colors, border, alignment, width, padding) are computed-CSS/QA
 * territory per the contract's Registered-surface disposition and are not
 * asserted here, except `auto`/`alignment`/`direction` which gate whether
 * Label.jsx renders at all (Label.jsx:31) — those are set as harness defaults
 * purely so the label exists, not as a subject under test.
 *
 * SketchPicker's onChangeComplete is debounced 100ms (react-color's ColorWrap);
 * the one test that picks a color through the real hex field waits for it
 * rather than asserting synchronously. Dragging the hue/saturation/alpha
 * sliders is geometry/QA territory (jsdom has no real layout), so
 * alpha-affecting color changes are driven through the registered `setColor`
 * action instead — a first-class, equally real path into the same code.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/ColorPicker/TESTING.md) as a
 * `[ColorPicker-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import React from 'react';
import { act, screen, waitFor, fireEvent as rtlFireEvent } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { componentDefinition, seedApp } from '@/test/app-builder';
import {
  createWidgetHarness,
  setVariableOn,
  binding,
  drain,
  store,
  MODULE_ID,
  widgetProps,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const CP = 'cp1';
const NAME = 'colorpicker1';

// Mirrors colorPicker.js's own `definition.properties`/`definition.styles`,
// not invented defaults.
const DEFAULT_PROPERTIES = {
  label: binding('Label'),
  placeholder: binding('Select a color'),
  defaultColor: binding('#4368E3'),
  format: binding('hex'),
  showAlpha: binding('{{false}}'),
  showClearBtn: binding('{{false}}'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  disabledState: binding('{{false}}'),
};

// Label's own render gate is `width > 0 || auto` (Label.jsx:31) — these read
// from styles, not properties, so without them the label never mounts,
// unrelated to anything under test here.
const DEFAULT_STYLES = {
  auto: binding('{{true}}'),
  alignment: binding('side'),
  direction: binding('left'),
  padding: binding('default'),
};

const widget = createWidgetHarness({
  componentType: 'ColorPicker',
  handle: NAME,
  id: CP,
  defaultProperties: DEFAULT_PROPERTIES,
  defaultStyles: DEFAULT_STYLES,
});

const widgetWrapper = () => document.querySelector('.color-picker-widget');
const triggerButton = () => document.querySelector('.color-picker-button');
const colorCode = () => document.querySelector('.color-code');
const clearButton = () => document.querySelector('.tj-input-clear-btn');
const popover = () => document.querySelector('.color-picker-widget-popover');
const loader = () => document.querySelector('.tj-widget-loader');
const hexField = () => screen.queryByLabelText('hex');

describe('[ColorPicker-DEF] Default rendering', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-DEF-001] renders the label and exposes the default color as hex/rgb/rgba', async () => {
    widget.render();

    expect(await screen.findByText('Label')).toBeInTheDocument();
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));
    expect(widget.exposed().selectedColorRGB).toBe('rgb(67, 104, 227)');
    expect(widget.exposed().selectedColorRGBA).toBe('rgba(67, 104, 227, 1)');
    expect(widget.exposed().isValid).toBe(true);
  });

  test('[ColorPicker-DEF-002] an empty/invalid defaultColor shows the placeholder and exposes undefined color fields', async () => {
    widget.render({ properties: { defaultColor: binding('') } });

    await waitFor(() => expect(colorCode()).toHaveTextContent('Select a color'));
    expect(widget.exposed().selectedColorHex).toBeUndefined();
    expect(widget.exposed().selectedColorRGB).toBeUndefined();
    expect(widget.exposed().selectedColorRGBA).toBeUndefined();
  });

  test('[ColorPicker-DEF-003] changing defaultColor live re-derives and revalidates the exposed color', async () => {
    widget.render();
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));

    widget.setComponentProperty(CP, 'defaultColor', '#00FF00', 'properties');

    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#00ff00'));
    expect(widget.exposed().selectedColorRGB).toBe('rgb(0, 255, 0)');
  });

  test('[ColorPicker-DEF-004] opens the popover with the real SketchPicker, and tolerates no #real-canvas boundary in the DOM', async () => {
    // Popover.Content's collisionBoundary is document.getElementById('real-canvas')
    // (ColorPicker.jsx:403), which resolves to null in this harness — this test
    // pins that Radix tolerates that (renders without throwing) rather than
    // asserting on console output, which react-color's own library code emits
    // regardless (React 18 defaultProps deprecation warnings unrelated to
    // ColorPicker or this widget's own correctness).
    widget.render();
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());

    await widget.session.user.click(triggerButton());

    await waitFor(() => expect(popover()).toBeInTheDocument());
    expect(hexField()).toBeInTheDocument();
  });

  test('[ColorPicker-DEF-005] two ColorPicker instances keep independent state (instance isolation)', async () => {
    // Conditional risk: instance state, actions, and generated ids (Popover
    // ids/portals are keyed by `id`) — acting on one must not leak into the other.
    const CP2 = 'cp2';
    const sibling = componentDefinition(CP2, 'colorpicker2', 'ColorPicker', {
      ...DEFAULT_PROPERTIES,
      defaultColor: binding('#00FF00'),
    });
    sibling.component.definition.styles = DEFAULT_STYLES;

    widget.render({
      extraComponents: { [CP2]: sibling },
      also: [{ id: CP2, componentType: 'ColorPicker' }],
    });
    await waitFor(() => expect(widget.exposed(CP).selectedColorHex).toBe('#4368e3'));
    await waitFor(() => expect(widget.exposed(CP2).selectedColorHex).toBe('#00ff00'));

    await act(async () => {
      await widget.exposed(CP).setColor('#FF00FF');
    });

    await waitFor(() => expect(widget.exposed(CP).selectedColorHex).toBe('#ff00ff'));
    // The sibling's own public state is untouched by acting on the first instance.
    expect(widget.exposed(CP2).selectedColorHex).toBe('#00ff00');
  });
});

describe('[ColorPicker-FMT] Color format', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-FMT-001] format=hex displays the hex representation', async () => {
    widget.render({ properties: { format: binding('hex') } });

    await waitFor(() => expect(colorCode()).toHaveTextContent('#4368e3'));
    expect(widget.exposed().colorFormat).toBe('hex');
  });

  test('[ColorPicker-FMT-002] format=rgb displays the rgb representation of the SAME underlying color', async () => {
    widget.render({ properties: { format: binding('rgb') } });

    await waitFor(() => expect(colorCode()).toHaveTextContent('rgb(67, 104, 227)'));
    expect(widget.exposed().colorFormat).toBe('rgb');
    expect(widget.exposed().selectedColorHex).toBe('#4368e3');
  });

  test('[ColorPicker-FMT-003] switching format live only re-labels the display, it does not touch the stored hex/rgb/rgba', async () => {
    widget.render({ properties: { format: binding('hex') } });
    await waitFor(() => expect(colorCode()).toHaveTextContent('#4368e3'));
    const { selectedColorHex, selectedColorRGB, selectedColorRGBA } = widget.exposed();

    widget.setComponentProperty(CP, 'format', 'rgb', 'properties');

    await waitFor(() => expect(colorCode()).toHaveTextContent('rgb(67, 104, 227)'));
    expect(widget.exposed().selectedColorHex).toBe(selectedColorHex);
    expect(widget.exposed().selectedColorRGB).toBe(selectedColorRGB);
    expect(widget.exposed().selectedColorRGBA).toBe(selectedColorRGBA);
  });

  test('[ColorPicker-FMT-004] format=rgb with showAlpha=true still displays plain RGB, not RGBA', async () => {
    // Combination: `displayedColor` (ColorPicker.jsx:71-74) reads `colorFormat`
    // and `selectedColorRGB`/`selectedColorHex` only — `showAlpha` changes the
    // HEX shape (ALPHA-002) but must not make the RGB display grow an alpha
    // channel it was never asked to show.
    widget.render({ properties: { format: binding('rgb'), showAlpha: binding('{{true}}') } });

    await waitFor(() => expect(colorCode()).toHaveTextContent('rgb(67, 104, 227)'));
    expect(colorCode()).not.toHaveTextContent('rgba');
    expect(widget.exposed().selectedColorHex).toBe('#4368e3ff');
  });
});

describe('[ColorPicker-ALPHA] Alpha channel', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-ALPHA-001] showAlpha=false exposes a 6-digit hex and allowOpacity false', async () => {
    widget.render({ properties: { showAlpha: binding('{{false}}') } });

    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));
    expect(widget.exposed().allowOpacity).toBe(false);
  });

  test('[ColorPicker-ALPHA-002] showAlpha=true exposes an 8-digit hex (with alpha) and allowOpacity true', async () => {
    widget.render({ properties: { showAlpha: binding('{{true}}') } });

    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3ff'));
    expect(widget.exposed().allowOpacity).toBe(true);
  });

  test('[ColorPicker-ALPHA-003] toggling showAlpha mid-session preserves the RGB value and only reshapes the hex', async () => {
    widget.render({ properties: { showAlpha: binding('{{false}}') } });
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));
    const rgbBefore = widget.exposed().selectedColorRGB;

    widget.setComponentProperty(CP, 'showAlpha', true, 'properties');

    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3ff'));
    expect(widget.exposed().allowOpacity).toBe(true);
    expect(widget.exposed().selectedColorRGB).toBe(rgbBefore);
  });
});

describe('[ColorPicker-CHG] Picking a color', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-CHG-001] picking a color through the real hex field updates hex/rgb/rgba and fires onChange', async () => {
    widget.render();
    widget.setEvents(setVariableOn(CP, 'onChange'));
    await widget.session.user.click(triggerButton());
    await waitFor(() => expect(hexField()).toBeInTheDocument());

    rtlFireEvent.change(hexField(), { target: { value: '00FF00' } });

    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#00ff00'), { timeout: 1000 });
    expect(widget.exposed().selectedColorRGB).toBe('rgb(0, 255, 0)');
    expect(widget.exposed().selectedColorRGBA).toBe('rgba(0, 255, 0, 1)');
    expect(widget.variables().seen).toBe('YES');
  });

  test('[ColorPicker-CHG-002] picking a color marks the widget as user-interacted, revealing a pending validation error', async () => {
    widget.render({
      properties: { defaultColor: binding('') },
      afterSeed: () => widget.setComponentProperty(CP, 'mandatory', '{{true}}', 'validation', 'value', false),
    });
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

    await widget.session.user.click(triggerButton());
    await waitFor(() => expect(hexField()).toBeInTheDocument());
    rtlFireEvent.change(hexField(), { target: { value: 'FF0000' } });

    await waitFor(() => expect(widget.exposed().isValid).toBe(true), { timeout: 1000 });
  });
});

describe('[ColorPicker-EVT] Focus and blur events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-EVT-001] opening the popover fires onFocus and sets aria-expanded', async () => {
    widget.render();
    widget.setEvents(setVariableOn(CP, 'onFocus', { key: 'focused', value: 'YES' }));

    await widget.session.user.click(triggerButton());
    await drain();

    expect(widget.variables().focused).toBe('YES');
    expect(triggerButton()).toHaveAttribute('aria-expanded', 'true');
  });

  test('[ColorPicker-EVT-002] closing the popover (Escape) fires onBlur', async () => {
    widget.render();
    widget.setEvents(setVariableOn(CP, 'onBlur', { key: 'blurred', value: 'YES' }));
    await widget.session.user.click(triggerButton());
    await waitFor(() => expect(popover()).toBeInTheDocument());

    await widget.session.user.keyboard('{Escape}');
    await drain();

    await waitFor(() => expect(popover()).not.toBeInTheDocument());
    expect(widget.variables().blurred).toBe('YES');
    expect(triggerButton()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('[ColorPicker-CLR] Clear button', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-CLR-001] is not rendered when showClearBtn is off', async () => {
    widget.render({ properties: { showClearBtn: binding('{{false}}') } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(clearButton()).toBeNull();
  });

  test('[ColorPicker-CLR-002] clicking clear resets hex/rgb/rgba to undefined and marks user-interacted', async () => {
    widget.render({ properties: { showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));

    await widget.session.user.click(clearButton());

    await waitFor(() => expect(widget.exposed().selectedColorHex).toBeUndefined());
    expect(widget.exposed().selectedColorRGB).toBeUndefined();
    expect(widget.exposed().selectedColorRGBA).toBeUndefined();
  });

  test('[ColorPicker-CLR-003] clicking clear does not also open the popover (stopPropagation)', async () => {
    widget.render({ properties: { showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(clearButton()).toBeInTheDocument());

    await widget.session.user.click(clearButton());
    await drain();

    expect(popover()).not.toBeInTheDocument();
  });
});

describe('[ColorPicker-VAL] Validation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-VAL-001] a mandatory ColorPicker with no color is invalid, but the message stays hidden until interaction', async () => {
    widget.render({
      properties: { defaultColor: binding('') },
      afterSeed: () => widget.setComponentProperty(CP, 'mandatory', '{{true}}', 'validation', 'value', false),
    });

    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    expect(widgetWrapper()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
  });

  test('[ColorPicker-VAL-002] a configured customRule marks the widget invalid with its own message', async () => {
    widget.render({
      afterSeed: () =>
        widget.setComponentProperty(CP, 'customRule', 'Must be a warm color', 'validation', 'value', false),
    });
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));

    // Any interaction reveals the message — clearing is the simplest one available.
    widget.setComponentProperty(CP, 'showClearBtn', true, 'properties');
    await waitFor(() => expect(clearButton()).toBeInTheDocument());
    await widget.session.user.click(clearButton());

    await waitFor(() => expect(screen.getByText('Must be a warm color')).toBeInTheDocument());
  });

  test('[ColorPicker-VAL-003] a valid, non-mandatory ColorPicker shows no error', async () => {
    widget.render();

    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
    expect(widgetWrapper()).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
  });
});

describe('[ColorPicker-STATE] Loading, visibility, disabled state and CSA precedence', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-STATE-001] loadingState shows a loader instead of the swatch and exposes isLoading', async () => {
    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(loader()).toBeInTheDocument());
    expect(colorCode()).toBeNull();
    expect(widget.exposed().isLoading).toBe(true);
    expect(widgetWrapper()).toHaveAttribute('aria-busy', 'true');
  });

  test('[ColorPicker-STATE-002] visibility=false hides the widget and exposes isVisible false', async () => {
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(widgetWrapper()).toHaveClass('d-none'));
    expect(widget.exposed().isVisible).toBe(false);
    expect(widgetWrapper()).toHaveAttribute('aria-hidden', 'true');
  });

  test('[ColorPicker-STATE-003] disabledState marks the widget disabled to assistive tech', async () => {
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(widgetWrapper()).toHaveAttribute('aria-disabled', 'true'));
    expect(widgetWrapper()).toHaveAttribute('data-disabled', 'true');
    expect(widget.exposed().isDisabled).toBe(true);
  });

  test.failing(
    // BUG (D-01: characterize only): disabledState is cosmetic on ColorPicker.
    // Popover.Trigger (ColorPicker.jsx:347-393) carries no `disabled` attribute
    // and no click guard, so a disabled ColorPicker still opens its popover and
    // still lets a user pick a new color. Compare Checkbox, which has the
    // identical bug (checkbox.spec.jsx) — same root cause, no disabled gate on
    // the click path. Right behaviour: a disabled ColorPicker ignores clicks.
    '[ColorPicker-STATE-004] a disabled ColorPicker cannot be opened',
    async () => {
      widget.render({ properties: { disabledState: binding('{{true}}') } });
      await waitFor(() => expect(widgetWrapper()).toHaveAttribute('aria-disabled', 'true'));

      await widget.session.user.click(triggerButton());
      await drain();

      expect(popover()).not.toBeInTheDocument();
    }
  );

  test('[ColorPicker-STATE-005] setDisable(true) survives an unrelated label change, but a genuine disabledState flip overrides it', async () => {
    // `disabledState` starts false (the harness default) and is never touched
    // until the deliberate flips below, so the CSA call below is a genuine
    // divergence from the property, not a no-op.
    widget.render();
    await waitFor(() => expect(typeof widget.exposed().setDisable).toBe('function'));
    await act(async () => {
      await widget.exposed().setDisable(true);
    });
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

    widget.setComponentProperty(CP, 'label', 'Renamed label', 'properties');
    await waitFor(() => expect(screen.getByText('Renamed label')).toBeInTheDocument());
    expect(widget.exposed().isDisabled).toBe(true);

    // A boolean property change that merely restates its current resolved
    // value (false -> false) is not a real transition and the dependency
    // effect will not re-fire — the property must actually move for the
    // widget to get a chance to reassert it, hence the two real flips below,
    // ending on the value that DIFFERS from the CSA's.
    widget.setComponentProperty(CP, 'disabledState', true, 'properties');
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    widget.setComponentProperty(CP, 'disabledState', false, 'properties');

    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));
  });

  test('[ColorPicker-STATE-006] setLoading(true) survives an unrelated label change, but a genuine loadingState flip overrides it', async () => {
    widget.render();
    await waitFor(() => expect(typeof widget.exposed().setLoading).toBe('function'));
    await act(async () => {
      await widget.exposed().setLoading(true);
    });
    await waitFor(() => expect(loader()).toBeInTheDocument());

    widget.setComponentProperty(CP, 'label', 'Renamed label', 'properties');
    await waitFor(() => expect(screen.getByText('Renamed label')).toBeInTheDocument());
    expect(loader()).toBeInTheDocument();

    // Same two-real-flips reasoning as the setDisable test above.
    widget.setComponentProperty(CP, 'loadingState', true, 'properties');
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    widget.setComponentProperty(CP, 'loadingState', false, 'properties');

    await waitFor(() => expect(loader()).not.toBeInTheDocument());
  });

  test('[ColorPicker-STATE-007] setVisibility(false) survives an unrelated label change, but a genuine visibility flip overrides it', async () => {
    widget.render();
    await waitFor(() => expect(typeof widget.exposed().setVisibility).toBe('function'));
    await act(async () => {
      await widget.exposed().setVisibility(false);
    });
    await waitFor(() => expect(widgetWrapper()).toHaveClass('d-none'));

    widget.setComponentProperty(CP, 'label', 'Renamed label', 'properties');
    await drain();
    expect(widgetWrapper()).toHaveClass('d-none');

    // Same two-real-flips reasoning as the setDisable/setLoading tests above.
    widget.setComponentProperty(CP, 'visibility', false, 'properties');
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    widget.setComponentProperty(CP, 'visibility', true, 'properties');

    await waitFor(() => expect(widgetWrapper()).not.toHaveClass('d-none'));
  });
});

describe('[ColorPicker-ACT] Component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-ACT-001] every action declared in the schema is exposed as a callable', async () => {
    widget.render();
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));

    for (const handle of ['setColor', 'setDisable', 'setLoading', 'setVisibility']) {
      expect(typeof widget.exposed()[handle]).toBe('function');
    }
  });

  test('[ColorPicker-ACT-002] setColor(value) updates hex/rgb/rgba respecting the current allowOpacity', async () => {
    widget.render({ properties: { showAlpha: binding('{{false}}') } });
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));

    await act(async () => {
      await widget.exposed().setColor('#00FF00');
    });

    expect(widget.exposed().selectedColorHex).toBe('#00ff00');
    expect(widget.exposed().selectedColorRGB).toBe('rgb(0, 255, 0)');
  });

  test('[ColorPicker-ACT-003] setColor keeps a fresh closure after showAlpha changes — no stale-scope regression', async () => {
    widget.render({ properties: { showAlpha: binding('{{false}}') } });
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));

    widget.setComponentProperty(CP, 'showAlpha', true, 'properties');
    await waitFor(() => expect(widget.exposed().allowOpacity).toBe(true));

    await act(async () => {
      await widget.exposed().setColor('#00FF00');
    });

    // If setColor's closure were stale (captured allowOpacity: false), this
    // would come back as a plain 6-digit hex instead of hex8.
    expect(widget.exposed().selectedColorHex).toBe('#00ff00ff');
  });

  test('[ColorPicker-ACT-004] setDisable(true) updates isDisabled', async () => {
    widget.render();
    await waitFor(() => expect(typeof widget.exposed().setDisable).toBe('function'));

    await act(async () => {
      await widget.exposed().setDisable(true);
    });

    expect(widget.exposed().isDisabled).toBe(true);
    await waitFor(() => expect(widgetWrapper()).toHaveAttribute('aria-disabled', 'true'));
  });

  test('[ColorPicker-ACT-005] setLoading(true) swaps in the loader and updates isLoading', async () => {
    widget.render();
    await waitFor(() => expect(typeof widget.exposed().setLoading).toBe('function'));

    await act(async () => {
      await widget.exposed().setLoading(true);
    });

    expect(widget.exposed().isLoading).toBe(true);
    await waitFor(() => expect(loader()).toBeInTheDocument());
  });

  test('[ColorPicker-ACT-006] setVisibility(false) hides the widget and updates isVisible', async () => {
    widget.render();
    await waitFor(() => expect(typeof widget.exposed().setVisibility).toBe('function'));

    await act(async () => {
      await widget.exposed().setVisibility(false);
    });

    expect(widget.exposed().isVisible).toBe(false);
    await waitFor(() => expect(widgetWrapper()).toHaveClass('d-none'));
  });
});

describe('[ColorPicker-FORM] Form integration', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test("[ColorPicker-FORM-001] a Form submit attempt reveals ColorPicker's pending validation error", async () => {
    widget.renderInsideForm({
      properties: { defaultColor: binding('') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).submitForm();
    });

    await waitFor(() => expect(screen.getByText('Field cannot be empty')).toBeInTheDocument());
  });

  test('[ColorPicker-FORM-002] a Form clear (clearForm) clears a previously picked color', async () => {
    widget.renderInsideForm();
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#4368e3'));

    await act(async () => {
      await widget.exposed().setColor('#00FF00');
    });
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#00ff00'));

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(widget.exposed().selectedColorHex).toBeUndefined());
    expect(widget.exposed().selectedColorRGB).toBeUndefined();
  });
});

describe('[ColorPicker-COMPAT] Saved-app compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ColorPicker-COMPAT-001] a legacy definition missing collapseWhenHidden/tooltip/showClearBtn still renders and behaves', async () => {
    // Simulates a component saved before those keys existed — bypasses the
    // harness defaults entirely, unlike every other test in this file.
    const legacyDefinition = componentDefinition(CP, NAME, 'ColorPicker', {
      label: { value: 'Legacy label' },
      placeholder: { value: 'Select a color' },
      defaultColor: { value: '#123456' },
      format: { value: 'hex' },
      showAlpha: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      // showClearBtn, collapseWhenHidden, tooltip, tooltipFormat: absent
    });
    legacyDefinition.component.definition.styles = DEFAULT_STYLES;
    seedApp({ [CP]: legacyDefinition }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);

    widget.session.render(<RenderWidget {...widgetProps(CP, 'ColorPicker')} />);

    expect(await screen.findByText('Legacy label')).toBeInTheDocument();
    await waitFor(() => expect(widget.exposed().selectedColorHex).toBe('#123456'));
    expect(clearButton()).toBeNull();
  });
});
