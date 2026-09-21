import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

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
