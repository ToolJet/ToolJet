/**
 * Image: the approved contract at
 * frontend/ee/test/app-builder/widgets/Image/TESTING.md.
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Image component. Nothing about the
 * widget is mocked. SVG icon imports render as `<svg data-file-name="...">`
 * via the repo's jest SVGR mock (__mocks__/svg.js) — a real, stable selector
 * for icon presence.
 */
import React from 'react';
import { waitFor, fireEvent as rtlFireEvent } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { componentDefinition, seedApp } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
  widgetProps,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'img1';
const NAME = 'image1';

const defaultProperties = {
  imageFormat: binding('imageUrl'),
  source: binding('https://example.com/image.png'),
  jsSchema: binding("{{{ name: 'Demo', type: 'image/png', sizeBytes: 4, base64Data: 'abc123' }}}"),
  alternativeText: binding('An image'),
  zoomButtons: binding('{{false}}'),
  rotateButton: binding('{{false}}'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  dynamicHeight: binding('{{false}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
  tooltipFormat: binding('plainText'),
  tooltip: binding(''),
};

const widget = createWidgetHarness({
  componentType: 'Image',
  handle: NAME,
  id: ID,
  defaultProperties,
  // react-lazyload's checkNormalVisible bails out early whenever
  // offsetWidth/offsetHeight/getClientRects() are all falsy (index.js:139) —
  // true for every element in jsdom, which has no layout engine. Stubbing a
  // nonzero offsetHeight is this harness's existing escape hatch for that.
  offsetHeight: 40,
});

const img = () => document.getElementById(`component-${ID}`);
const wrapper = () => document.querySelector('.image-widget-wrapper');
const fallback = () => document.querySelector('.broken-url-placeholder');
const loader = () => document.querySelector('.tj-widget-loader');
const brokenIcon = () => document.querySelector('svg[data-file-name="broken-image.svg"]');
const rotateIcon = () => document.querySelector('svg[data-file-name="rotate-image.svg"]');
const zoomInButton = () => document.querySelector('button[aria-label="Zoom in"]');
const zoomOutButton = () => document.querySelector('button[aria-label="Zoom out"]');
const exposed = (key) => widget.exposed()?.[key];

// A top-level (parentId === null) Image mounts a real react-lazyload
// <LazyLoad scrollContainer=".canvas-container"> (Image.jsx:356-366); the
// library resolves that selector via a plain `document.querySelector` (not
// ancestor-scoped — react-lazyload/lib/index.js:262), so any element with
// this class anywhere in the document satisfies it. Production always mounts
// inside AppCanvas's own `.canvas-container`; this harness has no AppCanvas,
// so it provides the same element directly.
function setup() {
  const el = document.createElement('div');
  el.className = 'canvas-container';
  document.body.appendChild(el);
  widget.setup();
}
function teardown() {
  widget.teardown();
  document.querySelector('.canvas-container')?.remove();
}

describe('Image: initial rendering and source resolution', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-DEF-001] A configured URL source renders as the image src', async () => {
    // Break this catches: computeUrl() reading the wrong property, or the
    // `<img>` never receiving the resolved sourceURL.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(img()).toHaveAttribute('src', 'https://example.com/image.png');
    // Positive control for Image-COMPAT-002: a top-level (parentId === null)
    // image DOES get the LazyLoad wrapper; only a nested one skips it.
    expect(document.querySelector('.lazyload-wrapper')).toBeInTheDocument();
  });

  test('[Image-DEF-002] The rendered source is also exposed as imageURL, and matches after mount', async () => {
    // Break this catches: setExposedVariable('imageURL', ...) never firing, or
    // firing with a stale value.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    await waitFor(() => expect(exposed('imageURL')).toBe('https://example.com/image.png'));
    expect(img()).toHaveAttribute('src', exposed('imageURL'));
  });
});

