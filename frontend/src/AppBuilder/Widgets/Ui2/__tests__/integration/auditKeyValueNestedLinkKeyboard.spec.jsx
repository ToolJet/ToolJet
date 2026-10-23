import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixtures auditKeyValueNestedLinkKeyboard and auditKeyValueDisabledSurfaces, from
// FORM-RELEASE-REPLAY-016c13d): with onFieldClick wired, a row took Enter and Space from the link inside it, so the
// key's browser default (following the link, scrolling) was cancelled and the row's workflow ran instead; a native
// browser confirmed Enter no longer followed the link. And a disabled Key value list still let its links navigate
// and its Copy value buttons write to the clipboard, initially disabled or through setDisable. A row now takes only
// keys pressed on itself, and disable reaches its links and copy buttons, as a disabled standalone Link does. The
// controls (an unwired link, the row's own keys, copy keys, IME Enter, re-enabling, loading, ShadLink) already held.
// jsdom does not follow links: these check whether the click or key default is cancelled.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, fireEvent, waitFor } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

describe('a link in a Key value row keeps its keys', () => {
  const w = createWidgetHarness({
    componentType: 'ShadKeyValue',
    id: 'kv1',
    handle: 'kv1',
    widgetWidth: 600,
    widgetHeight: 180,
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  async function mount(wired = true) {
    w.render({
      currentMode: 'view',
      properties: {
        allowCopy: binding(true),
        data: binding([
          { label: 'Record', value: 'https://example.test/item/1', type: 'link', linkText: 'Open record' },
        ]),
      },
    });
    const link = await screen.findByRole('link', { name: 'Open record' });
    if (wired) {
      w.setEvents(
        setVariableOn('kv1', 'onFieldClick', {
          key: 'rows',
          value: '{{[...(variables.rows||[]),components.kv1.lastClickedField]}}',
        })
      );
    }
    await waitFor(() => expect(link.closest('[role="button"]') !== null).toBe(wired));
    return { link, row: link.closest('[role="button"]'), copy: screen.getByRole('button', { name: 'Copy value' }) };
  }

  test.each([true, false].flatMap((wired) => ['Enter', ' '].map((key) => [wired, key])))(
    'wired %s: the link keeps its browser default for %p',
    async (wired, key) => {
      const { link } = await mount(wired);
      let allowed;
      await act(async () => {
        link.focus();
        allowed = fireEvent.keyDown(link, { key, cancelable: true });
      });
      expect({ allowed, rowWorkflows: w.variables().rows || [] }).toEqual({ allowed: true, rowWorkflows: [] });
    }
  );

  test.each(['Enter', ' '])('the row itself still activates once on %p (control)', async (key) => {
    const { row } = await mount();
    await act(async () => {
      row.focus();
      fireEvent.keyDown(row, { key, cancelable: true });
    });
    expect(w.variables().rows).toEqual([{ label: 'Record', value: 'https://example.test/item/1' }]);
  });

  test.each(['Enter', ' '])('the copy button keeps %p from the row (control)', async (key) => {
    const { copy } = await mount();
    let allowed;
    await act(async () => {
      copy.focus();
      allowed = fireEvent.keyDown(copy, { key, cancelable: true });
    });
    expect({ allowed, rowWorkflows: w.variables().rows || [] }).toEqual({ allowed: true, rowWorkflows: [] });
  });

  test('IME Enter in the link is not taken by the row (control)', async () => {
    const { link } = await mount();
    let allowed;
    await act(async () => {
      allowed = fireEvent.keyDown(link, { key: 'Enter', isComposing: true, cancelable: true });
    });
    expect({ allowed, rowWorkflows: w.variables().rows || [] }).toEqual({ allowed: true, rowWorkflows: [] });
  });
});

const MODES = ['active', 'initial-disabled', 'disabled', 'recovered', 'loading'];
const isDisabled = (mode) => mode === 'disabled' || mode === 'initial-disabled';

async function enterMode(w, mode) {
  if (mode === 'disabled' || mode === 'recovered') await w.act('setDisable', true);
  if (mode === 'recovered') await w.act('setDisable', false);
  if (mode === 'loading') await w.act('setLoading', true);
  await waitFor(() =>
    expect({ disabled: w.exposed().isDisabled, loading: w.exposed().isLoading }).toEqual({
      disabled: isDisabled(mode),
      loading: mode === 'loading',
    })
  );
}

describe.each(['ShadKeyValue', 'ShadLink'])('%s: disable reaches the link', (type) => {
  const w = createWidgetHarness({ componentType: type, id: 'w1', handle: 'w1', widgetWidth: 600, widgetHeight: 180 });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test.each(MODES)('%s: the link click default is allowed only when enabled', async (mode) => {
    w.render({
      currentMode: 'view',
      properties: {
        disabledState: binding(mode === 'initial-disabled'),
        ...(type === 'ShadLink'
          ? { linkTarget: binding('#local-target'), linkText: binding('Open record'), targetType: binding('same') }
          : {
              data: binding([
                {
                  label: 'Record',
                  value: 'Local record',
                  href: '#local-target',
                  type: 'link',
                  linkText: 'Open record',
                },
              ]),
            }),
      },
    });
    await screen.findByRole('link', { name: 'Open record' });
    await enterMode(w, mode);
    if (mode === 'loading') {
      expect(screen.queryByRole('link', { name: 'Open record' })).toBeNull();
      return;
    }
    const link = screen.getByRole('link', { name: 'Open record' });
    let allowed;
    // All targets are same-page fragments; no external site is opened.
    await act(async () => {
      allowed = fireEvent.click(link, { cancelable: true });
    });
    expect(allowed).toBe(!isDisabled(mode));
  });
});

describe('ShadKeyValue: disable reaches the copy button', () => {
  const w = createWidgetHarness({
    componentType: 'ShadKeyValue',
    id: 'w1',
    handle: 'w1',
    widgetWidth: 600,
    widgetHeight: 180,
  });
  let originalClipboard;
  let writeText;
  beforeEach(async () => {
    await w.setup();
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });
  afterEach(() => {
    w.teardown();
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else delete navigator.clipboard;
  });

  test.each(MODES)('%s: copies only when enabled', async (mode) => {
    w.render({
      currentMode: 'view',
      properties: {
        disabledState: binding(mode === 'initial-disabled'),
        allowCopy: binding(true),
        data: binding([{ label: 'Note', value: 'Audit note' }]),
      },
    });
    await screen.findByRole('button', { name: 'Copy value' });
    await enterMode(w, mode);
    if (mode === 'loading') {
      expect(screen.queryByRole('button', { name: 'Copy value' })).toBeNull();
      expect(writeText).not.toHaveBeenCalled();
      return;
    }
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy value' })));
    expect(writeText.mock.calls).toEqual(isDisabled(mode) ? [] : [['Audit note']]);
  });
});
