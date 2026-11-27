import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { verticalDividerConfig as frontendConfig } from '@tooljet/widget-definitions';
// eslint-disable-next-line import/no-relative-packages
import serverWidgets from '../../../../../../../server/src/modules/apps/services/widget-config';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import { componentDefinition } from '@/test/app-builder';

const serverConfig = serverWidgets.verticalDividerConfig;

const ID = 'verticalDivider1';
const HANDLE = 'verticalDivider1';

const defaultProperties = {
  visibility: binding('{{true}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
};

const defaultStyles = {
  dividerColor: binding('var(--cc-default-border)'),
  dividerStyle: binding('solid'),
  padding: binding('default'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
};

const widget = createWidgetHarness({
  componentType: 'VerticalDivider',
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
});

const root = (container) => container.querySelector(`[data-cy="${HANDLE}"]`);

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

async function setStyle(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'styles'));
}

describe('Vertical Divider widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[VerticalDivider-REN-001] default VerticalDivider renders one centered vertical line', async () => {
    // Break this catches: changing the vertical axis, adding extra content, or losing the centering container.
    const { container } = widget.render();
    const divider = await waitFor(() => {
      const node = root(container);
      expect(node).toBeInTheDocument();
      return node;
    });

    expect(divider).toHaveClass('justify-content-center');
    expect(divider).toHaveStyle({
      display: 'flex',
      width: '100%',
      height: '100%',
    });
    expect(divider).toHaveTextContent('');
    expect(divider.children).toHaveLength(1);
    expect(divider.firstElementChild).toHaveStyle({
      width: '1px',
      height: '100%',
      border: 'none',
    });
  });

  test('[VerticalDivider-LIN-001] solid and dashed styles select the correct observable vertical branch', async () => {
    // Break this catches: routing dashed through the solid branch, repeating on the wrong axis, or remounting the line on updates.
    const { container } = widget.render({
      styles: {
        dividerColor: binding('#3366ff'),
        dividerStyle: binding('solid'),
      },
    });
    const line = root(container).firstElementChild;
    await waitFor(() => expect(line).toHaveStyle({ backgroundColor: '#3366ff' }));
    expect(line).toHaveStyle({ height: '100%', width: '1px', border: 'none' });

    await setStyle('dividerStyle', 'dashed');
    await waitFor(() => expect(line.style.backgroundRepeat).toBe('repeat-y'));
    expect(root(container).firstElementChild).toBe(line);
    expect(line).toHaveStyle({
      backgroundColor: 'transparent',
      backgroundSize: '1px 8px',
      backgroundRepeat: 'repeat-y',
      border: 'none',
    });
  });

  test('[VerticalDivider-CLR-001] legacy black colors follow the light/dark fallback', async () => {
    // Break this catches: removing the saved-app black fallback, handling one spelling only, or recoloring authored custom colors.
    const light = widget.render({
      darkMode: false,
      styles: { dividerColor: binding('#000') },
    });
    await waitFor(() =>
      expect(root(light.container).firstElementChild).toHaveStyle({
        backgroundColor: '#000',
      })
    );

    widget.teardown();
    widget.setup();
    const dark = widget.render({
      darkMode: true,
      styles: { dividerColor: binding('#000000') },
    });
    await waitFor(() =>
      expect(root(dark.container).firstElementChild).toHaveStyle({
        backgroundColor: '#fff',
      })
    );

    widget.teardown();
    widget.setup();
    const custom = widget.render({
      darkMode: true,
      styles: { dividerColor: binding('#3366ff') },
    });
    await waitFor(() =>
      expect(root(custom.container).firstElementChild).toHaveStyle({
        backgroundColor: '#3366ff',
      })
    );
  });

  test.each(['edit', 'view'])(
    '[VerticalDivider-VIS-001] visibility hides and restores the same VerticalDivider in %s mode',
    async (currentMode) => {
      // Break this catches: unmounting on hide, applying visibility in one mode only, or dropping line style when restored.
      const { container } = widget.render({
        currentMode,
        styles: {
          dividerColor: binding('#3366ff'),
          dividerStyle: binding('dashed'),
        },
      });
      const divider = root(container);
      const line = divider.firstElementChild;
      expect(divider).toHaveStyle({ display: 'flex' });

      await setProperty('visibility', false);
      await waitFor(() => expect(divider).toHaveStyle({ display: 'none' }));
      expect(divider.firstElementChild).toBe(line);

      await setProperty('visibility', true);
      await waitFor(() => expect(divider).toHaveStyle({ display: 'flex' }));
      expect(divider.firstElementChild).toBe(line);
      expect(line).toHaveStyle({
        backgroundRepeat: 'repeat-y',
        backgroundSize: '1px 8px',
      });
    }
  );

  test('[VerticalDivider-CMP-001] frontend and server registrations publish the same VerticalDivider contract', () => {
    // Break this catches: editing one registry so new and server-loaded apps receive different VerticalDivider APIs.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: 'VerticalDivider',
      displayName: 'Vertical divider',
      component: 'VerticalDivider',
      defaultSize: { width: 1, height: 100 },
      events: {},
      exposedVariables: {},
      properties: { visibility: { validation: { defaultValue: true } } },
      styles: {
        dividerColor: {
          validation: { defaultValue: 'var(--cc-default-border)' },
        },
        dividerStyle: {
          options: [
            { displayName: 'Solid', value: 'solid' },
            { displayName: 'Dashed', value: 'dashed' },
          ],
        },
      },
      definition: {
        properties: { visibility: { value: '{{true}}' } },
        events: [],
        styles: {
          dividerColor: { value: 'var(--cc-default-border)' },
          dividerStyle: { value: 'solid' },
        },
      },
    });
    expect(frontendConfig.actions ?? []).toEqual([]);
  });
});

// Theme box shadow (contract D-03; Button's D-03..D-06 transferred).
describe('VerticalDivider: theme box shadow', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());
  const shadowBox = () => document.querySelector('[data-cy="verticalDivider1"] > div');

  test('[VerticalDivider-THEME-001] a newly dropped VerticalDivider starts with no theme shadow, with the theme dropdown', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(frontendConfig.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(frontendConfig.styles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[VerticalDivider-THEME-002] a VerticalDivider saved before theme styles keeps its own shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      'verticalDivider1',
      'verticalDivider1',
      'VerticalDivider',
      {},
      {
        styles: { boxShadow: binding('5px 5px 0px 0px #00000040') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles, generalStyles } = buildComponentMetaDefinition({ verticalDivider1: saved })['verticalDivider1']
      .component.definition;
    expect(styles).not.toHaveProperty('boxShadowStyle');
    expect(generalStyles ?? {}).not.toHaveProperty('boxShadowStyle');

    widget.render({ styles: { ...generalStyles, ...styles, boxShadowStyle: binding('custom') } });
    await waitFor(() => expect(shadowBox()).toBeTruthy());
    expect(getComputedStyle(shadowBox()).boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[VerticalDivider-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw value whatever the theme style.
    widget.render({
      styles: {
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(shadowBox()).toBeTruthy());
    expect(getComputedStyle(shadowBox()).boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty('verticalDivider1', 'boxShadowStyle', 'custom', 'styles');
    await waitFor(() => expect(getComputedStyle(shadowBox()).boxShadow).toBe('0px 0px 0px 0px #00000040'));
  });
});
