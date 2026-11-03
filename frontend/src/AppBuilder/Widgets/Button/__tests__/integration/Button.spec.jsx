/**
 * Button widget — approved contract at
 * frontend/ee/test/app-builder/widgets/Button/TESTING.md is the single source of truth.
 * Test titles carry their `[Button-FAMILY-NNN]` scenario ID per the widget-testing-contract validator.
 *
 * Real store, real RenderWidget, real Button. Nothing about the widget is mocked.
 * Button uses the manual exposed-state pattern (no useExposeState): local disable/loading/visibility,
 * onClick fires only when !disable && !loading (Button.jsx:123,198), onHover fires on mouseOver.
 */
import { waitFor, fireEvent as rtlFireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'btn1';
const NAME = 'button1';

const widget = createWidgetHarness({
  componentType: 'Button',
  handle: NAME,
  id: ID,
  // Baseline is button.js's own definition (text default 'Button', states false/true).
  defaultProperties: {
    text: binding('Button'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
  },
  defaultStyles: { type: binding('primary') },
});

const btn = () => document.querySelector('button.jet-btn');
const labelEl = () => document.querySelector('[data-cy$="-label"]');
const label = () => labelEl()?.textContent;
const iconEl = () => document.querySelector('[data-cy$="-icon"]');
const exposed = (key) => widget.exposed()?.[key];

const onClickCapture = setVariableOn(ID, 'onClick', { key: 'clicked', value: 'yes' });
const onHoverCapture = setVariableOn(ID, 'onHover', { key: 'hovered', value: 'yes' });
const clicked = () => store().getVariable('clicked', MODULE_ID);
const hovered = () => store().getVariable('hovered', MODULE_ID);

describe('Button: default rendering, label, and click/hover events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Button-DEF-001] renders the configured label and exposes it as buttonText', async () => {
    // Break this catches: Button.jsx:44 no longer seeding buttonText from properties.text,
    // or the label <p> (data-cy `-label`) no longer rendering properties.text.
    widget.render({ properties: { text: binding('Save') } });

    await waitFor(() => expect(btn()).toBeInTheDocument());
    expect(label()).toBe('Save');
    expect(exposed('buttonText')).toBe('Save');
  });

  test('[Button-TEXT-001] setText updates the visible label and buttonText', async () => {
    // Break this catches: the setText CSA (Button.jsx:132-135) dropping setLabel or the buttonText write.
    widget.render();
    await waitFor(() => expect(btn()).toBeInTheDocument());

    await widget.act('setText', 'Update');

    await waitFor(() => expect(label()).toBe('Update'));
    expect(exposed('buttonText')).toBe('Update');
  });

  test('[Button-TEXT-002] an empty label renders without crashing and exposes an empty buttonText', async () => {
    // Break this catches: an unguarded render of a non-string/empty label. Pins the empty boundary.
    widget.render({ properties: { text: binding('') } });

    await waitFor(() => expect(btn()).toBeInTheDocument());
    expect(label()).toBe('');
    expect(exposed('buttonText')).toBe('');
  });

  test('[Button-CLICK-001] a user click and the click() CSA both fire onClick', async () => {
    // Break this catches: handleClick (Button.jsx:198-201) or the click CSA (127-130) dropping fireEvent('onClick').
    widget.render({ events: onClickCapture });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    await widget.session.user.click(btn());
    await waitFor(() => expect(clicked()).toBe('yes'));

    // reset probe, then the CSA path
    store().setVariable('clicked', undefined, MODULE_ID);
    await widget.act('click');
    await waitFor(() => expect(clicked()).toBe('yes'));
  });

  test('[Button-CLICK-002] a disabled button does not fire onClick', async () => {
    // Break this catches: removing the `!disable` guard in handleClick (Button.jsx:198).
    widget.render({ properties: { disabledState: binding('{{true}}') }, events: onClickCapture });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    await widget.session.user.click(btn());

    expect(clicked()).toBeUndefined();
  });

  test('[Button-CLICK-003] a loading button does not fire onClick', async () => {
    // Break this catches: removing the `!loading` guard in handleClick (Button.jsx:198).
    widget.render({ properties: { loadingState: binding('{{true}}') }, events: onClickCapture });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    await widget.session.user.click(btn());

    expect(clicked()).toBeUndefined();
    expect(exposed('isLoading')).toBe(true);
  });

  test('[Button-HOVER-001] hovering the button fires onHover', async () => {
    // Break this catches: the onMouseOver->setHovered->onHover effect (Button.jsx:191-195,219).
    widget.render({ events: onHoverCapture });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    rtlFireEvent.mouseOver(btn());

    await waitFor(() => expect(hovered()).toBe('yes'));
  });
});

