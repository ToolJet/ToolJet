// Page builders shared by the dynamic height store specs. Not a spec itself (jest only runs *.spec.*).
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition } from '@/test/app-builder';

// Container ids are UUIDs: a canvas id such as `<tabs id>-<tab id>` maps back to its owner only for a UUID owner
// (formComponentSlice getBaseParentId), as in real apps.
export const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// One component with a desktop layout. `left` and `width` are grid columns, `top` and `height` px.
export const widget = (
  id,
  type,
  { parent, top = 0, left = 0, width = 10, height = 40, properties, styles, mobile } = {}
) => {
  const definition = componentDefinition(id, id, type, properties, { styles });
  definition.component.parent = parent;
  definition.layouts = { desktop: { top, left, width, height } };
  if (mobile) definition.layouts.mobile = mobile;
  return definition;
};

// Creates a module instance's namespace in every slice the resolver reads (as moduleIsolation.spec.js does).
export const bootModule = (moduleId) => {
  const s = useStore.getState();
  s.initializeComponentsSlice(moduleId);
  s.initializeAppSlice(moduleId);
  s.initializeEventsSlice(moduleId);
  s.initializeResolvedSlice(moduleId);
  s.initializeDependencySlice(moduleId);
  s.initializeDataQuerySlice(moduleId);
  s.initializeModeSlice(moduleId);
  s.initializeLoaderSlice(moduleId);
};
