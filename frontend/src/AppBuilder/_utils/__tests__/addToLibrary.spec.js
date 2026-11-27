import { planAddToLibrary } from '../addToLibrary';

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const ctx = (extra = {}) => ({
  componentIdNameMapping: { [U1]: 'table1', [U2]: 'input1' },
  queryIdNameMapping: {},
  takenNames: [],
  ...extra,
});
const plan = (kind, name, options, c = ctx()) => planAddToLibrary({ kind, name, options }, c);

describe('planAddToLibrary - app references become inputs', () => {
  it('replaces a SQL component reference with {{input.id}}', () => {
    const r = plan('postgresql', 'q', {
      mode: 'sql',
      query: `select * from c where id = {{components.${U1}.selectedRow.id}}`,
    });
    expect(r.blocked).toEqual([]);
    expect(r.libraryOptions.query).toBe('select * from c where id = {{input.id}}');
    expect(r.inputs).toEqual({ id: `{{components.${U1}.selectedRow.id}}` });
    expect(r.inputList).toEqual([{ name: 'id', expression: '{{components.table1.selectedRow.id}}' }]);
    expect(r.libraryOptions.inputs).toEqual([{ name: 'id', defaultValue: '' }]);
  });

  it('maps the same template used in two fields to one input', () => {
    const t = `{{components.${U2}.value}}`;
    const r = plan('restapi', 'q', { url: `https://x/${t}`, body: [['k', t]] });
    expect(r.inputs).toEqual({ value: t });
    expect(r.libraryOptions.url).toBe('https://x/{{input.value}}');
    expect(r.libraryOptions.body).toEqual([['k', '{{input.value}}']]);
  });

  it('dedupes input names across different templates', () => {
    const r = plan('postgresql', 'q', {
      mode: 'sql',
      query: `select {{components.${U1}.selectedRow.id}}, {{components.${U2}.id}}`,
    });
    expect(Object.keys(r.inputs)).toEqual(['id', 'id2']);
    expect(r.libraryOptions.query).toBe('select {{input.id}}, {{input.id2}}');
    expect(r.libraryOptions.inputs.map((i) => i.name)).toEqual(['id', 'id2']);
  });

  it('keeps library-resolvable templates untouched', () => {
    const q = '{{constants.base}}/{{globals.currentUser.email}}';
    const r = plan('restapi', 'q', { url: q });
    expect(r.blocked).toEqual([]);
    expect(r.libraryOptions.url).toBe(q);
    expect(r.inputs).toEqual({});
    expect(r.libraryOptions.inputs).toEqual([]);
  });
});

describe('planAddToLibrary - workflow node references become inputs', () => {
  // A workflow has no components, so it plans with empty id->name mappings.
  const workflow = { componentIdNameMapping: {}, queryIdNameMapping: {}, takenNames: [] };

  it('turns trigger params and other nodes into inputs bound to them, and keeps constants', () => {
    const r = plan(
      'restapi',
      'q',
      { url: 'https://x/{{startTrigger.params.id}}/{{someNode.data[0].name}}/{{constants.base}}' },
      workflow
    );

    expect(r.blocked).toEqual([]);
    expect(r.libraryOptions.url).toBe('https://x/{{input.id}}/{{input.name}}/{{constants.base}}');
    expect(r.inputs).toEqual({ id: '{{startTrigger.params.id}}', name: '{{someNode.data[0].name}}' });
  });
});

describe('planAddToLibrary - blocked', () => {
  it('blocks a template reading parameters, alone or with app state', () => {
    expect(plan('restapi', 'q', { url: '{{parameters.p}}' }).blocked.join(' ')).toMatch(/parameters/);
    expect(plan('restapi', 'q', { url: `{{components.${U1}.value + parameters.p}}` }).blocked).toHaveLength(1);
  });

  it('blocks a template calling a query', () => {
    const r = plan('restapi', 'q', { url: '{{queries.q1.getData()}}' });
    expect(r.blocked.length).toBeGreaterThan(0);
  });

  it('blocks %% and unparseable templates', () => {
    expect(plan('restapi', 'q', { url: '%%server.x%%' }).blocked.length).toBeGreaterThan(0);
    expect(plan('restapi', 'q', { url: '{{ a b }}' }).blocked.length).toBeGreaterThan(0);
  });

  it('blocks a query with parameters', () => {
    const r = plan('restapi', 'q', { url: 'x', parameters: [{ name: 'p', defaultValue: '1' }] });
    expect(r.blocked.join(' ')).toMatch(/parameters/);
  });

  it('blocks %% even when the string also has a {{ }} template', () => {
    const r = plan('restapi', 'q', { url: `%%server.x%%/{{components.${U1}.value}}` });
    expect(r.blocked.length).toBeGreaterThan(0);
  });

  it('does not block calls on query data, which are app-state reads', () => {
    const t = '{{queries.q1.data.map((r) => r.id)}}';
    const r = plan('restapi', 'q', { url: t });
    expect(r.blocked).toEqual([]);
    expect(r.inputs).toEqual({ id: t });
    expect(r.libraryOptions.url).toBe('{{input.id}}');
  });

  it('blocks other methods called directly on a query', () => {
    expect(plan('restapi', 'q', { url: '{{queries.q1.run()}}' }).blocked.length).toBeGreaterThan(0);
    expect(plan('restapi', 'q', { url: '{{queries.q1.reset()}}' }).blocked.length).toBeGreaterThan(0);
  });

  it('blocks an invalid query name', () => {
    expect(plan('restapi', 'bad name', { url: 'x' }).blocked.length).toBeGreaterThan(0);
  });
});

