export const SOURCE_CONFIGS = {
  restapi: { kind: 'restapi', id: 'null', name: 'REST API' },
  runjs: { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
  tooljetdb: { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
  runpy: { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
};

export const STATIC_DATA_SOURCES = [
  { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
  { kind: 'restapi', id: 'null', name: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
  { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
];

export const getDefaultTheme = (options) => ({
  scheme: 'bright',
  author: 'chris kempson (http://chriskempson.com)',
  base00: options.darkMode ? '#272822' : '#000000',
  base01: '#303030',
  base02: '#505050',
  base03: '#b0b0b0',
  base04: '#d0d0d0',
  base05: '#e0e0e0',
  base06: '#f5f5f5',
  base07: '#ffffff',
  base08: '#fb0120',
  base09: '#fc6d24',
  base0A: '#fda331',
  base0B: '#a1c659',
  base0C: '#76c7b7',
  base0D: '#6fb3d2',
  base0E: '#d381c3',
  base0F: '#be643c',
});

export const removeRestKey = (options) => {
  delete options.arrayValuesChanged;
  return options;
};

export const computeQueryName = (dataQueries, kind) => {
  const currentQueriesForKind = dataQueries.filter((query) => query.kind === kind);
  let found = false;
  let newName = '';
  let currentNumber = currentQueriesForKind.length + 1;

  while (!found) {
    newName = `${kind}${currentNumber}`;
    if (dataQueries.find((query) => query.name === newName) === undefined) {
      found = true;
    }
    currentNumber += 1;
  }

  return newName;
};

export const SCHEMA_UNAVAILABLE_OPTIONS = {
  restapi: {
    method: 'get',
    url: '',
    url_params: [['', '']],
    headers: [['', '']],
    body: [['', '']],
    json_body: null,
    body_toggle: false,
  },
  stripe: {},
  tooljetdb: {
    operation: '',
  },
  runjs: {
    code: '',
  },
  runpy: {},
};
