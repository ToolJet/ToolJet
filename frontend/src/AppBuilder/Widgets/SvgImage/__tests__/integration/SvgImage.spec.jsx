import { waitFor, within } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { svgImageConfig as frontendConfig } from '@tooljet/widget-definitions';
// eslint-disable-next-line import/no-relative-packages
import serverWidgets from '../../../../../../../server/src/modules/apps/services/widget-config';

const serverConfig = serverWidgets.svgImageConfig;

const ID = 'svg1';
const HANDLE = 'svgimage1';
const ID2 = 'svg2';
const HANDLE2 = 'svgimage2';
const LAYOUT_HEIGHT = 50;
const OFFSET_HEIGHT = 96;
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';

// Two distinguishable vectors: the assertions below key off the shape element, never off markup text.
const RECT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>';
const CIRCLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="8" /></svg>';

// D-05: visibility lives under properties (additional actions) with loading/disable/dynamic height;
// alignment is the only remaining style.
const defaultProperties = {
  data: binding(RECT_SVG),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  dynamicHeight: binding('{{false}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
};
const defaultStyles = {
  alignment: binding('left'),
};

const widget = createWidgetHarness({
  componentType: 'SvgImage',
  handle: HANDLE,
  id: ID,
  widgetHeight: LAYOUT_HEIGHT,
  offsetHeight: OFFSET_HEIGHT,
  defaultProperties,
  defaultStyles,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const canvasNode = (container, handle = HANDLE) => container.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const loader = (container, handle = HANDLE) => root(container, handle)?.querySelector('.tj-widget-loader');
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
      '<script>window.__svgPwned = true;</script>',
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

      await setProperty('visibility', false);
      await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
      expect(within(container).getByRole('img', { hidden: true })).toBe(imageNode);
      expect(shapes(container, 'rect')).toHaveLength(2);

      await setProperty('visibility', true);
      await waitFor(() => expect(root(container).style.display).toBe(''));
      expect(within(container).getByRole('img')).toBe(imageNode);
      expect(shapes(container, 'rect')).toHaveLength(2);
      expect(image(container)).toHaveStyle({ justifyContent: 'center' });
      expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
    }
  );

  test('[SvgImage-VIS-002] A saved app that still stores visibility under styles stays hidden', async () => {
    // Break this catches: reading only properties.visibility so an app saved before the D-05 data
    // migration (visibility under styles, no properties.visibility) pops its hidden Svg Images back
    // on screen the moment the new build ships.
    const definition = svgImageDefinition(ID, HANDLE);
    delete definition.component.definition.properties.visibility;
    definition.component.definition.styles.visibility = binding('{{false}}');
    const { container } = widget.render({
      extraComponents: { [ID]: definition },
    });
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(within(container).getByRole('img', { hidden: true })).not.toBeNull();
  });

  test('[SvgImage-LOAD-001] Loading state swaps the vector for the shared loader and back', async () => {
    // Break this catches: ignoring loadingState, unmounting the data-cy root while loading (so box
    // shadow and the layout box vanish), or leaving the vector on screen behind the loader.
    const { container } = widget.render({
      afterSeed: () => widget.setComponentProperty(ID, 'boxShadow', SHADOW, 'generalStyles'),
    });
    await within(container).findByRole('img');
    expect(loader(container)).toBeNull();

    await setProperty('loadingState', true);
    await waitFor(() => expect(loader(container)).not.toBeNull());
    expect(image(container)).toBeNull();
    expect(root(container)).toHaveStyle({ height: `${LAYOUT_HEIGHT - 4}px`, boxShadow: SHADOW });
    expect(canvasNode(container)).toHaveClass('disabled');

    await setProperty('loadingState', false);
    await waitFor(() => expect(loader(container)).toBeNull());
    expect(shapes(container, 'rect')).toHaveLength(2);
    expect(canvasNode(container)).not.toHaveClass('disabled');
  });

  test('[SvgImage-DIS-001] Disabled state marks the root and the canvas node without touching the vector', async () => {
    // Break this catches: dropping the data-disabled hook (custom CSS / Cypress target) or breaking
    // the shared RenderWidget `disabled` class, which is what actually greys the widget out.
    const { container } = widget.render();
    const imageNode = await within(container).findByRole('img');
    expect(root(container)).toHaveAttribute('data-disabled', 'false');
    expect(canvasNode(container)).not.toHaveClass('disabled');

    await setProperty('disabledState', true);
    await waitFor(() => expect(root(container)).toHaveAttribute('data-disabled', 'true'));
    expect(canvasNode(container)).toHaveClass('disabled');
    expect(image(container)).toBe(imageNode);
    expect(shapes(container, 'rect')).toHaveLength(2);

    await setProperty('disabledState', false);
    await waitFor(() => expect(root(container)).toHaveAttribute('data-disabled', 'false'));
    expect(canvasNode(container)).not.toHaveClass('disabled');
  });

  test('[SvgImage-SIZ-001] The vector scales to the widget box instead of its authored size', async () => {
    // Break this catches: dropping the scoped scaling hook (class or 100% height) so Tabler's global
    // `.icon` rule or the file's own width/height pins the vector at 20-24px regardless of widget size,
    // and rewriting authored markup instead of overriding it with CSS.
    const TABLER_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1" /></svg>';
    const { container } = widget.render({ properties: { data: binding(TABLER_SVG) } });
    const imageNode = await within(container).findByRole('img');

    // The scaling rule lives in svgImage.scss and is scoped to this hook; jsdom cannot lay out, so the
    // hook plus the full-height content node are the DOM contract.
    expect(imageNode).toHaveClass('svg-image-widget');
    expect(imageNode).toHaveStyle({ height: '100%' });
    expect(root(container)).toHaveStyle({ height: `${LAYOUT_HEIGHT - 4}px` });

    // Authored markup is not rewritten: the override is CSS, so the sanitised data keeps its class and size.
    const svg = imageNode.querySelector('svg');
    expect(svg).toHaveClass('icon');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

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

    await setProperty('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('visibility', true);
    await waitFor(() => expect(root(container).style.display).toBe(''));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test('[SvgImage-API-001] Mount publishes the Svg Image state and action API', async () => {
    // Break this catches: leaving the runtime API empty (the pre-D-05 shape), or omitting a shipped
    // CSA/state key from the public component handle after mount.
    const { container } = widget.render();
    await within(container).findByRole('img');

    await waitFor(() =>
      expect(widget.exposed()).toMatchObject({
        id: ID,
        isVisible: true,
        isLoading: false,
        isDisabled: false,
        setVisibility: expect.any(Function),
        setLoading: expect.any(Function),
        setDisable: expect.any(Function),
      })
    );
    expect(frontendConfig.actions.map((action) => action.handle)).toEqual([
      'setVisibility',
      'setLoading',
      'setDisable',
    ]);
    expect(frontendConfig.events).toEqual({});
  });

  test('[SvgImage-STA-001] State actions boolean-coerce and publish their DOM state', async () => {
    // Break this catches: publishing without re-rendering, re-rendering without publishing, or
    // retaining arbitrary truthy/falsy arguments instead of public booleans.
    const { container } = widget.render();
    const imageNode = await within(container).findByRole('img');
    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));

    await widget.act('setVisibility', 0);
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveStyle({ display: 'none' });
    expect(within(container).getByRole('img', { hidden: true })).toBe(imageNode);

    await widget.act('setVisibility', 'shown');
    expect(widget.exposed().isVisible).toBe(true);
    expect(root(container).style.display).toBe('');

    await widget.act('setLoading', { truthy: true });
    expect(widget.exposed().isLoading).toBe(true);
    await waitFor(() => expect(loader(container)).not.toBeNull());
    expect(image(container)).toBeNull();

    await widget.act('setLoading', '');
    expect(widget.exposed().isLoading).toBe(false);
    await waitFor(() => expect(loader(container)).toBeNull());
    expect(shapes(container, 'rect')).toHaveLength(2);

    await widget.act('setDisable', ['truthy']);
    expect(widget.exposed().isDisabled).toBe(true);
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(canvasNode(container)).toHaveClass('disabled');

    await widget.act('setDisable', null);
    expect(widget.exposed().isDisabled).toBe(false);
    expect(root(container)).toHaveAttribute('data-disabled', 'false');
    expect(canvasNode(container)).not.toHaveClass('disabled');
  });

  test('[SvgImage-STA-002] A later property change wins over earlier CSA state', async () => {
    // Break this catches: dropping the owning-property dependency from the local-state sync so a
    // genuine visibility/loading/disabled binding change never reaches the DOM after a CSA call.
    const { container } = widget.render();
    await within(container).findByRole('img');

    await widget.act('setVisibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    await setProperty('visibility', false);
    await setProperty('visibility', true);
    await waitFor(() => expect(root(container).style.display).toBe(''));
    expect(widget.exposed().isVisible).toBe(true);

    await widget.act('setLoading', true);
    await waitFor(() => expect(loader(container)).not.toBeNull());
    await setProperty('loadingState', true);
    await setProperty('loadingState', false);
    await waitFor(() => expect(loader(container)).toBeNull());
    expect(widget.exposed().isLoading).toBe(false);

    await widget.act('setDisable', true);
    await waitFor(() => expect(root(container)).toHaveAttribute('data-disabled', 'true'));
    await setProperty('disabledState', true);
    await setProperty('disabledState', false);
    await waitFor(() => expect(root(container)).toHaveAttribute('data-disabled', 'false'));
    expect(widget.exposed().isDisabled).toBe(false);
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

    await setProperty('visibility', false);
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
    await setProperty('visibility', false, ID);
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
        loadingState: { type: 'toggle', validation: { defaultValue: false }, section: 'additionalActions' },
        visibility: { type: 'toggle', validation: { defaultValue: true }, section: 'additionalActions' },
        dynamicHeight: { type: 'toggle', validation: { defaultValue: false }, section: 'additionalActions' },
        collapseWhenHidden: { type: 'toggle', validation: { defaultValue: false }, section: 'additionalActions' },
        disabledState: { type: 'toggle', validation: { defaultValue: false }, section: 'additionalActions' },
      },
      others: {
        showOnDesktop: { type: 'toggle' },
        showOnMobile: { type: 'toggle' },
      },
      events: {},
      exposedVariables: {},
      styles: {
        alignment: { type: 'alignButtons', validation: { defaultValue: 'left' } },
      },
      definition: {
        others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
        properties: {
          loadingState: { value: '{{false}}' },
          visibility: { value: '{{true}}' },
          dynamicHeight: { value: '{{false}}' },
          collapseWhenHidden: { value: '{{false}}' },
          disabledState: { value: '{{false}}' },
        },
        events: [],
        styles: { alignment: { value: 'left' } },
      },
    });
    // D-05: visibility moved off styles; a stale styles entry would double-register the toggle.
    expect(frontendConfig.styles.visibility).toBeUndefined();
    expect(frontendConfig.definition.styles.visibility).toBeUndefined();
    expect(frontendConfig.properties.data.validation.defaultValue).toContain('<svg');
    expect(frontendConfig.definition.properties.data.value).toContain('<svg');
    expect(frontendConfig.actions.map((action) => action.handle)).toEqual([
      'setVisibility',
      'setLoading',
      'setDisable',
    ]);
  });
});

