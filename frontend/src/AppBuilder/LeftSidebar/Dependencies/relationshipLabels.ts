import { componentTypeDefinitionMap as rawComponentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { ActionTypes as rawActionTypes } from '@/AppBuilder/RightSideBar/Inspector/ActionTypes';
import type { UsageDetail } from '@/AppBuilder/_utils/entityUsage';

// Both are built in untyped JS, so their inferred types carry no index signature.
// Cast once here rather than at every lookup.
const componentTypeDefinitionMap = rawComponentTypeDefinitionMap as Record<string, any>;
const ActionTypes = rawActionTypes as Array<{ id: string; name: string }>;

// `onRowClicked` → 'Row clicked', `set-page-variable` → 'Set page variable'
const humanize = (id: string | undefined = '') =>
  String(id)
    .replace(/^on(?=[A-Z])/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

const ACTION_LABELS = ActionTypes.reduce<Record<string, string>>((acc, action) => {
  acc[action.id] = action.name;
  return acc;
}, {});

// Events that do not belong to a widget, so they are absent from componentTypeDefinitionMap
const NON_WIDGET_EVENT_LABELS: Record<string, string> = {
  onDataQuerySuccess: 'Query success',
  onDataQueryFailure: 'Query failure',
  onPageLoad: 'On page load',
};

const META_SECTIONS = ['properties', 'general', 'generalStyles', 'others', 'styles', 'validation'];

export const getComponentDisplayName = (componentType?: string): string =>
  componentTypeDefinitionMap[componentType as string]?.displayName ?? componentType ?? '';

/**
 * Human label for a bound property key — the widget's own `displayName` when the
 * component type is known ('data' → 'Datasource'), otherwise a humanised key.
 */
export const formatPropertyLabel = (key?: string, componentType?: string): string => {
  if (!key) return '';
  const meta = componentTypeDefinitionMap[componentType as string];
  if (meta) {
    for (const section of META_SECTIONS) {
      const displayName = meta[section]?.[key]?.displayName;
      if (displayName) return displayName;
    }
  }
  return humanize(key);
};

export const formatEventLabel = (eventId?: string, sourceComponentType?: string): string =>
  componentTypeDefinitionMap[sourceComponentType as string]?.events?.[eventId as string]?.displayName ??
  NON_WIDGET_EVENT_LABELS[eventId as string] ??
  humanize(eventId);

export const formatActionLabel = (actionId?: string): string => ACTION_LABELS[actionId as string] ?? humanize(actionId);

export type RelationTagContext = {
  sourceComponentType?: string;
  targetComponentType?: string;
};

/**
 * The mono tag shown on a detail row: 'On click → Run query' for event details,
 * the humanised property label otherwise. Returns null when there is nothing useful
 * to show (e.g. an internal 'code' marker with no event behind it).
 */
export const formatRelationTag = (
  detail?: UsageDetail | null,
  { sourceComponentType, targetComponentType }: RelationTagContext = {}
): string | null => {
  if (!detail) return null;
  if (detail.eventId) {
    return `${formatEventLabel(detail.eventId, sourceComponentType)} → ${formatActionLabel(detail.actionId)}`;
  }
  return formatPropertyLabel(detail.label, targetComponentType);
};
