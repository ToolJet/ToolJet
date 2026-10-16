import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import DOMPurify from 'dompurify';

const ID = 'html1';
const INITIAL_HTML = '<main><h1 style="color: red">Initial content</h1><button>Run</button></main>';

const html = createWidgetHarness({
  componentType: 'Html',
  handle: 'html1',
  id: ID,
  widgetHeight: 80,
  defaultProperties: {
    rawHtml: binding(INITIAL_HTML),
    dynamicHeight: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    boxShadow: binding('none'),
  },
});

const root = (container) => container.querySelector('.html-widget-container');
const content = (container) => root(container)?.firstElementChild;

async function setProperty(property, value, paramType = 'properties') {
  await html.session.store.act(() => html.setComponentProperty(ID, property, value, paramType));
}

async function expectExposed(values) {
  await waitFor(() => expect(html.exposed()).toEqual(expect.objectContaining(values)));
}

describe('Html widget', () => {
  beforeEach(() => html.setup());
  afterEach(() => html.teardown());

  test('[Html-REN-001] author HTML renders as semantic DOM with supported inline CSS', async () => {
    // Break this catches: escaping rawHtml or stripping safe elements/styles makes authored templates render incorrectly.
    html.render();

    const heading = await screen.findByRole('heading', { name: 'Initial content' });
    expect(heading.closest('main')).toBeInTheDocument();
    expect(heading).toHaveStyle({ color: 'red' });
    expect(root(document.body)).not.toHaveTextContent('<main>');
  });

  test('[Html-REN-002] rendered HTML fills the widget width in light and dark mode', async () => {
    // Break this catches: removing the content-root base style shrinks templates or makes them unreadable in one theme.
    const { container } = html.render({ darkMode: false });

    expect(content(container)).toHaveStyle({ width: '100%', backgroundColor: '#ffffff', color: 'black' });

    html.teardown();
    html.setup();
    const dark = html.render({ darkMode: true });
    expect(content(dark.container)).toHaveStyle({ width: '100%', backgroundColor: '#47505D', color: 'white' });
  });

  test('[Html-SEC-001] executable HTML is removed while safe content remains', async () => {
    // Break this catches: bypassing DOMPurify leaves scripts or inline event handlers in viewer-controlled DOM.
    const { container } = html.render({
      properties: {
        rawHtml: binding(
          '<p>Safe</p><script>window.__htmlViewerXss = true</script><img src="x" onerror="window.__htmlViewerXss = true">'
        ),
      },
    });

    expect(await screen.findByText('Safe')).toBeInTheDocument();
    expect(content(container).querySelector('script')).toBeNull();
    expect(content(container).querySelector('img')).not.toHaveAttribute('onerror');
    expect(window.__htmlViewerXss).toBeUndefined();
  });

  test('[Html-SEC-002] rendered links open separately without opener access', async () => {
    // Break this catches: removing the sanitizer hook reintroduces same-context links with opener access.
    html.render({ properties: { rawHtml: binding('<a href="https://example.com">Docs</a>') } });

    const link = await screen.findByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  test('[Html-RAW-001] property changes and falsy values replace prior HTML without stale content', async () => {
    // Break this catches: dropping the rawHtml effect leaves the old DOM and exposed value after resolver updates.
    html.render();

    await setProperty('rawHtml', '<p>Replacement</p>');
    expect(await screen.findByText('Replacement')).toBeInTheDocument();
    expect(screen.queryByText('Initial content')).not.toBeInTheDocument();
    await expectExposed({ rawHTML: '<p>Replacement</p>' });

    await setProperty('rawHtml', false);
    await waitFor(() => expect(screen.queryByText('Replacement')).not.toBeInTheDocument());
    await expectExposed({ rawHTML: '' });
  });

  test('[Html-LOAD-001] loading replaces content and publishes busy state', async () => {
    // Break this catches: rendering the spinner as an overlay leaves authored HTML active or publishes stale loading state.
    const { container } = html.render();

    await setProperty('loadingState', true);
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-busy', 'true'));
    expect(screen.queryByText('Initial content')).not.toBeInTheDocument();
    expect(root(container).querySelector('.spinner-border')).toBeInTheDocument();
    await expectExposed({ isLoading: true });

    await setProperty('loadingState', false);
    expect(await screen.findByText('Initial content')).toBeInTheDocument();
    expect(root(container)).toHaveAttribute('aria-busy', 'false');
    await expectExposed({ isLoading: false });
  });

  test('[Html-VIS-001] visibility hides and restores the same content and exposed state', async () => {
    // Break this catches: unmounting or overwriting content on hide loses authored DOM state when visibility returns.
    const { container } = html.render();
    const heading = await screen.findByRole('heading', { name: 'Initial content' });

    await setProperty('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(screen.getByRole('heading', { name: 'Initial content', hidden: true })).toBe(heading);
    await expectExposed({ isVisible: false });

    await setProperty('visibility', true);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'flex' }));
    expect(screen.getByRole('heading', { name: 'Initial content' })).toBe(heading);
    await expectExposed({ isVisible: true });
  });

  test('[Html-DYN-001] dynamic height changes the Html root only in viewer mode', async () => {
    // Break this catches: enabling dynamic height in edit mode destabilizes canvas geometry, while ignoring view mode clips content.
    const { container } = html.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' });

    expect(root(container)).not.toHaveClass('dynamic-height');
    expect(root(container)).toHaveStyle({ height: '76px' });
    expect(root(container).style.minHeight).toBe('');

    html.teardown();
    html.setup();
    const viewer = html.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' });
    expect(root(viewer.container)).toHaveClass('dynamic-height');
    expect(root(viewer.container)).toHaveStyle({ height: 'auto', minHeight: '76px' });
  });

  test('[Html-LINK-001] links keep the destination and tab the author asked for', async () => {
    // Break this catches: a sanitize hook forced target="_blank" and rel="noopener" onto EVERY
    // element owning a target. An in-page `#id` link then opened a new tab at the app URL instead
    // of scrolling to its heading; an explicit target="_self" was overridden; and an author's
    // rel was replaced outright, silently dropping nofollow and noreferrer. The hook was also
    // registered on the SHARED DOMPurify instance and never removed, so it rewrote anchors for
    // every other consumer of the library — Text, tooltips, the markdown and HTML renderers.
    const authored =
      '<a id="frag" href="#faq">Jump to the FAQ</a>' +
      '<a id="self" href="https://example.com/self" target="_self">Same tab</a>' +
      '<a id="keeprel" href="https://example.com/rel" rel="nofollow noreferrer">Keeps rel</a>' +
      '<a id="plain" href="https://example.com/plain">Plain</a>' +
      // The exact markup from issue #5794, which PR #5883's hook was written for.
      '<a id="issue5794" href="https://www.tooljet.io" target="_blank" rel="noopener noreferrer">Tooljet</a>' +
      '<h3 id="faq">FAQ</h3>';

    const { container } = html.render({ properties: { rawHtml: binding(authored) } });
    await waitFor(() => expect(container.querySelector('#faq')).toBeInTheDocument());
    const link = (id) => container.querySelector(`#${id}`);

    // An in-page link must stay in this tab, or it navigates away instead of scrolling.
    expect(link('frag').getAttribute('target')).toBeNull();
    // An explicit choice is the author's to make.
    expect(link('self').getAttribute('target')).toBe('_self');
    // An author's rel survives; noopener is added to it rather than replacing it.
    expect(link('keeprel').getAttribute('rel').split(/\s+/).sort()).toEqual(['nofollow', 'noopener', 'noreferrer']);
    // The long-standing default for an outbound link is unchanged.
    expect(link('plain').getAttribute('target')).toBe('_blank');
    expect(link('plain').getAttribute('rel')).toBe('noopener');

    // Issue #5794: `target` was being dropped silently. PR #5883 restored it but collapsed the
    // author's `rel` to `noopener`, losing `noreferrer`. Both halves have to survive now.
    expect(link('issue5794').getAttribute('target')).toBe('_blank');
    expect(link('issue5794').getAttribute('rel').split(/\s+/).sort()).toEqual(['noopener', 'noreferrer']);

    // The rewrite belongs to this widget. Every other DOMPurify caller is untouched.
    expect(DOMPurify.sanitize('<a href="https://example.com">x</a>')).toBe('<a href="https://example.com">x</a>');
  });

  test('[Html-LINK-002] an in-page link scrolls to its target instead of navigating', async () => {
    // Break this catches: index.ejs sets `<base href="/">`, and per spec a fragment-only href
    // resolves against the BASE url, not the current page. Verified in Chrome: on
    // /apps/myapp/ an `#faq` link resolves to `/#faq`, so clicking it leaves the app for the
    // dashboard. Removing target="_blank" only changed that from a new tab to the same tab.
    // The widget has to handle the click itself and scroll to the author's own element.
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    const authored =
      '<a id="jump" href="#faq">Jump to the FAQ</a><div style="height:380px"></div><h3 id="faq">FAQ</h3>';
    const { container } = html.render({ properties: { rawHtml: binding(authored) } });
    await waitFor(() => expect(container.querySelector('#faq')).toBeInTheDocument());

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    container.querySelector('#jump').dispatchEvent(clickEvent);

    // The browser must not be allowed to follow the link; the widget scrolls instead.
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(container.querySelector('#faq'));
  });

  test('[Html-STY-004] the background covers the whole document, not just the visible part', async () => {
    // Break this catches: the content root is a flex item of a fixed-height, scrolling container,
    // so the default `stretch` sizes it to the VISIBLE height. A document taller than the widget
    // then overflows the painted box and scrolling reveals unpainted content. Flooring the item at
    // its own content height lets it grow past the line while stretch still fills a widget that is
    // taller than its content — measured in Chrome: 600px content painted 150px before, 600px
    // after, and a short document in a 200px dynamic-height widget still paints the full 200px.
    // The geometry itself is browser-owned; what is pinned here is the declaration that causes it.
    const { container } = html.render({ styles: { backgroundColor: binding('#ff0000') } });
    await waitFor(() => expect(root(container)).toBeInTheDocument());

    expect(content(container)).toHaveStyle({ backgroundColor: '#ff0000', minHeight: 'max-content' });
  });

  test('[Html-STY-001] box shadow survives loading and visibility transitions', async () => {
    // Break this catches: rebuilding state styles without the resolved boxShadow drops author styling during transitions.
    const shadow = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
    const { container } = html.render({ styles: { boxShadow: binding(shadow) } });

    expect(root(container)).toHaveStyle({ boxShadow: shadow });
    await setProperty('loadingState', true);
    expect(root(container)).toHaveStyle({ boxShadow: shadow });
    await setProperty('visibility', false);
    expect(root(container)).toHaveStyle({ boxShadow: shadow });
  });

  test('[Html-STY-002] configured background color overrides the default light/dark backdrop and survives state transitions', async () => {
    // Break this catches: dropping the backgroundColor style, ignoring the empty-string sentinel, or losing the value across state transitions.
    const { container } = html.render({ darkMode: false, styles: { backgroundColor: binding('') } });
    expect(content(container)).toHaveStyle({ backgroundColor: '#ffffff' });

    html.teardown();
    html.setup();
    const dark = html.render({ darkMode: true, styles: { backgroundColor: binding('') } });
    expect(content(dark.container)).toHaveStyle({ backgroundColor: '#47505D' });

    html.teardown();
    html.setup();
    const transparentContainer = html.render({ styles: { backgroundColor: binding('transparent') } }).container;
    expect(content(transparentContainer)).toHaveStyle({ backgroundColor: 'transparent' });

    html.teardown();
    html.setup();
    const { container: customContainer } = html.render({ styles: { backgroundColor: binding('#ff0000') } });
    expect(content(customContainer)).toHaveStyle({ backgroundColor: '#ff0000' });

    await setProperty('loadingState', true, 'properties');
    await waitFor(() => expect(customContainer.querySelector('.spinner-border')).toBeInTheDocument());
    await setProperty('loadingState', false, 'properties');
    expect(await within(customContainer).findByRole('heading', { name: 'Initial content' })).toBeInTheDocument();
    expect(content(customContainer)).toHaveStyle({ backgroundColor: '#ff0000' });

    await setProperty('visibility', false, 'properties');
    await waitFor(() => expect(root(customContainer)).toHaveStyle({ display: 'none' }));
    expect(content(customContainer)).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  test('[Html-COMB-001] loading and visibility remain independent', async () => {
    // Break this catches: clearing loading through shared temporary state accidentally resets visibility to true.
    const { container } = html.render({
      properties: { loadingState: binding('{{true}}'), visibility: binding('{{false}}') },
    });

    await expectExposed({ isLoading: true, isVisible: false });
    expect(root(container)).toHaveStyle({ display: 'none' });
    expect(root(container).querySelector('.spinner-border')).toBeInTheDocument();

    await setProperty('loadingState', false);
    expect(await screen.findByText('Initial content', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(root(container)).toHaveStyle({ display: 'none' });
    await expectExposed({ isLoading: false, isVisible: false });
  });

  test('[Html-API-001] mount publishes the supported HTML Viewer state and action API', async () => {
    // Break this catches: omitting a registered action or exposed value silently breaks existing app expressions and CSAs.
    html.render({
      properties: {
        rawHtml: binding('<p>API content</p>'),
        visibility: binding('{{false}}'),
        loadingState: binding('{{true}}'),
        disabledState: binding('{{true}}'),
      },
    });

    await expectExposed({ rawHTML: '<p>API content</p>', isVisible: false, isLoading: true, isDisabled: true });
    for (const action of ['setRawHTML', 'setVisibility', 'setLoading', 'setDisable']) {
      expect(html.exposed()[action]).toBeInstanceOf(Function);
    }
  });

  test('[Html-ACT-001] setRawHTML updates content and obeys property precedence', async () => {
    // Break this catches: property effects overwrite CSA state on unrelated or no-op resolutions, or ignore a new owning value.
    html.render();

    await html.act('setRawHTML', '<p>Action content</p>');
    expect(await screen.findByText('Action content')).toBeInTheDocument();
    await expectExposed({ rawHTML: '<p>Action content</p>' });
    await setProperty('disabledState', true);
    await setProperty('rawHtml', INITIAL_HTML);
    expect(screen.getByText('Action content')).toBeInTheDocument();

    await setProperty('rawHtml', '<p>Property content</p>');
    expect(await screen.findByText('Property content')).toBeInTheDocument();
    expect(screen.queryByText('Action content')).not.toBeInTheDocument();
    await expectExposed({ rawHTML: '<p>Property content</p>' });
  });

  test('[Html-ACT-002] setVisibility coerces values and obeys property precedence', async () => {
    // Break this catches: property effects erase CSA visibility on unrelated/no-op writes or actions publish non-booleans.
    const { container } = html.render();

    await html.act('setVisibility', 0);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    await expectExposed({ isVisible: false });
    await setProperty('rawHtml', '<p>Unrelated</p>');
    await setProperty('visibility', true);
    expect(root(container)).toHaveStyle({ display: 'none' });

    await html.act('setVisibility', 'yes');
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'flex' }));
    await expectExposed({ isVisible: true });
    await setProperty('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    await expectExposed({ isVisible: false });
  });

  test('[Html-ACT-003] setLoading coerces values and obeys property precedence', async () => {
    // Break this catches: property effects erase CSA loading on unrelated/no-op writes or actions publish non-booleans.
    const { container } = html.render();

    await html.act('setLoading', 'yes');
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-busy', 'true'));
    await expectExposed({ isLoading: true });
    await setProperty('visibility', false);
    await setProperty('loadingState', false);
    expect(root(container)).toHaveAttribute('aria-busy', 'true');

    await html.act('setLoading', 0);
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-busy', 'false'));
    await expectExposed({ isLoading: false });
    await setProperty('loadingState', true);
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-busy', 'true'));
    await expectExposed({ isLoading: true });
  });

  test('[Html-ACT-004] setDisable coerces values and obeys property precedence', async () => {
    // Break this catches: property effects erase CSA disabled state on unrelated/no-op writes or actions publish non-booleans.
    const { container } = html.render();

    await html.act('setDisable', 'yes');
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-disabled', 'true'));
    await expectExposed({ isDisabled: true });
    await setProperty('loadingState', true);
    await setProperty('disabledState', false);
    expect(root(container)).toHaveAttribute('aria-disabled', 'true');

    await html.act('setDisable', 0);
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-disabled', 'false'));
    await expectExposed({ isDisabled: false });
    await setProperty('disabledState', true);
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-disabled', 'true'));
    await expectExposed({ isDisabled: true });
  });

  test('[Html-DIS-001] disabled state exposes semantics and makes authored descendants inert', async () => {
    // Break this catches: opacity and pointer-events alone leave authored controls keyboard-focusable and semantically enabled.
    const { container } = html.render({ properties: { disabledState: binding('{{true}}') } });

    expect(await screen.findByRole('button', { name: 'Run' })).toBeInTheDocument();
    expect(root(container)).toHaveAttribute('aria-disabled', 'true');
    expect(root(container)).toHaveAttribute('inert');
    expect(root(container)).toHaveStyle({ opacity: '0.5', pointerEvents: 'none' });
    expect(root(container)).not.toHaveAttribute('aria-busy', 'true');
    await expectExposed({ isDisabled: true, isLoading: false });
  });

  test('[Html-COMB-002] loading and disabled states remain independent', async () => {
    // Break this catches: clearing either temporary state clears the other and restores content or interaction too early.
    const { container } = html.render({
      properties: { loadingState: binding('{{true}}'), disabledState: binding('{{true}}') },
    });

    await setProperty('disabledState', false);
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-disabled', 'false'));
    expect(root(container)).toHaveAttribute('aria-busy', 'true');
    expect(root(container).querySelector('.spinner-border')).toBeInTheDocument();
    await expectExposed({ isDisabled: false, isLoading: true });

    await setProperty('disabledState', true);
    await setProperty('loadingState', false);
    expect(await screen.findByText('Initial content')).toBeInTheDocument();
    expect(root(container)).toHaveAttribute('aria-busy', 'false');
    expect(root(container)).toHaveAttribute('aria-disabled', 'true');
    expect(root(container)).toHaveAttribute('inert');
    await expectExposed({ isDisabled: true, isLoading: false });
  });
});
