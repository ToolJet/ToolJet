/**
 * MultiselectV2 — exposed variables, label/field styling, accessibility, and
 * editor-vs-viewer parity.
 *
 * Contract: `frontend/ee/test/app-builder/widgets/MultiselectV2/TESTING.md`
 * (scenarios MultiselectV2-VAR-*, STYLE-*, A11Y-* and MODE-001).
 *
 * Only styles a documented property drives are asserted here, and only through
 * the inline style the widget itself writes — computed CSS, real geometry and
 * focus order are the contract's `qa:` lane (MultiselectV2-BRW-*), not this
 * one.
 */
import { cleanup, screen, waitFor } from '@testing-library/react';
import { binding, drain, option } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { createMultiselectHarness } from './multiselectV2Harness';

const harness = createMultiselectHarness();
const state = () => useStore.getState();

const countEvent = (eventId, key) => [
  {
    id: `evt-${eventId}`,
    index: 0,
    sourceId: 'ms1',
    name: `evt-${eventId}`,
    target: 'component',
    event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
  },
];
const count = (key) => state().getVariable(key, 'canvas') ?? 0;

const control = () => screen.getByRole('combobox');
const widgetRoot = () => document.querySelector('.multiselect-widget');
const labelElement = () => document.querySelector('#ms1-label');
const labelText = () => labelElement()?.querySelector('p');
const platformWrapper = () => document.querySelector('.canvas-component');
const fieldIcon = () => document.querySelector('.multiselect-widget svg.tabler-icon');
/**
 * react-select's control and its field container. Both are emotion-generated
 * class names, matched by their stable `-control` suffix and by the widget's
 * own authored `px-0 h-100`: there is no role or label on either, and the
 * inline height/width these scenarios are about live nowhere else.
 */
const selectControl = () => document.querySelector('[class$="-control"]');
const fieldContainer = () => document.querySelector('.multiselect-widget .px-0.h-100');
/** The validation error row: the only element carrying the error text. */
const errorRow = () => screen.getByText('Field cannot be empty').closest('div');

async function openMenu() {
  await harness.session.user.click(control());
  await drain();
}
const clickRow = async (text) => {
  const found = screen.getAllByRole('option').find((r) => r.textContent.startsWith(text));
  if (!found) throw new Error(`no option row rendering "${text}"`);
  await harness.session.user.click(found);
  await drain();
};

const setProperty = async (property, value, paramType = 'properties') => {
  await harness.session.store.act(async () => {
    harness.setComponentProperty('ms1', property, value, paramType);
  });
  await drain();
};

function remount() {
  cleanup();
  harness.teardown();
  harness.setup();
}

const EMPTY_SELECTION = { values: binding('{{[]}}') };
const MANDATORY = { mandatory: binding(true) };
const SIDE_FIXED_LABEL = { auto: binding('{{false}}'), alignment: binding('side'), labelWidth: binding('40') };

