import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'iframe1';
const ID2 = 'iframe2';
const DEFAULT_URL = 'https://tooljet.io/';
const ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

const iframe = createWidgetHarness({
  componentType: 'IFrame',
  handle: 'iframe1',
  id: ID,
  widgetHeight: 310,
  preload: ['Button'],
});

const wrapper = (name = ID) => document.querySelector(`[data-cy="${name}"]`);
const frame = (name = ID) => wrapper(name)?.querySelector('iframe') ?? null;
const renderWidgetRoot = (name = ID) => document.querySelector(`[data-cy="draggable-widget-${name}"]`);

async function setProperty(property, value, paramType = 'properties', componentId = ID) {
  await iframe.session.store.act(() => iframe.setComponentProperty(componentId, property, value, paramType));
}

async function expectExposed(values, componentId = ID) {
  await waitFor(() => expect(iframe.exposed(componentId)).toEqual(expect.objectContaining(values)));
}

async function expectSrc(src, name = ID) {
  await waitFor(() => expect(frame(name)).toHaveAttribute('src', src));
}

// Cross-origin frames throw on contentWindow.location access; jsdom frames never do.
function makeCrossOrigin(element) {
  Object.defineProperty(element, 'contentWindow', {
    configurable: true,
    get: () => ({
      location: {
        reload() {
          throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError');
        },
      },
    }),
  });
}

function renderTwo({ properties = {}, secondProperties = {} } = {}) {
  return iframe.render({
    properties,
    extraComponents: {
      [ID2]: componentDefinition(ID2, ID2, 'IFrame', {
        source: binding('https://example.com/second'),
        ...secondProperties,
      }),
    },
    also: [{ id: ID2, componentType: 'IFrame', widgetHeight: 310 }],
  });
}

