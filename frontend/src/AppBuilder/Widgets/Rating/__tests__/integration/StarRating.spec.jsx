/**
 * StarRating behaviour spec, run against the real RenderWidget/store path.
 *
 * Approved contract: `ee/test/app-builder/widgets/StarRating/TESTING.md`.
 * Every test title starts with its approved scenario ID.
 *
 * The registered component type is `StarRating`; the runtime is `Widgets/Rating/Rating.jsx`,
 * reached through the alias in `editorHelpers.js`. That is why this spec lives under `Rating/`
 * but is named for the component type.
 *
 * DOM seams: the control is a `radiogroup` whose icons are `radio`-role spans carrying
 * aria-checked/posinset/setsize, so value, selection and bounds are all observable without
 * geometry. Half-star selection is driven by pointer coordinates inside an icon and belongs
 * to QA (BRW-001); every interaction here is a click or a key.
 *
 * `styles.labelStyle` picks one of two whole render arms. `standard` is the registered default;
 * `legacy` is what migration 1756792368199 stamps on every pre-3.16 app, so several scenarios
 * assert against both.
 *
 * Four scenarios are RED/GREEN against the production changes D-12 authorized — BIND-005 (D-01),
 * ACT-003 (D-02), STATE-005 (D-04), A11Y-003 (D-10). The rest are characterization, and the ones
 * pinning behaviour the contract records as sharp rather than desirable say so in a comment.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, countInvocationsOn, binding, store } from '../../../__tests__/integration/widgetHarness';

const SR = 'sr1';
const FORM = 'form1';

const widget = createWidgetHarness({
  componentType: 'StarRating',
  handle: 'starrating1',
  id: SR,
  defaultProperties: {
    label: binding('Rate us'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  },
});

/** `labelStyle` is a STYLE key, not a property — it selects the whole render arm. */
const LEGACY_STYLES = { labelStyle: binding('legacy') };

// `hidden: true` because several scenarios deliberately hide the widget, and an
// aria-hidden subtree is invisible to the accessible queries. Visibility itself is
// asserted explicitly, not inferred from whether the query finds anything.
const group = (container) => within(container).getByRole('radiogroup', { hidden: true });
const icons = (container) => within(container).queryAllByRole('radio', { hidden: true });
const labelEl = (container) => container.querySelector('label, .star-rating > span');
const loaderEl = (container) => container.querySelector('.tj-widget-loader');
const liveRegion = (container) => container.querySelector('[role="status"][aria-live="polite"]');
const legacyRoot = (container) => container.querySelector('.star-rating');
const standardRoot = (container) => container.querySelector('.star-rating-container');
const iconFill = (el) => el.querySelector('svg')?.getAttribute('fill');
const checkedCount = (container) => icons(container).filter((el) => el.getAttribute('aria-checked') === 'true').length;

