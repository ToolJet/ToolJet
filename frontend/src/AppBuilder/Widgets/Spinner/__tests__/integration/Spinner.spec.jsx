import { waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding, store, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { spinnerConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/spinner';
import { spinnerConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/spinner';

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
  visibility: binding('{{true}}'),
  size: binding('sm'),
  colour: binding(DEFAULT_COLOUR),
};

const widget = createWidgetHarness({
  componentType: 'Spinner',
  handle: HANDLE,
  id: ID,
  widgetHeight: LAYOUT_HEIGHT,
  defaultStyles,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const status = (container, handle = HANDLE) => root(container, handle)?.querySelector('[role="status"]');
const resolvedStyle = (key, id = ID) => store().getResolvedComponent(id, null, MODULE_ID)?.styles?.[key];

function spinnerDefinition(id, handle, styles = {}) {
  const definition = componentDefinition(id, handle, 'Spinner');
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  return definition;
}

async function setStyle(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'styles'));
}

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

  test('[Spinner-COL-001] Colour updates the spinner\'s inline color', async () => {
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

  test('[Spinner-SIZ-002] Undocumented size values follow the D-02 interpolation rule', async () => {
    // Break this catches: clamping unknown size back to sm instead of interpolating spinner-border-${value}.
    const { container } = widget.render();
    const indicator = await within(container).findByRole('status');

    await setStyle('size', 'lg');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-lg'));
    await setStyle('size', '');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-sm'));
    expect(status(container)).not.toHaveClass('spinner-border-lg');
    expect(status(container)).toBe(indicator);

    await setStyle('size', 'xl');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-xl'));
    expect(status(container)).not.toHaveClass('spinner-border-sm');
    expect(status(container)).not.toHaveClass('spinner-border-lg');

    await setStyle('size', 'lg');
    await waitFor(() => expect(status(container)).toHaveClass('spinner-border-lg'));
    expect(status(container)).not.toHaveClass('spinner-border-xl');
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

      await setStyle('visibility', false);
      await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
      expect(within(container).getByRole('status', { hidden: true })).toBe(indicator);

      await setStyle('visibility', true);
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

    await setStyle('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setStyle('visibility', true);
    await waitFor(() => expect(root(container).style.display).toBe(''));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test('[Spinner-CMP-001] Frontend and server registrations agree on Spinner defaults', () => {
    // Break this catches: editing one registry so newly created and server-loaded apps get different Spinner APIs.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: 'Spinner',
      defaultSize: { width: 4, height: 30 },
      properties: {},
      events: {},
      exposedVariables: {},
      styles: {
        visibility: { validation: { defaultValue: true } },
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
        properties: {},
        events: [],
        styles: {
          visibility: { value: '{{true}}' },
          size: { value: 'sm' },
          colour: { value: 'var(--cc-primary-brand)' },
        },
      },
    });
    expect(frontendConfig.actions ?? []).toEqual([]);
  });

  test('[Spinner-ISO-001] Instances isolate colour, size, and visibility', async () => {
    // Break this catches: shared module state restyling or hiding every Spinner when one instance updates.
    const { container } = widget.render({
      styles: { colour: binding(RGB_COLOUR), size: binding('lg'), visibility: binding('{{true}}') },
      extraComponents: {
        [ID2]: spinnerDefinition(ID2, HANDLE2, {
          colour: binding(OTHER_RGB),
          size: binding('sm'),
          visibility: binding('{{false}}'),
        }),
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
    await setStyle('visibility', false, ID);
    await waitFor(() => expect(root(container, HANDLE)).toHaveStyle({ display: 'none' }));
    expect(status(container, HANDLE).style.color).toBe(RGBA_COLOUR);
    expect(status(container, HANDLE)).toHaveClass('spinner-border-sm');
    expect(status(container, HANDLE2).style.color).toBe(OTHER_RGB);
    expect(status(container, HANDLE2)).toHaveClass('spinner-border-sm');
    expect(root(container, HANDLE2)).toHaveStyle({ display: 'none' });

    await setStyle('visibility', true, ID2);
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
});
