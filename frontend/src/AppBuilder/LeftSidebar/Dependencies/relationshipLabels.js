import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { ActionTypes } from '@/AppBuilder/RightSideBar/Inspector/ActionTypes';

// `onRowClicked` → 'Row clicked', `set-page-variable` → 'Set page variable'
const humanize = (id = '') =>
  String(id)
    .replace(/^on(?=[A-Z])/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

const ACTION_LABELS = ActionTypes.reduce((acc, action) => {
  acc[action.id] = action.name;
  return acc;
}, {});

// Events that do not belong to a widget, so they are absent from componentTypeDefinitionMap
const NON_WIDGET_EVENT_LABELS = {
  onDataQuerySuccess: 'Query success',
  onDataQueryFailure: 'Query failure',
  onPageLoad: 'On page load',
};

const META_SECTIONS = ['properties', 'general', 'generalStyles', 'others', 'styles', 'validation'];

export const getComponentDisplayName = (componentType) =>
  componentTypeDefinitionMap[componentType]?.displayName ?? componentType ?? '';

/**
 * Human label for a bound property key — the widget's own `displayName` when the
 * component type is known ('data' → 'Datasource'), otherwise a humanised key.
 */
export const formatPropertyLabel = (key, componentType) => {
  if (!key) return '';
  const meta = componentTypeDefinitionMap[componentType];
  if (meta) {
    for (const section of META_SECTIONS) {
      const displayName = meta[section]?.[key]?.displayName;
      if (displayName) return displayName;
    }
  }
  return humanize(key);
};

export const formatEventLabel = (eventId, sourceComponentType) =>
  componentTypeDefinitionMap[sourceComponentType]?.events?.[eventId]?.displayName ??
  NON_WIDGET_EVENT_LABELS[eventId] ??
  humanize(eventId);

export const formatActionLabel = (actionId) => ACTION_LABELS[actionId] ?? humanize(actionId);

/**
 * The mono tag shown on a detail row: 'On click → Run query' for event details,
 * the humanised property label otherwise. Returns null when there is nothing useful
 * to show (e.g. an internal 'code' marker with no event behind it).
 */
export const formatRelationTag = (detail, { sourceComponentType, targetComponentType } = {}) => {
  if (!detail) return null;
  if (detail.eventId) {
    return `${formatEventLabel(detail.eventId, sourceComponentType)} → ${formatActionLabel(detail.actionId)}`;
  }
  return formatPropertyLabel(detail.label, targetComponentType);
};