describe('Image: imageFormat / JS Object mode', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-FMT-001] Switching imageFormat from URL to JS Object re-resolves the rendered/exposed image live', async () => {
    // Break this catches: computeUrl()'s effect missing `imageFormat` from its
    // dependency array, leaving sourceURL stuck on the previous mode.
    widget.render();
    await waitFor(() => expect(img()).toHaveAttribute('src', 'https://example.com/image.png'));

    widget.render({ properties: { imageFormat: binding('jsObject') } });
    await waitFor(() => expect(img()).toHaveAttribute('src', 'data:image/png;base64,abc123'));
    expect(exposed('imageURL')).toBe('data:image/png;base64,abc123');
  });

  test('[Image-FMT-002] JS Object mode builds a data: URL from type and base64Data only', async () => {
    // Break this catches: computeUrl() reading jsSchema.name/sizeBytes into
    // the URL, which would silently change behavior if those fields varied.
    widget.render({
      properties: {
        imageFormat: binding('jsObject'),
        jsSchema: binding("{{{ name: 'A', type: 'image/png', sizeBytes: 4, base64Data: 'abc123' }}}"),
      },
    });
    await waitFor(() => expect(img()).toHaveAttribute('src', 'data:image/png;base64,abc123'));

    widget.render({
      properties: {
        imageFormat: binding('jsObject'),
        jsSchema: binding(
          "{{{ name: 'Completely different name', type: 'image/png', sizeBytes: 999999, base64Data: 'abc123' }}}"
        ),
      },
    });
    await waitFor(() => expect(exposed('imageURL')).toBe('data:image/png;base64,abc123'));
    expect(img()).toHaveAttribute('src', 'data:image/png;base64,abc123');
  });

  test('[Image-FMT-003] Empty alternativeText exposes null, not an empty string', async () => {
    // Break this catches: the widget exposing '' instead of null, breaking a
    // `{{!components.image1.alternativeText}}` check apps rely on.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(exposed('alternativeText')).toBe('An image');

    widget.render({ properties: { alternativeText: binding('') } });
    await waitFor(() => expect(exposed('alternativeText')).toBeNull());
  });

  test("[Image-FMT-004] Changing the inactive format's field does not affect the currently displayed image", async () => {
    // Break this catches: computeUrl() or its effect reacting to the
    // currently-inactive field and swapping the displayed image prematurely.
    widget.render();
    await waitFor(() => expect(img()).toHaveAttribute('src', 'https://example.com/image.png'));

    widget.render({
      properties: { jsSchema: binding("{{{ name: 'Ignored', type: 'image/gif', sizeBytes: 1, base64Data: 'zzz' }}}") },
    });
    await waitFor(() => expect(exposed('imageURL')).toBe('https://example.com/image.png'));
    expect(img()).toHaveAttribute('src', 'https://example.com/image.png');
  });
});

describe('Image: broken source and error recovery', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-ERR-001] A broken image source shows the fallback with alt text, not a broken image icon alone', async () => {
    // Break this catches: onError not wiring isError, or FallbackState not
    // rendering the broken-image icon/alt text together.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    rtlFireEvent.error(img());

    await waitFor(() => expect(fallback()).toBeInTheDocument());
    expect(img()).not.toBeInTheDocument();
    expect(brokenIcon()).toBeInTheDocument();
    expect(fallback()).toHaveTextContent('An image');
  });

  test('[Image-ERR-002] Changing the source after an error clears the error state', async () => {
    // Break this catches: isError never resetting, permanently stuck showing
    // the fallback even after the builder fixes the source.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    rtlFireEvent.error(img());
    await waitFor(() => expect(fallback()).toBeInTheDocument());

    widget.render({ properties: { source: binding('https://example.com/fixed.png') } });

    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(fallback()).not.toBeInTheDocument();
    expect(img()).toHaveAttribute('src', 'https://example.com/fixed.png');
  });

  test('[Image-ERR-003] While both loading and errored, the loader is shown, not the broken-image message', async () => {
    // Break this catches: FallbackState's internal isLoading branch not
    // taking precedence over the broken-image content.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    rtlFireEvent.error(img());
    await waitFor(() => expect(brokenIcon()).toBeInTheDocument());

    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(loader()).toBeInTheDocument());
    expect(brokenIcon()).not.toBeInTheDocument();
  });
});

