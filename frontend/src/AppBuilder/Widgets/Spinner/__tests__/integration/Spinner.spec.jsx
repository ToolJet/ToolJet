import { screen, waitFor, within } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { spinnerConfig as frontendConfig } from '@tooljet/widget-definitions';
import serverWidgets from '../../../../../../../server/src/modules/apps/services/widget-config';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { baseComponentProperties } from '@/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';

const serverConfig = serverWidgets.spinnerConfig;

const ID = 'spin1';
const HANDLE = 'spinner1';
const ID2 = 'spin2';
const HANDLE2 = 'spinner2';
const DEFAULT_COLOUR = 'var(--cc-primary-brand)';
const HEX_COLOUR = '#3366ff';
const HEX_AS_RGB = 'rgb(51, 102, 255)';
const RGB_COLOUR = 'rgb(255, 0, 0)';
const RGBA_COLOUR = 'rgba(1, 2, 3, 0.5)';
const OTHER_RGB = 'rgb(0, 0, 255)';
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
const LAYOUT_HEIGHT = 30;

const defaultStyles = {
  size: binding('sm'),
  colour: binding(DEFAULT_COLOUR),
};
const defaultProperties = { visibility: binding('{{true}}') };

const widget = createWidgetHarness({
  componentType: 'Spinner',
  handle: HANDLE,
  id: ID,
  widgetHeight: LAYOUT_HEIGHT,
  defaultProperties,
  defaultStyles,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const status = (container, handle = HANDLE) => root(container, handle)?.querySelector('[role="status"]');
const resolvedStyle = (key, id = ID) => store().getResolvedComponent(id, null, MODULE_ID)?.styles?.[key];

function spinnerDefinition(id, handle, styles = {}, properties = {}) {
  const definition = componentDefinition(id, handle, 'Spinner');
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  definition.component.definition.properties = { ...defaultProperties, ...properties };
  return definition;
}

async function setStyle(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'styles'));
}

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'properties'));
}

const sizeErrors = () => store().debugger.logs.filter((log) => log.key === `${HANDLE} - Size`);

// The Inspector inputs DefaultComponent passes for the registered Spinner, as the widget author sees them.
function spinnerInspectorAccordions() {
  const meta = componentTypeDefinitionMap.Spinner;
  const component = componentDefinition(ID, HANDLE, 'Spinner');
  component.component.properties = meta.properties;
  const sectionOf = (key) => meta.properties[key]?.section;
  const keys = Object.keys(meta.properties);
  return baseComponentProperties(
    keys.filter((key) => sectionOf(key) !== 'additionalActions'),
    Object.keys(meta.events),
    component,
    meta,
    () => {},
    () => {},
    [],
    {},
    () => {},
    [],
    {},
    [],
    false,
    [],
    keys.filter((key) => sectionOf(key) === 'additionalActions'),
    ID
  );
}
const controlsOf = (item) =>
  [].concat(item.children?.props?.children ?? item.children).map((el) => [el.props.param.name, el.props.paramType]);

