const evaluateExpression = (valueWithBrackets, state = {}) => {
  const expression = valueWithBrackets.replace(/^\{\{/, '').replace(/\}\}$/, '').trim();
  return Function('components', 'queries', `return (${expression});`)(state.components || {}, state.queries || {});
};

jest.mock('@/_helpers/utils', () => ({
  getDynamicVariables: (value) => value.match(/\{\{(.*?)\}\}/g) || [],
  resolveReferences: evaluateExpression,
}));

jest.mock('@/AppBuilder/_stores/utils', () => ({
  resolveDynamicValues: evaluateExpression,
}));

jest.mock('@/AppBuilder/_stores/ast', () => ({
  extractAndReplaceReferencesFromString: (valueWithBrackets) => ({ valueWithBrackets }),
}));

jest.mock('@tooljet/plugins/client', () => ({
  allOperations: {},
}));

const { getQueryVariables } = require('../../AppBuilder/_utils/queryPanel.js');

const emptyMappings = { components: {}, queries: {} };

describe('getQueryVariables method', () => {
  test('Returns empty object.', async () => {
    const options = []; // not one.of(string, object) which are the available options

    expect(getQueryVariables(options, undefined, emptyMappings)).toStrictEqual({});
  });

  test('Tests when options type is string', async () => {
    const options = 'options type is string';

    expect(getQueryVariables(options, undefined, emptyMappings)).toStrictEqual({});
  });

  test('Tests when options type is object', async () => {
    const options = { key: 'value' };

    expect(getQueryVariables(options, undefined, emptyMappings)).toStrictEqual({});
  });
  test('Tests when options is a multi-line string', async () => {
    const state = {
      components: {
        dropdown1: {
          value: 2,
        },
      },
    };
    const options = {
      case1: `
      {{1 == 1 ? 
"select * from users;"
: "select user from users"}}
  `,
      case2: `
      {{1 == 1 ? 
"select * from users;" : "select user from users"}}
    `,
      case3: `
      {{components.dropdown1.value  ?? 
1}}
    `,
    };

    expect(getQueryVariables(options.case1, state, emptyMappings)).toEqual({
      '{{1 == 1 ?  "select * from users;" : "select user from users"}}': 'select * from users;',
    });
    expect(getQueryVariables(options.case2, state, emptyMappings)).toEqual({
      '{{1 == 1 ?  "select * from users;" : "select user from users"}}': 'select * from users;',
    });
    expect(getQueryVariables(options.case3, state, emptyMappings)).toEqual({
      '{{components.dropdown1.value  ??  1}}': 2,
    });
  });
});