describe('Image: alt text', () => {
  beforeEach(setup);
  afterEach(teardown);

  test("[Image-ALT-001] alternativeText reaches the img's alt attribute and the exposed variable", async () => {
    widget.render();
    await waitFor(() => expect(img()).toHaveAttribute('alt', 'An image'));
    expect(exposed('alternativeText')).toBe('An image');
  });

  test('[Image-ALT-002] alternativeText appears as visible text in the broken-image fallback', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    rtlFireEvent.error(img());
    await waitFor(() => expect(fallback()).toHaveTextContent('An image'));
  });
});

describe('Image: loading, visibility, and disabled states', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-STATE-001] loadingState shows the loader instead of the image', async () => {
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(loader()).toBeInTheDocument());
    expect(img()).not.toBeInTheDocument();
    expect(exposed('isLoading')).toBe(true);
  });

  test('[Image-STATE-002] visibility false hides the widget from sight and marks the img aria-hidden', async () => {
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'none' }));
    expect(img()).toHaveAttribute('aria-hidden', 'true');
    expect(exposed('isVisible')).toBe(false);
  });

  test('[Image-STATE-003] disabledState marks the widget disabled and blocks its onClick', async () => {
    widget.render({ properties: { disabledState: binding('{{true}}') }, events: setVariableOn(ID, 'onClick') });
    await waitFor(() => expect(img()).toHaveAttribute('aria-disabled', 'true'));

    await widget.session.user.click(img());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store().getVariable('seen', MODULE_ID)).not.toBe('YES');
    expect(exposed('isDisabled')).toBe(true);
  });

  test('[Image-STATE-004] A visible, enabled, non-loading image carries none of the negative-state markers', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(img()).toHaveAttribute('aria-hidden', 'false');
    expect(img()).toHaveAttribute('aria-disabled', 'false');
    expect(loader()).not.toBeInTheDocument();
    expect(fallback()).not.toBeInTheDocument();
  });
});

describe('Image: state precedence (client action versus property)', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-STATE-006] setLoading survives an unrelated property re-resolve, yields to a real loadingState change', async () => {
    // Break this catches: the [properties.visibility, loadingState,
    // disabledState] reset effect widening scope and clobbering a CSA-set
    // value on ANY re-render, not only when loadingState itself changes.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('setLoading', true);
    await waitFor(() => expect(loader()).toBeInTheDocument());

    // Unrelated re-resolve: loadingState property itself stays false (its
    // starting value), only an unrelated field changes — the CSA-set loading
    // presentation must survive. (The <img> itself doesn't render at all
    // while loading — renderImageContainer's gate — so alternativeText is
    // checked via the exposed variable, not a DOM attribute, here.)
    widget.render({ properties: { loadingState: binding('{{false}}'), alternativeText: binding('changed') } });
    await waitFor(() => expect(exposed('alternativeText')).toBe('changed'));
    expect(loader()).toBeInTheDocument();

    // A genuine loadingState transition (false -> true is a no-op here since
    // isLoading is already true; true -> false is the one that proves the
    // property, not the stale CSA value, now drives the widget).
    widget.render({ properties: { loadingState: binding('{{true}}'), alternativeText: binding('changed') } });
    widget.render({ properties: { loadingState: binding('{{false}}'), alternativeText: binding('changed') } });
    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(loader()).not.toBeInTheDocument();
  });

  test('[Image-STATE-007] setVisibility survives an unrelated property re-resolve, yields to a real visibility change', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('setVisibility', false);
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'none' }));

    widget.render({ properties: { visibility: binding('{{true}}'), alternativeText: binding('changed') } });
    await waitFor(() => expect(img()).toHaveAttribute('alt', 'changed'));
    expect(wrapper()).toHaveStyle({ display: 'none' });

    widget.render({ properties: { visibility: binding('{{false}}'), alternativeText: binding('changed') } });
    widget.render({ properties: { visibility: binding('{{true}}'), alternativeText: binding('changed') } });
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'flex' }));
  });

  test('[Image-STATE-008] setDisable survives an unrelated property re-resolve, yields to a real disabledState change', async () => {
    // The <img>'s own `aria-disabled` mirrors the raw `disabledState`
    // property directly (Image.jsx), not the CSA-synced local state — only
    // the wrapper's `data-disabled` and the click gate follow the CSA value.
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('setDisable', true);
    await waitFor(() => expect(wrapper()).toHaveAttribute('data-disabled', 'true'));

    widget.render({ properties: { disabledState: binding('{{false}}'), alternativeText: binding('changed') } });
    await waitFor(() => expect(img()).toHaveAttribute('alt', 'changed'));
    expect(wrapper()).toHaveAttribute('data-disabled', 'true');

    widget.render({ properties: { disabledState: binding('{{true}}'), alternativeText: binding('changed') } });
    widget.render({ properties: { disabledState: binding('{{false}}'), alternativeText: binding('changed') } });
    await waitFor(() => expect(wrapper()).toHaveAttribute('data-disabled', 'false'));
  });
});