describe('Spinner widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Spinner-REN-001] Default Spinner renders a status indicator at the registered size', async () => {
    // Break this catches: dropping the status role, small size class, or layout height, or injecting author-facing copy.
    const { container } = widget.render();
    const indicator = await within(container).findByRole('status');

    expect(indicator).toHaveClass('spinner-border', 'spinner-border-sm');
    expect(root(container)).toHaveStyle({ height: `${LAYOUT_HEIGHT - 4}px` });
    expect(indicator).toBeEmptyDOMElement();
  });

  test("[Spinner-COL-001] Colour updates the spinner's inline color", async () => {
    // Break this catches: ignoring colour updates, remounting on style change, or leaving a stale inline color after clear.
    const { container } = widget.render();
    const indicator = await within(container).findByRole('status');
    expect(resolvedStyle('colour')).toBe(DEFAULT_COLOUR);

    await setStyle('colour', HEX_COLOUR);
    await waitFor(() => expect(status(container).style.color).toBe(HEX_AS_RGB));
    expect(status(container)).toBe(indicator);

    await setStyle('colour', RGB_COLOUR);
    await waitFor(() => expect(status(container).style.color).toBe(RGB_COLOUR));

    await setStyle('colour', RGBA_COLOUR);
    await waitFor(() => expect(status(container).style.color).toBe(RGBA_COLOUR));
    expect(status(container)).toBe(indicator);

    await setStyle('colour', '');
    await waitFor(() => expect(resolvedStyle('colour')).toBe(''));
    await setStyle('colour', OTHER_RGB);
    await waitFor(() => expect(status(container).style.color).toBe(OTHER_RGB));
    expect(status(container)).toBe(indicator);
  });

  test('[Spinner-SIZ-001] Size sm and lg select the matching spinner-border class', async () => {
    // Break this catches: hardcoding one size class or dropping colour when size changes on the same node.
    const { container } = widget.render({ styles: { colour: binding(RGB_COLOUR) } });
    const indicator = await within(container).findByRole('status');
    expect(indicator).toHaveClass('spinner-border', 'spinner-border-sm');
    expect(indicator).not.toHaveClass('spinner-border-lg');
    expect(indicator.style.color).toBe(RGB_COLOUR);

    await setStyle('size', 'lg');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-lg'));
    expect(status(container)).toBe(indicator);
    expect(status(container)).toHaveClass('spinner-border');
    expect(status(container)).not.toHaveClass('spinner-border-sm');
    expect(status(container).style.color).toBe(RGB_COLOUR);
  });

  test('[Spinner-SIZ-002] Empty size resolves to the registered sm default', async () => {
    // Break this catches: rendering an empty size as a bare `spinner-border-` class instead of the sm default.
    const { container } = widget.render();
    const indicator = await within(container).findByRole('status');

    await setStyle('size', 'lg');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-lg'));
    await setStyle('size', '');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-sm'));
    expect(status(container)).not.toHaveClass('spinner-border-lg');
    expect(status(container)).not.toHaveClass('spinner-border-');
    expect(status(container)).toBe(indicator);

    await setStyle('size', 'lg');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-lg'));
    expect(status(container)).toBe(indicator);
  });

  test('[Spinner-SIZ-003] Size outside sm/lg is a validation error and renders sm', async () => {
    // Break this catches: interpolating any resolved size into `spinner-border-<value>`, so a number or typo renders an unstyled spinner and never reports why.
    const { container } = widget.render({ styles: { size: binding('lg') } });
    const indicator = await within(container).findByRole('status');
    expect(indicator).toHaveClass('spinner-border-lg');
    expect(sizeErrors()).toHaveLength(0);

    await setStyle('size', '{{5}}');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-sm'));
    expect(status(container).className).not.toMatch(/spinner-border-(5|lg)\b/);
    expect(sizeErrors()).toHaveLength(1);
    expect(sizeErrors()[0]).toMatchObject({ logLevel: 'error', error: { resolvedProperty: { size: 5 } } });

    await setStyle('size', 'xl');
    await waitFor(() => expect(sizeErrors()).toHaveLength(2));
    expect(status(container)).toHaveClass('spinner-border-sm');
    expect(status(container)).not.toHaveClass('spinner-border-xl');

    await setStyle('size', 'lg');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-lg'));
    expect(sizeErrors()).toHaveLength(2);
    expect(status(container)).toBe(indicator);
  });

  test.each(['edit', 'view'])(
    '[Spinner-VIS-001] Visibility hides and restores the same spinner in %s mode',
    async (currentMode) => {
      // Break this catches: unmounting on hide, hiding only in viewer, or dropping colour/size/shadow when visibility returns.
      const { container } = widget.render({
        currentMode,
        styles: { colour: binding(RGB_COLOUR), size: binding('lg') },
        afterSeed: () => widget.setComponentProperty(ID, 'boxShadow', SHADOW, 'generalStyles'),
      });
      const indicator = await within(container).findByRole('status');
      const containerNode = root(container);
      expect(containerNode.style.display).toBe('');
      expect(indicator).toHaveClass('spinner-border-lg');
      expect(indicator.style.color).toBe(RGB_COLOUR);
      expect(containerNode).toHaveStyle({ boxShadow: SHADOW });

      await setProperty('visibility', false);
      await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
      expect(within(container).getByRole('status', { hidden: true })).toBe(indicator);

      await setProperty('visibility', true);
      await waitFor(() => expect(root(container).style.display).toBe(''));
      expect(within(container).getByRole('status')).toBe(indicator);
      expect(status(container)).toHaveClass('spinner-border-lg');
      expect(status(container).style.color).toBe(RGB_COLOUR);
      expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
    }
  );

  test('[Spinner-STY-001] Box shadow survives independent style changes', async () => {
    // Break this catches: rebuilding container styles without the merged generalStyles boxShadow.
    const { container } = widget.render({
      afterSeed: () => widget.setComponentProperty(ID, 'boxShadow', SHADOW, 'generalStyles'),
    });
    await waitFor(() => expect(root(container)).toHaveStyle({ boxShadow: SHADOW }));

    await setStyle('colour', RGB_COLOUR);
    await waitFor(() => expect(status(container).style.color).toBe(RGB_COLOUR));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setStyle('size', 'lg');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-lg'));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('visibility', true);
    await waitFor(() => expect(root(container).style.display).toBe(''));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test('[Spinner-CMP-001] Frontend and server registrations agree on Spinner defaults', () => {
    // Break this catches: editing one registry so newly created and server-loaded apps get different Spinner APIs.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: 'Spinner',
      defaultSize: { width: 4, height: 30 },
      events: {},
      exposedVariables: {},
      properties: {
        visibility: { section: 'additionalActions', validation: { defaultValue: true } },
        tooltipFormat: { type: 'switch', section: 'additionalActions', defaultValue: { value: 'plainText' } },
        tooltip: { type: 'code', section: 'additionalActions' },
      },
      styles: {
        colour: { type: 'colorSwatches', validation: { defaultValue: 'var(--cc-primary-brand)' } },
        size: {
          options: [
            { name: 'small', value: 'sm' },
            { name: 'large', value: 'lg' },
          ],
          validation: { defaultValue: 'sm' },
        },
      },
      definition: {
        properties: {
          visibility: { value: '{{true}}' },
          tooltipFormat: { value: 'plainText' },
          tooltip: { value: '' },
        },
        events: [],
        styles: {
          size: { value: 'sm' },
          colour: { value: 'var(--cc-primary-brand)' },
        },
      },
    });
    expect(frontendConfig.styles.visibility).toBeUndefined();
    expect(frontendConfig.definition.styles.visibility).toBeUndefined();
    expect(frontendConfig.actions ?? []).toEqual([]);
  });

  test('[Spinner-ISO-001] Instances isolate colour, size, and visibility', async () => {
    // Break this catches: shared module state restyling or hiding every Spinner when one instance updates.
    const { container } = widget.render({
      styles: { colour: binding(RGB_COLOUR), size: binding('lg') },
      properties: { visibility: binding('{{true}}') },
      extraComponents: {
        [ID2]: spinnerDefinition(
          ID2,
          HANDLE2,
          { colour: binding(OTHER_RGB), size: binding('sm') },
          { visibility: binding('{{false}}') }
        ),
      },
      also: [{ id: ID2, componentType: 'Spinner', widgetHeight: LAYOUT_HEIGHT }],
    });

    const first = status(container, HANDLE);
    const second = status(container, HANDLE2);
    expect(first).toHaveClass('spinner-border-lg');
    expect(first.style.color).toBe(RGB_COLOUR);
    expect(root(container, HANDLE).style.display).toBe('');
    expect(second).toHaveClass('spinner-border-sm');
    expect(second.style.color).toBe(OTHER_RGB);
    expect(root(container, HANDLE2)).toHaveStyle({ display: 'none' });

    await setStyle('colour', RGBA_COLOUR, ID);
    await setStyle('size', 'sm', ID);
    await setProperty('visibility', false, ID);
    await waitFor(() => expect(root(container, HANDLE)).toHaveStyle({ display: 'none' }));
    expect(status(container, HANDLE).style.color).toBe(RGBA_COLOUR);
    expect(status(container, HANDLE)).toHaveClass('spinner-border-sm');
    expect(status(container, HANDLE2).style.color).toBe(OTHER_RGB);
    expect(status(container, HANDLE2)).toHaveClass('spinner-border-sm');
    expect(root(container, HANDLE2)).toHaveStyle({ display: 'none' });

    await setProperty('visibility', true, ID2);
    await waitFor(() => expect(root(container, HANDLE2).style.display).toBe(''));
    expect(root(container, HANDLE)).toHaveStyle({ display: 'none' });
    expect(status(container, HANDLE2).style.color).toBe(OTHER_RGB);
  });

  test('[Spinner-A11Y-001] Status semantics follow the D-03 accessibility baseline', async () => {
    // Break this catches: removing role=status or adding an accessible name / visually hidden loading label.
    const { container } = widget.render();
    const indicator = await within(container).findByRole('status');

    expect(indicator).toHaveAccessibleName('');
    expect(indicator).toBeEmptyDOMElement();
    expect(indicator.querySelector('.visually-hidden, .sr-only')).toBeNull();
  });

  test('[Spinner-VIS-002] Visibility is a Property under Additional Actions and the widget reads it', async () => {
    // Break this catches: leaving Visibility in Styles, or Spinner still reading `styles.visibility`, so the Additional Actions toggle and every migrated `properties.visibility` are ignored.
    const accordions = spinnerInspectorAccordions();
    const titles = accordions.map((item) => item.title);
    expect(titles).not.toContain('General');
    const additional = accordions.find((item) => item.title === 'Additional Actions');
    expect(controlsOf(additional)).toEqual([
      ['visibility', 'properties'],
      ['tooltipFormat', 'properties'],
      ['tooltip', 'properties'],
    ]);
    expect(Object.keys(componentTypeDefinitionMap.Spinner.styles)).not.toContain('visibility');

    const { container } = widget.render({
      properties: { visibility: binding('{{false}}') },
      styles: { visibility: binding('{{true}}') },
    });
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    await setProperty('visibility', true);
    await waitFor(() => expect(root(container).style.display).toBe(''));
  });

  test.each([
    ['plainText', '**Ready** soon', () => screen.getAllByText('**Ready** soon')],
    // react-markdown is a pass-through stub in jest.config.js; the markdown branch is what is assertable.
    ['markdown', '**Ready** soon', () => document.querySelectorAll('.widget-tooltip-markdown')],
    ['html', '<em>Ready</em> soon', () => screen.getAllByText('Ready', { selector: 'em' })],
  ])('[Spinner-TOOLTIP-001] Tooltip renders in %s format from properties', async (format, text, find) => {
    // Break this catches: reading the Spinner tooltip from `general`, where nothing writes it any more, or ignoring the chosen format so Markdown/HTML show as raw source.
    widget.render({
      properties: { tooltip: binding(text), tooltipFormat: binding(format) },
      afterSeed: () => widget.setComponentProperty(ID, 'tooltip', 'stale general tooltip', 'general'),
    });
    await widget.session.user.hover(document.querySelector(`[data-cy="draggable-widget-${HANDLE}"]`));
    await waitFor(() => expect(find().length).toBeGreaterThan(0));
    expect(screen.queryByText('stale general tooltip')).toBeNull();
  });

  test.each([
    [true, true],
    [false, false],
  ])('[Spinner-CSS-001] CSS class sits in a Styles "Advanced" section (licensed: %s)', (licensed, shown) => {
    // Break this catches: rendering CSS class as a flat Styles control, or showing it without the license.
    const meta = componentTypeDefinitionMap.Spinner;
    const component = componentDefinition(ID, HANDLE, 'Spinner');
    component.component.properties = meta.properties;
    const props = {
      componentMeta: meta,
      component,
      paramUpdated: () => {},
      dataQueries: [],
      currentState: {},
      allComponents: {},
      hasCustomStyling: licensed,
    };
    const flat = [].concat(Inspector.RenderStyleOptions(props) ?? []).map((el) => el?.props?.param?.name);
    expect(flat).toEqual(['colour', 'size']);

    const advanced = Inspector.RenderLegacyAdvancedStyles(props);
    if (!shown) {
      expect(advanced).toBeNull();
      return;
    }
    const [section] = advanced.props.items;
    expect(section.title).toBe('Advanced');
    expect(controlsOf(section)).toEqual([['cssClass', 'styles']]);
  });
});
