import { toEventWrites, toIndexData } from '@modules/app-validation/export-reader';
import {
  eventActionKnown,
  eventActionTargetExists,
  eventFiredBySource,
  eventNoSwitchPageInModule,
  eventOrderUnambiguous,
  eventRules,
  eventSourceExists,
  eventTargetTypeValid,
} from '@modules/app-validation/rules/event.rules';
import { runRules } from '@modules/app-validation/runner';
import { EventWrite, RuleContext } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';
import { templateAppVersions } from '../helpers/templates';

const index = VersionIndex.fromData({
  components: [
    { id: 'c1', name: 'button1', type: 'Button', parent: null, pageId: 'p1' },
    { id: 'c2', name: 'modal1', type: 'Modal', parent: null, pageId: 'p1' },
  ],
  pages: [{ id: 'p1', name: 'Home', handle: 'home' }],
  queries: [{ id: 'q1', name: 'getUsers' }],
  events: [{ id: 'e1', sourceId: 'c1', target: 'component', index: 0, eventId: 'onClick', actionId: 'show-alert' }],
});
const ctx: RuleContext = { appVersionId: 'v1', source: 'pat', index: async () => index };

const write = (overrides: Partial<EventWrite> = {}): EventWrite => ({
  op: 'create',
  id: 'new',
  data: {
    name: 'onClick',
    target: 'component',
    sourceId: 'c1',
    index: 1,
    event: { eventId: 'onClick', actionId: 'run-query', queryId: 'q1' },
  },
  ...overrides,
});

const withEvent = (event: Record<string, any>, rest: Partial<EventWrite['data']> = {}): EventWrite =>
  write({ data: { ...write().data, ...rest, event } });

