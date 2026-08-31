/**
 * Behaviour spec for the real Divider (AppBuilder/Widgets/Divider.jsx) and its
 * near-twin VerticalDivider (AppBuilder/Widgets/VerticalDivider.jsx), rendered
 * through the real RenderWidget against the real composed store. Nothing about
 * either widget is mocked. Shared setup lives in ./widgetHarness.js.
 *
 * Scope is deliberately small, and that is the honest scope. Between them these
 * two widgets declare (WidgetManager/widgets/divider.js, verticalDivider.js):
 *   - properties: label, visibility, tooltip/tooltipFormat (RenderWidget's, not
 *     the widget's)
 *   - styles: dividerColor, dividerStyle, labelAlignment, labelColor, textWrap,
 *     boxShadow, padding
 *   - exposedVariables: {} — none. No events. No user interaction of any kind.
 * So there is nothing stateful to assert: every test below is "this declared
 * property produces this inline style / this node in the DOM", plus the one
 * genuinely valuable case — a `{{ }}` binding controlling visibility travelling
 * the real dependency graph.
 *
 * Deliberately NOT tested, because jsdom cannot observe a difference:
 *   - `padding` (destructured at Divider.jsx:8 and then never used — dead; the
 *     real container padding is applied by RenderWidget.jsx, not the widget)
 *   - `boxShadow` beyond pass-through, and the `height`/`width` props, which
 *     both widgets accept and ignore.
 *
 * Colours are asserted with plain hex, never the shipped
 * `var(--cc-default-border)` default: jsdom keeps a custom property verbatim in
 * cssText but resolves nothing, so a `toHaveStyle` against a var() token would
 * pass for the wrong reason.
 */
import { act, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding, store, MODULE_ID } from './widgetHarness';