describe('Button: loading / disabled / visibility states and their CSAs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Button-STATE-001] visibility=false hides the button and is mirrored by isVisible', async () => {
    // Break this catches: Button.jsx:118 display gate or :182 isVisible mirror.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    expect(exposed('isVisible')).toBe(false);
    expect(btn()).toHaveAttribute('aria-hidden', 'true');
  });

  test('[Button-STATE-002] disabledState=true disables the button and is mirrored by isDisabled', async () => {
    // Break this catches: Button.jsx:35 disable from disabledState, :187 isDisabled mirror, :228 aria-disabled.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    expect(exposed('isDisabled')).toBe(true);
    expect(btn()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[Button-STATE-003] loadingState=true shows the loader (label hidden) and is mirrored by isLoading', async () => {
    // Break this catches: Button.jsx:232 loading branch (Loader vs label), :177 isLoading mirror, :229 aria-busy.
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    expect(exposed('isLoading')).toBe(true);
    expect(labelEl()).toBeNull(); // loading swaps the label for <Loader>
    expect(btn()).toHaveAttribute('aria-busy', 'true');
  });

  test('[Button-STATE-004] setVisibility(false) toggles isVisible and hides the button', async () => {
    // Break this catches: the setVisibility CSA (Button.jsx:161-163).
    widget.render();
    await waitFor(() => expect(exposed('isVisible')).toBe(true));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(btn()).toHaveAttribute('aria-hidden', 'true');
  });

  test('[Button-STATE-005] setDisable(true) toggles isDisabled', async () => {
    // Break this catches: the setDisable CSA (Button.jsx:169-171).
    widget.render();
    await waitFor(() => expect(exposed('isDisabled')).toBe(false));

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(btn()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[Button-STATE-006] setLoading(true) toggles isLoading and shows the loader', async () => {
    // Break this catches: the setLoading CSA (Button.jsx:153-155).
    widget.render();
    await waitFor(() => expect(exposed('isLoading')).toBe(false));

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(labelEl()).toBeNull();
  });
});

