/** @group platform */
import { BadRequestException } from '@nestjs/common';
import { assertImportedVariableDefinitions } from 'src/helpers/import-variable-validation.helper';

const variable = (value = '5', fxActive = false) => ({ value, fxActive });
const exported = (appMap: unknown = {}, pageMap: unknown = {}, type = 'front-end') => ({
  app: [
    {
      definition: {
        appV2: {
          name: 'Orders',
          type,
          schemaDetails: { multiPages: true },
          appVersions: [{ id: 'v1', name: 'Draft', globalSettings: { variables: appMap } }],
          pages: [{ id: 'p1', name: 'Home', appVersionId: 'v1', variables: pageMap }],
        },
      },
    },
  ],
});

describe('import variable validation', () => {
  it.each([{}, null, undefined])('accepts empty or absent maps (%j)', (map) => {
    expect(() => assertImportedVariableDefinitions(exported(map, map))).not.toThrow();
  });
  describe.each(['app', 'page'])('%s map', (scope) => {
    it.each([[], [1], false, true, 0, 42, '', 'bad'])('rejects malformed map %j', (map) => {
      const payload = scope === 'app' ? exported(map) : exported({}, map);
      expect(() => assertImportedVariableDefinitions(payload)).toThrow(BadRequestException);
      expect(() => assertImportedVariableDefinitions(payload)).toThrow(/Orders.*Draft.*variables/);
      if (scope === 'page') expect(() => assertImportedVariableDefinitions(payload)).toThrow('Home');
    });
    it.each(['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty'])(
      'rejects reserved name %s',
      (name) => {
        const map = JSON.parse(`{"${name}":{"value":"5","fxActive":false}}`);
        expect(() => assertImportedVariableDefinitions(scope === 'app' ? exported(map) : exported({}, map))).toThrow(
          name
        );
      }
    );
    it.each([null, [], { value: 5, fxActive: false }, { value: '5', fxActive: 'false' }])(
      'reports the invalid entry (%j)',
      (entry) => {
        expect(() =>
          assertImportedVariableDefinitions(
            scope === 'app' ? exported({ broken: entry }) : exported({}, { broken: entry })
          )
        ).toThrow('broken');
      }
    );
  });
  it('rejects page declarations in modules, including nested modules', () => {
    const nested = exported();
    nested.app[0].definition.appV2['modules'] = [exported({}, { local: variable() }, 'module').app[0].definition];
    expect(() => assertImportedVariableDefinitions(nested)).toThrow(/Home.*local.*module/i);
    expect(() => assertImportedVariableDefinitions(exported({}, { local: variable() }, 'module'))).toThrow(/module/i);
    expect(() => assertImportedVariableDefinitions(exported({ shared: variable() }, {}, 'module'))).not.toThrow();
  });
  it('validates every version, including versions not selected for import', () => {
    const payload = exported();
    payload.app[0].definition.appV2.appVersions.push({
      id: 'v2',
      name: 'Saved',
      globalSettings: { variables: { broken: null } },
    });
    expect(() => assertImportedVariableDefinitions(payload)).toThrow(/Saved.*broken/);
  });
  it('validates older released version/page schemas without requiring declared variables', () => {
    const payload = {
      name: 'Old app',
      appVersions: [
        {
          id: 'old',
          name: 'Legacy',
          definition: {
            globalSettings: {},
            pages: { p1: { name: 'Old page', variables: { broken: null } as unknown } },
          },
        },
      ],
    };
    expect(() => assertImportedVariableDefinitions(payload)).toThrow(/Legacy.*Old page.*broken/);
    payload.appVersions[0].definition.pages.p1.variables = {};
    const before = structuredClone(payload);
    expect(() => assertImportedVariableDefinitions(payload)).not.toThrow();
    expect(payload).toEqual(before);
  });
  it.each([
    ['self', '{{variables .self}}'],
    ['self', '{{variables ["self"]}}'],
    ['self', '{{variables?.self}}'],
    ['self', '{{variables[`self`]}}'],
    ['self', "{{variables['se' + 'lf']}}"],
    ['self', '{{(variables.self)}}'],
    ['self', '{{({nested: variables.self})}}'],
    ['self', '{{variables /* comment */ .self}}'],
    ['self', '{{`value ${variables.self}`}}'],
    ['self', 'variables.self', true],
  ])('rejects static self cycles (%s, %s)', (name, value, fxActive = false) => {
    expect(() => assertImportedVariableDefinitions(exported({ [name]: variable(value, fxActive) }))).toThrow(
      /circular.*self/i
    );
  });
  it('rejects multi-node cycles and app/page cycles with contextual paths', () => {
    expect(() =>
      assertImportedVariableDefinitions(exported({ a: variable('{{variables.b}}'), b: variable('{{variables.a}}') }))
    ).toThrow(/circular.*a.*b.*a/i);
    expect(() =>
      assertImportedVariableDefinitions(
        exported({ a: variable('{{page.variables.b}}') }, { b: variable('{{variables.a}}') })
      )
    ).toThrow(/Home.*circular/i);
  });
  it('keeps pages and versions isolated when detecting cycles', () => {
    const payload = exported({}, { a: variable('{{page.variables.b}}') });
    payload.app[0].definition.appV2.pages.push({
      id: 'p2',
      name: 'Other',
      appVersionId: 'v1',
      variables: { b: variable('{{page.variables.a}}') },
    });
    expect(() => assertImportedVariableDefinitions(payload)).not.toThrow();
  });
  it('does not treat static text, dynamic property names or shadowed identifiers as proven cycles', () => {
    for (const value of [
      'variables.self',
      '{{variables[key]}}',
      '{{((variables) => variables.self)({self: 1})}}',
      '{{"variables.self"}}',
    ]) {
      expect(() => assertImportedVariableDefinitions(exported({ self: variable(value) }))).not.toThrow();
    }
  });
  it('never executes imported expressions, including calls and getters', () => {
    const value = '{{(() => { throw new Error("must never run"); })()}}';
    expect(() => assertImportedVariableDefinitions(exported({ safe: variable(value) }))).not.toThrow();
  });
});

test.each(['app', 'page'])('rejects ID-keyed %s imports instead of normalizing them', (scope) => {
  const map = { old: { id: 'old', name: 'source', ...variable() } };
  expect(() => assertImportedVariableDefinitions(scope === 'app' ? exported(map) : exported({}, map))).toThrow(
    /Orders.*Draft.*ID-keyed variable definitions are not supported/
  );
});

test('class-local namespace names do not create false circular dependencies', () => {
  expect(() =>
    assertImportedVariableDefinitions(
      exported({ self: variable('{{(class variables { static x = variables.self })}}') })
    )
  ).not.toThrow();
});
