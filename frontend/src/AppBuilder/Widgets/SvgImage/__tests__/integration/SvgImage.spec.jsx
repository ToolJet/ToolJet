import { waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding, store, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { svgImageConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/svgImage';
import { svgImageConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/svgImage';

const ID = 'svg1';
const HANDLE = 'svgimage1';
const ID2 = 'svg2';
const HANDLE2 = 'svgimage2';
const LAYOUT_HEIGHT = 50;
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';

// Two distinguishable vectors: the assertions below key off the shape element, never off markup text.
const RECT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>';
const CIRCLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="8" /></svg>';

const defaultProperties = {
  data: binding(RECT_SVG),
  collapseWhenHidden: binding('{{false}}'),
};
const defaultStyles = {
  visibility: binding('{{true}}'),
  alignment: binding('left'),
};

const widget = createWidgetHarness({
  componentType: 'SvgImage',
  handle: HANDLE,
  id: ID,
  widgetHeight: LAYOUT_HEIGHT,
  defaultProperties,
  defaultStyles,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const image = (container, handle = HANDLE) => root(container, handle)?.querySelector('[role="img"]');
const shapes = (container, selector, handle = HANDLE) => image(container, handle).querySelectorAll(selector);
const resolvedProperty = (key, id = ID) => store().getResolvedComponent(id, null, MODULE_ID)?.properties?.[key];

function svgImageDefinition(id, handle, properties = {}, styles = {}) {
  const definition = componentDefinition(id, handle, 'SvgImage', { ...defaultProperties, ...properties });
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  return definition;
}

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'properties'));
}

async function setStyle(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'styles'));
}