describe('Button: state precedence, deprecated CSAs, type gating, icon, isolation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Button-PREC-001] setLoading survives an unrelated re-resolve', async () => {
    // Break this catches: the loadingState sync effect (Button.jsx:59-62) widening its deps beyond
    // [properties.loadingState] and clobbering the CSA-set local loading on any re-render.
    widget.render();
    await waitFor(() => expect(exposed('isLoading')).toBe(false));

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));

    // Unrelated re-resolve: text changes, loadingState stays false.
    widget.render({ properties: { text: binding('Changed') } });
    await waitFor(() => expect(exposed('buttonText')).toBe('Changed'));

    expect(exposed('isLoading')).toBe(true);
  });

  test('[Button-PREC-002] setDisable survives an unrelated re-resolve', async () => {
    // Break this catches: the disabledState sync effect (Button.jsx:49-52) re-running on any re-render.
    widget.render();
    await waitFor(() => expect(exposed('isDisabled')).toBe(false));

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    widget.render({ properties: { text: binding('Changed') } });
    await waitFor(() => expect(exposed('buttonText')).toBe('Changed'));

    expect(exposed('isDisabled')).toBe(true);
  });

  test('[Button-PREC-003] setVisibility survives an unrelated re-resolve', async () => {
    // Break this catches: the visibility sync effect (Button.jsx:54-57) re-running on any re-render.
    widget.render();
    await waitFor(() => expect(exposed('isVisible')).toBe(true));

    await widget.act('setVisibility', false);
    await waitFor(() => expect(exposed('isVisible')).toBe(false));

    widget.render({ properties: { text: binding('Changed') } });
    await waitFor(() => expect(exposed('buttonText')).toBe('Changed'));

    expect(exposed('isVisible')).toBe(false);
  });

  test('[Button-PREC-004] setText survives an unrelated re-resolve; a changed text property overrides', async () => {
    // Break this catches: the text sync effect (Button.jsx:41-47) widening beyond [properties.text].
    widget.render();
    await waitFor(() => expect(btn()).toBeInTheDocument());

    await widget.act('setText', 'FromCSA');
    await waitFor(() => expect(label()).toBe('FromCSA'));

    // Unrelated re-resolve: disabledState changes, text unchanged → CSA label survives.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(label()).toBe('FromCSA');

    // A genuine text change overrides.
    widget.render({ properties: { text: binding('FromProp') } });
    await waitFor(() => expect(label()).toBe('FromProp'));
  });

  test('[Button-DEP-001] the deprecated disable/visibility/loading CSAs still toggle their state', async () => {
    // Break this catches: dropping the deprecated CSAs (Button.jsx:136-144) that legacy apps may call.
    widget.render();
    await waitFor(() => expect(btn()).toBeInTheDocument());

    await widget.act('disable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    await widget.act('loading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));

    await widget.act('visibility', false);
    await waitFor(() => expect(exposed('isVisible')).toBe(false));
  });

  test('[Button-COMBO-001] type=outline drops the solid background (transparent)', async () => {
    // Break this catches: Button.jsx:75-82 no longer forcing transparent bg for non-primary type.
    widget.render({ styles: { type: binding('outline') } });
    await waitFor(() => expect(btn()).toBeInTheDocument());

    expect(btn()).toHaveStyle({ backgroundColor: 'transparent' });
  });

  test('[Button-ICON-001] with the icon enabled, the icon renders and direction sets its side', async () => {
    // Break this catches: Button.jsx:266 iconVisibility gate, or :239 direction flex-order.
    widget.render({
      styles: {
        type: binding('primary'),
        iconVisibility: binding('{{true}}'),
        icon: binding('IconHome'),
        direction: binding('left'),
      },
    });
    await waitFor(() => expect(iconEl()).toBeInTheDocument());

    // direction 'left' => row-reverse on the content flex row (Button.jsx:239)
    const contentRow = btn().querySelector('div');
    expect(contentRow).toHaveStyle({ flexDirection: 'row-reverse' });
  });

  test('[Button-ISO-001] two Button instances keep independent text and state', async () => {
    // Break this catches: instance state leaking across instances (a shared/module-level store
    // instead of per-instance local state) — setText/setLoading on one would change the other.
    widget.render({
      extraComponents: {
        btn2: componentDefinition('btn2', 'button2', 'Button', {
          text: binding('Two'),
          loadingState: binding('{{false}}'),
          visibility: binding('{{true}}'),
          disabledState: binding('{{false}}'),
        }),
      },
      also: [{ id: 'btn2', componentType: 'Button' }],
    });
    await waitFor(() => expect(document.querySelectorAll('button.jet-btn')).toHaveLength(2));

    // setText on btn1 must not touch btn2's label (check before loading hides btn1's label).
    await widget.act('setText', 'One');
    await waitFor(() => expect(document.querySelector('#component-btn1 [data-cy$="-label"]')?.textContent).toBe('One'));
    expect(document.querySelector('#component-btn2 [data-cy$="-label"]')?.textContent).toBe('Two');

    // setLoading on btn1 must not put btn2 into a loading state.
    await widget.act('setLoading', true);
    await waitFor(() => expect(widget.exposed('btn1').isLoading).toBe(true));
    expect(widget.exposed('btn2').isLoading).toBe(false);
  });
});
