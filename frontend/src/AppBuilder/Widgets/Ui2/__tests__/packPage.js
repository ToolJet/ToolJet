// A page of many UI 2.0 widgets mounted through the widget harness (real store, real RenderWidget, each widget's
// registered definition), for the render-count, accessibility and hostile-data specs.
import { componentDefinition } from '@/test/app-builder';
import { TYPES, boxOf } from './packWidgets';

export * from './packWidgets';

export const idOf = (type) => `w-${type}`;
export const handleOf = (type) => `${type.replace(/^Shad/, '').toLowerCase()}1`;

/**
 * A page holding `types` (each at its default box, with its registered definition) plus `extra` widgets
 * ({ id: { componentType, properties } }), mounted in view mode through one harness. `render(properties)` takes
 * property overrides keyed by component id.
 */
export function createPackPage(createWidgetHarness, { types = TYPES, extra = {} } = {}) {
  const widgets = [
    ...types.map((type) => ({ id: idOf(type), componentType: type })),
    ...Object.entries(extra).map(([id, w]) => ({ id, ...w })),
  ];
  const [first, ...rest] = widgets;
  const harness = createWidgetHarness({
    componentType: first.componentType,
    handle: handleOf(first.componentType),
    id: first.id,
    widgetWidth: boxOf(first.componentType).width,
    widgetHeight: boxOf(first.componentType).height,
    // Container widgets (Tabs, List view, a Kanban with card content) mount canvases, which need the dnd provider.
    capabilities: { dnd: true },
    preload: widgets.map((w) => w.componentType),
  });
  const render = (properties = {}) =>
    harness.render({
      currentMode: 'view',
      properties: { ...first.properties, ...properties[first.id] },
      extraComponents: Object.fromEntries(
        rest.map((w) => [
          w.id,
          componentDefinition(
            w.id,
            w.handle || handleOf(w.componentType),
            w.componentType,
            { ...w.properties, ...properties[w.id] },
            { seedFromRegisteredDefinition: true }
          ),
        ])
      ),
      also: rest.map((w) => ({
        id: w.id,
        componentType: w.componentType,
        currentMode: 'view',
        widgetWidth: boxOf(w.componentType).width,
        widgetHeight: boxOf(w.componentType).height,
      })),
    });
  const handles = Object.fromEntries(widgets.map((w) => [w.id, w.handle || handleOf(w.componentType)]));
  /** The mounted widget's wrapper (RenderWidget's draggable-widget box). */
  const elementOf = (id) => document.querySelector(`[data-cy="draggable-widget-${handles[id]}"]`);
  return { harness, widgets, ids: widgets.map((w) => w.id), render, elementOf };
}
