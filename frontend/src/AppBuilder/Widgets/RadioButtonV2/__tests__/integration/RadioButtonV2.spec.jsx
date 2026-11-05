/**
 * RadioButtonV2 behaviour spec, run against the real RenderWidget/store path.
 *
 * Approved contract: `src/test/app-builder/widgets/RadioButtonV2/TESTING.md`.
 * Every test title starts with its approved scenario ID; nothing here may
 * assert behaviour that contract does not record.
 *
 * Nothing first-party is mocked: the real composed store resolves the saved
 * definition (including the nested `{ value: '{{...}}' }` wrappers inside each
 * option), the real RenderWidget supplies props, the real eventsSlice
 * dispatches `onSelectionChange`, and the real RadioButtonV2 module is what
 * ends up in the DOM.
 *
 * Two structural notes about the DOM, both load-bearing for the queries below:
 *
 *   1. Each option is a `<label>` wrapping its option text and its
 *      `<input type="radio">`, so the radio's accessible name is the option
 *      label. `getByRole('radio', { name })` is therefore the user-facing
 *      handle, and clicking it is what a user does.
 *   2. Option input ids come from React's `useId` (RadioButtonV2.jsx:57), not
 *      from the component id. That is the fix for `f537bdd320f` /
 *      `76e28839803` — two instances of one definition must not share input
 *      ids, or a label click in the second instance checks the first
 *      instance's input. `RadioButtonV2-ISO-001` is that regression.
 *
 * The group container carries the state contract (`role="radiogroup"`,
 * `aria-required`/`aria-invalid`/`aria-disabled`/`aria-busy`/`aria-hidden`),
 * which is what `RadioButtonV2-A11Y-001` pins.
 *
 * `RadioButtonV2-FORM-001` renders the radio as a real Form child, so it needs
 * the session's `dnd` capability: `AppCanvas/Container` throws
 * "Expected drag drop context" without the react-dnd provider that
 * `AppBuilder.jsx:96` supplies in production. It therefore runs on its own
 * session rather than the shared widget harness, and `FormSignalContext` is
 * still never injected directly — the Form provides it.
 */
import { screen, waitFor, within } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  option,
  setVariableOn,
  radioButtonV2Defaults,
  MODULE_ID,
} from '../../../__tests__/integration/widgetHarness';

const ID = 'radio1';
const NAME = 'radiobutton1';

const widget = createWidgetHarness({
  componentType: 'RadioButtonV2',
  handle: NAME,
  id: ID,
  ...radioButtonV2Defaults,
});

const seenByHandler = (key = 'valueSeenByHandler') =>
  widget.session.store.read((state) => state.getVariable(key, MODULE_ID));

// `hidden: true` on purpose: `setVisibility(false)` sets `aria-hidden`, which
// drops the group out of the accessibility tree, and the hidden state itself is
// what STATE-001/STATE-002 assert.
const radiogroup = () => screen.getByRole('radiogroup', { hidden: true });
const radio = (name) => screen.getByRole('radio', { name });
const validationMessage = (text) => screen.queryByText(text);

