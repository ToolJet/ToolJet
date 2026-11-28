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
          threshold: { value: '5', fxActive: false },
          double: { value: '{{variables.threshold * 2}}', fxActive: true },
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
        variables: { doubled: { value: 'variables.threshold * 2', fx_active: true } },
      },
    });
    expect(findVariableReferences(legacy, { scope: 'app', name: 'threshold' }).map((r) => r.confidence)).toEqual([
      'confirmed',
    ]);
  });
  test('a page variable reading the value is named and labelled from its own page, even when an app variable shares its name', () => {
    const sameNames = input({
      pages: [
        {
          id: 'p1',
          name: 'Home',
          components: {},
          variables: { double: { value: '{{variables.threshold * 3}}', fxActive: false } },
        },
      ],
      globalSettings: { variables: { double: { value: '{{variables.threshold * 2}}', fxActive: false } } },
    });
    const refs = findVariableReferences(sameNames, { scope: 'app', name: 'threshold' });
    expect(refs.map((r) => [r.entityName, r.fieldLabel, r.preview.includes('* 3') ? 'page' : 'app']).sort()).toEqual(
      [
        ['double', 'App variable · Initial value', 'app'],
        ['double', 'Page variable · Initial value', 'page'],
      ].sort()
    );
  });

  test('a development value saved under a definition id is still named after its variable', () => {
    const legacy = input({
      pages: [{ id: 'p1', name: 'Home', components: {} }],
      globalSettings: {
        variables: { v9: { id: 'v9', name: 'tripled', value: '{{variables.threshold * 3}}', fxActive: false } },
      },
    });
    expect(findVariableReferences(legacy, { scope: 'app', name: 'threshold' }).map((r) => r.entityName)).toEqual([
      'tripled',
    ]);
  });
  // Saved maps are keyed by name, so a variable's name is a map key. Names that collide with keys the
  // search index treats specially (a definition's old `name` field, or bookkeeping keys it skips)
  // must still have their values searched.
  const READ_THRESHOLD = '{{variables.threshold * 2}}';
  describe.each(['name', 'id', 'fxActive', 'layouts', 'parent', 'createdAt', 'updatedAt', 'isDefault'])(
    'a variable named %s',
    (name) => {
      test('reading the variable is listed as an app variable initial value', () => {
        const app = input({
          pages: [{ id: 'p1', name: 'Home', components: {} }],
          globalSettings: { variables: { [name]: { value: READ_THRESHOLD, fxActive: false } } },
        });
        expect(findVariableReferences(app, { scope: 'app', name: 'threshold' })).toEqual([
          expect.objectContaining({
            confidence: 'confirmed',
            entityName: name,
            fieldLabel: 'App variable · Initial value',
          }),
        ]);
      });

      test('reading the variable is listed as a page variable initial value', () => {
        const page = input({
          pages: [
            {
              id: 'p1',
              name: 'Home',
              components: {},
              variables: { [name]: { value: READ_THRESHOLD, fxActive: false } },
            },
          ],
        });
        expect(findVariableReferences(page, { scope: 'app', name: 'threshold' })).toEqual([
          expect.objectContaining({
            confidence: 'confirmed',
            entityName: name,
            fieldLabel: 'Page variable · Initial value',
          }),
        ]);
      });
    }
  );

  test("a development definition's own name field is still not listed as a reference", () => {
    const legacy = input({
      pages: [{ id: 'p1', name: 'Home', components: {} }],
      globalSettings: {
        variables: { v1: { id: 'v1', name: 'threshold', value: '5', fxActive: false } },
      },
    });
    expect(findVariableReferences(legacy, { scope: 'app', name: 'threshold' })).toEqual([]);
  });
  // A variable value is code only when it is an expression: fx on, or containing {{ }}. A value saved
  // with fx on but without braces is code as a whole; with braces, only what is inside them is.
  describe('initial values that are text, not code', () => {
    const appWith = (definition) =>
      input({
        pages: [{ id: 'p1', name: 'Home', components: {} }],
        globalSettings: { variables: { note: definition } },
      });
    const pageWith = (definition) =>
      input({ pages: [{ id: 'p1', name: 'Home', components: {}, variables: { note: definition } }] });

    test.each([
      ['an app variable', appWith],
      ['a page variable', pageWith],
    ])('static text in %s is not a reference', (_label, build) => {
      const app = build({ value: 'variables.threshold', fxActive: false });
      expect(findVariableReferences(app, { scope: 'app', name: 'threshold' })).toEqual([]);
    });

    test('text outside the {{ }} of an fx value is not a reference', () => {
      const app = appWith({ value: 'variables.threshold is {{1 + 1}}', fxActive: true });
      expect(findVariableReferences(app, { scope: 'app', name: 'threshold' })).toEqual([]);
    });

    test('an expression inside {{ }} in a static value is still a reference', () => {
      const app = appWith({ value: 'limit {{variables.threshold}}', fxActive: false });
      expect(summary(findVariableReferences(app, { scope: 'app', name: 'threshold' }))).toEqual(['confirmed:note']);
    });
  });

  // A variable may be named `variables`, which is also the map's own key in the field path.
  describe('a variable named variables with an fx value saved without {{ }}', () => {
    const fx = { value: 'variables.threshold * 2', fxActive: true };

    test('is listed and named as an app variable initial value', () => {
      const app = input({
        pages: [{ id: 'p1', name: 'Home', components: {} }],
        globalSettings: { variables: { variables: fx } },
      });
      expect(findVariableReferences(app, { scope: 'app', name: 'threshold' })).toEqual([
        expect.objectContaining({
          confidence: 'confirmed',
          entityName: 'variables',
          fieldLabel: 'App variable · Initial value',
        }),
      ]);
    });

    test('is listed and named as a page variable initial value', () => {
      const page = input({ pages: [{ id: 'p1', name: 'Home', components: {}, variables: { variables: fx } }] });
      expect(findVariableReferences(page, { scope: 'app', name: 'threshold' })).toEqual([
        expect.objectContaining({
          confidence: 'confirmed',
          entityName: 'variables',
          fieldLabel: 'Page variable · Initial value',
        }),
      ]);
    });
  });
});