describe('SvgImage widget: dynamic height', () => {
  let offsetParentDescriptor;
  beforeEach(() => {
    // useDynamicHeight treats `offsetParent === null` as "under a hidden ancestor" and takes the
    // ResizeObserver-recovery branch instead of scheduling a reflow; jsdom's offsetParent is always
    // null, so without this override the test would exercise the wrong branch.
    offsetParentDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get() {
        return this.parentElement;
      },
    });
    widget.setup();
  });
  afterEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', offsetParentDescriptor);
    widget.teardown();
  });

  const tempLayout = () => widget.session.store.read((state) => state.temporaryLayouts[ID]);

  test('[SvgImage-DYN-001] In view mode dynamic height frees the box and sizes the vector by width', async () => {
    // Break this catches: keeping the fixed box/`height: 100%` hook while dynamic height is on (the
    // vector would never grow with the viewBox ratio, D-06), or wiring the hook without the reflow so
    // the shared layout never learns the new height.
    const { container } = widget.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    const imageNode = await within(container).findByRole('img');
    const layoutElement = canvasNode(container);
    layoutElement.classList.add(`ele-${ID}`);
    layoutElement.dataset.layoutContext = 'root';

    expect(imageNode).toHaveClass('svg-image-widget', 'svg-image-widget--dynamic');
    expect(root(container)).toHaveStyle({ height: 'auto' });

    await widget.session.store.act((state) => state.clearTemporaryLayouts());
    await setProperty('data', CIRCLE_SVG);
    await waitFor(() => expect(shapes(container, 'circle')).toHaveLength(1));
    await waitFor(() => expect(tempLayout()?.height).toBe(OFFSET_HEIGHT));
  });

  test('[SvgImage-DYN-002] Dynamic height only applies in view mode, never on the editor canvas', async () => {
    // Break this catches: dropping the `currentMode === 'view'` half of the gate so the editor box
    // collapses to the vector while authoring.
    const { container } = widget.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
    });
    const imageNode = await within(container).findByRole('img');

    expect(imageNode).not.toHaveClass('svg-image-widget--dynamic');
    expect(root(container)).toHaveStyle({ height: `${LAYOUT_HEIGHT - 4}px` });
  });
});