describe('RadioButtonV2', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  const twoOptions = { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] };

  describe('selection', () => {
    test('[RadioButtonV2-SEL-001] selecting an option publishes its value and On select reads the new selection', async () => {
      widget.render({ properties: { options: twoOptions } });
      widget.setEvents(
        setVariableOn(ID, 'onSelectionChange', { key: 'valueSeenByHandler', value: `{{components.${NAME}.value}}` })
      );

      // The configured default is the starting point a user sees.
      await waitFor(() => expect(widget.exposed().value).toBe('b'));
      expect(radio('Beta')).toBeChecked();

      await widget.session.user.click(radio('Alpha'));

      await waitFor(() => expect(widget.exposed().value).toBe('a'));
      expect(radio('Alpha')).toBeChecked();
      expect(radio('Beta')).not.toBeChecked();
      expect(widget.exposed().isValid).toBe(true);
      // The handler must observe 'a', not the 'b' that was current when the click landed.
      await waitFor(() => expect(seenByHandler()).toBe('a'));
    });

    test('[RadioButtonV2-ISO-001] each instance of one definition routes its own label clicks to its own option', async () => {
      // Two mounts of the SAME definition is the ListView/Kanban row shape:
      // one component id, several rendered instances.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b')] } },
        also: [{ id: ID, componentType: 'RadioButtonV2' }],
      });

      const [firstGroup, secondGroup] = screen.getAllByRole('radiogroup');
      expect(secondGroup).toBeDefined();

      await widget.session.user.click(within(secondGroup).getByRole('radio', { name: 'Beta' }));

      expect(within(secondGroup).getByRole('radio', { name: 'Beta' })).toBeChecked();
      expect(within(firstGroup).getByRole('radio', { name: 'Beta' })).not.toBeChecked();
      expect(within(firstGroup).getByRole('radio', { name: 'Alpha' })).not.toBeChecked();
    });
  });

  describe('options', () => {
    test('[RadioButtonV2-OPT-001] dynamic options replace static options and apply visible, disable, and default flags', async () => {
      widget.render({
        properties: {
          advanced: binding('{{true}}'),
          options: { value: [option('Static option', 'static', { isDefault: true })] },
          schema: binding(
            `{{[{label: 'Schema one', value: 's1', visible: true, disable: false, default: true},` +
              `{label: 'Schema two', value: 's2', visible: true, disable: true, default: false},` +
              `{label: 'Schema hidden', value: 's3', visible: false, disable: false, default: false}]}}`
          ),
        },
      });

      expect(await screen.findByRole('radio', { name: 'Schema one' })).toBeChecked();
      expect(screen.queryByText('Static option')).not.toBeInTheDocument();
      expect(screen.queryByText('Schema hidden')).not.toBeInTheDocument();
      expect(within(radiogroup()).getAllByRole('radio')).toHaveLength(2);

      // A disabled option is offered but not selectable.
      const disabled = radio('Schema two');
      expect(disabled).toBeDisabled();
      await widget.session.user.click(disabled);
      expect(widget.exposed().value).toBe('s1');

      await waitFor(() =>
        expect(widget.exposed().options).toEqual([
          { label: 'Schema one', value: 's1' },
          { label: 'Schema two', value: 's2' },
        ])
      );
    });

    test('[RadioButtonV2-OPT-002] replacing the options after mount re-derives the selection and republishes the list', async () => {
      widget.render({ properties: { options: twoOptions } });
      await waitFor(() => expect(widget.exposed().value).toBe('b'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(
          ID,
          'options',
          [option('Gamma', 'g'), option('Delta', 'd', { isDefault: true })],
          'properties'
        );
      });

      expect(await screen.findByRole('radio', { name: 'Delta' })).toBeChecked();
      // 'b' no longer exists, so it must not still be the published value.
      await waitFor(() => expect(widget.exposed().value).toBe('d'));
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
      await waitFor(() =>
        expect(widget.exposed().options).toEqual([
          { label: 'Gamma', value: 'g' },
          { label: 'Delta', value: 'd' },
        ])
      );
    });

    test('[RadioButtonV2-OPT-003] a false option value is a real selection and a non-string label stays readable', async () => {
      widget.render({
        properties: {
          options: {
            value: [option('Off', '{{false}}'), option('On', '{{true}}'), option('{{42}}', 'numeric-label')],
          },
        },
      });

      // A numeric label is rendered readably rather than dropped or crashing.
      expect(await screen.findByRole('radio', { name: '42' })).toBeInTheDocument();

      await widget.session.user.click(radio('Off'));
      await waitFor(() => expect(widget.exposed().value).toBe(false));
      expect(radio('Off')).toBeChecked();

      await widget.session.user.click(radio('On'));
      await waitFor(() => expect(widget.exposed().value).toBe(true));
      expect(radio('On')).toBeChecked();
      expect(radio('Off')).not.toBeChecked();
    });

    test('[RadioButtonV2-OPT-003] a non-array options value renders an empty group instead of crashing', async () => {
      widget.render({ properties: { options: binding('{{null}}') } });

      const group = await screen.findByRole('radiogroup');
      expect(within(group).queryAllByRole('radio')).toHaveLength(0);
      await waitFor(() => expect(widget.exposed().options).toEqual([]));
      expect(widget.exposed().value).toBeUndefined();
    });

    test('[RadioButtonV2-OPT-007] an options rewrite discards the user selection, an identical rewrite keeps it', async () => {
      // The default-selection effect is keyed to `JSON.stringify(options)`
      // (RadioButtonV2.jsx:122-125), so *content* decides whether a user's
      // choice survives. Break this catches: widening the dependency to the
      // options identity would drop the selection every time a binding
      // re-resolves, and narrowing it would leave a stale value published
      // after a query returns different rows.
      const original = [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })];
      widget.render({ properties: { options: { value: original } } });

      await widget.session.user.click(radio('Alpha'));
      await waitFor(() => expect(widget.exposed().value).toBe('a'));

      // Same content, written again: the selection is the user's, not the schema's.
      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'options', [...original], 'properties');
      });
      await waitFor(() => expect(widget.exposed().value).toBe('a'));
      expect(radio('Alpha')).toBeChecked();

      // Different content: the schema default takes the selection back.
      await widget.session.store.act(() => {
        widget.setComponentProperty(
          ID,
          'options',
          [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true }), option('Gamma', 'g')],
          'properties'
        );
      });
      await waitFor(() => expect(widget.exposed().value).toBe('b'));
      expect(radio('Beta')).toBeChecked();
      expect(radio('Alpha')).not.toBeChecked();
    });

    test('[RadioButtonV2-OPT-008] hiding the selected option removes it and re-derives the selection', async () => {
      // `selectOptions` filters on `visible ?? true` (RadioButtonV2.jsx:92)
      // while `checkedValue` is untouched by that filter. Break this catches:
      // skipping the re-derive would keep publishing a value with nothing on
      // screen to match it.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] } },
      });

      await widget.session.user.click(radio('Alpha'));
      await waitFor(() => expect(widget.exposed().value).toBe('a'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(
          ID,
          'options',
          [{ ...option('Alpha', 'a'), visible: { value: '{{false}}' } }, option('Beta', 'b', { isDefault: true })],
          'properties'
        );
      });

      await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
      // What is published agrees with what is on screen.
      await waitFor(() => expect(widget.exposed().value).toBe('b'));
      expect(radio('Beta')).toBeChecked();
      await waitFor(() => expect(widget.exposed().options).toEqual([{ label: 'Beta', value: 'b' }]));
    });

    test('[RadioButtonV2-OPT-009] an option that is both default and disabled still starts checked', async () => {
      // `findDefaultItem` matches only `default === true && visible === true`
      // (RadioButtonV2.jsx:109) and never consults `disable`. Break this
      // catches: making the default search skip disabled options would open a
      // saved app on an empty group instead of its stored selection.
      widget.render({
        properties: {
          options: {
            value: [
              option('Alpha', 'a'),
              { ...option('Beta', 'b', { isDefault: true }), disable: { value: '{{true}}' } },
            ],
          },
        },
      });

      const checked = await screen.findByRole('radio', { name: 'Beta' });
      expect(checked).toBeChecked();
      expect(checked).toBeDisabled();
      await waitFor(() => expect(widget.exposed().value).toBe('b'));
    });
  });

  test('[RadioButtonV2-OPT-005] when several options claim `default: true`, the first one wins', async () => {
    // Break this catches: swapping `findDefaultItem`'s `find` for a
    // last-wins scan silently changes which option a saved app opens on.
    widget.render({
      properties: {
        options: { value: [option('Alpha', 'a', { isDefault: true }), option('Beta', 'b', { isDefault: true })] },
      },
    });

    await waitFor(() => expect(widget.exposed().value).toBe('a'));
    expect(radio('Alpha')).toBeChecked();
    expect(radio('Beta')).not.toBeChecked();
  });

  test('[RadioButtonV2-OPT-006] a default option must declare `visible: true`, not merely omit it', async () => {
    // Characterized, not endorsed. Decision of 2026-09-04: rendering keeps an
    // option when `visible ?? true`, while `findDefaultItem` requires
    // `visible === true`, so an option with `default: true` and no `visible`
    // key is offered but never selected. Break this catches: loosening
    // `findDefaultItem` to `visible ?? true` (a reasonable-looking cleanup)
    // would change the initial selection of every app relying on this.
    widget.render({
      properties: {
        options: {
          value: [
            { label: 'NoVisibleKey', value: 'x', default: { value: '{{true}}' }, disable: { value: '{{false}}' } },
            option('Other', 'y'),
          ],
        },
      },
    });

    expect(await screen.findByRole('radio', { name: 'NoVisibleKey' })).toBeInTheDocument();
    expect(radio('NoVisibleKey')).not.toBeChecked();
    await waitFor(() => expect(widget.exposed().value).toBeUndefined());
  });

  describe('loosely-equal option values (characterized, not endorsed)', () => {
    test('[RadioButtonV2-OPT-004] option values that are loosely equal collide, so mixing them is unsupported', async () => {
      // Decision of 2026-09-04: a group must not be configured with option
      // values that are loosely equal to each other. This test pins what the
      // runtime does today so the constraint is visible rather than folklore:
      // `checkedValue == option.value` (RadioButtonV2.jsx:298/322) treats
      // `false`, `0`, and `''` as the same selection.
      widget.render({
        properties: {
          options: {
            value: [option('Off', '{{false}}', { isDefault: true }), option('Zero', '{{0}}'), option('Blank', '')],
          },
        },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(false));
      // One selection, three inputs showing as checked.
      expect(radio('Off')).toBeChecked();
      expect(radio('Zero')).toBeChecked();
      expect(radio('Blank')).toBeChecked();

      // Clicking an already-checked input fires no change, so the selection
      // cannot move between them and the published value stays `false`.
      await widget.session.user.click(radio('Zero'));
      await waitFor(() => expect(widget.exposed().value).toBe(false));
    });
  });

  describe('component-specific actions', () => {
    test('[RadioButtonV2-ACT-002] selectOption accepts a whole option object and stores its value', async () => {
      // Break this catches: dropping the `isObject && has(value, 'value')`
      // unwrap publishes the object itself, so `{{components.radiobutton1.value}}`
      // stops being comparable to an option value.
      widget.render({ properties: { options: twoOptions } });
      await widget.act('selectOption', { label: 'Alpha', value: 'a' });

      await waitFor(() => expect(widget.exposed().value).toBe('a'));
      expect(radio('Alpha')).toBeChecked();
    });

    test('[RadioButtonV2-ACT-003] selectOption with a value that matches no option publishes it and checks nothing', async () => {
      // Break this catches: adding a membership guard that silently ignores the
      // call, or clearing the selection instead — both change what a stale id
      // from a RunJS query does to a live app.
      widget.render({ properties: { options: twoOptions } });
      await widget.act('selectOption', 'no-such-option');

      await waitFor(() => expect(widget.exposed().value).toBe('no-such-option'));
      expect(screen.getAllByRole('radio').some((input) => input.checked)).toBe(false);
    });

    test('[RadioButtonV2-EVT-001] re-selecting the already-checked option fires no On select', async () => {
      // Break this catches: moving the handler from `onChange` to `onClick`
      // (or adding a click handler alongside it) makes every re-click fire the
      // event again, so queries wired to On select run on a non-change.
      widget.render({ properties: { options: twoOptions } });
      widget.setEvents(
        setVariableOn(ID, 'onSelectionChange', { key: 'valueSeenByHandler', value: `{{components.${NAME}.value}}` })
      );
      await waitFor(() => expect(widget.exposed().value).toBe('b'));

      await widget.session.user.click(radio('Beta'));

      expect(seenByHandler()).toBeUndefined();
      expect(radio('Beta')).toBeChecked();
    });

    test('[RadioButtonV2-ACT-001] selectOption selects the matching option and no-argument deselectOption clears it', async () => {
      widget.render({ properties: { options: twoOptions } });
      widget.setEvents(
        setVariableOn(ID, 'onSelectionChange', { key: 'valueSeenByHandler', value: `{{components.${NAME}.value}}` })
      );
      await widget.act('selectOption', 'a');
      await waitFor(() => expect(widget.exposed().value).toBe('a'));
      expect(radio('Alpha')).toBeChecked();
      await waitFor(() => expect(seenByHandler()).toBe('a'));

      await widget.act('deselectOption');
      await waitFor(() => expect(widget.exposed().value).toBeNull());
      expect(radio('Alpha')).not.toBeChecked();
      expect(radio('Beta')).not.toBeChecked();
    });
  });

  describe('validation', () => {
    const noDefault = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('[RadioButtonV2-VAL-001] a mandatory group with nothing selected surfaces its error and recovers on selection', async () => {
      widget.render({
        properties: { options: noDefault },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(widget.exposed().isMandatory).toBe(true);
      expect(radiogroup()).toHaveAttribute('aria-invalid', 'true');
      expect(radiogroup()).toHaveAttribute('aria-required', 'true');
      expect(validationMessage('Field cannot be empty')).toBeVisible();

      await widget.session.user.click(radio('Alpha'));

      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
      expect(validationMessage('Field cannot be empty')).not.toBeInTheDocument();
      expect(radiogroup()).toHaveAttribute('aria-invalid', 'false');
    });

    test('[RadioButtonV2-VAL-002] an option whose value is false satisfies a mandatory group', async () => {
      widget.render({
        properties: { options: { value: [option('Off', '{{false}}'), option('On', '{{true}}')] } },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await widget.session.user.click(radio('Off'));

      await waitFor(() => expect(widget.exposed().value).toBe(false));
      expect(widget.exposed().isValid).toBe(true);
      expect(validationMessage('Field cannot be empty')).not.toBeInTheDocument();
    });

    test('[RadioButtonV2-VAL-004] making the field mandatory after mount revalidates the current selection', async () => {
      // Break this catches: dropping the `[validate]` effect leaves a live app
      // reporting `isValid: true` for an empty field the builder just made
      // mandatory.
      widget.render({ properties: { options: noDefault } });
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false);
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(widget.exposed().isMandatory).toBe(true);
      expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();
      expect(radiogroup()).toHaveAttribute('aria-required', 'true');
    });

    test('[RadioButtonV2-VAL-003] a custom rule invalidates the group and surfaces its own message', async () => {
      widget.render({
        properties: { options: twoOptions },
        afterSeed: () =>
          widget.setComponentProperty(ID, 'customRule', "{{'Pick a real side'}}", 'validation', 'value', false),
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(await screen.findByText('Pick a real side')).toBeVisible();
      expect(radiogroup()).toHaveAttribute('aria-invalid', 'true');
    });

    test('[RadioButtonV2-VAL-005] a hidden group does not surface its message and surfaces it again when shown', async () => {
      // The message block's class is `isValid ? d-none : visibility ? d-flex :
      // d-none` (RadioButtonV2.jsx:353) — the one place visibility and
      // validity are read together. Break this catches: dropping the
      // visibility arm leaves an error floating on the canvas for a widget
      // the app has hidden.
      widget.render({
        properties: { options: noDefault },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      // The message text stays in the DOM either way — only the class the
      // runtime computes changes — and jsdom loads no stylesheet, so
      // `toBeVisible()` cannot see `d-none` and would pass in both states.
      // The class is therefore the observable this crossing owns; whether the
      // hidden group *looks* right is `RadioButtonV2-BRW-003`'s job.
      const messageBox = () => validationMessage('Field cannot be empty');
      expect(messageBox()).toHaveClass('d-flex');

      await widget.act('setVisibility', false);
      await waitFor(() => expect(messageBox()).toHaveClass('d-none'));
      // Still invalid — only its presentation changed.
      expect(widget.exposed().isValid).toBe(false);

      await widget.act('setVisibility', true);
      await waitFor(() => expect(messageBox()).toHaveClass('d-flex'));
    });

    test('[RadioButtonV2-VAL-006] deselectOption moves a mandatory field into the invalid state', async () => {
      // `deselectOption` routes through `onSelect(null)` and revalidates
      // (RadioButtonV2.jsx:200-203). Break this catches: clearing the
      // selection without re-running `validate` would leave a mandatory field
      // reporting `isValid: true` with nothing selected, so a Form submit
      // would accept it.
      widget.render({
        properties: { options: noDefault },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await widget.session.user.click(radio('Alpha'));
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));

      await widget.act('deselectOption');

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(radiogroup()).toHaveAttribute('aria-invalid', 'true');
      expect(validationMessage('Field cannot be empty')).toBeVisible();
      expect(radio('Alpha')).not.toBeChecked();
    });
  });

  describe('state actions and property changes', () => {
    test('[RadioButtonV2-STATE-001] setVisibility, setLoading, and setDisable update the public flags and the group', async () => {
      widget.render({ properties: { options: twoOptions } });
      await widget.act('setVisibility', false);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(radiogroup()).toHaveAttribute('aria-hidden', 'true');

      await widget.act('setVisibility', true);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
      expect(radiogroup()).toHaveAttribute('aria-hidden', 'false');

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
      expect(radiogroup()).toHaveAttribute('aria-disabled', 'true');

      await widget.act('setLoading', true);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(radiogroup()).toHaveAttribute('aria-busy', 'true');
      // The loader replaces the options while loading.
      expect(within(radiogroup()).queryAllByRole('radio')).toHaveLength(0);

      await widget.act('setLoading', false);
      await waitFor(() => expect(within(radiogroup()).queryAllByRole('radio')).toHaveLength(2));
    });

    test('[RadioButtonV2-STATE-002] property-driven visibility, loading, and disabled changes reach the DOM and the flags', async () => {
      widget.render({ properties: { options: twoOptions } });
      expect(radiogroup()).toHaveAttribute('aria-disabled', 'false');

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
      });
      await waitFor(() => expect(radiogroup()).toHaveAttribute('aria-disabled', 'true'));
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      // A radio that lands in a sub-container must not stay disabled (76e28839803).
      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
      });
      await waitFor(() => expect(radiogroup()).toHaveAttribute('aria-disabled', 'false'));
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'visibility', '{{false}}', 'properties');
      });
      await waitFor(() => expect(radiogroup()).toHaveAttribute('aria-hidden', 'true'));
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'optionsLoadingState', '{{true}}', 'properties');
      });
      await waitFor(() => expect(within(radiogroup()).queryAllByRole('radio')).toHaveLength(0));
    });

    test('[RadioButtonV2-STATE-003] options loading hides the options without claiming the component is loading', async () => {
      // Characterized per the 2026-09-04 decision: `loadingState` is the
      // component's public loading state, `optionsLoadingState` is a narrower
      // options-only spinner. Break this catches: folding
      // `optionsLoadingState` into `isLoading`/`aria-busy` would change a
      // published variable that apps branch on.
      widget.render({ properties: { options: twoOptions, optionsLoadingState: binding('{{true}}') } });

      const group = radiogroup();
      expect(within(group).queryAllByRole('radio')).toHaveLength(0);
      expect(group).toHaveAttribute('aria-busy', 'false');
      await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
    });

    test.each([
      ['row', { flexDirection: 'row', flexWrap: '', overflow: 'auto hidden' }],
      ['column', { flexDirection: 'column', flexWrap: '', overflow: 'hidden auto' }],
      ['wrap', { flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden auto' }],
    ])('[RadioButtonV2-STATE-004] the %s layout lays the options out in that direction', (layout, expected) => {
      // Break this catches: `wrap` is implemented as row + flexWrap, so a
      // mapping change (wrap -> column) or a dropped `flexWrap` stops options
      // wrapping — the regression `66c88ddc4f0` added this property for.
      widget.render({ properties: { options: twoOptions, layout: binding(layout) } });

      const optionsBox = screen.getAllByRole('radio')[0].closest('.radio-button-container').parentElement;
      expect(optionsBox.style.flexDirection).toBe(expected.flexDirection);
      expect(optionsBox.style.flexWrap).toBe(expected.flexWrap);
      expect(optionsBox.style.overflow).toBe(expected.overflow);
    });

    // Split in two: one session mounts one root, so the editor and viewer
    // renders cannot share a test.
    test('[RadioButtonV2-STATE-005] dynamic height never resizes the group on the editor canvas', () => {
      // Break this catches: dropping the `currentMode === 'view'` gate makes
      // the widget resize itself while a builder is still laying it out.
      widget.render({ properties: { options: twoOptions, dynamicHeight: binding('{{true}}') } });

      expect(radiogroup().style.height).toBe('100%');
      expect(radiogroup().style.minHeight).toBe('');
    });

    test('[RadioButtonV2-STATE-005] dynamic height grows the group in the viewer', () => {
      // The other half of the same gate: in view mode the group grows to fit
      // its options and keeps the configured height as a floor.
      widget.render({
        properties: { options: twoOptions, dynamicHeight: binding('{{true}}') },
        currentMode: 'view',
      });

      expect(radiogroup().style.height).toBe('auto');
    });

    test('[RadioButtonV2-STATE-008] the two loading flags hide the options independently', async () => {
      // One ternary reads both (`isLoading || optionsLoadingState`,
      // RadioButtonV2.jsx:286) but only `loadingState` reaches `aria-busy` and
      // the published `isLoading`. Break this catches: clearing either flag
      // revealing options the other still hides, or the options-only spinner
      // leaking into the component's public loading contract.
      widget.render({ properties: { options: twoOptions } });
      await widget.session.user.click(radio('Alpha'));
      await waitFor(() => expect(widget.exposed().value).toBe('a'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');
        widget.setComponentProperty(ID, 'optionsLoadingState', '{{true}}', 'properties');
      });
      await waitFor(() => expect(radiogroup()).toHaveAttribute('aria-busy', 'true'));
      expect(within(radiogroup()).queryAllByRole('radio')).toHaveLength(0);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));

      // Component loading cleared, options loading still set: still no options,
      // and the public loading contract is already false.
      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
      });
      await waitFor(() => expect(radiogroup()).toHaveAttribute('aria-busy', 'false'));
      expect(within(radiogroup()).queryAllByRole('radio')).toHaveLength(0);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(false));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'optionsLoadingState', '{{false}}', 'properties');
      });
      await waitFor(() => expect(within(radiogroup()).queryAllByRole('radio')).toHaveLength(2));
      // The selection outlived the spinner.
      expect(radio('Alpha')).toBeChecked();
      expect(widget.exposed().value).toBe('a');
    });

    // Hand-derived from `computedLayoutStyles` (RadioButtonV2.jsx:226-235) with
    // `isDynamicHeightEnabled` true: `row` keeps its horizontal overflow while
    // the other two switch to `visible`, and `wrap` is the only layout that
    // releases `maxHeight`. `height: max-content` is deliberately not asserted
    // — jsdom's CSS parser drops the intrinsic keyword, so that half of the
    // box belongs to `RadioButtonV2-BRW-001` in a real browser.
    test.each([
      ['row', { maxHeight: '', flexWrap: '', overflow: 'auto hidden' }],
      ['column', { maxHeight: '', flexWrap: '', overflow: 'visible' }],
      ['wrap', { maxHeight: 'none', flexWrap: 'wrap', overflow: 'visible' }],
    ])(
      '[RadioButtonV2-STATE-009] the %s layout with dynamic height on gets its own container box',
      (layout, expected) => {
        // Break this catches: `STATE-004` pins the layouts with dynamic height
        // off and `STATE-005` pins the mode gate, so only this crossing stops a
        // refactor from letting a dynamic-height group keep a `100%` cap and
        // clip its own options.
        widget.render({
          properties: {
            options: twoOptions,
            layout: binding(layout),
            dynamicHeight: binding('{{true}}'),
          },
          currentMode: 'view',
        });

        const optionsBox = screen.getAllByRole('radio')[0].closest('.radio-button-container').parentElement;
        expect(optionsBox.style.maxHeight).toBe(expected.maxHeight);
        expect(optionsBox.style.flexWrap).toBe(expected.flexWrap);
        expect(optionsBox.style.overflow).toBe(expected.overflow);
      }
    );

    test('[RadioButtonV2-STATE-006] a state action survives an unrelated property change', async () => {
      // Break this catches: the property-to-state sync effect is guarded by
      // `!==` and keyed on the state properties only. Running it unguarded (or
      // on every render) would revert `setDisable` the moment any other
      // property re-resolves.
      widget.render({ properties: { options: twoOptions } });
      await widget.act('setDisable', true);
      await waitFor(() => expect(radiogroup()).toHaveAttribute('aria-disabled', 'true'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'label', 'Changed by a query', 'properties');
      });

      expect(await screen.findByText('Changed by a query')).toBeInTheDocument();
      expect(radiogroup()).toHaveAttribute('aria-disabled', 'true');
      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('[RadioButtonV2-STATE-007] rewriting a state property with its current value does not revert the action', async () => {
      // Break this catches: the same effect firing on a no-op write — a
      // binding that re-resolves `disabledState` to the value it already had
      // must not undo `setDisable(true)`.
      widget.render({ properties: { options: twoOptions } });
      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
      });

      expect(radiogroup()).toHaveAttribute('aria-disabled', 'true');
      expect(widget.exposed().isDisabled).toBe(true);
    });
  });

  describe('the published surface', () => {
    test('[RadioButtonV2-EXP-001] the widget publishes exactly its documented variables and actions', async () => {
      widget.render({ properties: { options: twoOptions } });

      await waitFor(() => expect(widget.exposed().selectOption).toBeInstanceOf(Function));
      const exposed = widget.exposed();

      expect(exposed.label).toBe('Pick one');
      expect(exposed.value).toBe('b');
      expect(exposed.options).toEqual([
        { label: 'Alpha', value: 'a' },
        { label: 'Beta', value: 'b' },
      ]);
      expect(exposed.isValid).toBe(true);
      expect(exposed.isMandatory).toBe(false);
      expect(exposed.isLoading).toBe(false);
      expect(exposed.isVisible).toBe(true);
      expect(exposed.isDisabled).toBe(false);

      for (const action of ['selectOption', 'deselectOption', 'setVisibility', 'setLoading', 'setDisable']) {
        expect(exposed[action]).toBeInstanceOf(Function);
      }
    });

    test('[RadioButtonV2-EXP-001] a changed label re-renders and republishes the exposed label', async () => {
      widget.render({ properties: { options: twoOptions } });
      expect(await screen.findByText('Pick one')).toBeInTheDocument();

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'label', 'Pick a side', 'properties');
      });

      expect(await screen.findByText('Pick a side')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().label).toBe('Pick a side'));
    });
  });

  describe('Form lifecycle', () => {
    const FORM = 'form1';

    test('[RadioButtonV2-FORM-001] clearing the parent Form clears the radio selection', async () => {
      widget.renderInsideForm({ properties: { options: twoOptions } });

      expect(await screen.findByRole('radio', { name: 'Beta' })).toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe('b'));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toBeNull());
      expect(screen.getByRole('radio', { name: 'Beta' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'Alpha' })).not.toBeChecked();
      // Mounting the Form, the real Container and the child through one graph
      // is the slowest render in this file; the default 5s budget is tight
      // enough to flake on a cold module cache.
    }, 30000);

    test('[RadioButtonV2-FORM-002] clearing a Form leaves a mandatory radio invalid, not reset to its default', async () => {
      // `useFormClear(() => onSelect(null))` revalidates through the same
      // `onSelect` a user click uses. Break this catches: clearing straight to
      // `findDefaultItem(...)` instead of `null` would hand a Form back a
      // value the user never chose and report it as valid.
      widget.renderInsideForm({
        properties: { options: twoOptions },
        validation: { mandatory: binding('{{true}}') },
      });

      expect(await screen.findByRole('radio', { name: 'Beta' })).toBeChecked();
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(widget.exposed().value).toBeNull();
      // Not the schema default, which is what "reset" would have produced.
      expect(screen.getByRole('radio', { name: 'Beta' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'Alpha' })).not.toBeChecked();
    }, 30000);

    test('[RadioButtonV2-FORM-003] clearing a Form also clears a disabled radio', async () => {
      // The clear callback is registered unconditionally
      // (RadioButtonV2.jsx:222). Break this catches: guarding it on
      // `isDisabled` or `isLoading` would strand a stale value in a cleared
      // Form for exactly the fields an app locks down.
      widget.renderInsideForm({ properties: { options: twoOptions } });

      expect(await screen.findByRole('radio', { name: 'Beta' })).toBeChecked();
      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toBeNull());
      expect(screen.getByRole('radio', { name: 'Beta' })).not.toBeChecked();
    }, 30000);
  });

  describe('accessibility', () => {
    test('[RadioButtonV2-A11Y-001] the group exposes radiogroup semantics and associates each option label with its own input', async () => {
      widget.render({
        properties: { options: twoOptions },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      const group = await screen.findByRole('radiogroup');
      expect(group).toHaveAttribute('aria-required', 'true');
      expect(group).toHaveAttribute('aria-busy', 'false');
      expect(group).toHaveAttribute('aria-disabled', 'false');
      expect(group).toHaveAttribute('aria-hidden', 'false');

      // Each option's visible text is its radio's accessible name, which only
      // holds while every label points at its own input.
      const radios = within(group).getAllByRole('radio');
      expect(radios.map((input) => input.id)).toEqual([...new Set(radios.map((input) => input.id))]);
      for (const [index, name] of ['Alpha', 'Beta'].entries()) {
        const input = within(group).getByRole('radio', { name });
        expect(input.closest('label')).toHaveAttribute('for', input.id);
        expect(radios[index]).toBe(input);
      }
    });

    test('[RadioButtonV2-A11Y-002] the group is announced with its label under the default label settings', async () => {
      // The shipped defaults are `auto: true` / `labelWidth: 33`, which is
      // exactly the combination the old `aria-label` branch could never fire
      // for. Break this catches: dropping `aria-labelledby` (or pointing it at
      // an id `Label` does not render) leaves screen readers announcing an
      // unnamed radiogroup.
      widget.render({ properties: { options: twoOptions } });

      expect(await screen.findByRole('radiogroup', { name: 'Pick one' })).toBeInTheDocument();
    });

    test('[RadioButtonV2-A11Y-002] the group claims no accessible name when no label is rendered', async () => {
      // The other half of the same branch: `Label` renders nothing for an
      // empty label, so `aria-labelledby` must not point at an absent element.
      widget.render({ properties: { options: twoOptions, label: binding('') } });

      const group = await screen.findByRole('radiogroup');
      expect(group).not.toHaveAttribute('aria-labelledby');
      expect(group).not.toHaveAttribute('aria-label');
    });
  });
});
