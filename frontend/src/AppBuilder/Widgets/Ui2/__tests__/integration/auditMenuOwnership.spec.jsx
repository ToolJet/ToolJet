/**
 * UI 2.0 menus: an open DropdownMenu or Navigation menu takes no choice once its owner stops taking input.
 *
 * Release audit (18 Oct), Codex's reviewDropdownOwnerLifecycle, reviewNavigationOpenMenu, reviewNavigationMenuBoundaries,
 * reviewTabsMenuOwnership and reviewContainerMenuOwnership: the menu is portalled outside the widget, and closed only
 * when the widget itself was disabled or loading. Hiding the widget, switching, disabling or loading the Tabs around it,
 * hiding or disabling its Container, or (Navigation) disabling the parent item the menu opened from left the menu open,
 * and a click on an item still fired the widget's event.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const MENU = 'menu1';
// [componentType, properties, the trigger's name, the item's name, the event a choice fires]
const TYPES = {
  ShadDropdownMenu: [
    { label: binding('Actions'), items: binding('{{[{label:"Archive",value:"archive"}]}}') },
    'Actions',
    'Archive',
    'onSelect',
  ],
  ShadNavigation: [
    {
      orientation: binding('horizontal'),
      items: binding('{{[{label:"Actions",value:"actions",children:[{label:"Archive",value:"archive"}]}]}}'),
    },
    'Actions',
    'Archive',
    'onClick',
  ],
};

const openMenu = async (triggerName, itemName) => {
  const trigger = await screen.findByRole('button', { name: triggerName });
  await act(async () => fireEvent.keyDown(trigger, { key: 'Enter' }));
  await screen.findByRole('menuitem', { name: itemName });
  return trigger;
};

// Clicks the item if it is still there; returns how many times the event fired.
const chooseItem = async (w, itemName) => {
  const item = screen.queryByRole('menuitem', { name: itemName });
  if (item) {
    expect(item).toBeVisible();
    await act(async () => fireEvent.click(item));
  }
  return w.variables().calls || 0;
};

describe('the widget itself', () => {
  test.each(
    Object.keys(TYPES).flatMap((type) => ['normal', 'hidden', 'disabled', 'loading', 'unmounted'].map((s) => [type, s]))
  )('%s open menu after %s', async (type, state) => {
    const [properties, triggerName, itemName, event] = TYPES[type];
    const w = createWidgetHarness({ componentType: type, id: MENU, handle: MENU });
    await w.setup();
    try {
      const view = w.render({ currentMode: 'view', properties });
      w.setEvents(countInvocationsOn(MENU, event));
      await openMenu(triggerName, itemName);
      if (state === 'hidden') {
        await w.act('setVisibility', false);
        expect(screen.getByRole('button', { name: triggerName, hidden: true })).not.toBeVisible();
      }
      if (state === 'disabled') await w.act('setDisable', true);
      if (state === 'loading') await w.act('setLoading', true);
      if (state === 'unmounted') view.unmount();
      expect(await chooseItem(w, itemName)).toBe(state === 'normal' ? 1 : 0);
      if (state !== 'normal') expect(screen.queryByRole('menuitem', { name: itemName })).not.toBeInTheDocument();
      if (type === 'ShadDropdownMenu' && state !== 'normal' && state !== 'unmounted') {
        expect(w.exposed().isOpen).toBe(false);
      }
    } finally {
      w.teardown();
    }
  });

  test('Navigation: disabling the parent item an open menu belongs to closes the menu', async () => {
    const [properties, triggerName, itemName, event] = TYPES.ShadNavigation;
    const w = createWidgetHarness({ componentType: 'ShadNavigation', id: MENU, handle: MENU });
    await w.setup();
    try {
      w.render({ currentMode: 'view', properties });
      w.setEvents(countInvocationsOn(MENU, event));
      await openMenu(triggerName, itemName);
      await w.act('setItemDisable', 'actions', true);
      expect(screen.getByRole('button', { name: triggerName })).toBeDisabled();
      expect(await chooseItem(w, itemName)).toBe(0);
      expect(screen.queryByRole('menuitem', { name: itemName })).not.toBeInTheDocument();
    } finally {
      w.teardown();
    }
  });
});

// The menu as a child of a Tabs panel or a Container.
const mountIn = async (ownerType, owner, type, ownerProperties = {}) => {
  const [properties, triggerName, itemName, event] = TYPES[type];
  const w = createWidgetHarness({
    componentType: ownerType,
    id: owner,
    handle: owner,
    capabilities: { dnd: true },
    preload: [type],
    widgetHeight: 500,
    widgetWidth: 800,
  });
  await w.setup();
  const child = componentDefinition(MENU, MENU, type, properties);
  child.component.parent = ownerType === 'ShadTabs' ? `${owner}-t0` : owner;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 25, height: 100 } };
  w.render({ currentMode: 'view', properties: ownerProperties, extraComponents: { [MENU]: child } });
  await act(async () => w.setEvents(countInvocationsOn(MENU, event)));
  const trigger = await openMenu(triggerName, itemName);
  return { w, trigger, itemName };
};

describe('the Tabs panel holding the widget', () => {
  test.each(Object.keys(TYPES).flatMap((type) => ['normal', 'switch', 'disabled', 'loading'].map((s) => [type, s])))(
    '%s open menu after the tab %s',
    async (type, state) => {
      const { w, trigger, itemName } = await mountIn('ShadTabs', 'tabs1', type, { defaultTab: binding('t0') });
      try {
        const panel = trigger.closest('[role="tabpanel"]');
        if (state === 'switch') {
          await w.act('setTab', 't1');
          expect(panel).not.toBeVisible();
        }
        if (state === 'disabled') {
          await w.act('setTabDisable', 't0', true);
          expect(panel.getAttribute('aria-disabled')).toBe('true');
        }
        if (state === 'loading') await w.act('setLoading', true);
        expect(await chooseItem(w, itemName)).toBe(state === 'normal' ? 1 : 0);
      } finally {
        w.teardown();
      }
    },
    15000
  );
});

describe('the Container holding the widget', () => {
  // A disabled Container sets `node.inert`, which browsers reflect to the inert attribute; jsdom 20 has no inert, so
  // the property is made to reflect here as it does in a browser.
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'inert', {
      configurable: true,
      get() {
        return this.hasAttribute('inert');
      },
      set(value) {
        this.toggleAttribute('inert', !!value);
      },
    });
  });
  afterAll(() => {
    delete HTMLElement.prototype.inert;
  });

  test.each(Object.keys(TYPES).flatMap((type) => ['normal', 'hidden', 'disabled'].map((s) => [type, s])))(
    '%s open menu after the Container is %s',
    async (type, state) => {
      const { w, trigger, itemName } = await mountIn('Container', 'owner1', type);
      try {
        const panel = trigger.closest('.jet-container');
        if (state === 'hidden') {
          await w.act('setVisibility', false);
          expect(panel).not.toBeVisible();
        }
        if (state === 'disabled') {
          await w.act('setDisable', true);
          expect(panel.inert).toBe(true);
        }
        expect(await chooseItem(w, itemName)).toBe(state === 'normal' ? 1 : 0);
      } finally {
        w.teardown();
      }
    },
    15000
  );
});
