/** Sections of a component's definition, as the App Builder holds them in memory. */
export type DefinitionSection = 'properties' | 'styles' | 'general' | 'generalStyles' | 'validation' | 'others';

export interface MovedComponentKey {
  from: readonly [DefinitionSection, string];
  to: readonly [DefinitionSection, string];
}

/** By component type: see MOVED_COMPONENT_KEYS in @tooljet/widget-definitions. */
export type MovedComponentKeys = Readonly<Record<string, readonly MovedComponentKey[]>>;

type ComponentDefinition = Partial<Record<DefinitionSection, Record<string, unknown>>>;

interface LoadedComponent {
  component?: { component?: string; definition?: ComponentDefinition };
}

interface LoadedPage {
  components?: Record<string, LoadedComponent>;
}

/**
 * Drops each moved key's old place from the components of a loaded app. The database keeps the old place, in sync,
 * until the cleanup migration removes it, so release code that reads it would work until then and break after.
 * Dropping it here makes such a reader fail in the release that moved the key. Copies only what it changes, and
 * returns the same array when nothing moved.
 */
export function dropMovedComponentKeys<Page extends LoadedPage>(
  pages: readonly Page[],
  movedKeys: MovedComponentKeys
): Page[] {
  if (!Object.keys(movedKeys).length) return pages as Page[];
  let changed = false;
  const loaded = pages.map((page) => {
    let components: Record<string, LoadedComponent> | undefined;
    for (const [id, entry] of Object.entries(page?.components ?? {})) {
      const definition = entry?.component?.definition;
      const stale = (movedKeys[entry?.component?.component ?? ''] ?? []).filter(
        ({ from: [section, key] }) => definition?.[section] && key in (definition[section] ?? {})
      );
      if (!definition || !stale.length) continue;
      const nextDefinition: ComponentDefinition = { ...definition };
      for (const {
        from: [section, key],
      } of stale) {
        const { [key]: _dropped, ...kept } = nextDefinition[section] ?? {};
        nextDefinition[section] = kept;
      }
      components = components ?? { ...page.components };
      components[id] = { ...entry, component: { ...entry.component, definition: nextDefinition } };
    }
    if (!components) return page;
    changed = true;
    return { ...page, components };
  });
  return changed ? loaded : (pages as Page[]);
}
