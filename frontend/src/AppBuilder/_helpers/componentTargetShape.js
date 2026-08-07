/**
 * Structure-only description of the data a component expects to be fed.
 *
 * The mirror image of queryDataShape.js: that file describes the shape a transformation *receives*,
 * this one describes the shape it must *produce* when the user points at a component ("format this
 * to match @ordersTable"). Both are read from the live builder store, and both are value-free —
 * everything here comes from the component's own configuration (column keys, binding expressions),
 * never from the data flowing through it.
 *
 * Read from the browser rather than the app graph on purpose. The graph is only re-ingested after an
 * AI write (see the ingest-app emit in the server's writeChanges), so a column the user added by
 * hand would be missing from it; the store is always current.
 */

import useStore from '@/AppBuilder/_stores/store';

export const COMPONENT_TARGET_SHAPE_VERSION = 1;

// Components whose data contract a transformation can meaningfully target. Anything else is
// described by name and type only — telling the AI "reshape to match this button" is worse than
// telling it nothing.
const SHAPED_TYPES = new Set(['Table', 'Chart', 'Listview', 'Calendar', 'Kanban', 'DropdownV2', 'MultiselectV2']);

// Fixed contracts — the keys these components read off every row, regardless of configuration.
// Sourced from the widgets themselves (Chart.jsx's x/y accessors, Calendar.jsx's event mapper,
// KanbanBoard.jsx's column/card normalisers).
const FIXED_CONTRACTS = {
  Chart: {
    expects: 'array of objects, one per data point',
    fields: [
      { key: 'x', description: 'category / label plotted on the x axis' },
      { key: 'y', description: 'numeric value plotted on the y axis' },
    ],
  },
  Calendar: {
    expects: 'array of event objects',
    fields: [
      { key: 'title', description: 'event label' },
      {
        key: 'start',
        description: 'start datetime, parsed with the calendar’s date format',
      },
      {
        key: 'end',
        description: 'end datetime, parsed with the calendar’s date format',
      },
      {
        key: 'resourceId',
        description: 'optional — only when the calendar groups by resource',
      },
    ],
  },
  Kanban: {
    expects: 'array of card objects (the board’s column list is configured separately)',
    fields: [
      { key: 'id', description: 'unique card id' },
      { key: 'title', description: 'card title' },
      { key: 'columnId', description: 'id of the column the card belongs to' },
    ],
  },
  DropdownV2: {
    expects: 'array of option objects',
    fields: [
      { key: 'label', description: 'option text' },
      { key: 'value', description: 'option value' },
    ],
  },
  MultiselectV2: {
    expects: 'array of option objects',
    fields: [
      { key: 'label', description: 'option text' },
      { key: 'value', description: 'option value' },
    ],
  },
};

/**
 * Reads a component property, preferring the resolved value over the raw definition.
 *
 * A table's `columns` is usually a literal array, but it can be a binding ("{{ ... }}") — the
 * resolved store holds what that binding evaluated to, which is the list actually rendered.
 */
const readProperty = (componentId, definition, property, moduleId) => {
  const resolved = useStore.getState().getResolvedComponent?.(componentId, null, moduleId)?.properties?.[property];
  if (resolved !== undefined && resolved !== null) return resolved;
  return definition?.properties?.[property]?.value;
};

// Table columns carry both a display name and the data key they read; `key` is what the
// transformation has to emit, and it falls back to the name when the column was never given one.
const describeTableColumns = (componentId, definition, moduleId) => {
  const columns = readProperty(componentId, definition, 'columns', moduleId);
  if (!Array.isArray(columns)) return null;

  const fields = columns
    .filter((column) => column && typeof column === 'object')
    .map((column) => {
      const key = column.key || column.name;
      if (!key || typeof key !== 'string') return null;
      return {
        key,
        ...(column.name && column.name !== key ? { label: column.name } : {}),
        ...(column.columnType ? { columnType: column.columnType } : {}),
      };
    })
    .filter(Boolean);

  return fields.length ? fields : null;
};

// Every "listItem.<key>" the list's children read. A list view has no column config — its contract
// is whatever its child components bind to, so that is where the expected keys live.
const LIST_ITEM_REFERENCE = /\blistItem\s*(?:\.\s*([a-zA-Z_$][\w$]*)|\[\s*['"]([^'"]+)['"]\s*\])/g;

