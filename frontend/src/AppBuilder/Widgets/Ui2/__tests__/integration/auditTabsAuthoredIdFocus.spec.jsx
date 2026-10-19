// Release audit (Codex fixtures auditTabsAuthoredIdFocus and auditTabsKeyboardIdEscaping): an arrow key selected the
// next tab, then focused it through a CSS selector built from its id, escaping only quotes and backslashes. A tab id
// may hold any text, and one with a line feed or carriage return (a form feed too, in browsers) made the selector
// invalid: the frame threw and focus stayed on the old tab. The tab is now found by comparing its data-tab-id.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadTabs',
  handle: 'tabs1',
  id: 'tabs1',
  widgetWidth: 640,
  widgetHeight: 300,
  capabilities: { dnd: true },
});
// The keyboard focus runs in an animation frame: held, and run by the test so an error in it fails the test.
let frames;
let raf;
beforeEach(async () => {
  await w.setup();
  frames = [];
  raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
});
afterEach(() => {
  w.teardown();
  raf.mockRestore();
});

describe.each(['pills', 'underline', 'steps'])('%s', (variant) => {
  test.each([
    ['ordinary', 'west'],
    ['spaces', 'region west'],
    ['quotes', 'region "west"'],
    ['backslash', 'region\\west'],
    ['line feed', 'region\nwest'],
    ['carriage return', 'region\rwest'],
    ['form feed', 'region\fwest'],
  ])('a tab id with %s takes focus from the arrow key', async (_label, targetId) => {
    const tabs = [
      { id: 'start', title: 'Alpha' },
      { id: targetId, title: 'Beta' },
    ];
    await act(async () =>
      w.render({
        currentMode: 'view',
        properties: {
          variant: binding(variant),
          linearSteps: binding('{{false}}'),
          useDynamicOptions: binding('{{true}}'),
          tabs: binding(`{{${JSON.stringify(tabs)}}}`),
          defaultTab: binding('start'),
        },
      })
    );
    const alpha = screen.getByRole('tab', { name: /Alpha/ });
    const beta = screen.getByRole('tab', { name: /Beta/ });
    expect(beta).toHaveAttribute('data-tab-id', targetId);
    act(() => alpha.focus());
    fireEvent.keyDown(alpha, { key: 'ArrowRight' });
    expect(w.exposed().currentTab).toBe(targetId);
    let error = null;
    act(() => {
      for (const frame of frames.splice(0)) {
        try {
          frame(0);
        } catch (caught) {
          error = String(caught);
        }
      }
    });
    expect({ error, focused: document.activeElement === beta }).toEqual({ error: null, focused: true });
  });
});