describe('event rules', () => {
  describe('event-action-known', () => {
    it('rejects an action that is not in the editor action list', () => {
      expect(eventActionKnown.check(withEvent({ eventId: 'onClick', actionId: 'run-queryy' }), ctx)).toEqual([
        expect.objectContaining({ code: 'EVENT_UNKNOWN_ACTION', severity: 'critical', confidence: 'certain' }),
      ]);
    });

    it('rejects an event with no action at all', () => {
      expect(eventActionKnown.check(withEvent({ eventId: 'onClick' }), ctx)).toEqual([
        expect.objectContaining({ code: 'EVENT_ACTION_MISSING' }),
      ]);
    });

    it('accepts every editor action and skips reorders', () => {
      expect(eventActionKnown.check(write(), ctx)).toEqual([]);
      expect(
        eventActionKnown.check(write({ op: 'update', id: 'e1', touched: ['index'], data: write().data }), ctx)
      ).toEqual([]);
    });
  });

  describe('event-target-type-valid', () => {
    it('rejects an unknown source kind', () => {
      expect(eventTargetTypeValid.check(write({ data: { ...write().data, target: 'widget' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'EVENT_UNKNOWN_TARGET', severity: 'high' }),
      ]);
    });

    it('accepts the five stored kinds', () => {
      for (const target of ['component', 'page', 'data_query', 'table_column', 'table_action']) {
        expect(eventTargetTypeValid.check(write({ data: { ...write().data, target } }), ctx)).toEqual([]);
      }
    });
  });

  describe('event-source-exists', () => {
    it('rejects an event attached to a component of another app version', async () => {
      expect(await eventSourceExists.check(write({ data: { ...write().data, sourceId: 'foreign' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'EVENT_SOURCE_NOT_FOUND', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('reports instead of blocking when bulk data reproduces an orphan', async () => {
      const importCtx = { ...ctx, source: 'import' as const };
      expect(
        await eventSourceExists.check(write({ data: { ...write().data, sourceId: 'foreign' } }), importCtx)
      ).toEqual([expect.objectContaining({ code: 'EVENT_SOURCE_NOT_FOUND', severity: 'medium' })]);
    });

    it('resolves each target kind against its own table', async () => {
      expect(
        await eventSourceExists.check(write({ data: { ...write().data, target: 'page', sourceId: 'p1' } }), ctx)
      ).toEqual([]);
      expect(
        await eventSourceExists.check(write({ data: { ...write().data, target: 'data_query', sourceId: 'q1' } }), ctx)
      ).toEqual([]);
      expect(
        await eventSourceExists.check(write({ data: { ...write().data, target: 'table_column', sourceId: 'c1' } }), ctx)
      ).toEqual([]);
    });
  });

  describe('event-action-target-exists', () => {
    it('rejects a run-query pointing at a query that does not exist in this version', async () => {
      expect(
        await eventActionTargetExists.check(
          withEvent({ eventId: 'onClick', actionId: 'run-query', queryId: 'nope' }),
          ctx
        )
      ).toEqual([expect.objectContaining({ code: 'EVENT_ACTION_TARGET_NOT_FOUND', severity: 'high' })]);
    });

    it('resolves modals and pages through their own fields', async () => {
      expect(
        await eventActionTargetExists.check(withEvent({ eventId: 'onClick', actionId: 'show-modal', modal: 'c2' }), ctx)
      ).toEqual([]);
      expect(
        await eventActionTargetExists.check(
          withEvent({ eventId: 'onClick', actionId: 'switch-page', pageId: 'p1' }),
          ctx
        )
      ).toEqual([]);
    });

    it('reports an unconfigured action without blocking', async () => {
      expect(
        await eventActionTargetExists.check(withEvent({ eventId: 'onClick', actionId: 'run-query' }), ctx)
      ).toEqual([expect.objectContaining({ code: 'EVENT_ACTION_TARGET_MISSING', severity: 'info' })]);
    });

    it('never judges dynamic references', async () => {
      expect(
        await eventActionTargetExists.check(
          withEvent({ eventId: 'onClick', actionId: 'run-query', queryId: '{{variables.q}}' }),
          ctx
        )
      ).toEqual([]);
    });
  });

  describe('event-no-switch-page-in-module', () => {
    it('rejects switch-page inside a module', () => {
      const moduleCtx = { ...ctx, appType: 'module' };
      expect(
        eventNoSwitchPageInModule.check(
          withEvent({ eventId: 'onClick', actionId: 'switch-page', pageId: 'p1' }),
          moduleCtx
        )
      ).toEqual([expect.objectContaining({ code: 'EVENT_SWITCH_PAGE_IN_MODULE', severity: 'high' })]);
    });

    it('allows it in apps', () => {
      expect(
        eventNoSwitchPageInModule.check(withEvent({ eventId: 'onClick', actionId: 'switch-page', pageId: 'p1' }), ctx)
      ).toEqual([]);
    });
  });

  describe('event-fired-by-source', () => {
    it('warns when the widget does not fire the handled event', async () => {
      expect(
        await eventFiredBySource.check(withEvent({ eventId: 'onFileLoaded', actionId: 'show-alert' }), ctx)
      ).toEqual([
        expect.objectContaining({ code: 'EVENT_NOT_FIRED_BY_SOURCE', severity: 'medium', confidence: 'heuristic' }),
      ]);
    });

    it('accepts events the widget declares', async () => {
      expect(await eventFiredBySource.check(withEvent({ eventId: 'onClick', actionId: 'show-alert' }), ctx)).toEqual(
        []
      );
    });
  });

  describe('event-order-unambiguous', () => {
    it('warns when a new handler collides with an existing position', async () => {
      const clash = write({
        data: { ...write().data, index: 0, event: { eventId: 'onClick', actionId: 'show-alert' } },
      });
      expect(await eventOrderUnambiguous.check(clash, ctx)).toEqual([
        expect.objectContaining({ code: 'EVENT_ORDER_AMBIGUOUS', confidence: 'heuristic' }),
      ]);
    });

    it('accepts the next free position', async () => {
      expect(await eventOrderUnambiguous.check(write(), ctx)).toEqual([]);
    });
  });

  // Calibration: templates must import without blocking problems. ToolJet's own templates
  // contain a few orphaned events (their source was deleted before export), so warnings are
  // expected there, but nothing may rise to a blocking error.
  it('finds no blocking problem in any ToolJet template', async () => {
    const errors = [];
    for (const version of templateAppVersions()) {
      const versionCtx: RuleContext = {
        appVersionId: version.appVersionId,
        appType: version.appType,
        source: 'import',
        index: async () => VersionIndex.fromData(toIndexData(version)),
      };
      const result = await runRules(eventRules, toEventWrites(version), versionCtx);
      errors.push(...result.errors);
    }
    expect(errors).toEqual([]);
  });
});
