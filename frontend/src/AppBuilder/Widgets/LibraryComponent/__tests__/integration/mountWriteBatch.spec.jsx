import React from 'react';
import { render, act, waitFor } from '@testing-library/react';

import InlineLibraryComponent, { holdStoreWrites } from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import {
  loadLibraryModule,
  loadLibraryCss,
  toolJetSdk as ToolJet,
} from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import useStore from '@/AppBuilder/_stores/store';

// Large-page load (2026-10-25): every ToolJet.useStateX of every pack widget published its value as its own store update
// as the page mounted, and each update re-ran every widget's selectors: 100 Ant fields took ~3 s to switch to, 100 native
// fields ~0.4 s. The writes of one mount now go out as one store update.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve('')),
}));

const Field = () => {
  const [value, setValue] = ToolJet.useStateString({ name: 'value', initialValue: 'a' });
  ToolJet.useStateBoolean({ name: 'checked', initialValue: true });
  return (
    <button data-testid="field" onClick={() => setValue(value + 'b')}>
      {value}
    </button>
  );
};

const exposed = (id) => useStore.getState().resolvedStore.modules.canvas.exposedValues.components[id];

const widget = (id, cacheKey = 'lib|1') => (
  <InlineLibraryComponent
    key={id}
    bundleUrl="bundle.js"
    cssUrl="bundle.css"
    cacheKey={cacheKey}
    componentName="Field"
    componentProps={{}}
    componentStyles={{}}
    renderSlot={() => null}
    setExposedVariable={(key, value) => useStore.getState().setExposedValue(id, key, value, 'canvas')}
    fireEvent={jest.fn()}
    actions={new Map()}
    dataCy={id}
  />
);

beforeEach(() => {
  loadLibraryModule.mockReset();
  loadLibraryModule.mockResolvedValue({ Field });
  loadLibraryCss.mockReset();
  loadLibraryCss.mockResolvedValue('');
});

describe('pack mount store writes', () => {
  // Break this catches: releasing the mount batch before CSS allows the pack fields to mount.
  it.each(['code-first', 'css-first', 'css-failure'])(
    '[LibraryComponent-MOUNT-001] batches initial pack values when loading is %s',
    async (loadOrder) => {
      const ids = Array.from({ length: 10 }, (_, i) => `w${i}`);
      let updates = 0;
      const unsubscribe = useStore.subscribe(() => (updates += 1));
      let resolveCode;
      let resolveCss;
      let rejectCss;
      const cssPromise = new Promise((resolve, reject) => {
        resolveCss = resolve;
        rejectCss = reject;
      });
      loadLibraryCss.mockImplementation(() => cssPromise);
      const codePromise = new Promise((resolve) => {
        resolveCode = resolve;
      });
      loadLibraryModule.mockImplementation(() => codePromise);
      const view = render(<>{ids.map((id) => widget(id, `mount-${loadOrder}`))}</>);
      if (loadOrder === 'css-first') {
        await act(async () => {
          resolveCss('');
        });
        await act(async () => {
          resolveCode({ Field });
        });
      } else {
        await act(async () => {
          resolveCode({ Field });
        });
        await act(async () => {
          if (loadOrder === 'css-failure') rejectCss(new Error('Stylesheet unavailable'));
          else resolveCss('');
        });
      }
      await waitFor(() => expect(view.container.ownerDocument.querySelectorAll('[data-cy]')).toHaveLength(10));
      await waitFor(() => ids.forEach((id) => expect(exposed(id)).toEqual({ value: 'a', checked: true })));
      unsubscribe();
      // 10 widgets x 2 variables were 20 updates; now the mount commit's writes are one (dependency updates aside).
      expect(updates).toBe(1);
      expect(useStore.getState().isExposedValueBatching()).toBe(false);
    }
  );

  it('still writes a change after mount straight away, so an event on the next line reads it', async () => {
    const view = render(widget('solo'));
    await waitFor(() => expect(exposed('solo')?.value).toBe('a'));
    const host = view.container.querySelector('[data-cy="solo"]');
    await waitFor(() => expect(host.shadowRoot.querySelector('[data-testid="field"]')).not.toBeNull());
    act(() => host.shadowRoot.querySelector('[data-testid="field"]').click());
    expect(exposed('solo').value).toBe('ab');
    expect(useStore.getState().isExposedValueBatching()).toBe(false);
  });

  it('nests in a batch already open (a page switch) and leaves it open', () => {
    const { startExposedValueBatch, flushExposedValueBatch, isExposedValueBatching } = useStore.getState();
    startExposedValueBatch();
    const release = holdStoreWrites();
    release();
    release();
    expect(isExposedValueBatching()).toBe(true);
    flushExposedValueBatch();
    expect(isExposedValueBatching()).toBe(false);
  });
});
