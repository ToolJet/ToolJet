import { useResolveStore } from '@/_stores/resolverStore';
import moment from 'moment';
import _ from 'lodash';
import { useCurrentStateStore } from '@/_stores/currentStateStore';

const acorn = require('acorn');

const code = `
const array = [1, 2, 3];
const string = "hello";
const object = {};
const boolean = true;
const number = 1;
`;

const ast = acorn.parse(code, { ecmaVersion: 2020 });

export const getCurrentNodeType = (node) => Object.prototype.toString.call(node).slice(8, -1);

function traverseAST(node, callback) {
  callback(node);
  for (let key in node) {
    if (node[key] && typeof node[key] === 'object') {
      traverseAST(node[key], callback);
    }
  }
}

function getMethods(type) {
  const arrayMethods = Object.getOwnPropertyNames(Array.prototype).filter(
    (p) => typeof Array.prototype[p] === 'function'
  );
  const stringMethods = Object.getOwnPropertyNames(String.prototype).filter(
    (p) => typeof String.prototype[p] === 'function'
  );
  const objectMethods = Object.getOwnPropertyNames(Object.prototype).filter(
    (p) => typeof Object.prototype[p] === 'function'
  );
  const booleanMethods = Object.getOwnPropertyNames(Boolean.prototype).filter(
    (p) => typeof Boolean.prototype[p] === 'function'
  );
  const numberMethods = Object.getOwnPropertyNames(Number.prototype).filter(
    (p) => typeof Number.prototype[p] === 'function'
  );

  switch (type) {
    case 'Array':
      return arrayMethods;
    case 'String':
      return stringMethods;
    case 'Object':
      return objectMethods;
    case 'Boolean':
      return booleanMethods;
    case 'Number':
      return numberMethods;
    default:
      return [];
  }
}

function inferType(node) {
  if (node.type === 'ArrayExpression') {
    return 'Array';
  } else if (node.type === 'Literal') {
    if (typeof node.value === 'string') {
      return 'String';
    } else if (typeof node.value === 'number') {
      return 'Number';
    } else if (typeof node.value === 'boolean') {
      return 'Boolean';
    }
  } else if (node.type === 'ObjectExpression') {
    return 'Object';
  }
  return null;
}

export const createJavaScriptSuggestions = () => {
  const allMethods = {};

  traverseAST(ast, (node) => {
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
      const type = inferType(node.init);
      if (type) {
        allMethods[node.id.name] = {
          type: type,
          methods: getMethods(type),
        };
      }
    }
  });

  return allMethods;
};

function resolveCode(code, state, customObjects = {}, withError = true, reservedKeyword, isJsCode) {
  let result = '';
  let error;

  // dont resolve if code starts with "queries." and ends with "run()"
  if (code.startsWith('queries.') && code.endsWith('run()')) {
    error = `Cannot resolve function call ${code}`;
  } else {
    try {
      const evalFunction = Function(
        [
          'variables',
          'components',
          'queries',
          'globals',
          'page',
          'client',
          'server',
          'constants',
          'moment',
          '_',
          ...Object.keys(customObjects),
          reservedKeyword,
        ],
        `return ${code}`
      );
      result = evalFunction(
        isJsCode ? state?.variables : undefined,
        isJsCode ? state?.components : undefined,
        isJsCode ? state?.queries : undefined,
        isJsCode ? state?.globals : undefined,
        isJsCode ? state?.page : undefined,
        isJsCode ? undefined : state?.client,
        isJsCode ? undefined : state?.server,
        state?.constants, // Passing constants as an argument allows the evaluated code to access and utilize the constants value correctly.
        moment,
        _,
        ...Object.values(customObjects),
        null
      );
    } catch (err) {
      error = err;
      // console.log('eval_error', err);
    }
  }

  if (withError) return [result, error];
  return result;
}

export const resolveReferences = (query, expectedParamType) => {
  let resolvedValue = query;
  let error = null;

  if (!query.includes('{{') || !query.includes('}}')) {
    return [resolvedValue, error];
  }

  const value = query.replace(/{{|}}/g, '').trim();

  const { lookupTable } = useResolveStore.getState();

  const { toResolveReference, jsExpression } = inferJSExpAndReferences(value, lookupTable.hints);
  const currentState = useCurrentStateStore.getState();

  if (lookupTable.hints.has(toResolveReference)) {
    const idToLookUp = lookupTable.hints.get(toResolveReference);
    resolvedValue = lookupTable.resolvedRefs.get(idToLookUp);

    if (jsExpression) {
      let jscode = value.replace(toResolveReference, resolvedValue);
      jscode = value.replace(toResolveReference, `'${resolvedValue}'`);
      resolvedValue = resolveCode(jscode, currentState);
    }
  } else {
    console.log(value, 'pikuuuu ==> only JS code');

    const [resolvedCode, errorRef] = resolveCode(value, currentState);

    resolvedValue = resolvedCode;
    error = errorRef || null;
  }

  if (paramValidation(expectedParamType, resolvedValue)) {
    return [resolvedValue, error];
  }

  return [null, `Expected ${expectedParamType} but got ${getCurrentNodeType(resolvedValue)}`];
};

export const paramValidation = (expectedType, value) => {
  const type = getCurrentNodeType(value)?.toLowerCase();

  return type === expectedType;
};

const inferJSExpAndReferences = (code, hintsMap) => {
  const references = code.split('.');

  let prevReference;

  let toResolveReference;
  let jsExpression;

  for (let i = 0; i < references.length; i++) {
    const currentRef = references[i];

    const ref = prevReference ? prevReference + '.' + currentRef : currentRef;

    const existsInMap = hintsMap.has(ref);

    if (!existsInMap) {
      break;
    }

    prevReference = ref;
    toResolveReference = ref;
    jsExpression = code.substring(ref.length);
  }

  return {
    toResolveReference,
    jsExpression,
  };
};

function evaluateJsExpression(jsExpression) {
  try {
    const evalFunction = new Function(`return ${jsExpression};`);

    return evalFunction();
  } catch (error) {
    console.log(error);
  }
}

export const FxParamTypeMapping = Object.freeze({
  text: 'Text',
  string: 'Text',
  color: 'Color',
  json: 'Json',
  code: 'Code',
  toggle: 'Toggle',
  select: 'Select',
  alignButtons: 'AlignButtons',
  number: 'Number',
  boxShadow: 'BoxShadow',
  clientServerSwitch: 'ClientServerSwitch',
});
