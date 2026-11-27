/**
 * convertAllKeysToSnakeCase runs on every view load (preview, released app, module instances).
 * Declared app variables are keyed by their user-chosen name, so the conversion must leave
 * `globalSettings.variables` exactly as saved: renaming `querySequence` to `query_sequence` makes
 * `variables.querySequence` undefined at runtime, and `moduleCount` / `module_count` would collide.
 */
import { convertAllKeysToSnakeCase } from '../appDataCaseConversion';

const variables = {
  querySequence: { value: '{{queries.runjs1.data?.sequence ?? 0}}', fxActive: true },
  greeting: { value: 'hi', fxActive: false },
  moduleCount: { value: '4', fxActive: false },
  module_count: { value: '9', fxActive: false },
};

describe('convertAllKeysToSnakeCase and declared app variables', () => {
  it('keeps mixed-case and case-distinct variable names in a preview payload', () => {
    const result = convertAllKeysToSnakeCase({
      editingVersion: { globalSettings: { hideHeader: true, variables } },
    });

    expect(result.editing_version.global_settings.hide_header).toBe(true);
    expect(result.editing_version.global_settings.variables).toEqual(variables);
  });

  it('keeps variable names when the module endpoint already sends snake_case wrappers', () => {
    const result = convertAllKeysToSnakeCase({
      editing_version: { global_settings: { variables } },
      global_settings: { variables },
    });

    expect(result.editing_version.global_settings.variables).toEqual(variables);
    expect(result.global_settings.variables).toEqual(variables);
  });

  it('still converts keys named variables outside global settings', () => {
    expect(convertAllKeysToSnakeCase({ other: { variables: { someKey: 1 } } })).toEqual({
      other: { variables: { some_key: 1 } },
    });
  });
});
