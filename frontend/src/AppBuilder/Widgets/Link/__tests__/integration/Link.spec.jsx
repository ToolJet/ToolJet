/**
 * Link behaviour spec, run against the real RenderWidget/store path.
 *
 * Approved contract: `ee/test/app-builder/widgets/Link/TESTING.md`.
 * Every test title starts with its approved scenario ID.
 */
import { waitFor, fireEvent } from '@testing-library/react';
import { linkConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/link';
import { linkConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/link';
import { componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  setVariableOn,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'lnk1';
const HANDLE = 'link1';
const ID2 = 'lnk2';
const HANDLE2 = 'link2';
const DEFAULT_HREF = 'https://dev.to/';
const DEFAULT_TEXT = 'Click here';
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
const TEXT_COLOR = '#3366ff';

const defaultProperties = {
  linkTarget: binding(DEFAULT_HREF),
  linkText: binding(DEFAULT_TEXT),
  targetType: binding('new'),
  visibility: binding('{{true}}'),
  disabledState: binding('{{false}}'),
  loadingState: binding('{{false}}'),
  dynamicHeight: binding('{{false}}'),
  collapseWhenHidden: binding('{{false}}'),
};
const defaultStyles = {
  textColor: binding('var(--cc-primary-brand)'),
  textSize: binding('{{14}}'),
  underline: binding('on-hover'),
  verticalAlignment: binding('center'),
  horizontalAlignment: binding('left'),
  padding: binding('default'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  icon: binding('IconLink'),
  iconVisibility: binding('{{false}}'),
};

const widget = createWidgetHarness({
  componentType: 'Link',
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
  widgetHeight: 30,
  widgetWidth: 200,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const canvasNode = (container, handle = HANDLE) => container.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const anchor = (container, handle = HANDLE) => root(container, handle)?.querySelector('a');
const linkText = (container, handle = HANDLE) => root(container, handle)?.querySelector('.link-text');
const loader = (container) => container.querySelector('.tj-widget-loader');
const iconNode = (container, handle = HANDLE) => root(container, handle)?.querySelector('svg');

const countClicks = (sourceId = ID) =>
  setVariableOn(sourceId, 'onClick', { key: 'clicked', value: '{{(variables.clicked ?? 0) + 1}}' });
const countHovers = (sourceId = ID) =>
  setVariableOn(sourceId, 'onHover', { key: 'hovered', value: '{{(variables.hovered ?? 0) + 1}}' });

function linkDefinition(id, handle, properties = {}, styles = {}) {
  const definition = componentDefinition(id, handle, 'Link', { ...defaultProperties, ...properties });
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  return definition;
}

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'properties'));
}
async function setStyle(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'styles'));
}

/** Stops jsdom from following href while still letting React's onClick run. */
async function clickText(container, handle = HANDLE) {
  const node = linkText(container, handle);
  const stopNav = (event) => event.preventDefault();
  node.addEventListener('click', stopNav, { capture: true, once: true });
  await widget.session.user.click(node);
}

async function actClick(container, handle = HANDLE) {
  const node = anchor(container, handle);
  const stopNav = (event) => event.preventDefault();
  node.addEventListener('click', stopNav, { capture: true, once: true });
  await widget.act('click');
}

describe('Link widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Link-REN-001] Default Link renders text, href, and new-tab target', async () => {
    // Break this catches: dropping href/target, rendering the URL as the visible copy, or
    // swapping default target type so every new Link opens in the same tab.
    const { container } = widget.render();
    await waitFor(() => expect(linkText(container)).toHaveTextContent(DEFAULT_TEXT));

    expect(anchor(container)).toHaveAttribute('href', DEFAULT_HREF);
    expect(anchor(container)).toHaveAttribute('target', '_blank');
    expect(root(container)).toHaveClass('link-widget');
  });

  test('[Link-TXT-001] Link text follows the property and setLinkText', async () => {
    // Break this catches: ignoring later linkText bindings, or letting setLinkText stick after
    // the author changes the property.
    const { container } = widget.render();
    await waitFor(() => expect(linkText(container)).toHaveTextContent(DEFAULT_TEXT));

    await setProperty('linkText', 'Open docs');
    await waitFor(() => expect(linkText(container)).toHaveTextContent('Open docs'));
    expect(widget.exposed().linkText).toBe('Open docs');

    await widget.act('setLinkText', 'From CSA');
    await waitFor(() => expect(linkText(container)).toHaveTextContent('From CSA'));
    expect(widget.exposed().linkText).toBe('From CSA');

    await setProperty('linkText', 'Back to property');
    await waitFor(() => expect(linkText(container)).toHaveTextContent('Back to property'));
    expect(widget.exposed().linkText).toBe('Back to property');
  });

  test('[Link-URL-001] Empty link target omits href and still fires onClick', async () => {
    // Break this catches: writing href="" (which browsers treat as the current page) or
    // skipping onClick when the URL is empty.
    const { container } = widget.render({ events: countClicks() });
    await waitFor(() => expect(anchor(container)).toHaveAttribute('href', DEFAULT_HREF));

    await setProperty('linkTarget', '');
    await waitFor(() => expect(anchor(container).hasAttribute('href')).toBe(false));

    await clickText(container);
    await waitFor(() => expect(widget.variables().clicked).toBe(1));
  });

  test('[Link-URL-002] Authored href schemes reach the DOM unchanged', async () => {
    // Break this catches: a silent sanitiser (or React filter) stripping hostile schemes so
    // the D-03 pass-through policy flips without a product decision.
    const jsUrl = 'javascript:alert(1)';
    const dataUrl = 'data:text/html,x';
    const { container } = widget.render({ properties: { linkTarget: binding(jsUrl) } });
    await waitFor(() => expect(anchor(container)).not.toBeNull());
    expect(anchor(container).getAttribute('href')).toBe(jsUrl);

    await setProperty('linkTarget', dataUrl);
    await waitFor(() => expect(anchor(container).getAttribute('href')).toBe(dataUrl));
  });

  test('[Link-TGT-001] Target type new vs same', async () => {
    // Break this catches: writing target="_self" for Same Tab, or adding rel="noopener" that
    // D-05 explicitly left out of this backfill.
    const { container } = widget.render();
    await waitFor(() => expect(anchor(container)).toHaveAttribute('target', '_blank'));
    expect(anchor(container).hasAttribute('rel')).toBe(false);

    await setProperty('targetType', 'same');
    await waitFor(() => expect(anchor(container).hasAttribute('target')).toBe(false));
    expect(anchor(container).hasAttribute('rel')).toBe(false);
  });

  test('[Link-EVT-001] Clicking the link text fires onClick once', async () => {
    // Break this catches: dropping fireEvent, firing twice, or wiring the hit-target so a
    // text click is swallowed by a { pointer-events: none } ancestor.
    const { container } = widget.render({ events: countClicks() });
    await waitFor(() => expect(linkText(container)).not.toBeNull());

    expect(linkText(container)).toHaveClass('link-text');
    expect(anchor(container).querySelector('.link-text')).toBe(linkText(container));

    await clickText(container);
    await waitFor(() => expect(widget.variables().clicked).toBe(1));

    await widget.act('setDisable', true);
    fireEvent.click(linkText(container));
    expect(widget.variables().clicked).toBe(1);
  });

  test('[Link-EVT-002] Hovering the anchor fires onHover', async () => {
    // Break this catches: removing onMouseOver, or only firing hover from a non-bubbling
    // mouseenter so a hover on .link-text never reaches the handler.
    const { container } = widget.render({ events: countHovers() });
    await waitFor(() => expect(linkText(container)).not.toBeNull());

    await widget.session.user.hover(linkText(container));
    await waitFor(() => expect(widget.variables().hovered).toBe(1));
  });

  test('[Link-CSA-001] click() activates the same handler as a text click', async () => {
    // Break this catches: a click CSA that no-ops, or one that fires onClick twice.
    const { container } = widget.render({ events: countClicks() });
    await waitFor(() => expect(widget.exposed().click).toBeInstanceOf(Function));

    await actClick(container);
    await waitFor(() => expect(widget.variables().clicked).toBe(1));
  });

  test('[Link-CSA-002] click() while loading throws', async () => {
    // Break this catches: adding an unapproved null-guard so click() silently no-ops while
    // loading, hiding a broken caller.
    widget.render();
    await widget.act('setLoading', true);
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));

    await expect(widget.act('click')).rejects.toThrow();
  });

  test('[Link-CSA-003] setLinkTarget and setLinkText follow the D-09 asymmetry', async () => {
    // Break this catches: applying the string guard to setLinkTarget, or dropping it from
    // setLinkText so a number wipes the visible copy.
    const { container } = widget.render();
    await waitFor(() => expect(linkText(container)).toHaveTextContent(DEFAULT_TEXT));

    await widget.act('setLinkTarget', 'https://tooljet.com/');
    await waitFor(() => expect(anchor(container)).toHaveAttribute('href', 'https://tooljet.com/'));
    expect(widget.exposed().linkTarget).toBe('https://tooljet.com/');

    await widget.act('setLinkTarget', 42);
    await waitFor(() => expect(widget.exposed().linkTarget).toBe(42));

    await widget.act('setLinkText', 'Go');
    await waitFor(() => expect(linkText(container)).toHaveTextContent('Go'));

    await widget.act('setLinkText', 99);
    expect(linkText(container)).toHaveTextContent('Go');
    expect(widget.exposed().linkText).toBe('Go');
  });

  test('[Link-STA-001] Visibility, disable, and loading CSAs update flags and the DOM', async () => {
    // Break this catches: an action that publishes the flag without re-rendering, or the
    // reverse, so canvas and app logic disagree.
    const { container } = widget.render();
    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));

    await widget.act('setVisibility', false);
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveClass('d-none');

    await widget.act('setVisibility', true);
    expect(root(container)).not.toHaveClass('d-none');

    await widget.act('setDisable', true);
    expect(widget.exposed().isDisabled).toBe(true);
    expect(root(container)).toHaveStyle({ opacity: '0.5', pointerEvents: 'none' });
    expect(anchor(container)).toHaveAttribute('disabled');

    await widget.act('setLoading', true);
    expect(widget.exposed().isLoading).toBe(true);
    await waitFor(() => expect(loader(container)).toBeInTheDocument());
    expect(canvasNode(container).querySelector('a')).toBeNull();
  });

  test('[Link-STA-002] A sibling additional-action property change resets all three CSA writes', async () => {
    // Break this catches: adding Pagination's differ-check here, which would hide the shipped
    // coupled overwrite D-08 pinned as the product behaviour.
    const { container } = widget.render();
    await widget.act('setVisibility', false);
    await widget.act('setDisable', true);
    expect(widget.exposed().isVisible).toBe(false);
    expect(widget.exposed().isDisabled).toBe(true);
    expect(root(container)).toHaveClass('d-none');

    await setProperty('loadingState', '{{true}}');

    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    expect(widget.exposed().isVisible).toBe(true);
    expect(widget.exposed().isDisabled).toBe(false);
  });

  test('[Link-LOAD-001] Loading replaces the anchor with a spinner', async () => {
    // Break this catches: leaving the <a> mounted behind the loader so click/href still work.
    const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(loader(container)).toBeInTheDocument());
    expect(canvasNode(container).querySelector('a')).toBeNull();
    expect(widget.exposed().isLoading).toBe(true);

    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(anchor(container)).toBeTruthy());
    expect(loader(container)).toBeNull();
  });

  test('[Link-LOAD-002] Loading keeps the configured box shadow', async () => {
    // Break this catches: a loader branch with its own bare wrapper, so the shadow the builder
    // configured vanishes for as long as the link is loading.
    const { container } = widget.render({
      properties: { loadingState: binding('{{true}}') },
      styles: { boxShadow: binding(SHADOW) },
    });
    await waitFor(() => expect(loader(container)).toBeInTheDocument());

    expect(loader(container).closest('center').parentElement).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(anchor(container)).toBeTruthy());
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test('[Link-DIS-001] Disable blocks the click handler', async () => {
    // Break this catches: keeping onClick live while disabled, or dropping the wrapper lock
    // so the shared canvas `disabled` class is the only remaining gate.
    const { container } = widget.render({
      properties: { disabledState: binding('{{true}}') },
      events: countClicks(),
    });
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

    expect(root(container)).toHaveStyle({ opacity: '0.5', pointerEvents: 'none' });
    expect(canvasNode(container)).toHaveClass('disabled');

    fireEvent.click(linkText(container));
    expect(widget.variables().clicked).toBeUndefined();
  });

  test('[Link-DIS-002] Disabled Link gives no hover feedback and fires no onHover', async () => {
    // Break this catches: guarding only the click path, so a disabled link still fires onHover
    // and leaves the text's own pointer-events on for the hover colour and underline.
    const { container } = widget.render({
      properties: { disabledState: binding('{{true}}') },
      events: countHovers(),
    });
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

    expect(linkText(container)).toHaveStyle({ pointerEvents: 'none' });
    fireEvent.mouseOver(linkText(container));
    expect(widget.variables().hovered).toBeUndefined();

    await setProperty('disabledState', '{{false}}');
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));
    expect(linkText(container).style.pointerEvents).toBe('');
    fireEvent.mouseOver(linkText(container));
    // Exactly one: the hover made while disabled must not have been counted.
    await waitFor(() => expect(widget.variables().hovered).toBe(1));
  });

  test('[Link-VIS-001] Hidden uses d-none and keeps the anchor', async () => {
    // Break this catches: unmounting while hidden (losing href/text) or collapsing box-shadow
    // the way Pagination does — Link does not.
    const { container } = widget.render({ styles: { boxShadow: binding(SHADOW) } });
    const node = anchor(container);
    await waitFor(() => expect(node).toHaveAttribute('href', DEFAULT_HREF));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('visibility', '{{false}}');
    await waitFor(() => expect(root(container)).toHaveClass('d-none'));
    expect(anchor(container)).toBe(node);
    expect(linkText(container)).toHaveTextContent(DEFAULT_TEXT);
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(root(container)).not.toHaveClass('d-none'));
    expect(anchor(container)).toBe(node);
  });

  test('[Link-STY-001] Color, size, alignment, and box shadow are inline', async () => {
    // Break this catches: applying styles only at mount, or remounting the anchor when a
    // colour/size/alignment update lands.
    const { container } = widget.render();
    const node = anchor(container);
    await waitFor(() => expect(linkText(container)).not.toBeNull());

    expect(root(container)).toHaveStyle({
      alignItems: 'center',
      textAlign: 'left',
    });
    expect(linkText(container).parentElement).toHaveStyle({ fontSize: '14px' });

    await setStyle('textColor', TEXT_COLOR);
    await setStyle('textSize', '{{20}}');
    await setStyle('horizontalAlignment', 'right');
    await setStyle('verticalAlignment', 'top');
    await setStyle('boxShadow', SHADOW);

    await waitFor(() =>
      expect(root(container)).toHaveStyle({ alignItems: 'flex-start', textAlign: 'right', boxShadow: SHADOW })
    );
    expect(linkText(container).parentElement).toHaveStyle({
      fontSize: '20px',
      color: 'rgb(51, 102, 255)',
    });
    expect(anchor(container)).toBe(node);
    expect(root(container).style.getPropertyValue('--link-hover-color')).not.toBe('');
  });

  test('[Link-STY-003] Centre and bottom alignment use auto margins so overflowing text stays reachable', async () => {
    // Break this catches: aligning only through the wrapper's align-items, which pushes text
    // taller than the widget above the scroll origin where no scroll offset can reach it.
    const { container } = widget.render();
    await waitFor(() => expect(anchor(container)).toBeTruthy());

    expect(anchor(container).style.marginTop).toBe('auto');
    expect(anchor(container).style.marginBottom).toBe('auto');

    await setStyle('verticalAlignment', 'bottom');
    await waitFor(() => expect(anchor(container).style.marginBottom).toBe('0px'));
    expect(anchor(container).style.marginTop).toBe('auto');

    await setStyle('verticalAlignment', 'top');
    await waitFor(() => expect(anchor(container).style.marginTop).toBe(''));
    expect(anchor(container).style.marginBottom).toBe('');
  });

  test('[Link-STY-004] Hover colour darkens a theme-token text colour like a picked colour', async () => {
    // Break this catches: darkening the raw `var(--token)` string, which no colour parser
    // understands, so the hover colour silently becomes pure black.
    document.documentElement.style.setProperty('--cc-primary-brand', '#4368e3');
    try {
      const { container } = widget.render();
      await waitFor(() => expect(linkText(container)).not.toBeNull());
      expect(root(container).style.getPropertyValue('--link-hover-color')).toBe('#214cdc');

      await setStyle('textColor', TEXT_COLOR);
      await waitFor(() => expect(root(container).style.getPropertyValue('--link-hover-color')).toBe('#0a47ff'));
    } finally {
      document.documentElement.style.removeProperty('--cc-primary-brand');
    }
  });

  test('[Link-STY-002] Underline is a class on the wrapper', async () => {
    // Break this catches: dropping the underline class so CSS never paints, or writing the
    // display names ("Always") instead of the registered tokens.
    const { container } = widget.render();
    await waitFor(() => expect(root(container)).toHaveClass('on-hover'));

    await setStyle('underline', 'underline');
    await waitFor(() => expect(root(container)).toHaveClass('underline'));
    expect(root(container)).not.toHaveClass('on-hover');

    await setStyle('underline', 'no-underline');
    await waitFor(() => expect(root(container)).toHaveClass('no-underline'));
  });

  test('[Link-ICO-001] Icon visibility and name', async () => {
    // Break this catches: showing the icon by default, or ignoring iconVisibility so authors
    // cannot hide it after D-10's hidden default.
    const { container } = widget.render();
    await waitFor(() => expect(linkText(container)).not.toBeNull());
    await expect(waitFor(() => expect(iconNode(container)).not.toBeNull(), { timeout: 400 })).rejects.toThrow();

    await setStyle('iconVisibility', '{{true}}');
    await waitFor(() => expect(iconNode(container)).not.toBeNull());
    const defaultIconClass = iconNode(container).getAttribute('class') || '';

    await setStyle('icon', 'IconHome2');
    await waitFor(() => expect(iconNode(container)?.getAttribute('class') || '').not.toBe(defaultIconClass));
    expect(anchor(container)).toBeTruthy();
  });

  test('[Link-ICO-002] Icon is centred on the first text line at any text size', async () => {
    // Break this catches: a fixed pixel nudge that only centres the icon at the default 14px
    // size, so the icon drifts above the text as the size grows.
    const { container } = widget.render({ styles: { iconVisibility: binding('{{true}}') } });
    await waitFor(() => expect(iconNode(container)).not.toBeNull());

    const lineBox = () => iconNode(container).parentElement;
    expect(lineBox()).toHaveStyle({ display: 'inline-flex', alignItems: 'center' });
    expect(lineBox().textContent).toBe('\u200B');
    expect(iconNode(container).style.marginTop).toBe('');

    await setStyle('textSize', '{{30}}');
    await waitFor(() => expect(iconNode(container)).toHaveStyle({ height: '32px' }));
    expect(lineBox()).toHaveStyle({ display: 'inline-flex', alignItems: 'center' });
    expect(iconNode(container).style.marginTop).toBe('');
  });

  test('[Link-ICO-004] Icon flows inline with the text so it hugs the first line', async () => {
    // Break this catches: laying icon and text out as two flex columns, which pins the icon to
    // the left edge once the text wraps while the wrapped lines centre or right-align away from it.
    const { container } = widget.render({
      styles: { iconVisibility: binding('{{true}}'), horizontalAlignment: binding('center') },
    });
    await waitFor(() => expect(iconNode(container)).not.toBeNull());

    const flow = linkText(container).parentElement;
    expect(iconNode(container).parentElement.parentElement).toBe(flow);
    expect(flow.firstElementChild).toBe(iconNode(container).parentElement);
    expect(flow).toHaveStyle({ display: 'block' });
    expect(flow).not.toHaveClass('d-flex');
    expect(root(container)).toHaveStyle({ textAlign: 'center' });
  });

  test('[Link-ICO-003] Long unbroken link text wraps instead of pushing the icon out of view', async () => {
    // Break this catches: letting a long URL overflow the row, which under centre or right
    // alignment spills to the left of the scroll origin and hides the icon.
    const { container } = widget.render({
      properties: { linkText: binding('https://example.com/a-very-long-path-without-any-space-to-break-on') },
      styles: { iconVisibility: binding('{{true}}'), horizontalAlignment: binding('right') },
    });
    await waitFor(() => expect(linkText(container)).not.toBeNull());

    expect(linkText(container)).toHaveStyle({ overflowWrap: 'anywhere' });
  });

  test('[Link-EXP-001] Runtime publishes five exposed variables', async () => {
    // Break this catches: dropping a shipped key after D-01 pinned the runtime API, or
    // leaving the empty registered exposedVariables map as the public surface.
    widget.render();
    await waitFor(() =>
      expect(widget.exposed()).toMatchObject({
        linkTarget: DEFAULT_HREF,
        linkText: DEFAULT_TEXT,
        isVisible: true,
        isDisabled: false,
        isLoading: false,
      })
    );

    await widget.act('setLinkText', 'Exposed');
    await waitFor(() => expect(widget.exposed().linkText).toBe('Exposed'));
    await widget.act('setVisibility', false);
    expect(widget.exposed().isVisible).toBe(false);
  });

  test('[Link-A11Y-001] The control is a native anchor', async () => {
    // Break this catches: replacing the <a> with a clickable div, or adding rel/noopener that
    // D-05 left unsold.
    const { container } = widget.render();
    await waitFor(() => expect(anchor(container)?.tagName).toBe('A'));
    expect(anchor(container).hasAttribute('rel')).toBe(false);
    expect(anchor(container).hasAttribute('role')).toBe(false);

    await widget.act('setDisable', true);
    expect(anchor(container)).toHaveAttribute('disabled');
  });

  test('[Link-ISO-001] Instances isolate text, href, and flags', async () => {
    // Break this catches: module-level state rewriting every Link on the page when one
    // instance's CSA or property updates.
    const { container } = widget.render({
      extraComponents: {
        [ID2]: linkDefinition(
          ID2,
          HANDLE2,
          { linkText: binding('Other'), linkTarget: binding('https://example.com/') },
          {}
        ),
      },
      also: [{ id: ID2, componentType: 'Link', widgetHeight: 30 }],
    });
    await waitFor(() => expect(linkText(container, HANDLE2)).toHaveTextContent('Other'));
    expect(linkText(container, HANDLE)).toHaveTextContent(DEFAULT_TEXT);
    expect(anchor(container, HANDLE2)).toHaveAttribute('href', 'https://example.com/');

    await widget.act('setLinkText', 'Only first');
    await setProperty('visibility', '{{false}}', ID);
    await waitFor(() => expect(root(container, HANDLE)).toHaveClass('d-none'));

    expect(linkText(container, HANDLE2)).toHaveTextContent('Other');
    expect(root(container, HANDLE2)).not.toHaveClass('d-none');
    expect(store().getExposedValueOfComponent(ID2, MODULE_ID).linkText).toBe('Other');
  });

  test('[Link-CMP-001] Frontend and server registrations agree', () => {
    // Break this catches: editing one registry so newly created apps and server-loaded apps
    // get different Link defaults — the same drift class 5ee59e433d1 had to repair elsewhere.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: 'Link',
      component: 'Link',
      defaultSize: { width: 6, height: 30 },
      events: { onClick: { displayName: 'On click' }, onHover: { displayName: 'On hover' } },
      exposedVariables: {},
      definition: {
        properties: {
          linkTarget: { value: DEFAULT_HREF },
          linkText: { value: DEFAULT_TEXT },
          targetType: { value: 'new' },
        },
        styles: { icon: { value: 'IconLink' }, iconVisibility: { value: false } },
      },
    });
    expect(frontendConfig.actions.map((action) => action.handle)).toEqual([
      'click',
      'setLinkTarget',
      'setLinkText',
      'setVisibility',
      'setDisable',
      'setLoading',
    ]);
  });
});