describe('Image: onClick', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-EVT-001] Clicking the image fires onClick', async () => {
    widget.render({ events: setVariableOn(ID, 'onClick') });
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.session.user.click(img());

    await waitFor(() => expect(store().getVariable('seen', MODULE_ID)).toBe('YES'));
  });

  test('[Image-EVT-002] A disabled image does not fire onClick', async () => {
    widget.render({ properties: { disabledState: binding('{{true}}') }, events: setVariableOn(ID, 'onClick') });
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.session.user.click(img());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store().getVariable('seen', MODULE_ID)).not.toBe('YES');
  });
});

describe('Image: component-specific actions', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-ACT-001] setImageURL replaces the rendered and exposed image', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('setImageURL', 'https://example.com/new.png');

    await waitFor(() => expect(img()).toHaveAttribute('src', 'https://example.com/new.png'));
    expect(exposed('imageURL')).toBe('https://example.com/new.png');
  });

  test('[Image-ACT-002] clearImage empties the rendered and exposed image', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('clearImage');

    await waitFor(() => expect(exposed('imageURL')).toBe(''));
    expect(img()).toHaveAttribute('src', '');
  });

  test('[Image-ACT-003] setVisibility toggles isVisible and the rendered visibility', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(wrapper()).toHaveStyle({ display: 'none' });
    expect(img()).toHaveAttribute('aria-hidden', 'true');
  });

  test('[Image-ACT-004] setLoading toggles isLoading and the rendered loading presentation', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(loader()).toBeInTheDocument();
  });

  test('[Image-ACT-005] setDisable toggles isDisabled and blocks clicks', async () => {
    widget.render({ events: setVariableOn(ID, 'onClick') });
    await waitFor(() => expect(img()).toBeInTheDocument());

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(wrapper()).toHaveAttribute('data-disabled', 'true');

    await widget.session.user.click(img());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store().getVariable('seen', MODULE_ID)).not.toBe('YES');
  });
});

describe('Image: accessibility', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-A11Y-001] alt, aria-hidden, aria-disabled track their properties together, aria-busy is false on the rendered img', async () => {
    // Break this catches: any one of the four attributes drifting from its
    // source property when several states change together.
    widget.render({ properties: { visibility: binding('{{false}}'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(img()).toHaveAttribute('aria-hidden', 'true'));
    expect(img()).toHaveAttribute('aria-disabled', 'true');
    expect(img()).toHaveAttribute('alt', 'An image');
    // The <img> only ever renders while !isLoading (renderImageContainer's
    // gate), so a rendered img's aria-busy is always false in practice.
    expect(img()).toHaveAttribute('aria-busy', 'false');
  });
});