describe('SvgImage widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[SvgImage-REN-001] Authored SVG data renders as real vector DOM inside the image node', async () => {
    // Break this catches: rendering the authored data as escaped text, dropping the inner shapes,
    // or losing the fixed-height clipping container an app author sized the widget with.
    const { container } = widget.render();
    const imageNode = await within(container).findByRole('img');

    expect(imageNode.querySelector('svg')).not.toBeNull();
    expect(shapes(container, 'rect')).toHaveLength(2);
    expect(imageNode.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    expect(imageNode.textContent).toBe('');
    expect(root(container)).toHaveStyle({ height: `${LAYOUT_HEIGHT - 4}px`, overflow: 'hidden' });
  });

  test('[SvgImage-DATA-001] Data changes replace the vector in place and falsy data clears it', async () => {
    // Break this catches: memoising the sanitised markup so a new binding value keeps the old
    // vector on screen, or rendering "undefined"/"false" text when a binding resolves falsy.
    const { container } = widget.render();
    const imageNode = await within(container).findByRole('img');
    expect(shapes(container, 'rect')).toHaveLength(2);

    await setProperty('data', CIRCLE_SVG);
    await waitFor(() => expect(shapes(container, 'circle')).toHaveLength(1));
    expect(shapes(container, 'rect')).toHaveLength(0);
    expect(image(container)).toBe(imageNode);

    await setProperty('data', '');
    await waitFor(() => expect(image(container)).toBeEmptyDOMElement());
    expect(image(container)).toBe(imageNode);

    await setProperty('data', RECT_SVG);
    await waitFor(() => expect(shapes(container, 'rect')).toHaveLength(2));

    // An undefined binding is coerced back to the registered string type by the resolver; either
    // way the guarantee is that nothing stale or literal is left on screen.
    await setProperty('data', '{{undefined}}');
    await waitFor(() => expect(image(container)).toBeEmptyDOMElement());
    expect(resolvedProperty('data')).toBeFalsy();

    // D-02: a non-string binding result must not crash the widget. The registered string schema
    // keeps an object from ever reaching the sanitiser; the exact coerced text is deliberately NOT
    // frozen as a guarantee.
    await setProperty('data', RECT_SVG);
    await waitFor(() => expect(shapes(container, 'rect')).toHaveLength(2));
    await setProperty('data', '{{({ a: 1 })}}');
    await waitFor(() => expect(image(container)).toBeEmptyDOMElement());
    expect(typeof resolvedProperty('data')).toBe('string');
    expect(image(container)).toBe(imageNode);

    await setProperty('data', CIRCLE_SVG);
    await waitFor(() => expect(shapes(container, 'circle')).toHaveLength(1));
    expect(image(container)).toBe(imageNode);
  });

  test('[SvgImage-SEC-001] Executable markup cannot survive into the rendered vector', async () => {
    // Break this catches: dropping the DOMPurify call (or widening it) so authored SVG data can
    // ship a <script>, an inline event handler, or a javascript: link into every viewer's page.
    const hostile = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="window.__svgPwned = true">',
      '<script>window.__svgPwned = true;<\/script>',
      '<rect x="1" y="1" width="4" height="4" onclick="window.__svgPwned = true" />',
      '<a href="javascript:window.__svgPwned = true"><text x="1" y="20">go</text></a>',
      '</svg>',
    ].join('');
    const { container } = widget.render({ properties: { data: binding(hostile) } });
    const imageNode = await within(container).findByRole('img');

    await waitFor(() => expect(shapes(container, 'rect')).toHaveLength(1));
    expect(imageNode.querySelector('script')).toBeNull();
    expect(imageNode.querySelector('svg')).not.toHaveAttribute('onload');
    expect(imageNode.querySelector('rect')).not.toHaveAttribute('onclick');
    expect(imageNode.querySelector('a')).not.toHaveAttribute('href');
    expect(imageNode.querySelector('a')).not.toHaveAttribute('xlink:href');
    expect(imageNode.innerHTML).not.toMatch(/javascript:/i);
    expect(window.__svgPwned).toBeUndefined();
    // The safe part of the same value still renders.
    expect(imageNode.querySelector('text').textContent).toBe('go');
  });

  test('[SvgImage-SEC-001] External resource references survive sanitisation (D-01 accepted gap)', async () => {
    // Break this catches: a silent change to the accepted policy in either direction. D-01 records
    // that an authored vector may still reference a remote URL; changing that is a product decision,
    // not an incidental edit.
    const withRemoteImage =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image href="https://cdn.example.com/logo.png" width="24" height="24" /></svg>';
    const { container } = widget.render({ properties: { data: binding(withRemoteImage) } });
    await within(container).findByRole('img');

    await waitFor(() => expect(shapes(container, 'image')).toHaveLength(1));
    expect(shapes(container, 'image')[0].getAttribute('href')).toBe('https://cdn.example.com/logo.png');
  });

  test('[SvgImage-ALN-001] Alignment positions the vector and stays independent of the data', async () => {
    // Break this catches: rebuilding the content node's style from the data change path and losing
    // the configured alignment, or hardcoding one justification for every widget.
    const { container } = widget.render();
    const imageNode = await within(container).findByRole('img');
    expect(imageNode).toHaveStyle({ display: 'flex', justifyContent: 'left' });

    await setStyle('alignment', 'center');
    await waitFor(() => expect(image(container)).toHaveStyle({ justifyContent: 'center' }));
    expect(image(container)).toBe(imageNode);
    expect(shapes(container, 'rect')).toHaveLength(2);

    await setProperty('data', CIRCLE_SVG);
    await waitFor(() => expect(shapes(container, 'circle')).toHaveLength(1));
    expect(image(container)).toHaveStyle({ justifyContent: 'center' });

    await setStyle('alignment', 'right');
    await waitFor(() => expect(image(container)).toHaveStyle({ justifyContent: 'right' }));
    expect(shapes(container, 'circle')).toHaveLength(1);
  });

  test.each(['edit', 'view'])(
    '[SvgImage-VIS-001] Visibility hides and restores the same vector in %s mode',
    async (currentMode) => {
      // Break this catches: unmounting the vector on hide, hiding only in one mode, or dropping
      // alignment/box shadow when the widget becomes visible again.
      const { container } = widget.render({
        currentMode,
        styles: { alignment: binding('center') },
        afterSeed: () => widget.setComponentProperty(ID, 'boxShadow', SHADOW, 'generalStyles'),
      });
      const imageNode = await within(container).findByRole('img');
      expect(root(container).style.display).toBe('');
      expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

      await setStyle('visibility', false);
      await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
      expect(within(container).getByRole('img', { hidden: true })).toBe(imageNode);
      expect(shapes(container, 'rect')).toHaveLength(2);

      await setStyle('visibility', true);
      await waitFor(() => expect(root(container).style.display).toBe(''));
      expect(within(container).getByRole('img')).toBe(imageNode);
      expect(shapes(container, 'rect')).toHaveLength(2);
      expect(image(container)).toHaveStyle({ justifyContent: 'center' });
      expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
    }
  );

  test('[SvgImage-STY-001] Box shadow survives independent data, alignment, and visibility changes', async () => {
    // Break this catches: rebuilding the container's inline style on a property change without the
    // merged universal generalStyles boxShadow.
    const { container } = widget.render({
      afterSeed: () => widget.setComponentProperty(ID, 'boxShadow', SHADOW, 'generalStyles'),
    });
    await within(container).findByRole('img');
    await waitFor(() => expect(root(container)).toHaveStyle({ boxShadow: SHADOW }));

    await setProperty('data', CIRCLE_SVG);
    await waitFor(() => expect(shapes(container, 'circle')).toHaveLength(1));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setStyle('alignment', 'center');
    await waitFor(() => expect(image(container)).toHaveStyle({ justifyContent: 'center' }));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setStyle('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setStyle('visibility', true);
    await waitFor(() => expect(root(container).style.display).toBe(''));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test('[SvgImage-API-001] SvgImage publishes no actions and no widget-owned exposed variables', async () => {
    // Break this catches: re-introducing the exposedVariables entry removed by 5ee59e433d1, or
    // wiring a CSA onto a widget documented and registered as having neither.
    const { container } = widget.render();
    await within(container).findByRole('img');

    expect(frontendConfig.events).toEqual({});
    expect(frontendConfig.exposedVariables).toEqual({});

    const exposed = widget.exposed() ?? {};
    expect(Object.values(exposed).some((value) => typeof value === 'function')).toBe(false);
    expect(Object.keys(exposed).filter((key) => key !== 'id')).toEqual([]);

    await setProperty('data', CIRCLE_SVG);
    await waitFor(() => expect(shapes(container, 'circle')).toHaveLength(1));
    expect(Object.keys(widget.exposed() ?? {}).filter((key) => key !== 'id')).toEqual([]);
  });

  test('[SvgImage-A11Y-001] The image node keeps its role and component id across changes', async () => {
    // Break this catches: dropping role="img" (leaving the vector as an unlabelled <div> with no
    // image semantics) or losing the component-<id> hook that custom CSS and CSA-free styling use.
    const { container } = widget.render();
    const imageNode = await within(container).findByRole('img');
    expect(imageNode).toHaveAttribute('id', `component-${ID}`);

    await setProperty('data', CIRCLE_SVG);
    await waitFor(() => expect(shapes(container, 'circle')).toHaveLength(1));
    expect(within(container).getByRole('img')).toHaveAttribute('id', `component-${ID}`);

    await setStyle('alignment', 'center');
    await waitFor(() => expect(image(container)).toHaveStyle({ justifyContent: 'center' }));
    expect(within(container).getByRole('img')).toBe(imageNode);

    await setStyle('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(within(container).getByRole('img', { hidden: true })).toHaveAttribute('id', `component-${ID}`);
  });

  test('[SvgImage-ISO-001] Instances isolate data, alignment, and visibility', async () => {
    // Break this catches: module-level state in the widget restyling, blanking, or hiding every
    // Svg Image on the page when one instance is updated.
    const { container } = widget.render({
      extraComponents: {
        [ID2]: svgImageDefinition(ID2, HANDLE2, { data: binding(CIRCLE_SVG) }, { alignment: binding('right') }),
      },
      also: [{ id: ID2, componentType: 'SvgImage', widgetHeight: LAYOUT_HEIGHT }],
    });
    await waitFor(() => expect(image(container, HANDLE2)).not.toBeNull());
    const second = image(container, HANDLE2);

    expect(shapes(container, 'rect', HANDLE)).toHaveLength(2);
    expect(shapes(container, 'circle', HANDLE2)).toHaveLength(1);
    expect(image(container, HANDLE)).toHaveStyle({ justifyContent: 'left' });
    expect(second).toHaveStyle({ justifyContent: 'right' });

    await setProperty('data', CIRCLE_SVG, ID);
    await setStyle('alignment', 'center', ID);
    await setStyle('visibility', false, ID);
    await waitFor(() => expect(root(container, HANDLE)).toHaveStyle({ display: 'none' }));
    expect(shapes(container, 'circle', HANDLE2)).toHaveLength(1);
    expect(image(container, HANDLE2)).toBe(second);
    expect(image(container, HANDLE2)).toHaveStyle({ justifyContent: 'right' });
    expect(root(container, HANDLE2).style.display).toBe('');

    await setProperty('data', RECT_SVG, ID2);
    await waitFor(() => expect(shapes(container, 'rect', HANDLE2)).toHaveLength(2));
    expect(root(container, HANDLE)).toHaveStyle({ display: 'none' });
    expect(shapes(container, 'circle', HANDLE)).toHaveLength(1);
  });

  test('[SvgImage-CMP-001] Frontend and server registrations agree on Svg Image defaults', () => {
    // Break this catches: editing one registry so newly created apps and server-loaded apps get
    // different Svg Image defaults — exactly the drift 5ee59e433d1 had to repair in both copies.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: 'SvgImage',
      component: 'SvgImage',
      defaultSize: { width: 4, height: 50 },
      properties: {
        data: { type: 'code', validation: { schema: { type: 'string' } } },
        collapseWhenHidden: { type: 'toggle', validation: { schema: { type: 'boolean' }, defaultValue: false } },
      },
      others: {
        showOnDesktop: { type: 'toggle' },
        showOnMobile: { type: 'toggle' },
      },
      events: {},
      exposedVariables: {},
      styles: {
        visibility: { type: 'toggle', validation: { defaultValue: true } },
        alignment: { type: 'alignButtons', validation: { defaultValue: 'left' } },
      },
      definition: {
        others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
        events: [],
        styles: { visibility: { value: '{{true}}' }, alignment: { value: 'left' } },
      },
    });
    expect(frontendConfig.properties.data.validation.defaultValue).toContain('<svg');
    expect(frontendConfig.definition.properties.data.value).toContain('<svg');
    expect(frontendConfig.definition.properties.collapseWhenHidden).toEqual({ value: '{{false}}' });
    expect(frontendConfig.actions ?? []).toEqual([]);
  });
});
