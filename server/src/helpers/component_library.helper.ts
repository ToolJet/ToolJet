/* The component library an app version is built in: ToolJet UI 1.0 (the native widgets) or ToolJet UI 2.0 (the Shad*
   widgets), saved in globalSettings.componentLibrary. The components panel and AI builds read it. New apps are created
   on 'ui2'; an imported, cloned or template app keeps its source's library, or the one its widgets imply when the
   source has none. Only apps from before the setting are left unsaved (the frontend infers theirs the same way). */
export type ComponentLibrary = 'ui1' | 'ui2';

export const NEW_APP_COMPONENT_LIBRARY: ComponentLibrary = 'ui2';

export const isComponentLibrary = (value: unknown): value is ComponentLibrary => value === 'ui1' || value === 'ui2';

export function componentLibraryFor(globalSettings: unknown, componentTypes: Iterable<unknown>): ComponentLibrary {
  const saved = (globalSettings as { componentLibrary?: unknown } | null | undefined)?.componentLibrary;
  if (isComponentLibrary(saved)) return saved;
  for (const type of componentTypes) if (typeof type === 'string' && /^Shad[A-Z]/.test(type)) return 'ui2';
  return 'ui1';
}

/** Component types of one version in a normalized export (pages carry appVersionId, components pageId). */
export function versionComponentTypes(
  appVersionId: string,
  pages: Array<{ id?: string; appVersionId?: string }> = [],
  components: Array<{ pageId?: string; type?: string }> = []
): string[] {
  const pageIds = new Set(pages.filter((page) => page.appVersionId === appVersionId).map((page) => page.id));
  return components.filter((component) => pageIds.has(component.pageId)).map((component) => component.type);
}

/** Component types in a legacy definition: definition.pages[id].components[id].component.component. */
export function definitionComponentTypes(definition: unknown): string[] {
  const pages = (definition as { pages?: Record<string, { components?: Record<string, unknown> }> })?.pages ?? {};
  return Object.values(pages).flatMap((page) =>
    Object.values(page?.components ?? {}).map(
      (entry) => (entry as { component?: { component?: string } })?.component?.component
    )
  );
}
