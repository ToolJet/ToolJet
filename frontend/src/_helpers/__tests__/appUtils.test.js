const { getQueryVariables, runQuery, setTablePageIndex, computeComponentState } = require('../appUtils.js');

jest.mock(
  'config',
  () => {
    return {
      apiUrl: `http://localhost:3000/api`,
      SERVER_IP: process.env.SERVER_IP,
      COMMENT_FEATURE_ENABLE: true,
    };
  },
  { virtual: true }
);

describe('getQueryVariables method', () => {
  test('Returns empty object.', async () => {
    const options = []; // not one.of(string, object) which are the available options

    await expect(getQueryVariables(options)).toStrictEqual({});
  });

  test('Tests when options type is string', async () => {
    const options = 'options type is string';

    await expect(getQueryVariables(options)).toStrictEqual({});
  });

  test('Tests when options type is object', async () => {
    const options = { key: 'value' };

    await expect(getQueryVariables(options)).toStrictEqual({});
  });
});

describe('runQuery method', () => {
  test('Returns undefined when no query has been associated with the action.', async () => {
    const _ref = {
      state: {
        app: {
          data_queries: [],
        },
      },
    };

    await expect(runQuery(_ref)).toBe(undefined);
  });

  test('Returns undefined when requestConfirmation is true.', async () => {
    const _ref = {
      state: {
        app: {
          data_queries: [{ id: 1, options: { requestConfirmation: true } }],
        },
      },
      setState: jest.fn(),
    };

    await expect(runQuery(_ref, 1)).toBe(undefined);
  });

  // test('Tests when kind=runjs.', async () => {
  //   const _ref = {
  //     state: {
  //       app: {
  //         data_queries: [{ id: 1, kind: 'runjs', options: { requestConfirmation: false } }],
  //       },
  //       currentState: {
  //         queries: {},
  //       },
  //     },
  //     setState: jest.fn(() => {}),
  //   };

  //   // Unable to call the callback function in setState ..
  //   await expect(runQuery(_ref, 1)).resolves.toBe({});
  // });
});

describe('setTablePageIndex method', () => {
  test('Returns undefined when no table is associated with this event', async () => {
    const _ref = {
      state: {
        app: {
          data_queries: [],
        },
        currentState: {
          components: {},
        },
      },
      setState: jest.fn(() => {}),
    };

    await expect(setTablePageIndex(_ref)).resolves.toBe(undefined);
  });
});

describe('computeComponentState method', () => {
  test('Returns default', async () => {
    const _ref = {
      state: {
        app: {
          data_queries: [],
        },
        currentState: {
          components: {},
        },
      },
      setState: (_, resolve) => resolve('resolved'),
    };

    await expect(computeComponentState(_ref)).resolves.toBe('resolved');
  });
});
