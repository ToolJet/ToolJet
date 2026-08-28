import useStore from '@/AppBuilder/_stores/store';
import type { UsageEntryKind } from '@/AppBuilder/_utils/entityUsage';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const NAVIGABLE_KINDS = new Set<string>([
  'component',
  'query',
  'variable',
  'pageVariable',
  'global',
  'constant',
]);

export const KIND_LABELS: Record<UsageEntryKind, string> = {
  component: 'component',
  query: 'query',
  variable: 'variable',
  pageVariable: 'page var',
  global: 'global',
  constant: 'constant',
  page: 'page',
  action: 'action',
  unknown: 'unknown',
};

/** Anything with enough shape to navigate to. `UsageEntry` satisfies it. */
export type NavigableEntry = {
  kind?: string | null;
  id?: string | null;
  name?: string;
};

/**
 * A callable with an `inspect` method hung off it: calling it navigates the builder,
 * `.inspect(entry)` only opens the left Inspector. Same function object, two entry points.
 */
export interface NavigateToEntity {
  (entry: NavigableEntry): boolean;
  inspect: (entry: NavigableEntry) => boolean;
}

// Navigates the builder to a usage entry ({ kind, id, name }): components are
// selected on canvas, queries open in the query panel, variables/globals/constants
// open the left Inspector. Returns true when navigation happened.
// Inspector node path for an entry, or null when the entry has no Inspector node.
export const inspectorPathFor = (entry?: NavigableEntry | null): string | null => {
  switch (entry?.kind) {
    case 'component':
      return `components.${entry.name}`;
    case 'query':
      return `queries.${entry.name}`;
    case 'variable':
      return `variables.${entry.name}`;
    case 'pageVariable':
      return `page.variables.${entry.name}`;
    case 'global':
      return `globals.${entry.name}`;
    case 'constant':
      return `constants.${entry.name}`;
    default:
      return null;
  }
};

const useEntityNavigation = (): NavigateToEntity => {
  const { moduleId } = useModuleContext();
  const setSelectedComponents = useStore((state: any) => state.setSelectedComponents);
  const setSelectedQuery = useStore((state: any) => state.queryPanel.setSelectedQuery);
  const setIsQueryPaneExpanded = useStore((state: any) => state.queryPanel.setIsQueryPaneExpanded);
  const setSelectedSidebarItem = useStore((state: any) => state.setSelectedSidebarItem);
  const toggleLeftSidebar = useStore((state: any) => state.toggleLeftSidebar);
  const setSelectedNodePath = useStore((state: any) => state.setSelectedNodePath);

  const openLeftInspector = (path: string) => {
    setSelectedNodePath?.(path);
    setSelectedSidebarItem('inspect');
    toggleLeftSidebar(true);
  };

  const navigate = (entry: NavigableEntry): boolean => {
    switch (entry.kind) {
      case 'component': {
        setSelectedComponents([entry.id]);
        document.getElementById(entry.id as string)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      case 'query': {
        setSelectedQuery(entry.id, moduleId);
        setIsQueryPaneExpanded(true);
        return true;
      }
      case 'variable':
        openLeftInspector(`variables.${entry.name}`);
        return true;
      case 'pageVariable':
        openLeftInspector(`page.variables.${entry.name}`);
        return true;
      case 'global':
        openLeftInspector(`globals.${entry.name}`);
        return true;
      case 'constant':
        openLeftInspector(`constants.${entry.name}`);
        return true;
      default:
        return false;
    }
  };

  // Same function object, with `inspect` hung off it — see NavigateToEntity.
  const navigateToEntity = navigate as NavigateToEntity;
  navigateToEntity.inspect = (entry: NavigableEntry): boolean => {
    const path = inspectorPathFor(entry);
    if (!path) return false;
    openLeftInspector(path);
    return true;
  };

  return navigateToEntity;
};

export default useEntityNavigation;
