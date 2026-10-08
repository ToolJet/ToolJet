import { widgetEvents } from '../catalog';
import { actionEntityRef, isKnownActionId } from '../event-actions';
import { EventWrite, Rule, RuleContext, Severity, WriteSource } from '../types';
import { hasBraces } from '../values';

export const EVENT_TARGETS = ['component', 'page', 'data_query', 'table_column', 'table_action'] as const;

// Sources that reproduce stored data. ToolJet's own templates contain orphaned events
// (their source was deleted but the rows were exported), so a dangling reference in bulk
// data is a defect to report, not a reason to reject the whole app.
const BULK_SOURCES: ReadonlySet<WriteSource> = new Set(['import', 'git', 'copy', 'restore']);

function referenceSeverity(source: WriteSource): Severity {
  return BULK_SOURCES.has(source) ? 'medium' : 'high';
}

function labelOf(write: EventWrite): string {
  const eventId = write.data?.event?.eventId;
  return eventId ? `${eventId} handler` : `event ${write.id}`;
}

// Reorders only touch `index`; content rules run when the payload changes.
function eventUntouched(write: EventWrite): boolean {
  return write.op === 'update' && !!write.touched && !write.touched.includes('event');
}

// An event with an unknown action silently does nothing at runtime.
export const eventActionKnown: Rule<EventWrite> = {
  id: 'event-action-known',
  description: 'The event runs an action from the editor action list',
  check(write) {
    if (write.op === 'delete' || eventUntouched(write) || !write.data?.event) return [];
    const actionId = write.data.event.actionId;
    if (isKnownActionId(actionId)) return [];
    return [
      {
        code: actionId ? 'EVENT_UNKNOWN_ACTION' : 'EVENT_ACTION_MISSING',
        severity: 'critical',
        confidence: 'certain',
        path: `${labelOf(write)}.event.actionId`,
        message: actionId
          ? `${labelOf(write)} → action: "${actionId}" is not an action, the event would do nothing`
          : `${labelOf(write)} → action: no actionId set, the event would do nothing`,
        entity: { type: 'event', id: write.id },
        fix: 'Use one of the editor actions, e.g. "run-query" or "show-alert".',
      },
    ];
  },
};

export const eventTargetTypeValid: Rule<EventWrite> = {
  id: 'event-target-type-valid',
  description: 'The event is attached to a known kind of source',
  check(write) {
    if (write.op === 'delete' || !write.data?.target) return [];
    if ((EVENT_TARGETS as readonly string[]).includes(write.data.target)) return [];
    return [
      {
        code: 'EVENT_UNKNOWN_TARGET',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.target`,
        message: `${labelOf(write)} → target: "${write.data.target}" is not a source kind, expected one of ${EVENT_TARGETS.join(', ')}`,
        entity: { type: 'event', id: write.id },
      },
    ];
  },
};

// Scoped to the version, unlike today's save-code checks which accept any id in the database.
export const eventSourceExists: Rule<EventWrite> = {
  id: 'event-source-exists',
  description: 'The component, page or query the event is attached to exists in this version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.sourceId || !write.data.target) return [];
    if (!(EVENT_TARGETS as readonly string[]).includes(write.data.target)) return []; // reported separately
    const index = await ctx.index();
    const { target, sourceId } = write.data;

    const found =
      target === 'page'
        ? index.page(sourceId)
        : target === 'data_query'
          ? index.query(sourceId)
          : index.component(sourceId);
    if (found) return [];

    const kind = target === 'page' ? 'page' : target === 'data_query' ? 'query' : 'component';
    return [
      {
        code: 'EVENT_SOURCE_NOT_FOUND',
        severity: referenceSeverity(ctx.source),
        confidence: 'certain',
        path: `${labelOf(write)}.sourceId`,
        message: `${labelOf(write)} → attached to: no ${kind} with id ${sourceId} exists in this app version`,
        entity: { type: 'event', id: write.id },
        fix: `Attach the event to a ${kind} of the version being edited.`,
      },
    ];
  },
};

// run-query without its query (or switch-page without its page, ...) is a dead control:
// the button clicks and nothing happens.
export const eventActionTargetExists: Rule<EventWrite> = {
  id: 'event-action-target-exists',
  description: 'The query, page or component the action points at exists in this version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || eventUntouched(write) || !write.data?.event) return [];
    const ref = actionEntityRef(write.data.event);
    if (!ref) return [];
    const path = `${labelOf(write)}.event.${ref.field}`;

    if (ref.value === undefined || ref.value === null || ref.value === '') {
      return [
        {
          code: 'EVENT_ACTION_TARGET_MISSING',
          severity: 'info',
          confidence: 'certain',
          path,
          message: `${labelOf(write)} → ${ref.field}: no ${ref.entity} selected, the action does nothing until one is picked`,
          entity: { type: 'event', id: write.id },
        },
      ];
    }
    if (typeof ref.value !== 'string' || hasBraces(ref.value)) return []; // dynamic references are not checked

    const index = await ctx.index();
    const found =
      ref.entity === 'query'
        ? index.query(ref.value)
        : ref.entity === 'page'
          ? index.page(ref.value)
          : index.component(ref.value);
    if (found) return [];

    return [
      {
        code: 'EVENT_ACTION_TARGET_NOT_FOUND',
        severity: referenceSeverity(ctx.source),
        confidence: 'certain',
        path,
        message: `${labelOf(write)} → ${ref.field}: no ${ref.entity} with id ${ref.value} exists in this app version`,
        entity: { type: 'event', id: write.id },
        fix: `Point the action at a ${ref.entity} of the version being edited.`,
      },
    ];
  },
};

// Modules render inside a host app, which owns the pages.
export const eventNoSwitchPageInModule: Rule<EventWrite> = {
  id: 'event-no-switch-page-in-module',
  description: 'Modules cannot switch pages',
  check(write, ctx) {
    if (write.op === 'delete' || eventUntouched(write)) return [];
    if (ctx.appType !== 'module' || write.data?.event?.actionId !== 'switch-page') return [];
    return [
      {
        code: 'EVENT_SWITCH_PAGE_IN_MODULE',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.event.actionId`,
        message: `${labelOf(write)} → action: a module cannot switch pages, pages belong to the app that uses it`,
        entity: { type: 'event', id: write.id },
      },
    ];
  },
};