describe('StarRating', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('defaults and mounting', () => {
    test('[StarRating-DEF-001] a rating mounts with its configured default selected', async () => {
      // Break this catches: the mount-time reset never running, which would
      // leave the value at the seeded 0 while the icons show the default —
      // every binding would read a rating the user can plainly see is wrong.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{3}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(3));
      expect(icons(container)).toHaveLength(5);
      expect(checkedCount(container)).toBe(3);
    });

    test('[StarRating-DEF-002] a default of zero leaves every icon unselected', async () => {
      // Break this catches: a falsy guard treating a deliberate 0 as "unset"
      // and substituting the schema default.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{0}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(0));
      expect(icons(container)).toHaveLength(5);
      expect(checkedCount(container)).toBe(0);
    });

    test('[StarRating-DEF-003] a default above the star count is published unclamped', async () => {
      // CHARACTERIZATION (D-05). Not endorsed: every icon draws lit while the
      // published value exceeds the maximum, so a binding reads a rating the
      // control cannot represent.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{8}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(8));
      expect(icons(container)).toHaveLength(5);
      expect(checkedCount(container)).toBe(5);
    });

    test('[StarRating-DEF-003] a half default is honoured even with half ratings off', async () => {
      // CHARACTERIZATION (D-06). The default path applies no rounding at all,
      // while setValue rounds the same input away — the two writers disagree.
      widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{3.5}}'),
          allowHalfStar: binding('{{false}}'),
        },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(3.5));
    });

    test('[StarRating-DEF-004] the configured label renders and is published', async () => {
      const { container } = widget.render({ properties: { label: binding('How did we do?') } });

      expect(await screen.findByText('How did we do?')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().label).toBe('How did we do?'));
      expect(labelEl(container)).toBeInTheDocument();
    });

    test('[StarRating-DEF-005] the label style setting picks the whole render arm', async () => {
      // Break this catches: the arm selection inverting or collapsing, which
      // would change the markup of every migrated app at once.
      const standard = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));
      expect(standardRoot(standard.container)).toBeInTheDocument();
      expect(legacyRoot(standard.container)).toBeNull();
      expect(icons(standard.container)).toHaveLength(5);

      widget.teardown();
      widget.setup();

      const legacy = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
        styles: { ...LEGACY_STYLES },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));
      expect(legacyRoot(legacy.container)).toBeInTheDocument();
      expect(standardRoot(legacy.container)).toBeNull();
      expect(icons(legacy.container)).toHaveLength(5);
      expect(within(legacy.container).getByText('Rate us')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    test('[StarRating-INT-001] clicking an icon sets that rating and fires On change', async () => {
      // Break this catches: the click publishing the raw index instead of the
      // rating, an off-by-one that silently shifts every stored rating by one.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{1}}') },
        events: countInvocationsOn(SR, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      await widget.session.user.click(icons(container)[3]);

      await waitFor(() => expect(widget.exposed().value).toBe(4));
      expect(checkedCount(container)).toBe(4);
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    });

    test('[StarRating-INT-002] Enter and Space commit the focused icon', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{1}}') },
        events: countInvocationsOn(SR, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      icons(container)[2].focus();
      await widget.session.user.keyboard('{Enter}');
      await waitFor(() => expect(widget.exposed().value).toBe(3));

      icons(container)[4].focus();
      await widget.session.user.keyboard(' ');
      await waitFor(() => expect(widget.exposed().value).toBe(5));
      await waitFor(() => expect(widget.variables().calls).toBe(2));
    });

    test('[StarRating-INT-003] a read-only rating ignores interaction but is still announced as disabled', async () => {
      // CHARACTERIZATION. Read-only and disabled are distinct product states
      // that share one aria attribute, so assistive tech cannot tell them apart.
      const { container } = widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{2}}'),
          allowEditing: binding('{{false}}'),
          disabledState: binding('{{false}}'),
        },
        events: countInvocationsOn(SR, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.session.user.click(icons(container)[4]);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(widget.exposed().value).toBe(2);
      expect(widget.variables().calls ?? 0).toBe(0);
      expect(icons(container)[0]).toHaveAttribute('tabindex', '-1');
      expect(icons(container)[0]).toHaveAttribute('aria-disabled', 'true');
    });

    test('[StarRating-INT-004] a keyboard commit inherits the precision left by the last pointer move', async () => {
      // CHARACTERIZATION. The keyboard path reuses the click path, which reads
      // the precision a pointer move stored — so a key press can commit a half
      // rating that the keyboard alone can never select.
      const { container } = widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{1}}'),
          allowHalfStar: binding('{{true}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      const icon = icons(container)[2];
      icon.focus();
      await widget.session.user.keyboard('{Enter}');
      await waitFor(() => expect(widget.exposed().value).toBe(3));
    });

    test('[StarRating-INT-005] hovering previews a rating without committing it', async () => {
      // Break this catches: hover writing through to the published value, which
      // would make a mouse passing over the widget change stored data.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
        styles: { textColor: binding('rgb(1, 2, 3)'), unselectedBackground: binding('rgb(9, 8, 7)') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));
      // Two lit, three empty before any hover.
      expect(icons(container).map(iconFill)).toEqual([
        'rgb(1, 2, 3)',
        'rgb(1, 2, 3)',
        'rgb(9, 8, 7)',
        'rgb(9, 8, 7)',
        'rgb(9, 8, 7)',
      ]);

      await widget.session.user.hover(icons(container)[4]);

      // The preview lights all five WITHOUT touching the committed rating —
      // aria-checked tracks the commit, so the preview is only visible in the fill.
      await waitFor(() => expect(icons(container).every((el) => iconFill(el) === 'rgb(1, 2, 3)')).toBe(true));
      expect(checkedCount(container)).toBe(2);
      expect(widget.exposed().value).toBe(2);

      await widget.session.user.unhover(icons(container)[4]);
      await waitFor(() => expect(iconFill(icons(container)[4])).toBe('rgb(9, 8, 7)'));
      expect(widget.exposed().value).toBe(2);
    });
  });

  describe('bindings and property changes', () => {
    test('[StarRating-BIND-001] a bound label re-resolves and republishes', async () => {
      const { container } = widget.render({ properties: { label: binding('First') } });
      await waitFor(() => expect(widget.exposed().label).toBe('First'));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'label', 'Second', 'properties');
      });

      await waitFor(() => expect(widget.exposed().label).toBe('Second'));
      expect(within(container).getByText('Second')).toBeInTheDocument();
    });

    test('[StarRating-BIND-002] changing the default re-derives the rating', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'defaultSelected', '{{4}}', 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toBe(4));
      expect(checkedCount(container)).toBe(4);
    });

    test('[StarRating-BIND-003] lowering the star count leaves the published value stale', async () => {
      // CHARACTERIZATION (D-05), the higher-risk half: maxRating is usually
      // bound, so a query returning a smaller ceiling strands the value above it.
      const { container } = widget.render({
        properties: { maxRating: binding('{{10}}'), defaultSelected: binding('{{8}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(8));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'maxRating', '{{3}}', 'properties');
      });

      await waitFor(() => expect(icons(container)).toHaveLength(3));
      expect(widget.exposed().value).toBe(8);
    });

    test.each([
      ['zero', '{{0}}'],
      ['a negative number', '{{-4}}'],
      ['null', '{{null}}'],
      ['an unparseable binding', '{{"not a number"}}'],
    ])('[StarRating-BIND-004] a %s star count renders an empty rating rather than erroring', async (_l, value) => {
      // CHARACTERIZATION (D-07). A rejected binding falls to the type's generic
      // fallback of 0 rather than the five the config declares, so the widget
      // renders with no icons at all and no clue why.
      const { container } = widget.render({
        properties: { maxRating: binding(value), defaultSelected: binding('{{3}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(3));
      expect(icons(container)).toHaveLength(0);
      expect(group(container)).toBeInTheDocument();
    });

    test('[StarRating-BIND-005] a fractional star count renders whole icons instead of destroying the widget', async () => {
      // RED/GREEN (D-01). Before the fix a fractional count threw out of render
      // — react-spring cannot size its controller array to 3.5 — and the error
      // boundary replaced the entire widget. The star count is a code field, so
      // any computed binding that divides can produce this.
      const { container } = widget.render({
        properties: { maxRating: binding('{{3.5}}'), defaultSelected: binding('{{2}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(2));
      expect(group(container)).toBeInTheDocument();
      expect(icons(container)).toHaveLength(3);
      expect(checkedCount(container)).toBe(2);
    });
  });

  describe('events', () => {
    test('[StarRating-EVT-001] re-clicking the already-selected icon fires On change again', async () => {
      // (D-11.) The event reports a user act, not a value comparison, so a
      // confirm-by-tapping flow keeps working.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{1}}') },
        events: countInvocationsOn(SR, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      await widget.session.user.click(icons(container)[2]);
      await waitFor(() => expect(widget.variables().calls).toBe(1));
      expect(widget.exposed().value).toBe(3);

      await widget.session.user.click(icons(container)[2]);
      await waitFor(() => expect(widget.variables().calls).toBe(2));
      expect(widget.exposed().value).toBe(3);
    });

    test('[StarRating-EVT-002] only a user interaction fires On change', async () => {
      // (D-03.) setValue, resetValue and Form clear all change the published
      // rating silently. Deliberate: a rating is not something other components
      // recompute from, so the silence is accepted here even though the range
      // slider fires on clear.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
        events: countInvocationsOn(SR, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.act('setValue', 4);
      await waitFor(() => expect(widget.exposed().value).toBe(4));
      expect(widget.variables().calls ?? 0).toBe(0);

      await widget.act('resetValue');
      await waitFor(() => expect(widget.exposed().value).toBe(2));
      expect(widget.variables().calls ?? 0).toBe(0);

      await widget.session.user.click(icons(container)[4]);
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    });
  });

  describe('component specific actions', () => {
    test('[StarRating-ACT-001] setValue sets the rating and clamps it into the star range', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{1}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      await widget.act('setValue', 4);
      await waitFor(() => expect(widget.exposed().value).toBe(4));
      expect(checkedCount(container)).toBe(4);

      await widget.act('setValue', 99);
      await waitFor(() => expect(widget.exposed().value).toBe(5));

      await widget.act('setValue', -3);
      await waitFor(() => expect(widget.exposed().value).toBe(0));
    });

    test('[StarRating-ACT-002] setValue rounds a decimal according to the half-rating setting', async () => {
      widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{1}}'),
          allowHalfStar: binding('{{true}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      await widget.act('setValue', 3.4);
      await waitFor(() => expect(widget.exposed().value).toBe(3.5));

      widget.teardown();
      widget.setup();
      widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{1}}'),
          allowHalfStar: binding('{{false}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      await widget.act('setValue', 3.4);
      await waitFor(() => expect(widget.exposed().value).toBe(3));

      await widget.act('setValue', 3.6);
      await waitFor(() => expect(widget.exposed().value).toBe(4));
    });

    test.each([
      ['a boolean', true],
      ['an object', { a: 1 }],
      ['an array', [3]],
      ['null', null],
      ['undefined', undefined],
      ['an unparseable string', 'abc'],
      ['an empty string', '   '],
      ['NaN', NaN],
    ])('[StarRating-ACT-003] setValue leaves the rating unchanged for %s', async (_label, input) => {
      // RED/GREEN (D-02) for the NaN case. Every other input here was already
      // rejected; a numeric NaN slipped through the type check and landed in
      // the store, where each binding read NaN with the icons simply drawn empty.
      widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.act('setValue', input);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(widget.exposed().value).toBe(2);
    });

    test('[StarRating-ACT-003] setValue accepts a numeric string', async () => {
      widget.render({ properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{1}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      await widget.act('setValue', '4');

      await waitFor(() => expect(widget.exposed().value).toBe(4));
      expect(typeof widget.exposed().value).toBe('number');
    });

    test('[StarRating-ACT-004] resetValue restores the configured default', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.session.user.click(icons(container)[4]);
      await waitFor(() => expect(widget.exposed().value).toBe(5));

      await widget.act('resetValue');
      await waitFor(() => expect(widget.exposed().value).toBe(2));
      expect(checkedCount(container)).toBe(2);
    });

    test('[StarRating-ACT-004] resetValue uses the current default, not the mounted one', async () => {
      widget.render({ properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'defaultSelected', '{{4}}', 'properties');
      });
      await waitFor(() => expect(widget.exposed().value).toBe(4));

      await widget.act('setValue', 1);
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      await widget.act('resetValue');
      await waitFor(() => expect(widget.exposed().value).toBe(4));
    });

    test('[StarRating-ACT-005] the state actions update both the flag and the control', async () => {
      const { container } = widget.render({ properties: { maxRating: binding('{{5}}') } });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      await widget.act('setLoading', true);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(loaderEl(container)).toBeInTheDocument();

      await widget.act('setLoading', false);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(false));

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
      expect(group(container)).toHaveAttribute('aria-disabled', 'true');

      await widget.act('setVisibility', false);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(group(container)).toHaveAttribute('aria-hidden', 'true');
    });

    test('[StarRating-ACT-006] a rating set by action survives an unrelated re-resolve', async () => {
      widget.render({ properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.act('setValue', 5);
      await waitFor(() => expect(widget.exposed().value).toBe(5));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'label', 'Renamed', 'properties');
      });
      await waitFor(() => expect(widget.exposed().label).toBe('Renamed'));

      expect(widget.exposed().value).toBe(5);
    });

    test('[StarRating-ACT-006] a no-op rewrite of the default does not revert the action', async () => {
      widget.render({ properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.act('setValue', 5);
      await waitFor(() => expect(widget.exposed().value).toBe(5));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'defaultSelected', '{{2}}', 'properties');
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(widget.exposed().value).toBe(5);
    });

    test('[StarRating-ACT-006] a genuinely changed default overrides the action', async () => {
      widget.render({ properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.act('setValue', 5);
      await waitFor(() => expect(widget.exposed().value).toBe(5));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'defaultSelected', '{{1}}', 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toBe(1));
    });
  });

  describe('state', () => {
    test('[StarRating-STATE-001] visibility hides the rating without clearing it, in both arms', async () => {
      const standard = widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{3}}'),
          visibility: binding('{{false}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(group(standard.container)).toHaveAttribute('aria-hidden', 'true');
      expect(standardRoot(standard.container)).toHaveClass('invisible');
      expect(widget.exposed().value).toBe(3);

      widget.teardown();
      widget.setup();

      const legacy = widget.render({
        styles: { ...LEGACY_STYLES },
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{3}}'),
          visibility: binding('{{false}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(legacyRoot(legacy.container)).toHaveStyle({ display: 'none' });
      expect(widget.exposed().value).toBe(3);
    });

    test('[StarRating-STATE-001] showing a hidden rating again keeps the same value', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{3}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(3));

      await widget.session.user.click(icons(container)[4]);
      await waitFor(() => expect(widget.exposed().value).toBe(5));

      await widget.act('setVisibility', false);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(widget.exposed().value).toBe(5);

      await widget.act('setVisibility', true);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
      expect(widget.exposed().value).toBe(5);
    });

    test('[StarRating-STATE-002] a disabled rating ignores clicks and leaves the Tab order', async () => {
      const { container } = widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{2}}'),
          disabledState: binding('{{true}}'),
        },
        events: countInvocationsOn(SR, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      expect(group(container)).toHaveAttribute('aria-disabled', 'true');
      expect(icons(container)[0]).toHaveAttribute('tabindex', '-1');

      await widget.session.user.click(icons(container)[4]);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(widget.exposed().value).toBe(2);
      expect(widget.variables().calls ?? 0).toBe(0);
    });

    test('[StarRating-STATE-003] loading replaces the icons with the loader in the standard arm', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), loadingState: binding('{{true}}') },
      });

      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(loaderEl(container)).toBeInTheDocument();
      expect(icons(container)).toHaveLength(0);
    });

    test('[StarRating-STATE-004] state set by action survives an unrelated re-resolve', async () => {
      const { container } = widget.render({ properties: { maxRating: binding('{{5}}') } });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'label', 'Something else', 'properties');
      });
      await waitFor(() => expect(widget.exposed().label).toBe('Something else'));

      expect(widget.exposed().isDisabled).toBe(true);
      expect(group(container)).toHaveAttribute('aria-disabled', 'true');
    });

    test('[StarRating-STATE-004] a no-op rewrite of the paired property does not revert it', async () => {
      widget.render({ properties: { maxRating: binding('{{5}}'), disabledState: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(SR, 'disabledState', '{{false}}', 'properties');
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('[StarRating-STATE-005] setLoading shows the loader on the legacy arm too', async () => {
      // RED/GREEN (D-04). Before the fix the legacy arm rendered its loader from
      // the property rather than the state the action writes, so setLoading
      // flipped the exposed flag with nothing happening on screen — and the
      // migration puts every pre-3.16 app on this arm.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{2}}') },
        styles: { ...LEGACY_STYLES },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));
      expect(icons(container)).toHaveLength(5);

      await widget.act('setLoading', true);

      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(loaderEl(container)).toBeInTheDocument();
      expect(icons(container)).toHaveLength(0);
    });

    test('[StarRating-STATE-005] the loading property still drives the legacy loader', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), loadingState: binding('{{true}}') },
        styles: { ...LEGACY_STYLES },
      });

      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(loaderEl(container)).toBeInTheDocument();
      expect(icons(container)).toHaveLength(0);
    });

    test('[StarRating-STATE-006] the value actions still work while disabled or loading', async () => {
      // CHARACTERIZATION: the CSAs carry no guard, matching Checkbox.
      widget.render({
        properties: {
          maxRating: binding('{{5}}'),
          defaultSelected: binding('{{2}}'),
          disabledState: binding('{{true}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      await widget.act('setValue', 5);
      await waitFor(() => expect(widget.exposed().value).toBe(5));

      await widget.act('setLoading', true);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));

      await widget.act('setValue', 1);
      await waitFor(() => expect(widget.exposed().value).toBe(1));
    });
  });

  describe('Form lifecycle', () => {
    test('[StarRating-FORM-001] clearing the parent Form empties the rating', async () => {
      // CHARACTERIZATION (D-03): the clear target is 0, not the configured
      // default, and it fires no event.
      widget.renderInsideForm({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{4}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(4));
      widget.setEvents(countInvocationsOn(SR, 'onChange'));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toBe(0));
      expect(widget.variables().calls ?? 0).toBe(0);
    }, 30000);

    test('[StarRating-FORM-002] a rating added after a clear keeps its default', async () => {
      widget.renderInsideForm({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{4}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(4));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });
      await waitFor(() => expect(widget.exposed().value).toBe(0));

      const LATE = 'sr2';
      const late = componentDefinition(LATE, 'starrating2', 'StarRating', {
        label: binding('Late'),
        maxRating: binding('{{5}}'),
        defaultSelected: binding('{{4}}'),
        visibility: binding('{{true}}'),
        disabledState: binding('{{false}}'),
        loadingState: binding('{{false}}'),
      });
      late.component.parent = FORM;
      await widget.session.store.act(async () => {
        store().addComponentToCurrentPage([late], 'canvas', { saveAfterAction: false });
      });

      // The snapshot is what keeps the late arrival at its default...
      await waitFor(() => expect(widget.exposed(LATE).value).toBe(4));
      expect(widget.exposed().value).toBe(0);

      // ...and this second clear proves the late arrival really is wired into the
      // Form. Without it the first assertion would hold for a rating that simply
      // never received the signal, making the whole scenario vacuous.
      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });
      await waitFor(() => expect(widget.exposed(LATE).value).toBe(0));
    }, 30000);

    test('[StarRating-FORM-003] a rating never blocks Form submission', async () => {
      // The widget registers no validation at all, so it cannot make a Form
      // invalid however it is configured.
      widget.renderInsideForm({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{0}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(0));

      expect(widget.exposed().isValid).toBeUndefined();
      expect(widget.exposed().isMandatory).toBeUndefined();

      await waitFor(() => expect(widget.exposed(FORM).submitForm).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed(FORM).submitForm();
      });

      expect(widget.exposed().value).toBe(0);
    }, 30000);
  });

  describe('exposed surface', () => {
    test('[StarRating-EXP-001] the widget publishes its documented variable and actions', async () => {
      widget.render({ properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{3}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(3));

      expect(widget.exposed().label).toBe('Rate us');
      expect(widget.exposed().isVisible).toBe(true);
      expect(widget.exposed().isDisabled).toBe(false);
      expect(widget.exposed().isLoading).toBe(false);

      for (const action of ['setValue', 'resetValue', 'setVisibility', 'setDisable', 'setLoading']) {
        await waitFor(() => expect(widget.exposed()[action]).toBeInstanceOf(Function));
      }
    });
  });

  describe('styles', () => {
    test('[StarRating-STY-001] the selected and unselected colours reach the icons', async () => {
      // Break this catches: a colour setting stopping at the inspector, so a
      // builder's brand colour never reaches the stars with nothing else noticing.
      const { container } = widget.render({
        properties: { maxRating: binding('{{4}}'), defaultSelected: binding('{{2}}'), iconType: binding('stars') },
        styles: { textColor: binding('rgb(1, 2, 3)'), unselectedBackground: binding('rgb(9, 8, 7)') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      expect(iconFill(icons(container)[0])).toBe('rgb(1, 2, 3)');
      expect(iconFill(icons(container)[3])).toBe('rgb(9, 8, 7)');
    });

    test('[StarRating-STY-001] the icon type selects which colour setting applies', async () => {
      // Break this catches: the two selected-colour keys being swapped or both
      // read, which would make one icon type ignore its own colour setting.
      const { container } = widget.render({
        properties: { maxRating: binding('{{3}}'), defaultSelected: binding('{{2}}'), iconType: binding('hearts') },
        styles: {
          textColor: binding('rgb(1, 2, 3)'),
          selectedBackgroundHearts: binding('rgb(200, 100, 50)'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      expect(iconFill(icons(container)[0])).toBe('rgb(200, 100, 50)');
      expect(iconFill(icons(container)[0])).not.toBe('rgb(1, 2, 3)');
    });

    test('[StarRating-STY-002] the label styling settings reach the label', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}') },
        styles: { labelColor: binding('rgb(9, 9, 9)'), labelFontSize: binding('{{18}}') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      const label = container.querySelector('label');
      expect(label).toHaveStyle({ fontSize: '18px' });
      expect(within(label).getByText('Rate us')).toHaveStyle({ color: 'rgb(9, 9, 9)' });
    });

    test('[StarRating-STY-002] alignment and direction rearrange the label and icons', async () => {
      const top = widget.render({
        properties: { maxRating: binding('{{5}}') },
        styles: { alignment: binding('top'), auto: binding('{{true}}') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());
      expect(standardRoot(top.container)).toHaveClass('flex-column');

      widget.teardown();
      widget.setup();

      const right = widget.render({
        properties: { maxRating: binding('{{5}}') },
        styles: { alignment: binding('side'), direction: binding('right') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());
      expect(standardRoot(right.container)).toHaveClass('flex-row-reverse');
    });

    test('[StarRating-STY-003] the box shadow reaches the container in both arms', async () => {
      const standard = widget.render({
        properties: { maxRating: binding('{{5}}') },
        styles: { boxShadow: binding('0px 2px 4px 0px rgb(1, 1, 1)') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());
      expect(standardRoot(standard.container)).toHaveStyle({ boxShadow: '0px 2px 4px 0px rgb(1, 1, 1)' });

      widget.teardown();
      widget.setup();

      const legacy = widget.render({
        properties: { maxRating: binding('{{5}}') },
        styles: { ...LEGACY_STYLES, boxShadow: binding('0px 2px 4px 0px rgb(1, 1, 1)') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());
      expect(legacyRoot(legacy.container)).toHaveStyle({ boxShadow: '0px 2px 4px 0px rgb(1, 1, 1)' });
    });
  });

  describe('accessibility', () => {
    test('[StarRating-A11Y-001] each icon exposes its position, state and label', async () => {
      const { container } = widget.render({
        // The registered default ships five tooltips, which become part of each
        // icon's label — cleared here so the positional fallback is what is asserted.
        properties: {
          maxRating: binding('{{4}}'),
          defaultSelected: binding('{{2}}'),
          iconType: binding('stars'),
          tooltips: binding('{{[]}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(2));

      const all = icons(container);
      expect(all).toHaveLength(4);
      all.forEach((el, i) => {
        expect(el).toHaveAttribute('aria-posinset', String(i + 1));
        expect(el).toHaveAttribute('aria-setsize', '4');
      });
      expect(all[0]).toHaveAttribute('aria-checked', 'true');
      expect(all[3]).toHaveAttribute('aria-checked', 'false');
      expect(all[0]).toHaveAttribute('aria-label', '1 out of 4 stars');
    });

    test('[StarRating-A11Y-001] a configured tooltip becomes part of the icon label, and a short list falls back', async () => {
      // Break this catches: the tooltip list being read past its end, or a
      // falsy entry being treated as a real label.
      const { container } = widget.render({
        properties: {
          maxRating: binding('{{3}}'),
          defaultSelected: binding('{{1}}'),
          tooltips: binding("{{['Poor', 0]}}"),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));

      const all = icons(container);
      expect(all[0]).toHaveAttribute('aria-label', '1 out of 3 stars, Poor');
      expect(all[1]).toHaveAttribute('aria-label', '2 out of 3 stars');
      expect(all[2]).toHaveAttribute('aria-label', '3 out of 3 stars');
    });

    test('[StarRating-A11Y-002] a rating change is announced to assistive tech', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{1}}'), iconType: binding('stars') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(1));
      expect(liveRegion(container)).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion(container)).toHaveTextContent('');

      await widget.session.user.click(icons(container)[3]);

      await waitFor(() => expect(liveRegion(container)).toHaveTextContent('4 out of 5 stars'));
    });

    test('[StarRating-A11Y-003] the rating group carries an accessible name in the standard arm', async () => {
      // RED/GREEN (D-10). Before the fix the group was named only when auto
      // width was off AND the manual width was zero — never in the default
      // configuration — so every rating reached assistive tech as an anonymous
      // group of radio buttons.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), label: binding('Service quality') },
        styles: { auto: binding('{{true}}') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(group(container)).toHaveAccessibleName('Service quality');
    });

    test('[StarRating-A11Y-003] the rating group carries an accessible name in the legacy arm', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), label: binding('Service quality') },
        styles: { ...LEGACY_STYLES },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(group(container)).toHaveAccessibleName('Service quality');
    });

    test('[StarRating-A11Y-003] the manual-zero-width naming path still works', async () => {
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), label: binding('Squeezed') },
        styles: { auto: binding('{{false}}'), labelWidth: binding('{{0}}') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(group(container)).toHaveAccessibleName('Squeezed');
    });
  });

  describe('instance isolation', () => {
    test('[StarRating-ISO-001] two ratings on one page stay independent', async () => {
      const OTHER = 'sr2';
      const { container } = widget.render({
        properties: { label: binding('First'), maxRating: binding('{{5}}'), defaultSelected: binding('{{1}}') },
        extraComponents: {
          [OTHER]: componentDefinition(OTHER, 'starrating2', 'StarRating', {
            label: binding('Second'),
            maxRating: binding('{{5}}'),
            defaultSelected: binding('{{4}}'),
            visibility: binding('{{true}}'),
            disabledState: binding('{{false}}'),
            loadingState: binding('{{false}}'),
          }),
        },
        also: [{ id: OTHER, componentType: 'StarRating' }],
      });

      await waitFor(() => expect(widget.exposed(SR).value).toBe(1));
      await waitFor(() => expect(widget.exposed(OTHER).value).toBe(4));

      const groups = within(container).getAllByRole('radiogroup', { hidden: true });
      expect(groups).toHaveLength(2);
      // Each group must be named by its OWN label, not a shared one — the class of
      // bug where a shared DOM id makes every instance point at the first label.
      expect(groups[0]).toHaveAccessibleName('First');
      expect(groups[1]).toHaveAccessibleName('Second');

      await widget.session.user.click(within(groups[0]).getAllByRole('radio')[2]);

      await waitFor(() => expect(widget.exposed(SR).value).toBe(3));
      expect(widget.exposed(OTHER).value).toBe(4);
    });
  });

  describe('saved-app compatibility', () => {
    test('[StarRating-COMPAT-001] a pre-migration saved definition still renders', async () => {
      // Break this catches: the widget requiring a key that a pre-3.16 saved app
      // cannot have. The migration moves visibility/disabled out of styles, the
      // tooltip out of general and the shadow out of generalStyles, and stamps
      // the legacy label style — so a migrated definition lands on the legacy arm
      // with the current property shape.
      const { container } = widget.render({
        properties: { maxRating: binding('{{5}}'), defaultSelected: binding('{{3}}') },
        styles: { ...LEGACY_STYLES, labelColor: binding('rgb(51, 51, 51)') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(3));
      expect(legacyRoot(container)).toBeInTheDocument();
      expect(within(container).getByText('Rate us')).toBeInTheDocument();
      expect(icons(container)).toHaveLength(5);
      expect(checkedCount(container)).toBe(3);
    });
  });
});
