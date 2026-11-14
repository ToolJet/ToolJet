import { ROCKET_1_LABEL } from '@/AppBuilder/RightSideBar/ComponentManagerTab/componentLibrary';

export type ComponentIdentity = { kind: 'native' | 'module'; library: string; component: string };

// Components whose Properties tab names them some other way, or not at all: a pack component builds its own strip
// and so does a custom library's (LibraryComponent/packIdentity), and the module editor's own container has no
// Properties tab.
const NAMED_ELSEWHERE = new Set(['PackComponent', 'LibraryComponent', 'ModuleContainer']);

/**
 * The line a component's Properties tab opens with (design option D): where it comes from and what it is. A native
 * widget is ToolJet UI 1.0 and its display name; a module instance is Modules and the module's name, its widget name
 * until the modules list loads. Null where the tab names the component some other way.
 */
export const componentIdentity = (
  componentType: string | undefined,
  displayName: string | undefined,
  moduleName?: string
): ComponentIdentity | null => {
  if (!componentType || NAMED_ELSEWHERE.has(componentType)) return null;
  if (componentType === 'ModuleViewer') {
    const component = moduleName || displayName;
    return component ? { kind: 'module', library: 'Modules', component } : null;
  }
  return displayName ? { kind: 'native', library: ROCKET_1_LABEL, component: displayName } : null;
};
