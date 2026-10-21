/**
 * Mounts a widget's real inspector panel against the real composed store — no application UI is mocked.
 *
 * The component is seeded into the store, then the panel gets the same `component` / `componentMeta` props
 * Inspector.jsx builds for it (Inspector.jsx: componentMeta = registered type + stored definition).
 * Sections and toggles are read back through the data-cy hooks the real accordion and labels render.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { componentTypes } from '@/AppBuilder/WidgetManager/componentTypes';
import useStore from '@/AppBuilder/_stores/store';

const ID = 'widget1';

export function createInspectorPanelHarness({ componentType, Panel }) {
  const scenario = defineAppBuilderScenario({
    id: `${componentType.toLowerCase()}-inspector-panel`,
    name: `${componentType} inspector panel`,
    primarySeam: 'rtl',
    surface: 'app-editor',
    edition: 'ce',
    environment: 'development',
    layout: 'desktop',
    version: 'draft',
    transferPath: 'not-applicable',
    access: 'authenticated',
    capabilities: { observers: true, media: { matches: false } },
  });
  let session;

  return {
    setup() {
      session = new AppBuilderTestSession({ scenario });
    },
    render() {
      seedApp({ [ID]: componentDefinition(ID, `${componentType.toLowerCase()}1`, componentType) });
      const components = useStore.getState().getCurrentPageComponents();
      const stored = components[ID].component;
      const componentMeta = {
        ...componentTypes.find((type) => type.component === componentType),
        ...stored,
        definition: stored.definition,
      };
      const component = {
        id: ID,
        component: JSON.parse(JSON.stringify(componentMeta)),
        layouts: components[ID].layouts,
      };
      return session.render(
        <Panel
          component={component}
          componentMeta={componentMeta}
          paramUpdated={() => {}}
          layoutPropertyChanged={() => {}}
          dataQueries={[]}
          components={components}
          allComponents={components}
          currentState={{}}
          darkMode={false}
        />
      );
    },
  };
}

/**
 * The accordion section the real Inspector accordion renders for a title (e.g. 'additional-actions').
 * data-cy sits on the section header; its controls live in the header's sibling, so take the whole item.
 */
export const section = (key) =>
  document.querySelector(`[data-cy="widget-accordion-${key}"]`)?.closest('.accordion-item') ?? null;

/** Labels of the controls rendered inside a section, in render order, as kebab-case display names. */
export const controlsIn = (node) =>
  Array.from(node?.querySelectorAll('[data-cy$="-widget-parameter-label"]') ?? []).map((label) =>
    label.getAttribute('data-cy').replace('-widget-parameter-label', '')
  );

/** Waits for the real accordion to render `key`'s section with at least one control, then returns its controls. */
export async function renderedControls(key) {
  let controls = [];
  await waitFor(() => {
    controls = controlsIn(section(key));
    expect(controls.length).toBeGreaterThan(0);
  });
  return controls;
}