/** Schema defaults from divider.js `definition`, so a test only states its subject. */
const H_STYLES = {
  dividerColor: binding('#123456'),
  dividerStyle: binding('solid'),
  labelAlignment: binding('center'),
  labelColor: binding('#654321'),
  textWrap: binding('wrap'),
  padding: binding('default'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
};

/** Schema defaults from verticalDivider.js `definition`. */
const V_STYLES = {
  dividerColor: binding('#123456'),
  dividerStyle: binding('solid'),
  padding: binding('default'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
};

const divider = createWidgetHarness({
  componentType: 'Divider',
  handle: 'divider1',
  id: 'div1',
  defaultProperties: { label: binding(''), visibility: binding('{{true}}') },
  defaultStyles: H_STYLES,
});

const verticalDivider = createWidgetHarness({
  componentType: 'VerticalDivider',
  handle: 'verticalDivider1',
  id: 'vdiv1',
  defaultProperties: { visibility: binding('{{true}}') },
  defaultStyles: V_STYLES,
});

/**
 * The widget's own root: RenderWidget passes `dataCy={componentName}`
 * (RenderWidget.jsx:341), and both widgets put it on their outermost node — the
 * one carrying the visibility `display`.
 */
const root = (container, name) => container.querySelector(`[data-cy="${name}"]`);
/** The line(s). Everything under the root that is not the label span. */
const lines = (container, name) => Array.from(root(container, name).querySelectorAll('div'));

describe('Divider widget', () => {
  beforeEach(divider.setup);
  afterEach(divider.teardown);

  describe('drawing the line', () => {
    test('paints the line with the dividerColor style', async () => {
      const { container } = divider.render({ styles: { dividerColor: binding('#ff0000') } });

      await waitFor(() => expect(root(container, 'divider1')).toBeInTheDocument());
      expect(lines(container, 'divider1')[0]).toHaveStyle({ backgroundColor: '#ff0000', height: '1px' });
    });

    test('inverts a black divider to white in dark mode, so it stays visible', async () => {
      // Divider.jsx:10-11 — '' and #000/#000000 are treated as "unset" and
      // follow the theme instead of being taken literally.
      const { container } = divider.render({ styles: { dividerColor: binding('#000000') }, darkMode: true });

      await waitFor(() => expect(root(container, 'divider1')).toBeInTheDocument());
      expect(lines(container, 'divider1')[0]).toHaveStyle({ backgroundColor: '#fff' });
    });

    test('a dashed divider paints a repeating gradient instead of a solid fill', async () => {
      const { container } = divider.render({
        styles: { dividerStyle: binding('dashed'), dividerColor: binding('#ff0000') },
      });

      await waitFor(() => expect(root(container, 'divider1')).toBeInTheDocument());
      // NOT asserting the linear-gradient itself: jsdom's cssstyle does not
      // implement <gradient>, so `style.backgroundImage` comes back as ''. The
      // solid/dashed switch is still observable — a solid line fills with the
      // colour and sets no repeat, a dashed one goes transparent and repeats
      // horizontally — and that is what is asserted.
      const line = lines(container, 'divider1')[0];
      expect(line).toHaveStyle({ backgroundColor: 'transparent', backgroundRepeat: 'repeat-x' });
      expect(line).not.toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  describe('its label', () => {
    test('renders the label text and pushes the row to the labelAlignment edge', async () => {
      const { container } = divider.render({
        properties: { label: binding('Section') },
        styles: { labelAlignment: binding('right') },
      });

      expect(await screen.findByText('Section')).toBeInTheDocument();
      expect(root(container, 'divider1')).toHaveStyle({ justifyContent: 'flex-end' });
    });

    test('a centred label is bracketed by a line on each side, an edge label by one', async () => {
      const { container: centred } = divider.render({
        properties: { label: binding('Middle') },
        styles: { labelAlignment: binding('center') },
      });
      await screen.findByText('Middle');
      // The center branch wraps its two lines in an extra flex row, hence 3 divs.
      expect(lines(centred, 'divider1')).toHaveLength(3);

      const { container: edge } = divider.render({
        properties: { label: binding('Middle') },
        styles: { labelAlignment: binding('left') },
      });
      await waitFor(() => expect(lines(edge, 'divider1')).toHaveLength(1));
    });

    test('textWrap `nowrap` clips the label to one ellipsised line', async () => {
      divider.render({
        properties: { label: binding('A very long section heading') },
        styles: { textWrap: binding('nowrap') },
      });

      const label = await screen.findByText('A very long section heading');
      expect(label).toHaveStyle({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
    });
  });

  describe('visibility', () => {
    test('a false visibility property collapses the widget to display:none', async () => {
      const { container } = divider.render({ properties: { visibility: binding('{{false}}') } });

      await waitFor(() => expect(root(container, 'divider1')).toBeInTheDocument());
      expect(root(container, 'divider1')).toHaveStyle({ display: 'none' });
    });

    test('visibility bound to another component follows it through the dependency graph', async () => {
      // The one test here that React alone could not prove: `divider1`'s
      // visibility is an expression over `text1`'s EXPOSED value, so it only
      // resolves if Text writes to the store and the dependency graph
      // re-resolves the Divider.
      //
      // Asserting the TRANSITION, not just the end state, is load-bearing. A
      // single `waitFor(display: flex)` passes against a Divider that inverted
      // the ternary, because the very first poll happens before the cascade has
      // run and `visibility` is still undefined. Only flipping the source value
      // and watching the Divider follow rules that out.
      const { container } = divider.render({
        properties: { visibility: binding("{{components.text1.text === 'show'}}") },
        extraComponents: {
          txt: componentDefinition('txt', 'text1', 'Text', {
            text: binding('show'),
            textFormat: binding('plainText'),
            visibility: binding('{{true}}'),
          }),
        },
        also: [{ id: 'txt', componentType: 'Text' }],
      });

      await waitFor(() => expect(root(container, 'divider1')).toHaveStyle({ display: 'flex' }));

      // Real cascade entry point: setExposedValue calls updateDependencyValues
      // internally, which is what re-resolves every dependent binding.
      await act(async () => {
        store().setExposedValue('txt', 'text', 'hide', MODULE_ID);
      });

      await waitFor(() => expect(root(container, 'divider1')).toHaveStyle({ display: 'none' }));
    });
  });
});

describe('VerticalDivider widget', () => {
  beforeEach(verticalDivider.setup);
  afterEach(verticalDivider.teardown);

  test('paints a 1px-wide full-height line in the dividerColor', async () => {
    const { container } = verticalDivider.render({ styles: { dividerColor: binding('#00ff00') } });

    await waitFor(() => expect(root(container, 'verticalDivider1')).toBeInTheDocument());
    expect(lines(container, 'verticalDivider1')[0]).toHaveStyle({
      backgroundColor: '#00ff00',
      width: '1px',
      height: '100%',
    });
  });

  test('a dashed vertical divider repeats its gradient down the line, not across', async () => {
    const { container } = verticalDivider.render({
      styles: { dividerStyle: binding('dashed'), dividerColor: binding('#00ff00') },
    });

    await waitFor(() => expect(root(container, 'verticalDivider1')).toBeInTheDocument());
    // `repeat-y` vs the horizontal Divider's `repeat-x` is the only part of the
    // dashed branch jsdom can see (it drops the linear-gradient entirely), and
    // it is exactly the axis that distinguishes the two widgets.
    const line = lines(container, 'verticalDivider1')[0];
    expect(line).toHaveStyle({ backgroundColor: 'transparent', backgroundRepeat: 'repeat-y' });
  });

  test('a false visibility property collapses the widget to display:none', async () => {
    const { container } = verticalDivider.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(root(container, 'verticalDivider1')).toBeInTheDocument());
    expect(root(container, 'verticalDivider1')).toHaveStyle({ display: 'none' });
  });
});
