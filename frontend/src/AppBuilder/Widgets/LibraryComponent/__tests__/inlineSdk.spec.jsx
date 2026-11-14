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

describe('inline SDK: host disabled mark', () => {
  beforeEach(() => {
    loadLibraryModule.mockResolvedValue({ Card });
  });

  const hostWith = (disabled) => ({
    disabled,
    loading: false,
    fieldId: 'field-1',
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
    setRows: () => {},
    rowSlotAttr: (i) => `row-${i}`,
    registerPopupSlot: () => () => {},
    popupSlotAttr: (name) => name,
  });

  it('marks the component root while the host disables it, so the pack dims once without a wrapper', async () => {
    // Break this catches: the pack needing its own wrapper (withHostDisabled) to learn it is host-disabled, which
    // hides every wrapped component from the CLI's build; or the mark staying after the host re-enables it.
    const { host, rerenderWith } = renderCard({ host: hostWith(true) });
    const root = () => host.shadowRoot.querySelector('.tj-cc-root');
    await waitFor(() => expect(root()).toBeTruthy());

    await waitFor(() => expect(root().hasAttribute('data-tj-host-disabled')).toBe(true));
    rerenderWith({ host: hostWith(false) });
    await waitFor(() => expect(root().hasAttribute('data-tj-host-disabled')).toBe(false));
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

describe('inline SDK: style bindings', () => {
  it('[LibraryComponent-INLINE-STYLES-003] a style bound to null, or to an option it does not list, falls back to initialValue', async () => {
    // Break this catches: a style bound to data that has not loaded ({{null}}) reaching a vendor component, which can
    // throw (MUI Tabs' textColor took the whole viewer down).
    loadLibraryModule.mockResolvedValue({
      Card: () => {
        const tone = ToolJet.useStyleEnumeration({
          name: 'tone',
          enumDefinition: ['primary', 'secondary'],
          initialValue: 'primary',
        });
        const accent = ToolJet.useStyleString({ name: 'accent', initialValue: 'red' });
        return <div data-testid="card" data-tone={tone} data-accent={accent} />;
      },
    });
    const { card, rerenderWith } = renderCard({ componentStyles: { tone: null, accent: null } });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().dataset).toMatchObject({ tone: 'primary', accent: 'red' });
    rerenderWith({ componentStyles: { tone: 'tertiary', accent: 'blue' } });
    expect(card().dataset).toMatchObject({ tone: 'primary', accent: 'blue' });
    rerenderWith({ componentStyles: { tone: 'secondary' } });
    expect(card().dataset.tone).toBe('secondary');
  });
});

describe('inline SDK: style values the style cannot draw', () => {
  // jsdom has no CSS.supports; this stand-in reads colours with jsdom's own CSS parser and accepts var(), as browsers do.
  const realCss = global.CSS;
  beforeAll(() => {
    global.CSS = {
      supports: (property, value) => {
        if (/^var\(--[\w-]+(,.*)?\)$/.test(String(value).trim())) return true;
        const style = document.createElement('div').style;
        style[property] = value;
        return style[property] !== '';
      },
    };
  });
  afterAll(() => {
    global.CSS = realCss;
  });

  it('[LibraryComponent-STYLE-005] a bad colour, a non-number and a negative radius fall back to initialValue', async () => {
    // Break this catches: notacolor or a radius of abc / -4 reaching CSS, which drops it and draws the part transparent,
    // black or square (Rocket 2.0 RK-09, Ant Design PKB-66).
    loadLibraryModule.mockResolvedValue({
      Card: () => {
        const fill = ToolJet.useStyleString({
          name: 'fill',
          inspector: 'color',
          initialValue: 'var(--cc-primary-brand)',
        });
        const ink = ToolJet.useStyleString({ name: 'ink', inspector: 'color', initialValue: '#ffffff' });
        const label = ToolJet.useStyleString({ name: 'label', initialValue: 'Hi' });
        const radius = ToolJet.useStyleNumber({ name: 'borderRadius', initialValue: 4 });
        const gap = ToolJet.useStyleNumber({ name: 'gap', initialValue: 8 });
        const offset = ToolJet.useStyleNumber({ name: 'offset', initialValue: 0 });
        return (
          <div
            data-testid="card"
            data-fill={fill}
            data-ink={ink}
            data-label={label}
            data-radius={radius}
            data-gap={gap}
            data-offset={offset}
          />
        );
      },
    });
    const { card, rerenderWith } = renderCard({
      componentStyles: {
        fill: 'notacolor',
        ink: '#ff00zz',
        label: 'notacolor',
        borderRadius: 'abc',
        gap: 'wide',
        offset: -3,
      },
    });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().dataset).toMatchObject({
      fill: 'var(--cc-primary-brand)',
      ink: '#ffffff',
      label: 'notacolor',
      radius: '4',
      gap: '8',
      offset: '-3',
    });
    rerenderWith({
      componentStyles: { fill: 'var(--cc-success-systemStatus)', ink: 'rgb(1, 2, 3)', borderRadius: -4, gap: '12' },
    });
    expect(card().dataset).toMatchObject({
      fill: 'var(--cc-success-systemStatus)',
      ink: 'rgb(1, 2, 3)',
      radius: '4',
      gap: '12',
    });
    rerenderWith({ componentStyles: { borderRadius: 10 } });
    expect(card().dataset.radius).toBe('10');
  });

  it('[LibraryComponent-STYLE-006] a negative size in a number style falls back to initialValue', async () => {
    // Break this catches: a divider width of -5 reaching CSS as -5px, which CSS drops, so the divider has no width
    // and cannot be dragged (Rocket RK-38).
    loadLibraryModule.mockResolvedValue({
      Card: () => {
        const height = ToolJet.useStyleNumber({ name: 'panelHeight', initialValue: 160 });
        const padding = ToolJet.useStyleNumber({ name: 'padding', initialValue: 16 });
        const gap = ToolJet.useStyleNumber({ name: 'gap', initialValue: 6 });
        const thickness = ToolJet.useStyleNumber({ name: 'thickness', initialValue: 1 });
        const offset = ToolJet.useStyleNumber({ name: 'offset', initialValue: 0 });
        return (
          <div
            data-testid="card"
            data-height={height}
            data-padding={padding}
            data-gap={gap}
            data-thickness={thickness}
            data-offset={offset}
          />
        );
      },
    });
    const { card, rerenderWith } = renderCard({
      componentStyles: { panelHeight: -20, padding: '-4', gap: -5, thickness: -1, offset: -3 },
    });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().dataset).toMatchObject({ height: '160', padding: '16', gap: '6', thickness: '1', offset: '-3' });
    rerenderWith({ componentStyles: { panelHeight: 200, padding: '30', gap: 0 } });
    expect(card().dataset).toMatchObject({ height: '200', padding: '30', gap: '0' });
  });

  it('[LibraryComponent-STYLE-007] a number style typed in the number field reaches the component as a number', async () => {
    // Break this catches: the number field saving "200", which a component puts in style.height; CSS drops a size with
    // no unit, so the Accordion section collapsed to 0 (Rocket RK-28).
    let seen;
    loadLibraryModule.mockResolvedValue({
      Card: () => {
        seen = ToolJet.useStyleNumber({ name: 'panelHeight', initialValue: 160, inspector: 'numberInput' });
        return <div data-testid="card" />;
      },
    });
    const { card, rerenderWith } = renderCard({ componentStyles: { panelHeight: '200' } });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(seen).toBe(200);
    rerenderWith({ componentStyles: { panelHeight: ' 12.5 ' } });
    expect(seen).toBe(12.5);
  });
});
