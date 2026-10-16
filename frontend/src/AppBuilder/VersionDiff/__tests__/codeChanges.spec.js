import { autoOpenCode, codeEntries, codeForSelection, codeOf, languageFor } from '../codeChanges';

const change = (path, from, to, group = 'query') => ({
  group,
  path,
  label: path.split('.').pop(),
  from,
  to,
  summary: '',
});

describe('which changes have code to show', () => {
  it('shows Run JavaScript code as JavaScript', () => {
    const code = codeOf(change('options.code', 'return 1;', 'return 2;'), { dataSource: 'Run JavaScript' });
    expect(code).toEqual({ before: 'return 1;', after: 'return 2;', language: 'javascript', field: 'code' });
  });

  it('shows Run Python code as Python', () => {
    expect(codeOf(change('options.code', 'a = 1', 'a = 2'), { dataSource: 'Run Python' }).language).toBe('python');
  });

  it('shows SQL, including SQL nested inside a ToolJet Database query', () => {
    expect(codeOf(change('options.query', 'select 1', 'select 2'), { dataSource: 'PostgreSQL' }).language).toBe('sql');
    const nested = codeOf(
      change('options.sql_execution', { sqlQuery: 'SELECT a\nFROM t' }, { sqlQuery: 'SELECT a, b\nFROM t' }),
      { dataSource: 'ToolJet Database' }
    );
    expect(nested).toEqual({
      before: 'SELECT a\nFROM t',
      after: 'SELECT a, b\nFROM t',
      language: 'sql',
      field: 'sql_execution.sqlQuery',
    });
  });

  it('pretty-prints REST headers and bodies as JSON', () => {
    const code = codeOf(
      change(
        'options.headers',
        [['Accept', 'application/json']],
        [
          ['Accept', 'text/csv'],
          ['X-Key', '{{k}}'],
        ]
      ),
      { dataSource: 'REST API' }
    );
    expect(code.language).toBe('json');
    expect(code.after).toContain('\n');
    expect(code.after).toContain('"X-Key"');
  });

  it('shows a REST URL and a transformation', () => {
    expect(codeOf(change('options.url', 'https://a/x', 'https://a/x?page={{p}}')).language).toBe('javascript');
    expect(codeOf(change('options.transformation', 'return data;', 'return data.rows;')).language).toBe('javascript');
    expect(
      codeOf(change('options.transformation', 'return data', 'return data["rows"]'), {
        transformationLanguage: 'python',
      }).language
    ).toBe('python');
  });

  it('shows component properties that hold a {{ }} binding, unwrapping { value }', () => {
    const code = codeOf(
      change(
        'properties.data',
        { value: '{{queries.a.data}}' },
        { value: '{{queries.a.data.filter(r => r.ok)}}' },
        'property'
      )
    );
    expect(code).toMatchObject({
      before: '{{queries.a.data}}',
      after: '{{queries.a.data.filter(r => r.ok)}}',
      language: 'javascript',
    });
  });

  it('shows custom CSS as CSS', () => {
    expect(codeOf(change('styles.customCss', { value: '.a{}' }, { value: '.a{color:red}' }, 'style')).language).toBe(
      'css'
    );
  });

  it('shows what an event handler does as JSON', () => {
    const code = codeOf({
      key: 'e1',
      status: 'changed',
      eventId: 'onClick',
      summary: '',
      from: { actionId: 'run-query', queryName: 'a' },
      to: { actionId: 'run-query', queryName: 'b' },
    });
    expect(code.language).toBe('json');
    expect(code.before).toContain('"queryName": "a"');
  });

  it('has nothing to show for short plain values, numbers, switches and layout moves', () => {
    expect(codeOf(change('properties.text', { value: 'Save' }, { value: 'Save deal' }, 'property'))).toBeNull();
    expect(codeOf(change('options.runOnPageLoad', true, false))).toBeNull();
    expect(codeOf(change('styles.fontSize', { value: 14 }, { value: 16 }, 'style'))).toBeNull();
    expect(
      codeOf(
        change(
          'layouts.desktop',
          { top: 1, left: 2, width: 3, height: 4 },
          { top: 2, left: 2, width: 3, height: 4 },
          'layout'
        )
      )
    ).toBeNull();
  });

  it('shows code that was added or removed against an empty side', () => {
    expect(codeOf(change('options.transformation', undefined, 'return data;'))).toMatchObject({
      before: '',
      after: 'return data;',
    });
    expect(codeOf(change('options.transformation', 'return data;', undefined))).toMatchObject({
      before: 'return data;',
      after: '',
    });
  });
});