// ModuleViewer events come from the module's own contract and custom widgets declare
// nothing, so a static list can't judge them.
const DYNAMIC_EVENT_SOURCES = new Set(['ModuleViewer', 'ModuleContainer', 'CustomComponent']);

// Heuristic: the widget config is the editor's own list, but columns, actions and dynamic
// options fire events the top-level list doesn't mention. Warns, never blocks.
export const eventFiredBySource: Rule<EventWrite> = {
  id: 'event-fired-by-source',
  description: 'The source widget fires the handled event',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || eventUntouched(write)) return [];
    const eventId = write.data?.event?.eventId;
    if (!eventId || write.data?.target !== 'component' || !write.data.sourceId) return [];

    const index = await ctx.index();
    const source = index.component(write.data.sourceId);
    if (!source || DYNAMIC_EVENT_SOURCES.has(source.type)) return [];
    const declared = widgetEvents(source.type);
    if (!declared.length || declared.includes(eventId)) return [];

    return [
      {
        code: 'EVENT_NOT_FIRED_BY_SOURCE',
        severity: 'medium',
        confidence: 'heuristic',
        path: `${labelOf(write)}.event.eventId`,
        message: `${labelOf(write)} → event: ${source.name || source.type} (${source.type}) does not fire "${eventId}", so the handler would never run`,
        entity: { type: 'event', id: write.id },
        fix: `Use one of: ${declared.join(', ')}.`,
      },
    ];
  },
};

// Two handlers on the same slot with the same order run in an order the editor cannot
// show. Parallel saves can always race this, so it only ever warns.
export const eventOrderUnambiguous: Rule<EventWrite> = {
  id: 'event-order-unambiguous',
  description: 'Handlers of one event have distinct positions',
  async check(write, ctx: RuleContext) {
    if (write.op !== 'create' || !write.data?.sourceId || write.data.index === undefined) return [];
    const eventId = write.data.event?.eventId;
    if (!eventId) return [];
    const index = await ctx.index();
    const clash = index
      .eventsForSource(write.data.sourceId)
      .find((sibling) => sibling.id !== write.id && sibling.eventId === eventId && sibling.index === write.data.index);
    if (!clash) return [];
    return [
      {
        code: 'EVENT_ORDER_AMBIGUOUS',
        severity: 'medium',
        confidence: 'heuristic',
        path: `${labelOf(write)}.index`,
        message: `${labelOf(write)} → order: another ${eventId} handler on this source already has position ${write.data.index}`,
        entity: { type: 'event', id: write.id },
      },
    ];
  },
};

export const eventRules: Rule<EventWrite>[] = [
  eventActionKnown,
  eventTargetTypeValid,
  eventSourceExists,
  eventActionTargetExists,
  eventNoSwitchPageInModule,
  eventFiredBySource,
  eventOrderUnambiguous,
];
