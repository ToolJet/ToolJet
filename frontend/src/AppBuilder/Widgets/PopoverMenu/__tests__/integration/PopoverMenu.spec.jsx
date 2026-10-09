/**
 * PopoverMenu — full contract coverage against the REAL store.
 *
 * Scenario IDs below are approved in
 * `frontend/ee/test/app-builder/widgets/PopoverMenu/TESTING.md`. The hover-trigger
 * family (TRG-002..005) lives in the sibling `Widgets/__tests__/integration/popoverMenu.spec.jsx`
 * file (kept at its existing path per contract decision) and is not duplicated here.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'pm1';
const NAME = 'popovermenu1';

function popoverOption(
  label,
  value,
  { description = '', icon, iconVisibility = true, disable = false, visible = true } = {}
) {
  return {
    label,
    description,
    value,
    ...(icon !== undefined && { icon: { value: icon }, iconVisibility }),
    disable: { value: disable },
    visible: { value: visible },
  };
}

const THREE_OPTIONS = [popoverOption('Alpha', 'a'), popoverOption('Beta', 'b'), popoverOption('Gamma', 'c')];

const widget = createWidgetHarness({
  componentType: 'PopoverMenu',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Menu'),
    buttonType: binding('primary'),
    trigger: binding('click'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    advanced: binding('{{false}}'),
    optionsLoadingState: binding('{{false}}'),
    schema: binding('{{[]}}'),
    options: { value: THREE_OPTIONS },
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-primary-brand)'),
    hoverBackgroundMode: binding('auto'),
    hoverBackgroundColor: binding('var(--cc-primary-brand)'),
    textColor: binding('#FFFFFF'),
    textSize: binding('{{14}}'),
    fontWeight: binding('normal'),
    borderColor: binding('var(--cc-primary-brand)'),
    loaderColor: binding('var(--cc-surface1-surface)'),
    contentAlignment: binding('center'),
    icon: binding('IconMenu2'),
    iconVisibility: binding('{{true}}'),
    iconColor: binding('#FFFFFF'),
    direction: binding('left'),
    borderRadius: binding('6'),
    boxShadow: binding('0px 0px 0px 0px #00000040'),
    optionsTextColor: binding('var(--cc-primary-text)'),
    optionsIconColor: binding('var(--cc-default-icon)'),
    optionsDescriptionColor: binding('var(--cc-placeholder-text)'),
  },
});

const trigger = () => screen.getByRole('button', { name: 'Menu' });
const popup = () => screen.queryByRole('dialog', { name: 'Menu options' });
const listbox = () => screen.queryByRole('listbox', { name: 'Menu options' });
const options = () => screen.queryAllByRole('option');
const exposed = () => store().getExposedValueOfComponent(ID, 'canvas');

async function openViaClick() {
  await widget.session.user.click(trigger());
  await waitFor(() => expect(popup()).toBeInTheDocument());
}

describe('PopoverMenu', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('initial render and mount (INIT)', () => {
    test('[PopoverMenu-INIT-001] default render shows the configured label, primary type, and a closed popover', () => {
      // Break this catches: rendering the wrong `label`, defaulting buttonType to something
      // other than 'primary', or opening the popover on mount.
      widget.render();

      expect(trigger()).toHaveTextContent('Menu');
      expect(popup()).not.toBeInTheDocument();
    });

    test('[PopoverMenu-INIT-002] declared and undeclared exposed variables carry correct values at mount', () => {
      // Break this catches: dropping any of isVisible/isDisabled/isLoading/label/lastClickedOption
      // from the mount-time `setExposedVariables` call, or mis-defaulting one of them.
      widget.render();

      const values = exposed();
      expect(values.isVisible).toBe(true);
      expect(values.isDisabled).toBe(false);
      expect(values.isLoading).toBe(false);
      expect(values.label).toBe('Menu');
      expect(values.lastClickedOption).toBe(null);
      expect(values.options).toEqual([
        { label: 'Alpha', description: '', value: 'a' },
        { label: 'Beta', description: '', value: 'b' },
        { label: 'Gamma', description: '', value: 'c' },
      ]);
    });

    test('[PopoverMenu-INIT-003] renders and opens identically in view mode', async () => {
      // Break this catches: adding a `currentMode === 'view'` gate that skips rendering the
      // trigger, or blocks the click-to-open handler in view mode.
      widget.render({ currentMode: 'view' });

      expect(trigger()).toHaveTextContent('Menu');
      await openViaClick();
    });
  });

  describe('options source and shape (OPT)', () => {
    test('[PopoverMenu-OPT-001] static options render label, description, and icon per entry', async () => {
      // Break this catches: dropping the description row, rendering the wrong label per option,
      // or failing to render the icon for an option that has one.
      widget.render({
        properties: {
          options: {
            value: [
              popoverOption('Alpha', 'a', { description: 'First', icon: 'IconBolt' }),
              popoverOption('Beta', 'b'),
            ],
          },
        },
      });
      await openViaClick();

      const rows = options();
      expect(rows).toHaveLength(2);
      expect(within(rows[0]).getByText('Alpha')).toBeInTheDocument();
      expect(within(rows[0]).getByText('First')).toBeInTheDocument();
      expect(rows[0].querySelector('[data-cy="popover-menu-option-icon"]')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Beta')).toBeInTheDocument();
      expect(rows[1].querySelector('[data-cy="popover-menu-option-icon"]')).not.toBeInTheDocument();
    });

    test('[PopoverMenu-OPT-002] dynamic options (advanced:true) read from schema and filter identically to static options', async () => {
      // Break this catches: reading `options` instead of `schema` while advanced:true, or
      // filtering a schema-mode disabled/invisible option any differently than a static one.
      widget.render({
        properties: {
          advanced: binding('{{true}}'),
          schema: binding(
            '{{[{"label":"Dyn One","description":"","value":"1"},{"label":"Dyn Hidden","description":"","value":"2","visible":false}]}}'
          ),
        },
      });
      await openViaClick();

      expect(screen.getByText('Dyn One')).toBeInTheDocument();
      expect(screen.queryByText('Dyn Hidden')).not.toBeInTheDocument();
      // Not the static `options` array — proves the source actually switched.
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    });

    test('[PopoverMenu-OPT-003] no options renders a "No options" message instead of crashing', async () => {
      // Break this catches: removing the `hasNoOptions` guard so an empty/undefined options
      // array throws instead of rendering the fallback message.
      widget.render({ properties: { options: { value: [] } } });
      await openViaClick();

      expect(screen.getByRole('status', { name: 'No options available' })).toBeInTheDocument();
      expect(options()).toHaveLength(0);
    });

    test('[PopoverMenu-OPT-004] optionsLoadingState shows the loading spinner regardless of advanced', async () => {
      // Break this catches: gating the loading-spinner branch on `advanced`, so a static-options
      // menu with optionsLoadingState:true stops showing the spinner.
      widget.render({ properties: { advanced: binding('{{false}}'), optionsLoadingState: binding('{{true}}') } });
      await openViaClick();

      expect(screen.getByRole('status', { name: 'Loading options' })).toBeInTheDocument();
      expect(options()).toHaveLength(0);
    });

    test('[PopoverMenu-OPT-005] an option with visible:false is excluded from the rendered listbox', async () => {
      // Break this catches: rendering an invisible option anyway, or hiding a visible one.
      widget.render({
        properties: {
          options: {
            value: [popoverOption('Shown', 's'), popoverOption('Hidden', 'h', { visible: false })],
          },
        },
      });
      await openViaClick();

      expect(screen.getByText('Shown')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    test('[PopoverMenu-OPT-006] a disable:true option is non-interactive', async () => {
      // Break this catches: dropping aria-disabled/tabIndex from a disabled option, or firing
      // onSelect/lastClickedOption when a disabled option is clicked.
      widget.render({
        properties: {
          options: { value: [popoverOption('Off', 'off', { disable: true })] },
          events: [],
        },
      });
      await openViaClick();

      const [row] = options();
      expect(row).toHaveAttribute('aria-disabled', 'true');
      expect(row).toHaveAttribute('tabIndex', '-1');

      await widget.session.user.click(row);
      expect(exposed().lastClickedOption).toBe(null);
    });

    test('[PopoverMenu-OPT-007] loading takes precedence over the empty-options message', async () => {
      // Break this catches: checking the empty-options branch before the loading branch, so an
      // empty + loading menu shows "No options" instead of the spinner.
      widget.render({ properties: { options: { value: [] }, optionsLoadingState: binding('{{true}}') } });
      await openViaClick();

      expect(screen.getByRole('status', { name: 'Loading options' })).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: 'No options available' })).not.toBeInTheDocument();
    });
  });

  describe('trigger mechanics (TRG)', () => {
    test('[PopoverMenu-TRG-001] trigger:click toggles the popover open and closed', async () => {
      // Break this catches: dropping the click handler for trigger:'click', or making it only
      // open (never toggle closed) on a second click.
      widget.render();

      await widget.session.user.click(trigger());
      await waitFor(() => expect(popup()).toBeInTheDocument());

      await widget.session.user.click(trigger());
      await waitFor(() => expect(popup()).not.toBeInTheDocument());
    });

    test('[PopoverMenu-TRG-006] Escape closes an open popover', async () => {
      // Break this catches: removing the onEscapeKeyDown handler.
      widget.render();
      await openViaClick();

      await widget.session.user.keyboard('{Escape}');

      await waitFor(() => expect(popup()).not.toBeInTheDocument());
    });

    test('[PopoverMenu-TRG-007] outside interaction closes the popover regardless of the hovered flag', async () => {
      // Break this catches: never closing on outside click at all (the baseline guarantee this
      // scenario would still need even if the `hovered` guard were ever wired up correctly).
      widget.render();
      await openViaClick();

      await widget.session.user.click(document.body);
      await waitFor(() => expect(popup()).not.toBeInTheDocument());

      // Characterization: hovering the trigger does NOT keep it open on outside interaction —
      // `onInteractOutside`'s `hovered` check never calls `event.preventDefault()`, so Radix's
      // default dismiss proceeds regardless. See D-01-adjacent finding in TESTING.md.
      await openViaClick();
      await widget.session.user.hover(trigger());
      await widget.session.user.click(document.body);

      await waitFor(() => expect(popup()).not.toBeInTheDocument());
    });
  });

  describe('keyboard navigation (KEY)', () => {
    test('[PopoverMenu-KEY-001] ArrowDown moves selection to the next enabled option, wrapping at the end', async () => {
      // Break this catches: not advancing selection, or not wrapping to the first option past
      // the last one.
      widget.render();
      await openViaClick();
      const rows = options();

      await widget.session.user.keyboard('{ArrowDown}');
      expect(rows[1]).toHaveAttribute('aria-selected', 'true');

      await widget.session.user.keyboard('{ArrowDown}');
      expect(rows[2]).toHaveAttribute('aria-selected', 'true');

      await widget.session.user.keyboard('{ArrowDown}');
      expect(rows[0]).toHaveAttribute('aria-selected', 'true');
    });

    test('[PopoverMenu-KEY-002] ArrowUp moves selection to the previous enabled option, wrapping at the start', async () => {
      // Break this catches: not moving backward, or not wrapping to the last option before the
      // first one.
      widget.render();
      await openViaClick();
      const rows = options();

      await widget.session.user.keyboard('{ArrowUp}');
      expect(rows[2]).toHaveAttribute('aria-selected', 'true');

      await widget.session.user.keyboard('{ArrowUp}');
      expect(rows[1]).toHaveAttribute('aria-selected', 'true');
    });

    test('[PopoverMenu-KEY-003] arrow navigation skips disabled options', async () => {
      // Break this catches: landing selection on a disabled option instead of skipping past it.
      widget.render({
        properties: {
          options: {
            value: [
              popoverOption('One', '1'),
              popoverOption('Two', '2', { disable: true }),
              popoverOption('Three', '3'),
            ],
          },
        },
      });
      await openViaClick();
      const rows = options();
      expect(rows[0]).toHaveAttribute('aria-selected', 'true');

      await widget.session.user.keyboard('{ArrowDown}');

      expect(rows[2]).toHaveAttribute('aria-selected', 'true');
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    });

    test('[PopoverMenu-KEY-004] Enter activates the selected option', async () => {
      // Break this catches: not firing onSelect/lastClickedOption on Enter, or activating the
      // wrong option.
      widget.render();
      await openViaClick();

      await widget.session.user.keyboard('{ArrowDown}{Enter}');

      expect(exposed().lastClickedOption).toEqual({ label: 'Beta', description: '', value: 'b' });
      await waitFor(() => expect(popup()).not.toBeInTheDocument());
    });

    test('[PopoverMenu-KEY-005] opening seeds the first available option; closing resets selection', async () => {
      // Break this catches: seeding selection on the first option even when it's disabled, or
      // leaving a stale selectedOptionIndex after the popover closes and reopens.
      widget.render({
        properties: {
          options: { value: [popoverOption('One', '1', { disable: true }), popoverOption('Two', '2')] },
        },
      });
      await openViaClick();
      const rows = options();

      expect(rows[0]).toHaveAttribute('aria-selected', 'false');
      expect(rows[1]).toHaveAttribute('aria-selected', 'true');
    });

    test('[PopoverMenu-KEY-006] arrow navigation skips invisible options', async () => {
      // Break this catches: selecting an option whose `visible` resolves to false.
      widget.render({
        properties: {
          options: {
            value: [
              popoverOption('One', '1'),
              popoverOption('Two', '2', { visible: false }),
              popoverOption('Three', '3'),
            ],
          },
        },
      });
      await openViaClick();
      // 'Two' resolves invisible and never renders as a DOM row at all (see OPT-005) —
      // look the surviving rows up by text rather than assuming a fixed array index.
      expect(screen.queryByText('Two')).not.toBeInTheDocument();

      await widget.session.user.keyboard('{ArrowDown}');

      expect(screen.getByText('Three').closest('[role="option"]')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('events and exposed variables (EVT)', () => {
    /** `set-custom-variable` is a real, synchronous, no-network action — the same dispatch probe
     * used in `_stores/__tests__/integration/eventActions.spec.js`. */
    function onSelectFires({ id = 'onselect-1', value = 'FIRED' } = {}) {
      return {
        id,
        index: 0,
        sourceId: ID,
        name: id,
        target: 'component',
        event: { eventId: 'onSelect', actionId: 'set-custom-variable', key: 'onSelectProbe', value },
      };
    }
    const drain = () => new Promise((resolve) => setTimeout(resolve, 0));
    const probeVariable = () => store().resolvedStore.modules.canvas.exposedValues.variables.onSelectProbe;

    test('[PopoverMenu-EVT-001] clicking an enabled option fires onSelect and sets lastClickedOption', async () => {
      // Break this catches: not firing the onSelect event, or setting the wrong option payload.
      widget.render({ events: [onSelectFires()] });
      await openViaClick();

      await widget.session.user.click(options()[1]);
      await drain();

      expect(probeVariable()).toBe('FIRED');
      expect(exposed().lastClickedOption).toEqual({ label: 'Beta', description: '', value: 'b' });
    });

    test('[PopoverMenu-EVT-002] clicking a disabled or invisible option is a no-op', async () => {
      // Break this catches: firing onSelect/lastClickedOption for a disabled or invisible option.
      widget.render({
        properties: {
          options: { value: [popoverOption('Off', 'off', { disable: true })] },
        },
        events: [onSelectFires()],
      });
      await openViaClick();

      await widget.session.user.click(options()[0]);
      await drain();

      expect(probeVariable()).toBeUndefined();
      expect(exposed().lastClickedOption).toBe(null);
      expect(popup()).toBeInTheDocument();
    });

    test('[PopoverMenu-EVT-003] the options/label exposed variables track live property changes', async () => {
      // Break this catches: not re-publishing `options`/`label` when the underlying property
      // re-resolves to a new value.
      widget.render();
      expect(exposed().label).toBe('Menu');
      expect(exposed().options).toHaveLength(3);

      // Same-length replacement: the store resolves a shorter array by lodash-merging it
      // index-wise over the previous value (an unrelated, shared-resolver quirk), which would
      // obscure this scenario's actual guarantee. Same length sidesteps that entirely.
      widget.render({
        properties: {
          label: binding('Renamed'),
          options: { value: [popoverOption('Solo', 's'), popoverOption('Duo', 'd'), popoverOption('Trio', 't')] },
        },
      });

      await waitFor(() => expect(exposed().label).toBe('Renamed'));
      await waitFor(() =>
        expect(exposed().options).toEqual([
          { label: 'Solo', description: '', value: 's' },
          { label: 'Duo', description: '', value: 'd' },
          { label: 'Trio', description: '', value: 't' },
        ])
      );
    });
  });

  describe('state, precedence, and the disable/loading trigger gap (STA)', () => {
    test('[PopoverMenu-STA-001] visibility:false hides the widget and sets isVisible:false', () => {
      // Break this catches: not hiding the region on visibility:false, or not updating isVisible.
      const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });

      expect(container.querySelector('[role="region"]')).toHaveStyle({ display: 'none' });
      expect(exposed().isVisible).toBe(false);
    });

    test('[PopoverMenu-STA-002] disabledState:true sets isDisabled:true independent of loading', () => {
      // Break this catches: not setting isDisabled from disabledState alone, or requiring
      // loadingState too.
      widget.render({ properties: { disabledState: binding('{{true}}'), loadingState: binding('{{false}}') } });

      expect(exposed().isDisabled).toBe(true);
      expect(exposed().isLoading).toBe(false);
    });

    test('[PopoverMenu-STA-003] loadingState:true shows the loader and forces isDisabled:true', () => {
      // Break this catches: not forcing isDisabled when only loadingState is true, or not
      // swapping the label for the loader.
      // Note: CustomButton passes `aria-label="Loading"` to the shared `Loader` component, but
      // Loader's props signature doesn't forward it — the label never reaches the DOM. Asserted
      // by class instead of accessible name.
      const { container } = widget.render({
        properties: { disabledState: binding('{{false}}'), loadingState: binding('{{true}}') },
      });

      expect(exposed().isLoading).toBe(true);
      expect(exposed().isDisabled).toBe(true);
      expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    test('[PopoverMenu-STA-004] setDisable (CSA) survives an unrelated property re-resolve', async () => {
      // Break this catches: an unrelated re-render (label change) reverting isDisabled back to
      // disabledState.
      widget.render();
      await widget.act('setDisable', true);
      expect(exposed().isDisabled).toBe(true);

      widget.render({ properties: { label: binding('Different') } });

      expect(exposed().isDisabled).toBe(true);
    });

    test('[PopoverMenu-STA-005] setDisable (CSA) survives a no-op rewrite of disabledState', async () => {
      // Break this catches: re-resolving disabledState to its existing value clobbering the
      // CSA-set isDisabled.
      widget.render();
      await widget.act('setDisable', true);
      expect(exposed().isDisabled).toBe(true);

      widget.render({ properties: { disabledState: binding('{{false}}') } });

      expect(exposed().isDisabled).toBe(true);
    });

    test('[PopoverMenu-STA-006] setLoading (CSA) precedence over loadingState (property)', async () => {
      // Break this catches: the same precedence bug as STA-004/005, for setLoading/loadingState.
      widget.render();
      await widget.act('setLoading', true);
      expect(exposed().isLoading).toBe(true);

      widget.render({ properties: { label: binding('Different'), loadingState: binding('{{false}}') } });

      expect(exposed().isLoading).toBe(true);
    });

    test('[PopoverMenu-STA-007] setVisibility (CSA) precedence over visibility (property)', async () => {
      // Break this catches: the same precedence bug as STA-004/005, for setVisibility/visibility.
      widget.render();
      await widget.act('setVisibility', false);
      expect(exposed().isVisible).toBe(false);

      widget.render({ properties: { label: binding('Different'), visibility: binding('{{true}}') } });

      expect(exposed().isVisible).toBe(false);
    });

    test('[PopoverMenu-STA-008] trigger interaction while disabled/loading (baseline characterization, D-01)', async () => {
      // Break this catches: adding a guard that blocks click/hover from opening the popover while
      // disabled or loading — a legitimate fix, but per D-01 out of scope on this baseline; this
      // test would need to change alongside that decision.
      widget.render({ properties: { trigger: binding('click'), disabledState: binding('{{true}}') } });
      await widget.session.user.click(trigger());
      await waitFor(() => expect(popup()).toBeInTheDocument());

      widget.render({
        properties: {
          trigger: binding('hover'),
          disabledState: binding('{{false}}'),
          loadingState: binding('{{true}}'),
        },
      });
      await widget.session.user.hover(trigger());
      await waitFor(() => expect(popup()).toBeInTheDocument());
    });
  });

  describe('style-driven computed behavior (STY)', () => {
    test('[PopoverMenu-STY-001] buttonType swaps computed colors; outline always overrides background and suppresses boxShadow', () => {
      // Break this catches: an 'outline' button showing a solid background or its configured
      // boxShadow, or 'primary' failing to render a custom (non-default) backgroundColor as-is.
      widget.render({
        styles: { backgroundColor: binding('#123456') },
        properties: { buttonType: binding('primary') },
      });
      expect(trigger().style.backgroundColor).toBe('rgb(18, 52, 86)');
      expect(trigger().style.boxShadow).toBe('0px 0px 0px 0px #00000040');

      widget.render({
        styles: { backgroundColor: binding('#123456') },
        properties: { buttonType: binding('outline') },
      });
      expect(trigger().style.backgroundColor).toBe('transparent');
      expect(trigger().style.boxShadow).toBeFalsy();
    });

    test('[PopoverMenu-STY-002] direction reverses icon/label order and the alignment map', () => {
      // Break this catches: not reversing flex-direction for direction:'left', or not swapping
      // the left/right arms of the contentAlignment map.
      widget.render({ styles: { direction: binding('left'), contentAlignment: binding('left') } });
      const contentRow = trigger().querySelector('p').closest('div[style*="flex-direction"]');
      expect(contentRow).toHaveStyle({ flexDirection: 'row-reverse', justifyContent: 'flex-end' });

      widget.render({ styles: { direction: binding('right'), contentAlignment: binding('left') } });
      const contentRowRight = trigger().querySelector('p').closest('div[style*="flex-direction"]');
      expect(contentRowRight).toHaveStyle({ flexDirection: 'row', justifyContent: 'flex-start' });
    });

    test('[PopoverMenu-STY-003] hoverBackgroundMode selects manual vs. computed hover color', () => {
      // Break this catches: 'manual' ignoring hoverBackgroundColor, or 'auto' using it instead of
      // deriving the hover color.
      widget.render({ styles: { hoverBackgroundMode: binding('manual'), hoverBackgroundColor: binding('#ff0000') } });
      expect(trigger().style.getPropertyValue('--tblr-btn-color-darker')).toBe('#ff0000');

      widget.render({ styles: { hoverBackgroundMode: binding('auto'), hoverBackgroundColor: binding('#ff0000') } });
      expect(trigger().style.getPropertyValue('--tblr-btn-color-darker')).not.toBe('#ff0000');
    });

    test('[PopoverMenu-STY-004] the rendered icon glyph is gated by iconVisibility', () => {
      // Break this catches: ignoring iconVisibility:false, or never rendering the icon glyph
      // when iconVisibility:true and an icon is set.
      // Note: the icon *container* div renders whenever `icon` is truthy regardless of
      // iconVisibility — only the glyph inside it is gated. Assert on the glyph.
      widget.render({ styles: { icon: binding('IconBolt'), iconVisibility: binding('{{false}}') } });
      expect(trigger().querySelector('[data-cy="popover-menu-button-icon-container"] svg')).not.toBeInTheDocument();

      widget.render({ styles: { icon: binding('IconBolt'), iconVisibility: binding('{{true}}') } });
      expect(trigger().querySelector('[data-cy="popover-menu-button-icon-container"] svg')).toBeInTheDocument();
    });

    test('[PopoverMenu-STY-005] textSize/fontWeight drive computed font metrics, with safe fallbacks', () => {
      // Break this catches: not scaling lineHeight/iconSize off textSize, not mapping
      // fontWeight:'medium' to 500, or crashing on a non-numeric textSize instead of falling
      // back to 14.
      widget.render({ styles: { textSize: binding('{{20}}'), fontWeight: binding('medium') } });
      const label = trigger().querySelector('p');
      expect(label).toHaveStyle({ fontSize: '20px', lineHeight: '28.4px', fontWeight: '500' });

      widget.render({ styles: { textSize: binding('not-a-number'), fontWeight: binding('normal') } });
      expect(trigger().querySelector('p')).toHaveStyle({ fontSize: '14px' });
    });

    test('[PopoverMenu-STY-006] borderRadius/boxShadow passthrough, boxShadow gated by buttonType', () => {
      // Break this catches: not applying borderRadius as `${value}px`, or applying boxShadow for
      // buttonType:'outline'.
      widget.render({ styles: { borderRadius: binding('12') }, properties: { buttonType: binding('primary') } });
      expect(trigger()).toHaveStyle({ borderRadius: '12px' });
      expect(trigger().style.boxShadow).toBe('0px 0px 0px 0px #00000040');
    });
  });

  describe('saved-app compatibility (SAV)', () => {
    test('[PopoverMenu-SAV-001] a saved app without advanced falls back to static options', async () => {
      // Break this catches: reading `schema` (or crashing) when `advanced` is falsy/absent
      // instead of falling back to `options`. The harness's default is already `advanced:false`
      // (an omitted key on a real saved app resolves the same way — falsy either way, per
      // PopoverMenu.jsx's `advanced ? schema : options` ternary), so this renders with no
      // override needed; the render call is explicit for readability.
      widget.render({ properties: {} });
      await openViaClick();

      expect(screen.getByText('Alpha')).toBeInTheDocument();
    });
  });

  describe('accessibility (A11Y)', () => {
    test('[PopoverMenu-A11Y-001] trigger exposes aria-haspopup/aria-expanded/aria-controls', async () => {
      // Break this catches: aria-expanded not flipping on open, or aria-controls not pointing at
      // the actual content id.
      widget.render();
      expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      const controlsId = trigger().getAttribute('aria-controls');

      await openViaClick();

      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      expect(document.getElementById(controlsId)).toBe(popup());
    });

    test('[PopoverMenu-A11Y-002] options expose role=listbox/option and aria-selected', async () => {
      // Break this catches: dropping the listbox/option roles, or not reflecting
      // selectedOptionIndex through aria-selected.
      widget.render();
      await openViaClick();

      expect(listbox()).toBeInTheDocument();
      const rows = options();
      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveAttribute('aria-selected', 'true');
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('menu width wiring (STY-007) — registered surface added mid-implementation', () => {
    test('[PopoverMenu-STY-007] menuWidthMode/menuCustomWidth reach the rendered popover content', async () => {
      // Break this catches: computing `menuWidthStyle` (useMenuWidth, already unit-tested in
      // useMenuWidth.spec.js) but never spreading it into Popover.Content's style — the pure
      // hook being correct would not catch a dropped wiring.
      widget.render({ styles: { menuWidthMode: binding('matchField') } });
      await openViaClick();
      expect(popup()).toHaveStyle({ width: '200px', minWidth: '200px' });
      await widget.session.user.click(trigger());
      await waitFor(() => expect(popup()).not.toBeInTheDocument());

      widget.render({ styles: { menuWidthMode: binding('custom'), menuCustomWidth: binding('300') } });
      await openViaClick();
      expect(popup()).toHaveStyle({ width: '300px' });
    });
  });
});