describe('planAddToLibrary - options split', () => {
  it('drops app-level keys and an empty parameters list, keeps query_timeout', () => {
    const r = plan('restapi', 'q', {
      url: 'x',
      runOnPageLoad: true,
      transformations: { js: 'return data' },
      query_timeout: 30,
      parameters: [],
    });
    expect(r.libraryOptions).not.toHaveProperty('runOnPageLoad');
    expect(r.libraryOptions).not.toHaveProperty('transformations');
    expect(r.libraryOptions).not.toHaveProperty('parameters');
    expect(r.libraryOptions.query_timeout).toBe(30);
  });

  it('converts app references in every field, including GUI where filters and limit', () => {
    const t = `{{components.${U1}.value}}`;
    const r = plan('postgresql', 'q', {
      mode: 'gui',
      operation: 'list_rows',
      list_rows: { where_filters: { a: { value: t } } },
      limit: t,
    });
    expect(r.blocked).toEqual([]);
    expect(r.libraryOptions.list_rows.where_filters.a.value).toBe('{{input.value}}');
    expect(r.libraryOptions.limit).toBe('{{input.value}}');
    expect(r.inputs).toEqual({ value: t });
  });

  it('converts app references in a ToolJet Database join', () => {
    const t = `{{components.${U1}.value}}`;
    const r = plan('tooljetdb', 'q', {
      operation: 'list_rows',
      list_rows: {},
      join_table: { joins: [{ conditions: { conditionsList: [{ rightField: { value: t } }] } }] },
    });
    expect(r.blocked).toEqual([]);
    expect(r.libraryOptions.join_table.joins[0].conditions.conditionsList[0].rightField.value).toBe('{{input.value}}');
    expect(r.inputs).toEqual({ value: t });
  });

  it('does not swap inputs when an inserted placeholder equals a later original template', () => {
    // `{{input.value}}` in an app query is a module input (app state), so it gets its own input.
    const t = `{{components.${U1}.value}}`;
    const r = plan('restapi', 'q', { url: `${t} {{input.value}}` });
    expect(r.libraryOptions.url).toBe('{{input.value}} {{input.value2}}');
    expect(r.inputs).toEqual({ value: t, value2: '{{input.value}}' });
  });

  it('names the input from the name form, not the id form', () => {
    const r = plan('restapi', 'q', { url: `{{components.${U1}}}` });
    expect(Object.keys(r.inputs)).toEqual(['table1']);
  });
});

describe('planAddToLibrary - RunJS', () => {
  it('allows pure code', () => {
    expect(plan('runjs', 'q', { code: 'const page = 1; return page * 2' }).blocked).toEqual([]);
  });
  it('blocks components', () => {
    const r = plan('runjs', 'q', { code: 'return components.t1.data' });
    expect(r.blocked.join(' ')).toMatch(/components/);
  });
  it('blocks queries', () => {
    const r = plan('runjs', 'q', { code: 'return queries.q1.data' });
    expect(r.blocked.join(' ')).toMatch(/queries/);
  });
  it('allows constants, moment, globals.currentUser; blocks parameters, secrets and other globals', () => {
    expect(
      plan('runjs', 'q', { code: 'return moment().format() + constants.b + globals.currentUser.email' }).blocked
    ).toEqual([]);
    expect(plan('runjs', 'q', { code: 'return parameters.a' }).blocked.join(' ')).toMatch(/parameters/);
    expect(plan('runjs', 'q', { code: 'return secrets.k' }).blocked.join(' ')).toMatch(/secrets/);
    expect(plan('runjs', 'q', { code: 'return globals.theme' }).blocked.join(' ')).toMatch(/globals\.theme/);
  });
  it('keeps globals.server in templates, never in RunJS code', () => {
    const r = plan('restapi', 'q', { url: 'https://x/{{globals.server.currentUser.email}}' });
    expect(r.blocked).toEqual([]);
    expect(r.libraryOptions.url).toBe('https://x/{{globals.server.currentUser.email}}');
    expect(r.inputList).toEqual([]);
    expect(plan('runjs', 'q', { code: 'return globals.server.x' }).blocked.join(' ')).toMatch(/globals\.server/);
  });
  it('blocks a template mixing globals.server with app state', () => {
    const r = plan('restapi', 'q', { url: `{{globals.server.x + components.${U1}.value}}` });
    expect(r.blocked.join(' ')).toMatch(/mixes app values/);
  });
  it('blocks unparseable code', () => {
    expect(plan('runjs', 'q', { code: 'return (' }).blocked.length).toBeGreaterThan(0);
  });
});

describe('planAddToLibrary - name', () => {
  it('dedupes against taken names', () => {
    const r = plan('restapi', 'getCustomer', { url: 'x' }, ctx({ takenNames: ['getCustomer', 'getCustomer2'] }));
    expect(r.name).toBe('getCustomer3');
  });
  it('keeps a free name', () => {
    expect(plan('restapi', 'getCustomer', { url: 'x' }).name).toBe('getCustomer');
  });
});