describe('language for a field', () => {
  it('falls back to plain text for long prose', () => {
    expect(languageFor('properties.text', 'A long paragraph\nwith two lines', {})).toBe('text');
  });
});

describe('every code change in a diff', () => {
  const diff = {
    settings: [],
    pages: [
      {
        key: 'home',
        name: 'Home',
        changes: [],
        events: [],
        components: [
          {
            key: 'home/table1',
            name: 'table1',
            status: 'changed',
            changes: [
              change('properties.data', { value: '{{a}}' }, { value: '{{b}}' }, 'property'),
              change('styles.fontSize', { value: 14 }, { value: 16 }, 'style'),
            ],
            events: [],
          },
        ],
      },
    ],
    queries: [
      {
        key: 'pipelineStats',
        name: 'pipelineStats',
        status: 'changed',
        dataSource: 'Run JavaScript',
        changes: [change('options.code', 'return 1;', 'return 2;')],
        events: [],
      },
    ],
  };

  it('lists queries first, then components, each with a title and a stable id', () => {
    const entries = codeEntries(diff);
    expect(entries.map((entry) => entry.title)).toEqual(['pipelineStats', 'table1']);
    expect(entries[0]).toMatchObject({
      id: 'query:pipelineStats|options.code',
      owner: 'query:pipelineStats',
      field: 'code',
      language: 'javascript',
    });
    expect(entries[1]).toMatchObject({ id: 'home/table1|properties.data', owner: 'home/table1', field: 'data' });
  });
});

describe('what the right pane opens on its own', () => {
  const query = {
    key: 'pipelineStats',
    name: 'pipelineStats',
    status: 'changed',
    dataSource: 'Run JavaScript',
    changes: [change('options.runOnPageLoad', false, true), change('options.code', 'return 1;', 'return 2;')],
    events: [],
  };

  it('opens the first code change when no page changed', () => {
    const diff = { settings: [], pages: [], queries: [query] };
    expect(autoOpenCode(diff, codeEntries(diff))).toBe('query:pipelineStats|options.code');
  });

  it('leaves the preview in place when a page changed', () => {
    const diff = {
      settings: [],
      pages: [{ key: 'home', name: 'Home', changes: [], events: [], components: [] }],
      queries: [query],
    };
    expect(autoOpenCode(diff, codeEntries(diff))).toBeNull();
  });

  it('opens a query’s first code change when its row is picked, and nothing for a component', () => {
    const diff = { settings: [], pages: [], queries: [query] };
    const entries = codeEntries(diff);
    expect(codeForSelection('query:pipelineStats', entries)).toBe('query:pipelineStats|options.code');
    expect(codeForSelection('home/table1', entries)).toBeNull();
    expect(codeForSelection(null, entries)).toBeNull();
  });
});

describe('a query that is new or gone', () => {
  const query = (status) => ({
    key: 'pipelineStats',
    name: 'pipelineStats',
    status,
    dataSource: 'Run JavaScript',
    changes: [],
    events: [],
    options: { code: 'return 1;', runOnPageLoad: true, transformation: '' },
  });

  it('shows a new query’s code against an empty side', () => {
    const [entry, ...rest] = codeEntries({ settings: [], pages: [], queries: [query('added')] });
    expect(entry).toMatchObject({
      id: 'query:pipelineStats|options.code',
      before: '',
      after: 'return 1;',
      language: 'javascript',
    });
    expect(rest).toHaveLength(0);
  });

  it('shows a removed query’s code as all removed', () => {
    const [entry] = codeEntries({ settings: [], pages: [], queries: [query('removed')] });
    expect(entry).toMatchObject({ before: 'return 1;', after: '' });
  });
});