describe('IFrame widget', () => {
  beforeEach(() => iframe.setup());
  afterEach(() => iframe.teardown());

  test('[IFrame-REN-001] a fresh IFrame renders one frame at the default URL', async () => {
    // Break this catches: a default, permission or fullscreen change silently alters every newly dropped IFrame.
    iframe.render();

    await expectSrc(DEFAULT_URL);
    expect(wrapper().querySelectorAll('iframe')).toHaveLength(1);
    expect(frame()).toHaveAttribute('allow', ALLOW);
    expect(frame()).toHaveAttribute('allowfullscreen');
    expect(wrapper().style.display).toBe('');
  });

  test('[IFrame-API-001] the four exposed values and five actions are published on mount', async () => {
    // Break this catches: dropping a value or action from the mount-time publish breaks app expressions and CSAs.
    iframe.render({
      properties: {
        source: binding('https://example.com/api'),
        visibility: binding('{{false}}'),
        loadingState: binding('{{true}}'),
        disabledState: binding('{{true}}'),
      },
    });

    await expectExposed({ url: 'https://example.com/api', isVisible: false, isLoading: true, isDisabled: true });
    for (const action of ['setUrl', 'setDisable', 'setLoading', 'setVisibility', 'reload']) {
      expect(iframe.exposed()[action]).toBeInstanceOf(Function);
    }
  });

  test('[IFrame-URL-001] changing the URL property updates the frame and exposed url', async () => {
    // Break this catches: the #15011 regression where a changed source left the old page in the frame.
    iframe.render();
    await expectSrc(DEFAULT_URL);

    await setProperty('source', 'https://example.com/next');
    await expectSrc('https://example.com/next');
    await expectExposed({ url: 'https://example.com/next' });
  });

  test('[IFrame-URL-002] empty and non-string URL values', async () => {
    // Break this catches: invalid URLs routed to the registered default silently load https://tooljet.io/ for a missing URL param.
    const cases = [
      ['', ''],
      ['{{123}}', '123'],
      ['{{undefined}}', ''],
      ['{{null}}', ''],
      ['{{globals.urlparams.url}}', ''],
    ];
    for (const [source, expected] of cases) {
      iframe.teardown();
      await iframe.setup();
      iframe.render({ properties: { source: binding(source) } });
      await waitFor(() => expect(frame()).not.toBeNull());
      await waitFor(() => expect(frame().getAttribute('src') ?? '').toBe(expected));
      await expectExposed({ url: expected });
    }
  });

  test('[IFrame-SEC-001] a script-scheme URL from the URL property never reaches the frame', async () => {
    // Break this catches: the URL property passed verbatim to src runs `javascript:` in the ToolJet origin.
    iframe.render({ properties: { source: binding('{{"javascript:alert(document.domain)"}}') } });
    await expectSrc('about:blank');
    await expectExposed({ url: 'javascript:alert(document.domain)' });

    const blocked = [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      '   javascript:alert(1)',
      '\u0001\u001fjavascript:alert(1)',
      'java\tscript:alert(1)',
      'java\nscr\ript:alert(1)',
      'javascript\t:alert(1)',
      'vbscript:msgbox(1)',
      ' VBScript:msgbox(1)',
    ];
    for (const url of blocked) {
      await setProperty('source', 'https://example.com/reset');
      await expectSrc('https://example.com/reset');
      await setProperty('source', url);
      await expectSrc('about:blank');
      await expectExposed({ url });
    }

    const allowed = [
      'https://example.com/page?q=javascript:x',
      'http://example.com/',
      '/applications/my-app',
      'docs/javascript:intro',
      'data:text/html,<p>hi</p>',
    ];
    for (const url of allowed) {
      await setProperty('source', url);
      await expectSrc(url);
      await expectExposed({ url });
    }
  });

  test('[IFrame-SEC-002] a script-scheme URL from setUrl or reload never reaches the frame', async () => {
    // Break this catches: the CSA path (also reached by Control component → Set URL) bypassing the URL policy,
    // or the cross-origin reload fallback re-assigning a rejected URL.
    iframe.render();
    await expectSrc(DEFAULT_URL);

    await iframe.act('setUrl', 'javascript:alert(document.cookie)');
    await expectSrc('about:blank');
    await expectExposed({ url: 'javascript:alert(document.cookie)' });

    await iframe.act('setUrl', 'https://example.com/ok');
    await expectSrc('https://example.com/ok');

    await iframe.act('setUrl', ' Java\tScript:alert(1)');
    await expectSrc('about:blank');

    const node = frame();
    makeCrossOrigin(node);
    await iframe.act('reload');
    expect(frame()).toBe(node);
    expect(frame()).toHaveAttribute('src', 'about:blank');
    await expectExposed({ url: ' Java\tScript:alert(1)' });
  });

  test('[IFrame-SEC-002] the Control component Set URL event action applies the same policy', async () => {
    // Break this catches: a policy applied in setUrl's caller instead of the sink misses the event-action path.
    const { container } = iframe.render({
      extraComponents: { btn1: componentDefinition('btn1', 'button1', 'Button', { text: binding('Embed') }) },
      also: [{ id: 'btn1', componentType: 'Button' }],
      events: [
        {
          id: 'evt-set-url',
          index: 0,
          sourceId: 'btn1',
          name: 'evt-set-url',
          target: 'component',
          event: {
            eventId: 'onClick',
            actionId: 'control-component',
            componentId: ID,
            componentSpecificActionHandle: 'setUrl',
            componentSpecificActionParams: [{ handle: 'url', value: '{{"javascript:alert(1)"}}' }],
          },
        },
      ],
    });
    await expectSrc(DEFAULT_URL);

    await iframe.session.user.click(container.querySelector('button.jet-btn'));
    await expectExposed({ url: 'javascript:alert(1)' });
    expect(frame()).toHaveAttribute('src', 'about:blank');
  });

  test('[IFrame-ACT-001] setUrl updates the frame and obeys property precedence', async () => {
    // Break this catches: property effects overwriting the CSA URL on unrelated/no-op resolution, or non-strings leaking in.
    iframe.render();

    await iframe.act('setUrl', 'https://example.com/set');
    await expectSrc('https://example.com/set');
    await expectExposed({ url: 'https://example.com/set' });

    await iframe.act('setUrl', 123);
    expect(frame()).toHaveAttribute('src', 'https://example.com/set');
    await expectExposed({ url: 'https://example.com/set' });

    await setProperty('tooltip', 'unrelated');
    await setProperty('source', DEFAULT_URL);
    expect(frame()).toHaveAttribute('src', 'https://example.com/set');
    await expectExposed({ url: 'https://example.com/set' });

    await setProperty('source', 'https://example.com/property');
    await expectSrc('https://example.com/property');
    await expectExposed({ url: 'https://example.com/property' });
  });

  test('[IFrame-ACT-002] setVisibility hides and shows and obeys property precedence', async () => {
    // Break this catches: CSA visibility erased by unrelated/no-op resolution, or non-boolean values published.
    iframe.render();

    await iframe.act('setVisibility', 0);
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'none' }));
    await expectExposed({ isVisible: false });
    await setProperty('tooltip', 'unrelated');
    await setProperty('visibility', true);
    expect(wrapper()).toHaveStyle({ display: 'none' });

    await iframe.act('setVisibility', 'yes');
    await waitFor(() => expect(wrapper().style.display).toBe(''));
    await expectExposed({ isVisible: true });

    await setProperty('visibility', false);
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'none' }));
    await expectExposed({ isVisible: false });
  });

  test('[IFrame-ACT-003] setLoading swaps in the spinner and obeys property precedence', async () => {
    // Break this catches: CSA loading erased by unrelated/no-op resolution, or the frame kept beside the spinner.
    iframe.render();

    await iframe.act('setLoading', 'yes');
    await waitFor(() => expect(within(wrapper()).getByRole('status')).toBeInTheDocument());
    expect(frame()).toBeNull();
    await expectExposed({ isLoading: true });
    await setProperty('tooltip', 'unrelated');
    await setProperty('loadingState', false);
    expect(within(wrapper()).getByRole('status')).toBeInTheDocument();

    await iframe.act('setLoading', 0);
    await expectSrc(DEFAULT_URL);
    expect(within(wrapper()).queryByRole('status')).toBeNull();
    await expectExposed({ isLoading: false });

    await setProperty('loadingState', true);
    await waitFor(() => expect(within(wrapper()).getByRole('status')).toBeInTheDocument());
    await expectExposed({ isLoading: true });
  });

  test('[IFrame-ACT-004] setDisable disables and obeys property precedence', async () => {
    // Break this catches: CSA disabled state erased by unrelated/no-op resolution, or actions blocked while disabled.
    iframe.render();

    await iframe.act('setDisable', 'yes');
    await waitFor(() => expect(wrapper()).toHaveAttribute('data-disabled', 'true'));
    expect(renderWidgetRoot()).toHaveClass('disabled');
    await expectExposed({ isDisabled: true });

    await iframe.act('setUrl', 'https://example.com/while-disabled');
    await expectSrc('https://example.com/while-disabled');

    await setProperty('tooltip', 'unrelated');
    await setProperty('disabledState', false);
    expect(wrapper()).toHaveAttribute('data-disabled', 'true');
    expect(renderWidgetRoot()).toHaveClass('disabled');

    await iframe.act('setDisable', 0);
    await waitFor(() => expect(wrapper()).toHaveAttribute('data-disabled', 'false'));
    expect(renderWidgetRoot()).not.toHaveClass('disabled');
    await expectExposed({ isDisabled: false });

    await setProperty('disabledState', true);
    await waitFor(() => expect(wrapper()).toHaveAttribute('data-disabled', 'true'));
    await expectExposed({ isDisabled: true });
  });

  test('[IFrame-ACT-005] reload keeps the frame and state intact', async () => {
    // Break this catches: reload throwing on a cross-origin frame, remounting the frame, or rewriting src/state.
    iframe.render({ properties: { source: binding('https://example.com/reload') } });
    await expectSrc('https://example.com/reload');
    const before = { ...iframe.exposed() };
    const node = frame();

    await expect(iframe.act('reload')).resolves.toBeUndefined();
    expect(frame()).toBe(node);
    expect(frame()).toHaveAttribute('src', 'https://example.com/reload');

    makeCrossOrigin(node);
    await expect(iframe.act('reload')).resolves.toBeUndefined();
    expect(frame()).toBe(node);
    expect(frame()).toHaveAttribute('src', 'https://example.com/reload');
    expect(iframe.exposed()).toEqual(
      expect.objectContaining({
        url: before.url,
        isVisible: before.isVisible,
        isDisabled: before.isDisabled,
        isLoading: before.isLoading,
      })
    );

    await setProperty('loadingState', true);
    await waitFor(() => expect(frame()).toBeNull());
    await expect(iframe.act('reload')).resolves.toBeUndefined();
    expect(frame()).toBeNull();
    await expectExposed({ isLoading: true, url: 'https://example.com/reload' });

    await setProperty('loadingState', false);
    await expectSrc('https://example.com/reload');
  });

  test('[IFrame-VIS-001] hidden keeps the frame mounted and restores it unchanged', async () => {
    // Break this catches: hiding by unmounting reloads the embedded page and loses its state.
    iframe.render({ properties: { source: binding('https://example.com/kept') } });
    await expectSrc('https://example.com/kept');
    const node = frame();

    await setProperty('visibility', false);
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'none' }));
    expect(frame()).toBe(node);
    await expectExposed({ isVisible: false });

    await setProperty('visibility', true);
    await waitFor(() => expect(wrapper().style.display).toBe(''));
    expect(frame()).toBe(node);
    expect(frame()).toHaveAttribute('src', 'https://example.com/kept');
  });

  test('[IFrame-LOAD-001] loading replaces the frame with an accessible spinner', async () => {
    // Break this catches: an overlay spinner leaving the live frame interactive, or the frame returning at another URL.
    iframe.render({ properties: { source: binding('https://example.com/loading') } });
    await expectSrc('https://example.com/loading');

    await setProperty('loadingState', true);
    await waitFor(() => expect(within(wrapper()).getByRole('status')).toBeInTheDocument());
    expect(frame()).toBeNull();
    await expectExposed({ isLoading: true });

    await setProperty('loadingState', false);
    await expectSrc('https://example.com/loading');
    expect(within(wrapper()).queryByRole('status')).toBeNull();
    await expectExposed({ isLoading: false });
  });

  test('[IFrame-DIS-001] disabled removes the frame from keyboard and assistive interaction', async () => {
    // Break this catches: pointer-only disabling leaves the frame and its document in the Tab order and announced as enabled.
    iframe.render({ properties: { disabledState: binding('{{true}}') } });
    await expectSrc(DEFAULT_URL);
    expect(wrapper()).toHaveAttribute('inert');
    expect(wrapper()).toHaveAttribute('aria-disabled', 'true');

    await setProperty('disabledState', false);
    await waitFor(() => expect(wrapper()).not.toHaveAttribute('inert'));
    expect(wrapper()).not.toHaveAttribute('aria-disabled');

    await iframe.act('setDisable', true);
    await waitFor(() => expect(wrapper()).toHaveAttribute('inert'));
    expect(wrapper()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[IFrame-A11Y-001] each frame has a distinct accessible name', async () => {
    // Break this catches: a fixed title gives every frame on a page the same accessible name.
    renderTwo();
    await expectSrc(DEFAULT_URL);
    await expectSrc('https://example.com/second', ID2);

    expect(screen.getByTitle(ID)).toBe(frame());
    expect(screen.getByTitle(ID2)).toBe(frame(ID2));
  });

  test('[IFrame-STY-001] box shadow is applied and survives state changes', async () => {
    // Break this catches: rebuilding the wrapper style for a state drops the author's box shadow.
    const shadow = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
    iframe.render({ styles: { boxShadow: binding(shadow) } });
    await waitFor(() => expect(wrapper()).toHaveStyle({ boxShadow: shadow }));

    await setProperty('loadingState', true);
    await waitFor(() => expect(within(wrapper()).getByRole('status')).toBeInTheDocument());
    expect(wrapper()).toHaveStyle({ boxShadow: shadow });

    await setProperty('disabledState', true);
    await waitFor(() => expect(wrapper()).toHaveAttribute('data-disabled', 'true'));
    expect(wrapper()).toHaveStyle({ boxShadow: shadow });

    await setProperty('visibility', false);
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'none' }));
    expect(wrapper()).toHaveStyle({ boxShadow: shadow });
  });

  test('[IFrame-TIP-001] a tooltip configured under properties is shown on hover', async () => {
    // Break this catches: dropping IFrame from the properties-bucket list blanks every migrated IFrame tooltip.
    iframe.render({ properties: { tooltip: binding('Embedded dashboard'), tooltipFormat: binding('plainText') } });
    await expectSrc(DEFAULT_URL);

    await iframe.session.user.hover(renderWidgetRoot());
    await waitFor(() => expect(screen.getAllByText('Embedded dashboard').length).toBeGreaterThan(0));
  });

  test('[IFrame-ISO-001] actions on one instance do not affect another', async () => {
    // Break this catches: shared module-level state or a mis-targeted action leaking into a sibling IFrame.
    renderTwo();
    await expectSrc('https://example.com/second', ID2);

    await iframe.act('setUrl', 'https://example.com/first-only');
    await iframe.act('setDisable', true);
    await iframe.act('setVisibility', false);
    await expectSrc('https://example.com/first-only');
    await waitFor(() => expect(wrapper()).toHaveStyle({ display: 'none' }));
    expect(wrapper()).toHaveAttribute('data-disabled', 'true');

    expect(frame(ID2)).toHaveAttribute('src', 'https://example.com/second');
    expect(wrapper(ID2).style.display).toBe('');
    expect(wrapper(ID2)).toHaveAttribute('data-disabled', 'false');
    expect(renderWidgetRoot(ID2)).not.toHaveClass('disabled');
    await expectExposed({ url: 'https://example.com/second', isDisabled: false, isVisible: true }, ID2);
  });

  test('[IFrame-COMB-001] loading, visibility and disabled stay independent', async () => {
    // Break this catches: clearing one temporary state resetting another and showing or enabling the frame too early.
    iframe.render({
      properties: {
        loadingState: binding('{{true}}'),
        visibility: binding('{{false}}'),
        disabledState: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(within(wrapper()).getByRole('status', { hidden: true })).toBeInTheDocument());

    await setProperty('loadingState', false);
    await expectSrc(DEFAULT_URL);
    expect(wrapper()).toHaveStyle({ display: 'none' });
    expect(wrapper()).toHaveAttribute('data-disabled', 'true');
    expect(renderWidgetRoot()).toHaveClass('disabled');
    await expectExposed({ isLoading: false, isVisible: false, isDisabled: true });

    await setProperty('loadingState', true);
    await setProperty('disabledState', false);
    await waitFor(() => expect(wrapper()).toHaveAttribute('data-disabled', 'false'));
    expect(within(wrapper()).getByRole('status', { hidden: true })).toBeInTheDocument();
    expect(frame()).toBeNull();
    expect(renderWidgetRoot()).toHaveClass('disabled');
    await expectExposed({ isLoading: true, isDisabled: false });
  });

  test('[IFrame-COMB-002] a URL change during loading applies when loading clears', async () => {
    // Break this catches: a URL written while the frame is unmounted being lost or the old URL coming back.
    iframe.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(within(wrapper()).getByRole('status')).toBeInTheDocument());

    await setProperty('source', 'https://example.com/during-property');
    await expectExposed({ url: 'https://example.com/during-property' });
    expect(frame()).toBeNull();
    await setProperty('loadingState', false);
    await expectSrc('https://example.com/during-property');

    await setProperty('loadingState', true);
    await waitFor(() => expect(frame()).toBeNull());
    await iframe.act('setUrl', 'https://example.com/during-action');
    await expectExposed({ url: 'https://example.com/during-action' });
    expect(frame()).toBeNull();
    await setProperty('loadingState', false);
    await expectSrc('https://example.com/during-action');
  });
});
