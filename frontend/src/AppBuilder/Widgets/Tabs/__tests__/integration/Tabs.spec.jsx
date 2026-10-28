/**
 * Tabs widget — approved contract at
 * frontend/ee/test/app-builder/widgets/Tabs/TESTING.md is the single source of
 * truth. Test titles carry their `[Tabs-FAMILY-NNN]` scenario ID per the
 * widget-testing-contract validator.
 *
 * Real store, real RenderWidget, real Tabs / SubContainer / useExposeState.
 * Nothing about the widget is mocked. Tabs renders AppCanvas SubContainer panes,
 * so the session needs the real DndProvider (capabilities.dnd).
 *
 * By default (useDynamicOptions=false) the runtime reads `properties.tabItems`
 * (Tabs.jsx:88), NOT `properties.tabs` — so the harness seeds `tabItems`.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tab1';
const NAME = 'tabs1';

// Three tabs in the shape the runtime consumes: raw id/title/visible/disable.
const THREE_TABS =
  '{{[' +
  "{ id: '0', title: 'Home', visible: true, disable: false }," +
  "{ id: '1', title: 'Profile', visible: true, disable: false }," +
  "{ id: '2', title: 'Settings', visible: true, disable: false }" +
  ']}}';

const widget = createWidgetHarness({
  componentType: 'Tabs',
  handle: NAME,
  id: ID,
  capabilities: { dnd: true },
  // Baseline is tabs.js's own definition.properties, not invented defaults.
  defaultProperties: {
    useDynamicOptions: binding('{{false}}'),
    tabItems: binding(THREE_TABS),
    defaultTab: binding('0'),
    hideTabs: binding('{{false}}'),
    renderOnlyActiveTab: binding('{{false}}'),
    scrollToTopOnTabSwitch: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
});

const headers = () => [...document.querySelectorAll('.nav-item')];
const headerByTitle = (t) => headers().find((li) => li.textContent.includes(t));
const activeHeaderText = () => document.querySelector('.nav-item.active')?.textContent ?? '';
const panes = () => [...document.querySelectorAll('.tab-pane')];
const exposed = (key) => widget.exposed()?.[key];

// Capture onTabSwitch: a set-custom-variable action writing the just-switched-to
// currentTab. If it stays unset, the event never fired.
const onSwitch = setVariableOn(ID, 'onTabSwitch', {
  key: 'switchedTo',
  value: `{{components.${NAME}.currentTab}}`,
});
const switchedTo = () => store().getVariable('switchedTo', MODULE_ID);

describe('Tabs: default rendering and the initial active tab', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Tabs-DEF-001] renders one header per configured tab with the default tab active', async () => {
    // Break this catches: Tabs.jsx:88 reading `properties.tabItems` for the
    // non-dynamic path — swapping it to `properties.tabs` (undefined here)
    // renders zero headers.
    widget.render();

    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(headerByTitle('Home')).toBeTruthy();
    expect(headerByTitle('Profile')).toBeTruthy();
    expect(headerByTitle('Settings')).toBeTruthy();
    expect(activeHeaderText()).toContain('Home');
    expect(exposed('currentTab')).toBe('0');
  });

  test('[Tabs-DEF-002] defaultTab selects the initial active tab and exposes currentTab/currentTabTitle', async () => {
    // Break this catches: Tabs.jsx:147 seeding currentTab from parsedDefaultTab —
    // hardcoding the first tab would leave currentTab on Home for defaultTab='1'.
    widget.render({ properties: { defaultTab: binding('1') } });

    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(exposed('currentTab')).toBe('1');
    expect(exposed('currentTabTitle')).toBe('Profile');
    expect(activeHeaderText()).toContain('Profile');
  });

  test('[Tabs-DEF-003] an empty tabs array renders nothing and does not crash (characterization)', async () => {
    // Break this catches: any unguarded `.map`/`.find` on the tab list throwing
    // on []. Pins today's safe-empty behavior.
    widget.render({ properties: { tabItems: binding('{{[]}}') } });

    await waitFor(() => expect(document.querySelector('.tabs-component')).toBeInTheDocument());
    expect(headers()).toHaveLength(0);
  });

  test('[Tabs-DEF-003b] a defaultTab id absent from tabs falls back to the first visible tab (characterization)', async () => {
    // Break this catches: Tabs.jsx:121-125 removing the visibleParsedTabs[0]
    // fallback — currentTab would then dangle on the unknown '99' with a blank
    // pane. (Contrast Tabs-NAV-004: setTab has no such fallback.)
    widget.render({ properties: { defaultTab: binding('99') } });

    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(exposed('currentTab')).toBe('0');
    expect(activeHeaderText()).toContain('Home');
  });
});

describe('Tabs: switching tabs (click, setTab, events)', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Tabs-NAV-001] clicking a header switches the active tab, updates exposed vars, and fires onTabSwitch', async () => {
    // Break this catches: the header onClick (Tabs.jsx:382-397) dropping
    // setCurrentTab/setExposedVariables or fireEvent('onTabSwitch').
    widget.render({ events: onSwitch });
    await waitFor(() => expect(headers()).toHaveLength(3));

    await widget.session.user.click(headerByTitle('Settings'));

    await waitFor(() => expect(exposed('currentTab')).toBe('2'));
    expect(exposed('currentTabTitle')).toBe('Settings');
    expect(activeHeaderText()).toContain('Settings');
    expect(switchedTo()).toBe('2');
  });

  test('[Tabs-NAV-002] setTab(id) switches the active tab and fires onTabSwitch', async () => {
    // Break this catches: the setTab CSA (Tabs.jsx:191-199) dropping the
    // setCurrentTab / exposed-var update / fireEvent.
    widget.render({ events: onSwitch });
    await waitFor(() => expect(headers()).toHaveLength(3));

    await widget.act('setTab', '2');

    await waitFor(() => expect(exposed('currentTab')).toBe('2'));
    expect(exposed('currentTabTitle')).toBe('Settings');
    expect(switchedTo()).toBe('2');
  });

  test('[Tabs-NAV-003] setTab(currentTab) is a no-op and does not re-fire onTabSwitch', async () => {
    // Break this catches: removing the `if (currentTab != id)` guard at
    // Tabs.jsx:192 — re-selecting the active tab would re-fire onTabSwitch.
    widget.render({ events: onSwitch });
    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(exposed('currentTab')).toBe('0');

    await widget.act('setTab', '0');

    expect(switchedTo()).toBeUndefined();
    expect(exposed('currentTab')).toBe('0');
  });

  test('[Tabs-NAV-004] setTab(unknown id) sets currentTab to that id and fires onTabSwitch, leaving no active pane (characterization)', async () => {
    // Break this catches: adding id-validation to setTab (Tabs.jsx:191-199) that
    // would no-op an unknown id. Pins today's accept-any-id behavior.
    widget.render({ events: onSwitch });
    await waitFor(() => expect(headers()).toHaveLength(3));

    await widget.act('setTab', 'nope');

    await waitFor(() => expect(exposed('currentTab')).toBe('nope'));
    expect(switchedTo()).toBe('nope');
    // No header matches 'nope', so nothing is marked active.
    expect(document.querySelector('.nav-item.active')).toBeNull();
  });
});

const root = () => document.querySelector('.tabs-component');

describe('Tabs: component-level states and their CSAs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Tabs-STATE-001] visibility=false hides the component and is mirrored by isVisible', async () => {
    // Break this catches: Tabs.jsx:309 dropping `display: isVisible ? 'flex' : 'none'`,
    // or useExposeState no longer publishing isVisible from properties.visibility.
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(root()).toBeInTheDocument());
    expect(root()).toHaveStyle({ display: 'none' });
    expect(exposed('isVisible')).toBe(false);
  });

  test('[Tabs-STATE-002] disabledState=true marks the component disabled/inert and is mirrored by isDisabled', async () => {
    // Break this catches: useExposeState no longer publishing isDisabled, or
    // useDisableInert (Tabs.jsx:244) not applying `inert`. The pointer/keyboard
    // *blocking* itself is browser-enforced (Tabs-BRW-007); jsdom only reflects
    // the attribute + exposed var, which is what this asserts.
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(root()).toBeInTheDocument());
    expect(exposed('isDisabled')).toBe(true);
    expect(root()).toHaveAttribute('data-disabled', 'true');
    // useDisableInert sets the `.inert` DOM property (not the attribute).
    expect(root().inert).toBe(true);
  });

  test('[Tabs-STATE-003] loadingState=true shows the loading UI and is mirrored by isLoading', async () => {
    // Break this catches: Tabs.jsx:319/463 dropping the isLoading branch — the
    // headers (shimmer) and body (spinner) would render the normal nav/panes.
    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(root()).toBeInTheDocument());
    expect(exposed('isLoading')).toBe(true);
    // Loading replaces the nav with a shimmer and the body with a spinner.
    expect(headers()).toHaveLength(0);
    expect(panes()).toHaveLength(0);
  });

  test('[Tabs-STATE-004] setVisibility(false) toggles isVisible and hides the component', async () => {
    // Break this catches: the shared setVisibility CSA no longer writing the
    // visibility state useExposeState reads.
    widget.render();
    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(exposed('isVisible')).toBe(true);

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(root()).toHaveStyle({ display: 'none' });
  });

  test('[Tabs-STATE-005] setDisable(true) toggles isDisabled', async () => {
    // Break this catches: the shared setDisable CSA no longer writing disable state.
    widget.render();
    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(exposed('isDisabled')).toBe(false);

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(root()).toHaveAttribute('data-disabled', 'true');
  });

  test('[Tabs-STATE-006] setLoading(true) toggles isLoading and shows the loading UI', async () => {
    // Break this catches: the shared setLoading CSA no longer writing loading state.
    widget.render();
    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(exposed('isLoading')).toBe(false);

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(headers()).toHaveLength(0);
  });
});

const spinner = () => document.querySelector('.spinner-border');

describe('Tabs: per-tab CSAs and per-tab data', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Tabs-TAB-001] setTabDisable(id, true) disables a tab so clicking it does not switch', async () => {
    // Break this catches: the header onClick dropping `if (tab?.disable) return`
    // (Tabs.jsx:384) — a disabled tab would then switch on click.
    widget.render({ events: onSwitch });
    await waitFor(() => expect(headers()).toHaveLength(3));

    await widget.act('setTabDisable', '1', true);
    await widget.session.user.click(headerByTitle('Profile'));

    expect(exposed('currentTab')).toBe('0');
    expect(switchedTo()).toBeUndefined();
  });

  test('[Tabs-TAB-002] setTabLoading(id, true) shows a per-tab loading spinner', async () => {
    // Break this catches: TabContent (Tabs.jsx:595) dropping the
    // `loading ? <Spinner/>` branch.
    widget.render();
    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(spinner()).toBeNull();

    await widget.act('setTabLoading', '0', true);

    await waitFor(() => expect(spinner()).toBeInTheDocument());
  });

  test('[Tabs-TAB-003] setTabVisibility(id, true) reveals a tab that was initially hidden', async () => {
    // Break this catches: regression #16316 — setTabVisibility no longer able to
    // flip an initially-hidden tab back to visible (Tabs.jsx:223-231 + the
    // visible-filter at :365).
    widget.render({
      properties: {
        tabItems: binding(
          "{{[{ id: '0', title: 'Home', visible: true, disable: false }," +
            "{ id: '1', title: 'Profile', visible: false, disable: false }," +
            "{ id: '2', title: 'Settings', visible: true, disable: false }]}}"
        ),
      },
    });
    await waitFor(() => expect(headers()).toHaveLength(2));
    expect(headerByTitle('Profile')).toBeFalsy();

    await widget.act('setTabVisibility', '1', true);

    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(headerByTitle('Profile')).toBeTruthy();
  });

  test('[Tabs-TAB-004] per-tab data fields drive per-tab rendering (hidden tab absent, disabled tab dimmed)', async () => {
    // Break this catches: the visible filter (Tabs.jsx:365) or the disabled
    // opacity style (Tabs.jsx:370) — a visible:false tab would show a header, or
    // a disable:true tab would render at full opacity.
    widget.render({
      properties: {
        tabItems: binding(
          "{{[{ id: '0', title: 'Home', visible: true, disable: false }," +
            "{ id: '1', title: 'Profile', visible: true, disable: true }," +
            "{ id: '2', title: 'Settings', visible: false, disable: false }]}}"
        ),
      },
    });

    await waitFor(() => expect(headers()).toHaveLength(2));
    expect(headerByTitle('Settings')).toBeFalsy(); // visible:false → no header
    expect(headerByTitle('Profile')).toHaveStyle({ opacity: '0.5' }); // disable:true → dimmed
  });

  test('[Tabs-TAB-005] hiding the active tab leaves currentTab unchanged and blanks its content (characterization, D-02)', async () => {
    // Break this catches: adding a D-02-style fallback that reassigns currentTab
    // when the active tab is hidden. Pins today's no-fallback behavior.
    widget.render();
    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(exposed('currentTab')).toBe('0');

    await widget.act('setTabVisibility', '0', false);

    await waitFor(() => expect(headers()).toHaveLength(2));
    expect(headerByTitle('Home')).toBeFalsy(); // active tab's header now hidden
    expect(exposed('currentTab')).toBe('0'); // no auto-fallback
  });
});

const nav = () => document.querySelector('.nav');

describe('Tabs: dynamic options, render-only, and hide-tabs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Tabs-OPT-001] useDynamicOptions binds the tab list from the tabs array', async () => {
    // Break this catches: Tabs.jsx:87-91 no longer taking the
    // resolveWidgetFieldValue(properties.tabs) branch when useDynamicOptions is on.
    widget.render({
      properties: {
        useDynamicOptions: binding('{{true}}'),
        tabs: binding("{{[{ title: 'Alpha', id: 'a' }, { title: 'Beta', id: 'b' }]}}"),
      },
    });

    await waitFor(() => expect(headers()).toHaveLength(2));
    expect(headerByTitle('Alpha')).toBeTruthy();
    expect(headerByTitle('Beta')).toBeTruthy();
  });

  test('[Tabs-OPT-002] re-resolving the tabs binding updates the rendered tab list', async () => {
    // Break this catches: the parsedTabs->setTabItems sync effect (Tabs.jsx:172-177)
    // no longer reacting to a changed tabs binding.
    widget.render({
      properties: {
        useDynamicOptions: binding('{{true}}'),
        tabs: binding("{{[{ title: 'Alpha', id: 'a' }, { title: 'Beta', id: 'b' }]}}"),
      },
    });
    await waitFor(() => expect(headers()).toHaveLength(2));

    widget.render({
      properties: {
        useDynamicOptions: binding('{{true}}'),
        tabs: binding("{{[{ title: 'Gamma', id: 'g' }]}}"),
      },
    });

    await waitFor(() => expect(headerByTitle('Gamma')).toBeTruthy());
    expect(headerByTitle('Alpha')).toBeFalsy();
  });

  test('[Tabs-RENDER-001] renderOnlyActiveTab keeps only the active pane in the DOM', async () => {
    // Break this catches: shouldRenderTabContent (Tabs.jsx:261-266) always
    // returning true — every pane would stay mounted.
    widget.render({ properties: { renderOnlyActiveTab: binding('{{true}}') } });

    await waitFor(() => expect(headers()).toHaveLength(3));
    expect(panes()).toHaveLength(1); // only the active tab's TabContent
  });

  test('[Tabs-COMBO-001] render-only + hiding the active tab leaves a blank body, currentTab unchanged (characterization, D-02)', async () => {
    // Break this catches: a D-02 fallback reassigning currentTab, or TabContent
    // no longer returning null for a visible:false tab (Tabs.jsx:574).
    widget.render({ properties: { renderOnlyActiveTab: binding('{{true}}') } });
    await waitFor(() => expect(panes()).toHaveLength(1));

    await widget.act('setTabVisibility', '0', false);

    await waitFor(() => expect(panes()).toHaveLength(0)); // only-active tab is hidden → nothing renders
    expect(exposed('currentTab')).toBe('0');
  });

  test('[Tabs-COMBO-003] hideTabs hides the header row but keeps the active pane content', async () => {
    // Break this catches: parsedHideTabs no longer driving the nav `display:none`
    // (Tabs.jsx:328,350), or hideTabs wrongly also hiding the content body.
    widget.render({ properties: { hideTabs: binding('{{true}}') } });

    await waitFor(() => expect(document.querySelector('.tabs-component')).toBeInTheDocument());
    expect(nav()).toHaveStyle({ display: 'none' });
    expect(panes().length).toBeGreaterThan(0);
  });
});

describe('Tabs: state precedence (client action versus property re-resolve)', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Tabs-PREC-001] setVisibility survives an unrelated property re-resolve', async () => {
    // Break this catches: useExposeState's visibility sync effect widening its
    // deps beyond [visibility] — an unrelated re-resolve would re-apply the
    // property and clobber the CSA-set value.
    widget.render();
    await waitFor(() => expect(exposed('isVisible')).toBe(true));

    await widget.act('setVisibility', false);
    await waitFor(() => expect(exposed('isVisible')).toBe(false));

    // Unrelated re-resolve: defaultTab changes, visibility stays true.
    widget.render({ properties: { defaultTab: binding('1') } });
    await waitFor(() => expect(exposed('currentTab')).toBe('1'));

    expect(exposed('isVisible')).toBe(false);
  });

  test('[Tabs-PREC-002] setDisable survives an unrelated property re-resolve', async () => {
    // Break this catches: the disable sync effect re-running on any re-render.
    widget.render();
    await waitFor(() => expect(exposed('isDisabled')).toBe(false));

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    widget.render({ properties: { defaultTab: binding('1') } });
    await waitFor(() => expect(exposed('currentTab')).toBe('1'));

    expect(exposed('isDisabled')).toBe(true);
  });

  test('[Tabs-PREC-003] setLoading survives an unrelated property re-resolve', async () => {
    // Break this catches: the loading sync effect re-running on any re-render.
    widget.render();
    await waitFor(() => expect(exposed('isLoading')).toBe(false));

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));

    widget.render({ properties: { defaultTab: binding('1') } });
    await waitFor(() => expect(exposed('currentTab')).toBe('1'));

    expect(exposed('isLoading')).toBe(true);
  });

  test('[Tabs-PREC-004] a per-tab CSA state survives an unrelated re-resolve where the tabs data is unchanged', async () => {
    // Break this catches: the parsedTabs->setTabItems sync effect (Tabs.jsx:172-177)
    // resetting tabItems on any re-render instead of only when the tabs data
    // actually changes — it would wipe the CSA-set per-tab disable.
    widget.render();
    await waitFor(() => expect(headers()).toHaveLength(3));

    await widget.act('setTabDisable', '1', true);
    await waitFor(() => expect(headerByTitle('Profile')).toHaveStyle({ opacity: '0.5' }));

    // Unrelated re-resolve: defaultTab changes, tabItems data unchanged.
    widget.render({ properties: { defaultTab: binding('2') } });
    await waitFor(() => expect(exposed('currentTab')).toBe('2'));

    expect(headerByTitle('Profile')).toHaveStyle({ opacity: '0.5' });
  });
});
