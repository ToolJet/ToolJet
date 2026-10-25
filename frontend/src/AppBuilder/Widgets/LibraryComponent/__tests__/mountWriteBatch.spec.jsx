import React from 'react';
import { render, act, waitFor } from '@testing-library/react';

import InlineLibraryComponent, { holdStoreWrites } from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule, toolJetSdk as ToolJet } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
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

const widget = (id) => (
  <InlineLibraryComponent
    key={id}
    bundleUrl="bundle.js"
    cssUrl="bundle.css"
    cacheKey="lib|1"
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
});

describe('pack mount store writes', () => {
  it('publishes the mount writes of a page of pack widgets as one store update', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `w${i}`);
    let updates = 0;
    const unsubscribe = useStore.subscribe(() => (updates += 1));
    const view = render(<>{ids.map(widget)}</>);
    await waitFor(() => expect(view.container.ownerDocument.querySelectorAll('[data-cy]').length).toBe(10));
    await waitFor(() => ids.forEach((id) => expect(exposed(id)).toEqual({ value: 'a', checked: true })));
    unsubscribe();
    // 10 widgets x 2 variables were 20 updates; now the mount commit's writes are one (dependency updates aside).
    expect(updates).toBeLessThanOrEqual(3);
    expect(useStore.getState().isExposedValueBatching()).toBe(false);
  });

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
