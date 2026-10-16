/**
 * UI 2.0 Tabs: a container with a canvas per tab, as pills, an underline strip or a wizard's numbered steps.
 *
 * Real store, real RenderWidget, real widget, real child widgets in each tab's canvas; nothing is mocked. A tab's
 * canvas is a SubContainer, so the harness has the app's drag-and-drop provider (`capabilities: { dnd: true }`).
 * Standard control behaviour is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx; this file
 * covers what the Tabs widget itself does. Titles carry [ShadTabs-<AREA>-<NNN>] scenario ids.
 * The registered defaults apply: Overview (t0), Activity (t1) and Settings (t2) as pills, on Overview.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tab1';
const widget = createWidgetHarness({
  componentType: 'ShadTabs',
  handle: 'tabs1',
  id: ID,
  widgetHeight: 400,
  widgetWidth: 640,
  capabilities: { dnd: true },
  preload: ['ShadText'],
});

/** A Text widget placed in one tab's canvas (`<tabs id>-<tab id>`). */
const textIn = (tabId, id, text) => {
  const child = componentDefinition(id, id, 'ShadText', { text: binding(text) });
  child.component.parent = `${ID}-${tabId}`;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 30 } };
  return child;
};
const CHILDREN = { inT0: textIn('t0', 'inT0', 'Overview content'), inT1: textIn('t1', 'inT1', 'Activity content') };
const WIZARD = { variant: binding('steps') };
const FOUR =
  '{{[{ id: "a", title: "One" }, { id: "b", title: "Two" }, { id: "c", title: "Three", disable: true }, { id: "d", title: "Four" }]}}';

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const rerender = (options) => act(async () => render(options));
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const tab = (name) => screen.getByRole('tab', { name: new RegExp(name) });
const selected = () => screen.getAllByRole('tab').find((t) => t.getAttribute('aria-selected') === 'true');
const click = async (el) => {
  await act(async () => fireEvent.click(el));
};
const pressOnStrip = async (key) => {
  const strip = screen.getByRole('tablist');
  await act(async () => {
    fireEvent.keyDown(strip.contains(document.activeElement) ? document.activeElement : strip, { key });
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
};

describe('UI 2.0 Tabs', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTabs-DEF-001] shows the tabs with the default one selected, and exposes where it is', async () => {
    render();

    await waitFor(() => expect(selected()).toHaveTextContent('Overview'));
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Overview', 'Activity', 'Settings']);
    expect(exposed()).toMatchObject({
      currentTab: 't0',
      currentTabTitle: 'Overview',
      currentStepIndex: 0,
      isFirstStep: true,
      isLastStep: false,
    });
  });

  test('[ShadTabs-DEF-002] each tab shows its own components, and switching tabs swaps them', async () => {
    render({ extraComponents: CHILDREN });

    expect(await screen.findByText('Overview content')).toBeVisible();
    expect(screen.getByText('Activity content')).not.toBeVisible();
    await click(tab('Activity'));

    await waitFor(() => expect(screen.getByText('Activity content')).toBeVisible());
    expect(screen.getByText('Overview content')).not.toBeVisible();
  });

  // Ported from the pack's container suite: tabs added and removed at run time, with components in them.
  test('[ShadTabs-DEF-003] tabs added or removed at run time keep working; losing the current tab falls back to the first', async () => {
    const two = '{{[{ id: "t0", title: "Profile" }, { id: "t1", title: "Billing" }]}}';
    render({ properties: { tabItems: binding(two) }, extraComponents: CHILDREN });
    await screen.findByText('Overview content');

    await rerender({
      properties: {
        tabItems: binding(
          '{{[{ id: "t0", title: "Profile" }, { id: "t1", title: "Billing" }, { id: "t2", title: "Team" }]}}'
        ),
      },
      extraComponents: CHILDREN,
    });
    await widget.act('setTab', 't2');
    await waitFor(() => expect(exposed().currentTab).toBe('t2'));
    await rerender({
      properties: { tabItems: binding('{{[{ id: "t0", title: "Profile" }]}}') },
      extraComponents: CHILDREN,
    });

    await waitFor(() => expect(exposed()).toMatchObject({ currentTab: 't0', currentTabTitle: 'Profile' }));
    expect(screen.getByText('Overview content')).toBeVisible();
  });

  test('[ShadTabs-PROP-001] useDynamicOptions takes the tabs from the tabs list', async () => {
    render({
      properties: {
        useDynamicOptions: binding('{{true}}'),
        tabs: binding("{{[{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }]}}"),
        defaultTab: binding('b'),
      },
    });

    await waitFor(() => expect(selected()).toHaveTextContent('Beta'));
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  test('[ShadTabs-PROP-002] defaultTab starts on that tab', async () => {
    render({ properties: { defaultTab: binding('t1') } });

    await waitFor(() => expect(selected()).toHaveTextContent('Activity'));
    expect(exposed()).toMatchObject({ currentTab: 't1', currentStepIndex: 1 });
  });

  test('[ShadTabs-PROP-003] variant underline marks the tab with an indicator; tabsAlign centres or stretches the tabs', async () => {
    render({ properties: { variant: binding('underline'), tabsAlign: binding('center') } });
    await waitFor(() => expect(selected().className).toContain('var(--tb-indicator'));
    expect(screen.getByRole('tablist')).toHaveClass('justify-center');

    await rerender({ properties: { tabsAlign: binding('stretch') } });
    expect(tab('Activity')).toHaveClass('flex-1');
  });

  test('[ShadTabs-PROP-004] hideTabs hides the strip; renderOnlyActiveTab mounts only the current tab', async () => {
    render({ properties: { hideTabs: binding('{{true}}') }, extraComponents: CHILDREN });
    expect(await screen.findByText('Overview content')).toBeVisible();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();

    await rerender({ properties: { renderOnlyActiveTab: binding('{{true}}') }, extraComponents: CHILDREN });
    expect(screen.queryByText('Activity content')).not.toBeInTheDocument();
    await widget.act('setTab', 't1');
    expect(await screen.findByText('Activity content')).toBeVisible();
    expect(screen.queryByText('Overview content')).not.toBeInTheDocument();
  });

  test('[ShadTabs-PROP-005] scrollToTopOnTabSwitch scrolls the new tab canvas to its top, and leaves it when off', async () => {
    for (const on of [true, false]) {
      await rerender({ properties: { scrollToTopOnTabSwitch: binding(`{{${on}}}`) }, extraComponents: CHILDREN });
      await widget.act('setTab', 't0');
      const canvas = await waitFor(() => {
        const el = document.getElementById(`canvas-${ID}-t1`);
        expect(el).toBeTruthy();
        return el;
      });
      const writes = [];
      Object.defineProperty(canvas, 'scrollTop', {
        configurable: true,
        get: () => 80,
        set: (v) => {
          writes.push(v);
        },
      });

      await widget.act('setTab', 't1');
      await act(() => new Promise((resolve) => setTimeout(resolve, 60)));

      expect(writes).toEqual(on ? [0] : []);
    }
  });

  test('[ShadTabs-PROP-006] variant steps is a wizard with numbered steps and Back and Next buttons, labelled by their properties', async () => {
    render({ properties: { ...WIZARD, nextLabel: binding('Continue'), backLabel: binding('Previous') } });

    expect(await screen.findByRole('button', { name: /Continue/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    expect(tab('Overview')).toHaveTextContent('1');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    await click(screen.getByRole('button', { name: /Continue/ }));
    await waitFor(() => expect(exposed()).toMatchObject({ currentTab: 't1', currentStepIndex: 1, isFirstStep: false }));
    await click(screen.getByRole('button', { name: /Continue/ }));
    expect(await screen.findByRole('button', { name: 'Finish' })).toBeInTheDocument();

    await rerender({ properties: { ...WIZARD, finishLabel: binding('Submit now'), defaultTab: binding('t2') } });
    expect(await screen.findByRole('button', { name: 'Submit now' })).toBeInTheDocument();
  });

  test('[ShadTabs-PROP-007] showStepNav off removes the wizard buttons', async () => {
    render({ properties: { ...WIZARD, showStepNav: binding('{{false}}') } });

    await waitFor(() => expect(selected()).toHaveTextContent('Overview'));
    expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument();
  });

  test('[ShadTabs-PROP-008] a linear wizard only reaches steps already passed; linearSteps off lets any step be picked', async () => {
    render({ properties: WIZARD });
    await waitFor(() => expect(selected()).toHaveTextContent('Overview'));
    expect(tab('Settings')).toBeDisabled();

    await rerender({ properties: { ...WIZARD, linearSteps: binding('{{false}}') } });
    expect(tab('Settings')).toBeEnabled();
    await click(tab('Settings'));
    await waitFor(() => expect(exposed()).toMatchObject({ currentTab: 't2', isLastStep: true }));
  });

  test('[ShadTabs-EVT-001] clicking a tab fires onTabSwitch, whose handler reads the new tab', async () => {
    render();
    await handle(setVariableOn(ID, 'onTabSwitch', { value: '{{components.tabs1.currentTabTitle}}' }));

    await click(await screen.findByRole('tab', { name: 'Settings' }));

    await waitFor(() => expect(widget.variables().seen).toBe('Settings'));
    expect(exposed()).toMatchObject({ currentTab: 't2', isLastStep: true });
  });

  test('[ShadTabs-EVT-002] Finish on the last step of a wizard fires onFinish, whose handler reads isLastStep', async () => {
    render({ properties: { ...WIZARD, defaultTab: binding('t2') } });
    await handle(setVariableOn(ID, 'onFinish', { value: '{{components.tabs1.isLastStep}}' }));

    await click(await screen.findByRole('button', { name: 'Finish' }));

    await waitFor(() => expect(widget.variables().seen).toBe(true));
    expect(exposed().currentTab).toBe('t2');
  });

  test('[ShadTabs-ACT-001] setTab, nextTab and previousTab switch tabs and fire onTabSwitch', async () => {
    render();
    await handle(countInvocationsOn(ID, 'onTabSwitch'));

    await widget.act('setTab', 't2');
    await waitFor(() => expect(selected()).toHaveTextContent('Settings'));
    await widget.act('nextTab');
    expect(exposed().currentTab).toBe('t2');
    await widget.act('previousTab');
    await waitFor(() => expect(exposed()).toMatchObject({ currentTab: 't1', currentTabTitle: 'Activity' }));
    await widget.act('nextTab');

    await waitFor(() => expect(exposed().currentTab).toBe('t2'));
    expect(widget.variables().calls).toBe(3);
  });

  test('[ShadTabs-ACT-002] setTabDisable, setTabVisibility and setTabLoading change one tab at run time', async () => {
    render();

    await widget.act('setTabDisable', 't1', true);
    await waitFor(() => expect(tab('Activity')).toBeDisabled());
    await widget.act('setTabVisibility', 't2', false);
    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Settings' })).not.toBeInTheDocument());
    await widget.act('setTabLoading', 't0', true);
    await waitFor(() =>
      expect(screen.getAllByRole('tabpanel', { hidden: true })[0].querySelector('[role=status]')).toBeInTheDocument()
    );

    await widget.act('setTabDisable', 't1', false);
    await widget.act('setTabVisibility', 't2', true);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(3));
    expect(tab('Activity')).toBeEnabled();
  });

  // The pack Tabs had no keyboard pattern: every tab was its own Tab stop and the arrow keys did nothing (found in a
  // headless browser). Now Left and Right move and select, Home and End jump to the ends, a disabled tab is skipped,
  // and only the selected tab is a Tab stop, in every variant.
  test('[ShadTabs-KBD-001] the arrow keys, Home and End move and select, skipping a disabled tab, in every variant', async () => {
    for (const variant of ['pills', 'underline', 'steps']) {
      await rerender({
        properties: {
          tabItems: binding(FOUR),
          defaultTab: binding('a'),
          variant: binding(variant),
          linearSteps: binding('{{false}}'),
        },
      });
      const stops = () => screen.getAllByRole('tab').filter((t) => t.tabIndex === 0);
      await waitFor(() => expect(stops()).toEqual([tab('One')]));

      const visits = [];
      for (const key of ['ArrowRight', 'ArrowRight', 'Home', 'End', 'ArrowLeft']) {
        await pressOnStrip(key);
        visits.push(exposed().currentTab);
      }

      expect(visits).toEqual(['b', 'd', 'a', 'd', 'b']);
      expect(stops()).toEqual([tab('Two')]);
      await widget.act('setTab', 'a');
    }
  });

  test('[ShadTabs-KBD-002] a linear wizard does not skip ahead with the arrow keys', async () => {
    render({ properties: { tabItems: binding(FOUR), defaultTab: binding('a'), ...WIZARD } });
    await waitFor(() => expect(selected()).toHaveTextContent('One'));

    await pressOnStrip('ArrowRight');

    expect(exposed().currentTab).toBe('a');
  });

  test('[ShadTabs-STY-001] colour and size styles reach the tabs as CSS variables; the frame takes border and panel styles', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#e11d48'),
        tabListBackground: binding('#f1f5f9'),
        tabTextColor: binding('#64748b'),
        activeTabTextColor: binding('#0f172a'),
        activeTabBackground: binding('#ffffff'),
        indicatorColor: binding('#be123c'),
        borderColor: binding('#cbd5e1'),
        tabFontSize: binding('{{15}}'),
        borderRadius: binding('{{6}}'),
        panelBackground: binding('#fafafa'),
      },
    });

    await waitFor(() => expect(selected()).toHaveTextContent('Overview'));
    const root = container.querySelector('.tj-shadcn');
    const vars = {
      '--sc-primary': '#e11d48',
      '--tb-list-bg': '#f1f5f9',
      '--tb-text': '#64748b',
      '--tb-active-text': '#0f172a',
      '--tb-active-bg': '#ffffff',
      '--tb-indicator': '#be123c',
      '--tb-border': '#cbd5e1',
      '--tb-font': '15px',
    };
    Object.entries(vars).forEach(([name, value]) => expect(root.style.getPropertyValue(name)).toBe(value));
    expect(root.style.outline).toBe('1px solid #cbd5e1');
    expect(root.style.borderRadius).toBe('6px');
    expect(screen.getAllByRole('tabpanel', { hidden: true })[0].parentElement.style.background).toBe(
      'rgb(250, 250, 250)'
    );

    await rerender({ styles: { showBorder: binding('{{false}}') } });
    expect(container.querySelector('.tj-shadcn').style.outline).toBe('none');
  });
});
