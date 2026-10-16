// The page scripts/ui2-visual.js screenshots: every UI 2.0 widget, as a new widget is created, three times in a row
// (default, loading, disabled), rendered through the real RenderWidget and store like a page in the viewer. `?theme=dark`
// draws the dark theme. Built by scripts/ui2-visual.webpack.js; not part of the app.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import camelCase from 'lodash/camelCase';
import '@/_styles/theme.scss';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { baseTheme } from '@/AppBuilder/_stores/utils';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { seedApp, componentDefinition, binding } from '@/test/app-builder/seed';

const MODULE_ID = 'canvas';
const params = new URLSearchParams(window.location.search);
const dark = params.get('theme') === 'dark';
const only = params.get('only')?.split(',');
const VARIANTS = [
  ['default', {}],
  ['loading', { loadingState: binding('{{true}}') }],
  ['disabled', { disabledState: binding('{{true}}') }],
];
const configs = shadcnConfigs.filter((c) => !only || only.includes(c.name));

/** The app theme's colours as CSS variables, the way the viewer sets them (AppBuilder/_hooks/useAppData.js). */
function applyBaseTheme(mode) {
  const root = document.documentElement;
  for (const [category, properties] of Object.entries(baseTheme.definition)) {
    for (const property of Object.values(properties)) {
      if (!property || typeof property !== 'object') continue;
      for (const [type, value] of Object.entries(property)) {
        if (value && typeof value === 'object' && mode in value)
          root.style.setProperty(`--cc-${camelCase(type)}-${camelCase(category)}`, value[mode]);
      }
    }
  }
}

/** Loads a lazy widget through its own initializer, as widgetHarness.preloadLazyComponent does in Jest. */
async function preload(component) {
  if (component?.$$typeof !== Symbol.for('react.lazy') || component._payload._status === 1) return;
  try {
    component._init(component._payload);
  } catch (pending) {
    if (typeof pending?.then !== 'function') throw pending;
    await pending;
  }
}

/** A cell's size: the widget's own default height, and its default width on a 1200px canvas. */
const sizeOf = (config) => ({
  width: Math.max(240, Math.min(560, Math.round(((config.defaultSize?.width ?? 10) / 43) * 1200))),
  height: Math.max(32, Math.min(520, config.defaultSize?.height ?? 40)),
});

const widgetProps = (id, componentType, { width, height }) => ({
  id,
  componentType,
  moduleId: MODULE_ID,
  currentMode: 'view',
  currentLayout: 'desktop',
  widgetHeight: height,
  widgetWidth: width,
  inCanvas: true,
  darkMode: dark,
  onOptionChange: () => {},
  onOptionsChange: () => {},
});

function Gallery() {
  return (
    <main className="ui2-gallery">
      {configs.map((config) => {
        const size = sizeOf(config);
        return (
          <section key={config.name} data-cell={config.name} className="ui2-gallery-row">
            {VARIANTS.map(([variant]) => (
              <div key={variant} className="ui2-gallery-slot" style={size}>
                <RenderWidget {...widgetProps(`${config.name}-${variant}`, config.name, size)} />
              </div>
            ))}
          </section>
        );
      })}
    </main>
  );
}

async function main() {
  applyBaseTheme(dark ? 'dark' : 'light');
  document.body.classList.add(dark ? 'dark-theme' : 'light-theme');
  await Promise.all(configs.map((c) => preload(getComponentToRender(c.name))));

  const components = {};
  for (const config of configs) {
    for (const [variant, properties] of VARIANTS) {
      const id = `${config.name}-${variant}`;
      components[id] = componentDefinition(
        id,
        `${config.name.replace(/^Shad/, '').toLowerCase()}${variant}`,
        config.name,
        properties
      );
    }
  }
  seedApp(components, { moduleId: MODULE_ID });
  const store = useStore.getState();
  store.setEditorLoading(false, MODULE_ID);
  store.setCurrentMode('view', MODULE_ID);

  createRoot(document.getElementById('root')).render(
    <MemoryRouter initialEntries={['/applications/ui2-gallery']}>
      <DndProvider backend={HTML5Backend}>
        <Gallery />
      </DndProvider>
    </MemoryRouter>
  );
  window.__ui2Gallery = { ready: true, cells: configs.map((c) => c.name) };
}

main().catch((error) => {
  window.__ui2Gallery = { error: String(error?.stack ?? error) };
});
