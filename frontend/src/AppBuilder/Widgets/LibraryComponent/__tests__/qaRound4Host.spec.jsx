import { act } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';
import { deepActiveElement, tabbablesIn } from '@/AppBuilder/Widgets/LibraryComponent/packFocus';

installBrowserStubs();

// QA round four, fixes in the pack host and inline SDK that every pack shares. The pack components, the inline SDK
// and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a binding that becomes undefined empties the widget, as it does on the first render', () => {
  test.each([
    ['antd', 'Text', 'children'],
    ['antd', 'Statistic', 'value'],
    ['shadcn', 'Text', 'text'],
    ['mui', 'Typography', 'children'],
  ])('%s %s (%s)', async (pack, name, prop) => {
    const v = await mountPack(pack, name, { [prop]: 'Shown 4821' });
    expect(v.root().textContent).toContain('4821');
    await v.update({ props: { [prop]: undefined } });
    expect(v.root().textContent).not.toContain('4821');
    expect(v.exposed[prop]).toBe('');
    await v.update({ props: { [prop]: 'Back 77' } });
    expect(v.root().textContent).toContain('77');
  });
});

describe('keyboard focus stays in an open pack dialog and goes back to its trigger', () => {
  const tab = (shiftKey = false) => {
    const target = deepActiveElement() ?? document.body;
    act(() => {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, composed: true, cancelable: true })
      );
    });
  };
  const openModal = () => {
    const modals = [...document.querySelectorAll('.tj-cc-popup-host')].flatMap((host) => [
      ...host.shadowRoot.querySelectorAll('[data-tj-modal="open"]'),
    ]);
    return modals[modals.length - 1];
  };

  test.each([
    ['antd', 'Modal', 'open'],
    ['antd', 'Drawer', 'open'],
    ['mui', 'Dialog', 'isOpen'],
    ['shadcn', 'Dialog', 'show'],
  ])('%s %s', async (pack, name, openProp) => {
    const outside = document.createElement('button');
    outside.textContent = 'behind';
    document.body.appendChild(outside);
    const v = await mountPack(pack, name, { [openProp]: true });
    await settle(100);
    const modal = openModal();
    expect(modal).toBeTruthy();
    const items = tabbablesIn(modal);
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    const last = items[items.length - 1];

    // Tab on the last control goes round to the first, Shift+Tab on the first to the last.
    act(() => last.focus());
    expect(deepActiveElement()).toBe(last);
    tab();
    expect(deepActiveElement()).toBe(first);
    tab(true);
    expect(deepActiveElement()).toBe(last);

    // Focus behind the dialog comes back into it on Tab.
    act(() => outside.focus());
    tab();
    expect(deepActiveElement()).toBe(first);

    // Closed, nothing is held.
    await v.update({ props: { [openProp]: false } });
    await settle(400);
    act(() => outside.focus());
    tab();
    expect(deepActiveElement()).toBe(outside);
  });

  test('a focus() on the widget host goes to what was last focused inside it', async () => {
    const v = await mountPack('antd', 'Modal', {});
    const trigger = v.root().querySelector('button');
    act(() => trigger.focus());
    act(() => trigger.blur());
    expect(deepActiveElement()).not.toBe(trigger);
    const host = v.root().host;
    act(() => host.focus());
    expect(deepActiveElement()).toBe(trigger);
  });
});

test('a closed Ant Drawer keeps no focus stops in the page', async () => {
  const v = await mountPack('antd', 'Drawer', { open: true });
  await settle(100);
  const drawerRoot = () =>
    [...document.querySelectorAll('.tj-cc-popup-host')]
      .map((host) => host.shadowRoot.querySelector('.ant-drawer'))
      .find(Boolean);
  expect(drawerRoot().style.visibility).not.toBe('hidden');
  await v.update({ props: { open: false } });
  await settle(600);
  expect(drawerRoot().style.visibility).toBe('hidden');
  await v.update({ props: { open: true } });
  expect(drawerRoot().style.visibility).not.toBe('hidden');
});

describe('the host publishes isValid and isMandatory with a component rule', () => {
  const { renderHook } = require('@testing-library/react');
  const { useHostValidation } = require('@/AppBuilder/Widgets/LibraryComponent/usePackHost');

  test('a rule that still fails after the value changes keeps isValid false', () => {
    const exposed = {};
    const latest = {
      current: {
        validate: () => ({ isValid: true }),
        validation: {},
        setExposedVariable: (k, v) => {
          exposed[k] = v;
        },
      },
    };
    const { rerender } = renderHook(({ value, rule }) => useHostValidation(latest, value, undefined, rule), {
      initialProps: { value: 'abc', rule: 'Minimum 8 characters is needed' },
    });
    expect(exposed.isValid).toBe(false);
    // An event fired as the value changed judged the new value by the Validation section alone (fireHostEvent).
    exposed.isValid = true;
    rerender({ value: 'abcd', rule: 'Minimum 8 characters is needed' });
    expect(exposed.isValid).toBe(false);
  });

  test("a pack's own Required property sets isMandatory", () => {
    const exposed = {};
    const latest = {
      current: {
        validate: () => ({ isValid: true }),
        validation: {},
        required: true,
        setExposedVariable: (k, v) => {
          exposed[k] = v;
        },
      },
    };
    renderHook(() => useHostValidation(latest, '', undefined, ''));
    expect(exposed.isMandatory).toBe(true);
  });
});

describe('a disabled Ant or MUI Button is dimmed once, by the host', () => {
  test.each([
    ['antd', 'Button'],
    ['mui', 'Button'],
  ])('%s %s keeps its look, says it is disabled and fires nothing', async (pack, name) => {
    const { fireEvent } = require('@testing-library/react');
    const v = await mountPack(pack, name, {}, { host: { disabled: true } });
    const button = v.root().querySelector('button');
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(v.events).not.toContain('onClick');
  });
});
