import { queryView } from '../queryView';
import { codeEntries } from '../codeChanges';

const diffWith = (query) => ({ settings: [], pages: [], queries: [query] });
const viewOf = (query) => queryView(query, codeEntries(diffWith(query)));

describe('a query in the right pane', () => {
  it('heads the pane with its name, type and data source', () => {
    const query = {
      key: 'listDeals',
      name: 'listDeals',
      status: 'changed',
      type: 'PostgreSQL',
      dataSource: 'Prod DB',
      changes: [],
      events: [],
    };
    expect(viewOf(query)).toMatchObject({
      name: 'listDeals',
      type: 'PostgreSQL',
      dataSource: 'Prod DB',
      status: 'changed',
    });
  });

  it('shows a changed query’s code diffs and lists its other changes', () => {
    const query = {
      key: 'pipelineStats',
      name: 'pipelineStats',
      status: 'changed',
      type: 'Run JavaScript',
      dataSource: 'Run JavaScript',
      changes: [
        {
          group: 'query',
          path: 'options.code',
          label: 'Code',
          from: 'return 1;',
          to: 'return 2;',
          summary: 'Code edited (1 line added, 1 removed)',
        },
        {
          group: 'query',
          path: 'options.runOnPageLoad',
          label: 'Run on page load',
          from: false,
          to: true,
          summary: 'Run on page load changed from off to on',
        },
      ],
      events: [
        { key: 'e1', status: 'added', eventId: 'onDataQuerySuccess', summary: 'On data query success: show alert' },
      ],
    };
    const view = viewOf(query);
    expect(view.code.map((entry) => entry.field)).toEqual(['code']);
    expect(view.settings).toEqual([
      { label: 'Run on page load', value: 'Run on page load changed from off to on' },
      { label: 'Event', value: 'On data query success: show alert' },
    ]);
    expect(view.wholeQuery).toBe(false);
  });

  it('shows everything a new query holds: its code, then its settings', () => {
    const query = {
      key: 'listDeals',
      name: 'listDeals',
      status: 'added',
      type: 'PostgreSQL',
      dataSource: 'Prod DB',
      changes: [],
      events: [],
      options: { mode: 'sql', query: 'select *\nfrom deals', runOnPageLoad: true, transformation: '' },
      // Described by the server, in the change list's words.
      settings: [
        { key: 'mode', label: 'Mode', value: '"sql"' },
        { key: 'query', label: 'SQL', value: '"select * from deals"' },
        { key: 'runOnPageLoad', label: 'Run on page load', value: 'on' },
      ],
    };
    const view = viewOf(query);
    expect(view.wholeQuery).toBe(true);
    expect(view.code).toHaveLength(1);
    expect(view.code[0]).toMatchObject({ before: '', after: 'select *\nfrom deals', language: 'sql' });
    // The SQL shows as code, so it is not repeated among the settings.
    expect(view.settings).toEqual([
      { label: 'Mode', value: '"sql"' },
      { label: 'Run on page load', value: 'on' },
    ]);
  });

  it('shows what a removed query last held', () => {
    const query = {
      key: 'old',
      name: 'old',
      status: 'removed',
      type: 'Run JavaScript',
      dataSource: 'Run JavaScript',
      changes: [],
      events: [],
      options: { code: 'return 1;' },
    };
    const view = viewOf(query);
    expect(view.code[0]).toMatchObject({ before: 'return 1;', after: '' });
  });
});