describe('MultiselectV2: exposed variables, styling, and accessibility', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[MultiselectV2-VAR-001] After mount the widget publishes ten data variables and six action handles', async () => {
    // Break this catches: dropping any key from the mount-time
    // `setExposedVariables` call (MultiselectV2.jsx:291-315) or from the
    // selection/search writes — each name is a binding an app can already be
    // built on, so a rename is a breaking change with no error anywhere.
    harness.render({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();

    const exposed = harness.exposed();
    for (const key of [
      'label',
      'isVisible',
      'isLoading',
      'isDisabled',
      'isMandatory',
      'isValid',
      'options',
      'selectedOptions',
      'values',
      'searchText',
    ]) {
      expect(exposed).toHaveProperty(key);
    }
    for (const handle of ['clear', 'setVisibility', 'setLoading', 'setDisable', 'selectOptions', 'deselectOptions']) {
      expect(exposed[handle]).toBeInstanceOf(Function);
    }
    expect(exposed.isMandatory).toBe(true);
    expect(exposed.label).toBe('Select');
  });

  test('[MultiselectV2-VAR-002] The mirrored variables follow their properties on every re-resolve', async () => {
    // Break this catches: any of the five one-property republish effects
    // (MultiselectV2.jsx:249-279) losing its dependency — the variable would
    // freeze at its mount-time value while the field itself kept changing.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await setProperty('label', 'Renamed');
    expect(harness.exposed().label).toBe('Renamed');

    await setProperty('visibility', '{{false}}');
    expect(harness.exposed().isVisible).toBe(false);

    await setProperty('loadingState', '{{true}}');
    expect(harness.exposed().isLoading).toBe(true);

    await setProperty('disabledState', '{{true}}');
    expect(harness.exposed().isDisabled).toBe(true);

    await setProperty('mandatory', '{{true}}', 'validation');
    expect(harness.exposed().isMandatory).toBe(true);
  });

  test('[MultiselectV2-VAR-003] `selectedOptions` carries label, value and caption', async () => {
    // Break this catches: dropping the `caption ?? null` normalisation
    // (MultiselectV2.jsx:396-398) so an uncaptioned option omits the key —
    // a binding reading `caption` would start returning undefined instead.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        // A third, unselected option keeps this out of the full-selection
        // branch (MultiselectV2.jsx:205-206), which republishes the whole
        // option list in LIST order and would hide the selection order below.
        options: { value: [option('with', 'w', { caption: 'sub' }), option('without', 'x'), option('spare', 's')] },
      },
    });
    await drain();
    await openMenu();
    await clickRow('without');
    await clickRow('with');

    expect(harness.exposed().selectedOptions).toEqual([
      { label: 'without', value: 'x', caption: null },
      { label: 'with', value: 'w', caption: 'sub' },
    ]);
  });

  test('[MultiselectV2-VAR-004] `values` is the raw option-value array', async () => {
    // Break this catches: mapping `values` through `getSafeRenderableValue` or
    // `String()` (MultiselectV2.jsx:392) — a Form would start posting "false"
    // and "7" as strings, and every numeric comparison downstream would break.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        // As in VAR-003: a spare option keeps the full-selection branch out of
        // the way, so the published order is the order of the clicks.
        options: { value: [option('seven', 7), option('nope', false), option('text', 'abc'), option('spare', 's')] },
      },
    });
    await drain();
    await openMenu();
    await clickRow('text');
    await clickRow('nope');
    await clickRow('seven');

    expect(harness.exposed().values).toEqual(['abc', false, 7]);
  });

  test('[MultiselectV2-STYLE-001] `padding` is read at two layers for two effects', async () => {
    // Break this catches: dropping either reader — the platform's box padding
    // (AppCanvas/RenderWidget.jsx:318) or the widget's own `height + 4`
    // compensation (MultiselectV2.jsx:83) — which would leave the field either
    // inset or 4px short of the widget it sits in.
    harness.render({ properties: EMPTY_SELECTION, styles: { padding: binding('default') } });
    await drain();
    expect(platformWrapper()).toHaveStyle({ padding: '2px' });
    // The widget's `height` prop arrives already inset by the platform's box
    // padding, so the default case is 36px for a 40px widget.
    expect(selectControl()).toHaveStyle({ height: '36px' });

    remount();
    harness.render({ properties: EMPTY_SELECTION, styles: { padding: binding('none') } });
    await drain();
    expect(platformWrapper()).toHaveStyle({ padding: '0px' });
    expect(selectControl()).toHaveStyle({ height: '40px' });
  });

  test("[MultiselectV2-STYLE-002] The label's width, font size and colour follow their styles", async () => {
    // Break this catches: the `ofField` 70-percent scaling
    // (BaseComponents/hooks/useInput.js:15-18) or the field's complementary
    // width (:8-13) — the label and the field would stop adding up to the
    // widget, and one would overlap the other.
    harness.render({
      properties: EMPTY_SELECTION,
      styles: { ...SIDE_FIXED_LABEL, labelFontSize: binding('{{18}}'), labelColor: binding('#ff00ff') },
    });
    await drain();

    expect(labelElement()).toHaveStyle({ width: '40%', fontSize: '18px', maxWidth: '100%' });
    expect(labelText().style.color).toBe('rgb(255, 0, 255)');
    expect(fieldContainer()).toHaveStyle({ width: '60%', minWidth: '20%' });

    // The deprecated width type scales the label to 70% of the configured value
    // and gives the field the whole width.
    remount();
    harness.render({
      properties: EMPTY_SELECTION,
      styles: { ...SIDE_FIXED_LABEL, widthType: binding('ofField') },
    });
    await drain();
    expect(labelElement()).toHaveStyle({ width: '28%', maxWidth: '70%' });
    expect(fieldContainer()).toHaveStyle({ width: '100%' });

    // A non-numeric font size falls back to 12px.
    remount();
    harness.render({ properties: EMPTY_SELECTION, styles: { labelFontSize: binding('not-a-size') } });
    await drain();
    expect(labelElement()).toHaveStyle({ fontSize: '12px' });
  });

  test('[MultiselectV2-STYLE-003] Each `alignment` and `direction` pair produces its own layout', async () => {
    // Break this catches: dropping the `label?.length != 0` term from the
    // stacking condition (MultiselectV2.jsx:521-524) — a labelless field would
    // stack a zero-height label above the control and lose its vertical
    // centring for no reason the builder can see.
    const cases = [
      [{ alignment: 'side', direction: 'left' }, ['align-items-center'], ['flex-column', 'flex-row-reverse']],
      [{ alignment: 'side', direction: 'right' }, ['align-items-center', 'flex-row-reverse'], ['flex-column']],
      [{ alignment: 'top', direction: 'left' }, ['flex-column'], ['align-items-center', 'text-right']],
      [{ alignment: 'top', direction: 'right' }, ['flex-column', 'text-right'], ['align-items-center']],
    ];

    for (const [styles, present, absent] of cases) {
      harness.render({
        properties: EMPTY_SELECTION,
        styles: { alignment: binding(styles.alignment), direction: binding(styles.direction) },
      });
      await drain();
      for (const cls of present) expect(widgetRoot()).toHaveClass(cls);
      for (const cls of absent) expect(widgetRoot()).not.toHaveClass(cls);
      remount();
    }

    // With no label there is nothing to stack, whatever `alignment` says.
    harness.render({
      properties: { ...EMPTY_SELECTION, label: binding('') },
      styles: { alignment: binding('top') },
    });
    await drain();
    expect(widgetRoot()).toHaveClass('align-items-center');
    expect(widgetRoot()).not.toHaveClass('flex-column');
  });

  test('[MultiselectV2-STYLE-004] `errTextColor` and `direction` style the validation error row', async () => {
    // Break this catches: hardcoding the error colour, or dropping the
    // direction-driven justification (MultiselectV2.jsx:657-666) — the message
    // would sit under the label instead of under the field it describes.
    harness.render({
      properties: EMPTY_SELECTION,
      styles: { errTextColor: binding('#aa0000'), direction: binding('left') },
      validation: MANDATORY,
    });
    await drain();
    await openMenu();
    await clickRow('option1');
    await clickRow('option1');

    expect(errorRow().style.color).toBe('rgb(170, 0, 0)');
    expect(errorRow()).toHaveStyle({ justifyContent: 'flex-end' });

    remount();
    harness.render({
      properties: EMPTY_SELECTION,
      styles: { errTextColor: binding('#aa0000'), direction: binding('right') },
      validation: MANDATORY,
    });
    await drain();
    await openMenu();
    await clickRow('option1');
    await clickRow('option1');
    expect(errorRow()).toHaveStyle({ justifyContent: 'flex-start' });
  });

  test('[MultiselectV2-STYLE-005] The field icon appears only when icon visibility is on', async () => {
    // Break this catches: dropping `TablerIcon`'s `fallbackIcon` resolution
    // (_ui/Icon/TablerIcon.jsx:53) — a saved app naming an icon that has since
    // been removed would render a permanent empty placeholder instead.
    harness.render({ properties: EMPTY_SELECTION, styles: { iconVisibility: binding('{{true}}') } });
    await drain();
    await waitFor(() => expect(fieldIcon()).not.toBeNull());
    expect(fieldIcon()).toHaveClass('tabler-icon-home-2');

    remount();
    harness.render({ properties: EMPTY_SELECTION, styles: { iconVisibility: binding('{{false}}') } });
    await drain();
    expect(fieldIcon()).toBeNull();

    // An unrecognised name falls back to the default glyph, not to nothing.
    remount();
    harness.render({
      properties: EMPTY_SELECTION,
      styles: { iconVisibility: binding('{{true}}'), icon: binding('IconThatDoesNotExist') },
    });
    await drain();
    await waitFor(() => expect(fieldIcon()).not.toBeNull());
    expect(fieldIcon()).toHaveClass('tabler-icon-home-2');
  });

  test('[MultiselectV2-STYLE-006] `iconColor` colours the field icon', async () => {
    // Break this catches: dropping `color` from the icon's inline style
    // (MultiselectV2/CustomValueContainer.jsx:50-57) — the icon would fall back
    // to the theme's default and the builder's choice would do nothing.
    harness.render({
      properties: EMPTY_SELECTION,
      styles: { iconVisibility: binding('{{true}}'), iconColor: binding('#00aa55') },
    });
    await drain();
    await waitFor(() => expect(fieldIcon()).not.toBeNull());

    expect(fieldIcon().style.color).toBe('rgb(0, 170, 85)');
  });

  test('[MultiselectV2-STYLE-007] A legacy label colour maps forward to the theme token', async () => {
    // Break this catches: dropping a value from the legacy sentinel list
    // (_ui/Label.jsx:52) — every app saved with that hex would go back to a
    // hardcoded near-black label that ignores the current theme.
    harness.render({ properties: EMPTY_SELECTION, styles: { labelColor: binding('#1B1F24') } });
    await drain();
    // The mapped-forward value is `var(--text-primary)`, which jsdom's style
    // parser drops rather than storing — so what is assertable here is that the
    // legacy hex did NOT reach the element, and no literal colour did.
    expect(labelText().style.color).toBe('');
    expect(labelText().getAttribute('style')).not.toContain('#1B1F24');

    remount();
    harness.render({ properties: EMPTY_SELECTION, styles: { labelColor: binding('#123456') } });
    await drain();
    expect(labelText().style.color).toBe('rgb(18, 52, 86)');
  });

  test('[MultiselectV2-A11Y-001] Only the validity and labelling ARIA attributes reach the accessibility tree', async () => {
    // Break this catches: react-select starting to forward the four dropped
    // attributes, or the widget stopping passing `aria-invalid`
    // (MultiselectV2.jsx:590-595). The first would be a fix; today a mandatory,
    // loading or hidden field is announced as none of those things, and this
    // pins which of the five declarations actually land.
    harness.render({
      properties: { ...EMPTY_SELECTION, loadingState: binding('{{true}}'), visibility: binding('{{false}}') },
      validation: MANDATORY,
    });
    await drain();

    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(control()).toHaveAttribute('aria-labelledby', 'ms1-label');
    for (const dropped of ['aria-required', 'aria-busy', 'aria-disabled', 'aria-hidden']) {
      expect(document.querySelector(`#component-ms1 [${dropped}="true"]`)).toBeNull();
      expect(control().hasAttribute(dropped)).toBe(false);
    }

    // A disabled field is conveyed by the input's own `disabled` attribute only.
    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, disabledState: binding('{{true}}') } });
    await drain();
    expect(control()).toBeDisabled();
    expect(control().hasAttribute('aria-disabled')).toBe(false);
  });

  test('[MultiselectV2-A11Y-002] The mandatory marker rides on the label, and vanishes with it', async () => {
    // Break this catches: moving the required marker out of the label's render
    // gate (_ui/Label.jsx:68-80) — which is the fix — or dropping it entirely.
    // Today a required field with no label says nothing about being required.
    harness.render({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();
    expect(labelElement()).toHaveTextContent('*');

    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, label: binding('') }, validation: MANDATORY });
    await drain();
    expect(labelElement()).toBeNull();
    expect(widgetRoot().textContent).not.toContain('*');

    remount();
    harness.render({
      properties: EMPTY_SELECTION,
      styles: { auto: binding('{{false}}'), labelWidth: binding('0') },
      validation: MANDATORY,
    });
    await drain();
    expect(labelElement()).toBeNull();
    expect(widgetRoot().textContent).not.toContain('*');
  });

  test("[MultiselectV2-A11Y-003] With no label element the accessible name comes from the field's own label attribute", async () => {
    // Break this catches: dropping the `!auto && labelWidth == 0 &&
    // label?.length != 0` condition on `aria-label` (MultiselectV2.jsx:597) —
    // the one configuration with no label element would lose its accessible
    // name entirely, since `aria-labelledby` points at nothing there.
    harness.render({
      properties: { ...EMPTY_SELECTION, label: binding('Regions') },
      styles: { auto: binding('{{false}}'), labelWidth: binding('0') },
    });
    await drain();

    expect(labelElement()).toBeNull();
    expect(control()).toHaveAttribute('aria-label', 'Regions');
    expect(control()).toHaveAccessibleName('Regions');

    // With auto width the label element exists, and the attribute is dropped.
    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, label: binding('Regions') } });
    await drain();
    expect(labelElement()).not.toBeNull();
    expect(control().hasAttribute('aria-label')).toBe(false);
  });

  test('[MultiselectV2-A11Y-004] Clicking the label never focuses the field', async () => {
    // Break this catches: passing an `inputId` to `Label`
    // (MultiselectV2.jsx:548-562) so its viewer-mode `htmlFor`
    // (_ui/Label.jsx:44) resolves — which is the fix. Today the label is inert
    // in both modes, and this pins it.
    for (const currentMode of ['edit', 'view']) {
      harness.render({ properties: EMPTY_SELECTION, currentMode });
      await drain();

      await harness.session.user.click(labelText());
      await drain();

      expect(document.activeElement).not.toBe(control());
      remount();
    }
  });

  test('[MultiselectV2-MODE-001] The widget behaves identically in the editor and the viewer', async () => {
    // Break this catches: introducing a `currentMode` read into the widget —
    // selection, validation gating or any of the four events behaving
    // differently on the canvas than in the running app, which is exactly the
    // class of bug a builder cannot find by testing in the editor.
    const observed = [];
    for (const currentMode of ['edit', 'view']) {
      harness.render({
        properties: EMPTY_SELECTION,
        validation: MANDATORY,
        events: countEvent('onSelect', `selectCount_${currentMode}`),
        currentMode,
      });
      await drain();
      await openMenu();
      await clickRow('option2');
      const selected = { values: harness.exposed().values, isValid: harness.exposed().isValid };
      await clickRow('option2');

      observed.push({
        selected,
        emptied: { values: harness.exposed().values, isValid: harness.exposed().isValid },
        errorText: screen.queryByText('Field cannot be empty') !== null,
        events: count(`selectCount_${currentMode}`),
      });
      remount();
    }

    expect(observed[0]).toEqual({
      selected: { values: ['2'], isValid: true },
      emptied: { values: [], isValid: false },
      errorText: true,
      events: 2,
    });
    expect(observed[1]).toEqual(observed[0]);
  });
});