describe('Image: zoom and rotate controls', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-ZOOM-001] zoomButtons renders the zoom in/out controls', async () => {
    widget.render({ properties: { zoomButtons: binding('{{true}}') } });
    await waitFor(() => expect(zoomInButton()).toBeInTheDocument());
    expect(zoomOutButton()).toBeInTheDocument();
  });

  test('[Image-ZOOM-002] zoomButtons off renders no zoom controls', async () => {
    widget.render();
    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(zoomInButton()).not.toBeInTheDocument();
    expect(zoomOutButton()).not.toBeInTheDocument();
  });

  test('[Image-ROT-001] rotateButton click rotates the image by 90 degrees, wrapping past 270 back to 0', async () => {
    widget.render({ properties: { rotateButton: binding('{{true}}') } });
    await waitFor(() => expect(rotateIcon()).toBeInTheDocument());
    const rotateButtonEl = rotateIcon().closest('button');

    expect(img()).toHaveStyle({ transform: 'rotate(0deg)' });
    await widget.session.user.click(rotateButtonEl);
    expect(img()).toHaveStyle({ transform: 'rotate(90deg)' });
    await widget.session.user.click(rotateButtonEl);
    expect(img()).toHaveStyle({ transform: 'rotate(180deg)' });
    await widget.session.user.click(rotateButtonEl);
    expect(img()).toHaveStyle({ transform: 'rotate(270deg)' });
    await widget.session.user.click(rotateButtonEl);
    expect(img()).toHaveStyle({ transform: 'rotate(0deg)' });
  });

  test('[Image-ROT-002] The rotate control is present under both zoomButtons on and zoomButtons off', async () => {
    widget.render({ properties: { rotateButton: binding('{{true}}'), zoomButtons: binding('{{false}}') } });
    await waitFor(() => expect(rotateIcon()).toBeInTheDocument());

    widget.render({ properties: { rotateButton: binding('{{true}}'), zoomButtons: binding('{{true}}') } });
    await waitFor(() => expect(rotateIcon()).toBeInTheDocument());
  });
});

describe('Image: saved-app compatibility', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('[Image-COMPAT-001] A saved definition predating dynamicHeight/collapseWhenHidden still renders with pre-feature defaults', async () => {
    // Break this catches: reading `properties.dynamicHeight`/`collapseWhenHidden`
    // without an `undefined`-safe fallback, crashing or misrendering an old
    // saved app that never had these keys. Built directly via
    // componentDefinition (bypassing the harness's defaultProperties merge,
    // which would otherwise always backfill both keys) so they are genuinely
    // absent, the way an old saved app definition actually is.
    const legacyProperties = { ...defaultProperties };
    delete legacyProperties.dynamicHeight;
    delete legacyProperties.collapseWhenHidden;

    const definition = componentDefinition(ID, NAME, 'Image', legacyProperties);
    seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);

    widget.session.render(<RenderWidget {...widgetProps(ID, 'Image')} />);

    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(img()).toHaveAttribute('src', 'https://example.com/image.png');
    expect(document.querySelector('.tj-error-boundary')).not.toBeInTheDocument();
  });

  test('[Image-COMPAT-002] A nested (non-top-level) image renders without the LazyLoad wrapper', async () => {
    // Break this catches: the `parentId === null` LazyLoad gate being removed
    // or inverted, leaving a nested image's content unreachable behind a
    // scroll-triggered mount its container may never satisfy.
    const definition = componentDefinition(ID, NAME, 'Image', defaultProperties);
    definition.component.parent = 'container1';
    seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);

    widget.session.render(<RenderWidget {...widgetProps(ID, 'Image')} />);

    await waitFor(() => expect(img()).toBeInTheDocument());
    expect(img()).toHaveAttribute('src', 'https://example.com/image.png');
    expect(document.querySelector('.lazyload-wrapper')).not.toBeInTheDocument();
  });
});