const collectListItemKeys = (componentId, page) => {
  const keys = new Set();

  Object.values(page?.components ?? {}).forEach((entry) => {
    // Slots suffix the parent id ("<uuid>-header"), so a prefix test is what identifies a child.
    const parent = entry?.component?.parent;
    if (typeof parent !== 'string' || !parent.startsWith(componentId)) return;

    Object.values(entry?.component?.definition?.properties ?? {}).forEach((property) => {
      const value = property?.value;
      if (typeof value !== 'string') return;
      let match;
      LIST_ITEM_REFERENCE.lastIndex = 0;
      while ((match = LIST_ITEM_REFERENCE.exec(value)) !== null) {
        keys.add(match[1] ?? match[2]);
      }
    });
  });

  return [...keys];
};

/**
 * Locates a component by name across the module's pages.
 */
const findComponentByName = (componentName, moduleId) => {
  const pages = useStore.getState().modules?.[moduleId]?.pages ?? [];

  for (const page of pages) {
    for (const [id, entry] of Object.entries(page?.components ?? {})) {
      if (entry?.component?.name === componentName) return { id, entry, page };
    }
  }
  return null;
};

/**
 * Describes the data contract of one component, by name.
 *
 * @returns {object|null} `{ version, name, type, page, expects, fields }`, or null when no component
 *   of that name exists. `fields` is omitted for types with no describable contract.
 */
export const buildComponentTargetShape = (componentName, moduleId = 'canvas') => {
  if (!componentName) return null;

  const found = findComponentByName(componentName, moduleId);
  if (!found) return null;

  const { id, entry, page } = found;
  const component = entry.component;
  const type = component.component;

  const shape = {
    version: COMPONENT_TARGET_SHAPE_VERSION,
    name: component.name,
    type,
    ...(page?.name ? { page: page.name } : {}),
  };

  if (!SHAPED_TYPES.has(type)) return shape;

  if (type === 'Table') {
    const fields = describeTableColumns(id, component.definition, moduleId);
    shape.expects = 'array of flat row objects, one per table row';
    if (fields) {
      shape.fields = fields;
    } else {
      // A table with no columns configured renders a column per key of the first row, so any flat
      // object shape is valid — saying nothing is more accurate than inventing keys.
      shape.note = 'The table has no columns configured yet, so it renders one column per key of each row.';
    }
    return shape;
  }

  if (type === 'Listview') {
    const keys = collectListItemKeys(id, page);
    shape.expects = 'array of objects, one per list row';
    if (keys.length) {
      shape.fields = keys.map((key) => ({ key }));
    } else {
      shape.note = 'No child component reads a listItem field yet, so the row keys are not constrained.';
    }
    return shape;
  }

  return { ...shape, ...FIXED_CONTRACTS[type] };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Same boundary rule the chat input's highlighter uses: an "@" at the start or after whitespace/a
// comma, and the name followed by end/whitespace/comma. Keeps "@ordersTable" from matching inside
// "@ordersTableOld".
const isMentioned = (text, name) => new RegExp(`(?:^|[ ,])@${escapeRegex(name)}(?=$|[ ,])`).test(text);

// One message pointing at half the canvas is a prompt the AI can't act on anyway, and each shape
// costs context. In practice a reshaping request names one component.
const MAX_MENTIONED_COMPONENTS = 3;

/**
 * Describes every component `text` mentions by "@name".
 *
 * @param {string} text     The message the user is sending.
 * @param {string} moduleId Module whose pages to search.
 * @returns {object[]} Target shapes, in the order the components appear on the canvas. Empty when
 *   the message mentions no component.
 */
export const buildMentionedComponentShapes = (text, moduleId = 'canvas') => {
  if (!text) return [];

  const pages = useStore.getState().modules?.[moduleId]?.pages ?? [];
  const shapes = [];

  for (const page of pages) {
    for (const entry of Object.values(page?.components ?? {})) {
      const name = entry?.component?.name;
      if (!name || !isMentioned(text, name)) continue;

      const shape = buildComponentTargetShape(name, moduleId);
      if (shape) shapes.push(shape);
      if (shapes.length >= MAX_MENTIONED_COMPONENTS) return shapes;
    }
  }

  return shapes;
};
