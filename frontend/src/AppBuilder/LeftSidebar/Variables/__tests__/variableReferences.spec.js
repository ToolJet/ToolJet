import { toPlainDefs } from '@/AppBuilder/LeftSidebar/CodeSearch/buildSearchRecords';
import { findVariableReferences } from '../variableReferences';

const text = (value) => ({ value });
const component = (id, name, properties) => ({
  id,
  component: { name, component: 'Text', definition: { properties } },
});

const input = ({ pages, queries = [], events = [], globalSettings = {} }) => ({
  pages,
  queries,
  events,
  globalSettings,
  pageSettings: {},
  queryIdNameMapping: Object.fromEntries(queries.map((q) => [q.id, q.name])),
  defs: toPlainDefs({ widgetDefs: {}, actionDefs: [], pageSettingsDef: {} }),
});

const summary = (refs) => refs.map((r) => `${r.confidence}:${r.entityName}`).sort();

describe('findVariableReferences', () => {
  const app = input({
    pages: [
      {
        id: 'p1',
        name: 'Home',
        components: {
          c1: component('c1', 'dotAccess', { text: text('{{variables.threshold}}') }),
          c2: component('c2', 'bracketAccess', { text: text('{{variables["threshold"] + 1}}') }),
          c3: component('c3', 'optionalAccess', { text: text('{{variables?.threshold}}') }),
          c4: component('c4', 'pageScope', { text: text('{{page.variables.threshold}}') }),
          c5: component('c5', 'plainText', { text: text('the threshold is high') }),
        },
      },
      {
        id: 'p2',
        name: 'Settings',
        components: {
          c6: component('c6', 'otherPage', { text: text('{{variables.threshold}}') }),
          c7: component('c7', 'destructured', { text: text('{{(({ threshold }) => threshold)(variables)}}') }),
        },
      },
    ],
    queries: [
      { id: 'q1', name: 'setsIt', kind: 'runjs', options: { code: 'actions.setVariable("threshold", 5);' } },
      { id: 'q2', name: 'dynamicKey', kind: 'runjs', options: { code: 'const k = "threshold"; return variables[k];' } },
      { id: 'q3', name: 'unrelated', kind: 'runjs', options: { code: 'return variables.thresholdMax;' } },
    ],
  });

  test('app scope: confirmed references across pages, possible ones for what parsing cannot prove', () => {
    const refs = findVariableReferences(app, { scope: 'app', name: 'threshold' });
    expect(summary(refs)).toEqual(
      [
        'confirmed:dotAccess',
        'confirmed:bracketAccess',
        'confirmed:optionalAccess',
        'confirmed:otherPage',
        'confirmed:setsIt',
        'possible:pageScope',
        'possible:destructured',
        'possible:dynamicKey',
      ].sort()
    );
  });

  test('plain text and longer names are not references', () => {
    const names = findVariableReferences(app, { scope: 'app', name: 'threshold' }).map((r) => r.entityName);
    expect(names).not.toContain('plainText');
    expect(names).not.toContain('unrelated');
  });

  test('each reference carries its page, field and the record to navigate to', () => {
    const ref = findVariableReferences(app, { scope: 'app', name: 'threshold' }).find(
      (r) => r.entityName === 'otherPage'
    );
    expect(ref).toEqual(
      expect.objectContaining({
        entityType: 'component',
        pageId: 'p2',
        record: expect.any(Object),
        preview: expect.any(String),
      })
    );
  });

  test('page scope: page.variables is confirmed, app access is only possible', () => {
    const refs = findVariableReferences(app, { scope: 'page', name: 'threshold' });
    expect(refs.find((r) => r.entityName === 'pageScope')?.confidence).toBe('confirmed');
    expect(refs.find((r) => r.entityName === 'dotAccess')?.confidence).toBe('possible');
  });

  test("the variable's own definition is not listed, but another variable reading it is", () => {
    const withDefinitions = input({
      pages: [{ id: 'p1', name: 'Home', components: {} }],
      globalSettings: {
        variables: {
          v1: { id: 'v1', name: 'threshold', value: '5', fxActive: false },
          v2: { id: 'v2', name: 'double', value: '{{variables.threshold * 2}}', fxActive: true },
        },
      },
    });
    const refs = findVariableReferences(withDefinitions, { scope: 'app', name: 'threshold' });
    expect(refs).toHaveLength(1);
    expect(refs[0]).toEqual(
      expect.objectContaining({
        confidence: 'confirmed',
        preview: expect.stringContaining('threshold * 2'),
        entityName: 'double',
        fieldLabel: 'App variable · Initial value',
      })
    );
  });

  test('a Set variable event action with a plain key is confirmed; one with a {{ }} key is only possible', () => {
    const withEvents = input({
      pages: [{ id: 'p1', name: 'Home', components: { b1: component('b1', 'button1', {}) } }],
      events: [
        {
          id: 'e1',
          sourceId: 'b1',
          target: 'component',
          event: { eventId: 'onClick', actionId: 'set-custom-variable', key: 'threshold', value: '5' },
        },
        {
          id: 'e2',
          sourceId: 'b1',
          target: 'component',
          event: {
            eventId: 'onClick',
            actionId: 'set-custom-variable',
            key: '{{"thresh" + "old"}} threshold',
            value: '1',
          },
        },
        {
          id: 'e3',
          sourceId: 'b1',
          target: 'component',
          event: { eventId: 'onClick', actionId: 'set-page-variable', key: 'threshold', value: '1' },
        },
      ],
    });
    const refs = findVariableReferences(withEvents, { scope: 'app', name: 'threshold' });
    expect(refs.map((r) => `${r.confidence}:${r.record.eventId}`).sort()).toEqual(
      ['confirmed:e1', 'possible:e2', 'possible:e3'].sort()
    );
  });

  test('an fx variable value saved without {{ }} still counts as a reference', () => {
    const legacy = input({
      pages: [{ id: 'p1', name: 'Home', components: {} }],
      globalSettings: {
        variables: { v2: { id: 'v2', name: 'doubled', value: 'variables.threshold * 2', fx_active: true } },
      },
    });
    expect(findVariableReferences(legacy, { scope: 'app', name: 'threshold' }).map((r) => r.confidence)).toEqual([
      'confirmed',
    ]);
  });
});
