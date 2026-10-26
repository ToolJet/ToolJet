import * as fs from 'fs';
import * as path from 'path';

/* The component library an app version is built in, saved in globalSettings.componentLibrary: ToolJet UI 1.0 ('ui1'),
   a component pack ('pack:<id>') or another custom library ('lib:<id>'); 'ui2' (ToolJet UI 2.0) was saved by earlier
   builds and reads as Rocket 2.0. The components panel and AI builds read it. New apps are created on Rocket 2.0 (the
   built-in shadcn pack); an imported, cloned or template app keeps its source's library, or the one its widgets imply
   when the source has none. Only apps from before the setting are left unsaved (the frontend infers theirs the same
   way). */
export type ComponentLibrary = string;

export const NEW_APP_COMPONENT_LIBRARY: ComponentLibrary = 'pack:shadcn';

export const isComponentLibrary = (value: unknown): value is ComponentLibrary =>
  value === 'ui1' || value === 'ui2' || (typeof value === 'string' && /^(pack|lib):./.test(value));

export function componentLibraryFor(globalSettings: unknown, componentTypes: Iterable<unknown>): ComponentLibrary {
  const saved = (globalSettings as { componentLibrary?: unknown } | null | undefined)?.componentLibrary;
  if (isComponentLibrary(saved)) return saved;
  for (const type of componentTypes) if (typeof type === 'string' && /^Shad[A-Z]/.test(type)) return 'ui2';
  return 'ui1';
}

/** A new app's library settings: Rocket 2.0, pinned to the built-in shadcn pack the server ships (builtin-packs/, see
 *  ee custom-component-libraries/builtin-packs.ts), since a pack's components render only while its library is pinned.
 *  Without the packaged pack the app is saved on Rocket 2.0 unpinned; the components panel then offers ToolJet UI 1.0. */
export function newAppLibrarySettings(): {
  componentLibrary: ComponentLibrary;
  customComponentLibraries?: Record<string, string>;
} {
  const dir = process.env.BUILTIN_PACKS_PATH || path.join(process.cwd(), 'builtin-packs');
  try {
    const { correlationId, version } = JSON.parse(fs.readFileSync(path.join(dir, 'shadcn', 'pack.json'), 'utf8'));
    if (typeof correlationId === 'string' && typeof version === 'string') {
      return {
        componentLibrary: NEW_APP_COMPONENT_LIBRARY,
        customComponentLibraries: { [correlationId.replace(/-/g, '')]: version },
      };
    }
  } catch {
    // No packaged pack (a CE build, or a dev server before bundle-builtin.mjs ran).
  }
  return { componentLibrary: NEW_APP_COMPONENT_LIBRARY };
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
