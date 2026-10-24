import React from 'react';
import { render, act, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule, toolJetSdk as ToolJet } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

// The bundle loader fetches and dynamic-imports a blob URL, which jsdom can't do; the component it returns
// here is written against the real inline SDK, exactly as a bundle would be.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const Card = ({ showFooter = true, footerName = 'footer' }) => {
  const accent = ToolJet.useStyleString({ name: 'accent', initialValue: 'red' });
  const padding = ToolJet.useStyleNumber({ name: 'padding', initialValue: 8 });
  return (
    <div data-testid="card" data-accent={accent} data-padding={padding}>
      <ToolJet.Slot name="content" className="body" />
      {showFooter && <ToolJet.Slot name={footerName} />}
    </div>
  );
};

const renderCard = (overrides = {}) => {
  const setExposedVariable = jest.fn();
  const props = {
    bundleUrl: 'bundle.js',
    cssUrl: 'bundle.css',
    cacheKey: 'lib|v1',
    componentName: 'Card',
    componentProps: {},
    componentStyles: {},
    renderSlot: (name) => <span data-testid={`canvas-${name}`} />,
    setExposedVariable,
    fireEvent: jest.fn(),
    actions: new Map(),
    dataCy: 'card1',
    ...overrides,
  };
  const utils = render(<InlineLibraryComponent {...props} />);
  const host = utils.container.querySelector('[data-cy="card1"]');
  return {
    ...utils,
    host,
    setExposedVariable,
    rerenderWith: (next) => utils.rerender(<InlineLibraryComponent {...props} {...next} />),
    card: () => host.shadowRoot.querySelector('[data-testid="card"]'),
    slottedNames: () => [...host.children].map((child) => child.getAttribute('slot')),
  };
};

describe('inline SDK: styles and slots', () => {
  beforeEach(() => {
    loadLibraryModule.mockResolvedValue({ Card });
  });

  it('[LibraryComponent-INLINE-STYLES-001] useStyleX reads the Inspector style, falls back to initialValue, and is not exposed by default', async () => {
    // Break this catches: style hooks reading props instead of styles, ignoring initialValue when the
    // style is unset or cleared, or reporting styles as exposed variables like useStateX does.
    const { card, rerenderWith, setExposedVariable } = renderCard({ componentStyles: { accent: '' } });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().dataset).toMatchObject({ accent: 'red', padding: '8' });

    rerenderWith({ componentStyles: { accent: 'var(--cc-primary-brand)', padding: 24 } });
    expect(card().dataset).toMatchObject({ accent: 'var(--cc-primary-brand)', padding: '24' });
    expect(setExposedVariable).not.toHaveBeenCalled();
  });

  it('[LibraryComponent-INLINE-STYLES-002] a style declared with expose: true is also reported as an exposed variable', async () => {
    // Break this catches: ignoring `expose` (the app can't read a style meant to be shared), or not
    // re-reporting when the builder changes the style.
    loadLibraryModule.mockResolvedValue({
      Card: () => {
        ToolJet.useStyleString({ name: 'accent', initialValue: 'red', expose: true });
        return <div data-testid="card" />;
      },
    });
    const { card, rerenderWith, setExposedVariable } = renderCard();
    await waitFor(() => expect(card()).not.toBeNull());
    expect(setExposedVariable).toHaveBeenLastCalledWith('accent', 'red');

    rerenderWith({ componentStyles: { accent: 'blue' } });
    expect(setExposedVariable).toHaveBeenLastCalledWith('accent', 'blue');
  });

  it('[LibraryComponent-INLINE-SLOT-001] each mounted Slot gets a native <slot> and a light-DOM drop area assigned to it', async () => {
    // Break this catches: rendering the drop area inside the shadow root (the editor's document lookups
    // can't see it), or a slot/drop-area name mismatch (the browser never projects the canvas).
    const { card, host, slottedNames } = renderCard();
    await waitFor(() => expect(card()).not.toBeNull());

    const slots = [...card().querySelectorAll('slot')].map((slot) => slot.getAttribute('name'));
    expect(slots).toEqual(['tj-slot-content', 'tj-slot-footer']);
    expect(slottedNames()).toEqual(['tj-slot-content', 'tj-slot-footer']);
    expect(host.querySelector('[slot="tj-slot-content"] [data-testid="canvas-content"]')).not.toBeNull();
    expect(card().querySelector('[data-tj-slot="content"]').className).toBe('body');
  });

  it('[LibraryComponent-INLINE-SLOT-002] a Slot that unmounts releases its drop area; an invalid name never gets one', async () => {
    // Break this catches: a stale drop area left behind after the bundle stops rendering its slot, or a name
    // with '-' registering a canvas id the editor would split wrongly.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { card, slottedNames, rerenderWith } = renderCard();
    await waitFor(() => expect(slottedNames()).toEqual(['tj-slot-content', 'tj-slot-footer']));

    loadLibraryModule.mockResolvedValue({ Card: () => <Card showFooter={false} /> });
    rerenderWith({ cacheKey: 'lib|v2' });
    await waitFor(() => expect(slottedNames()).toEqual(['tj-slot-content']));

    loadLibraryModule.mockResolvedValue({ Card: () => <Card footerName="bad-name" /> });
    rerenderWith({ cacheKey: 'lib|v3' });
    await waitFor(() => expect(card()?.querySelector('[data-tj-slot="bad-name"]')).not.toBeNull());
    expect(slottedNames()).toEqual(['tj-slot-content']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid name "bad-name"'));
    warn.mockRestore();
  });
});

describe('inline SDK: state bindings', () => {
  const SAMPLE = [{ id: 1, name: 'Sample row' }];
  const Grid = () => {
    const [data] = ToolJet.useStateArray({ name: 'data', initialValue: SAMPLE });
    return <div data-testid="card" data-count={data.length} />;
  };
  beforeEach(() => {
    loadLibraryModule.mockResolvedValue({ Card: Grid });
  });

  it('[LibraryComponent-INLINE-STATE-001] a set property whose binding resolves to undefined starts empty, not with the sample', async () => {
    // Break this catches: a failed or not-yet-run query reading as the component's sample data in the viewer.
    const { card, rerenderWith } = renderCard({ componentProps: { data: undefined } });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().dataset.count).toBe('0');

    rerenderWith({ componentProps: { data: [{ id: 7 }, { id: 8 }] } });
    expect(card().dataset.count).toBe('2');
  });

  it('[LibraryComponent-INLINE-STATE-002] a property the app never set falls back to initialValue', async () => {
    const { card } = renderCard({ componentProps: {} });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().dataset.count).toBe('1');
  });
});
