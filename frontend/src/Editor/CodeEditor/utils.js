import { useResolveStore } from '@/_stores/resolverStore';
import moment from 'moment';
import _, { isEmpty } from 'lodash';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { any } from 'superstruct';
import { generateSchemaFromValidationDefinition, validate } from '../component-properties-validation';
import { hasCircularDependency } from '@/_helpers/utils';

const acorn = require('acorn');

const acorn_code = `
const array = [1, 2, 3];
const string = "hello";
const object = {};
const boolean = true;
const number = 1;
`;

const ast = acorn.parse(acorn_code, { ecmaVersion: 2020 });

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

const resolveWorkspaceVariables = (query, state) => {
  let resolvedStr = query;
  let error = null;
  let valid = false;
  // Resolve %%object%%
  const serverRegex = /(%%.+?%%)/g;
  const serverMatch = resolvedStr.match(serverRegex)?.[0];

  if (serverMatch) {
    const code = serverMatch.replace(/%%/g, '');

    if (code.includes('server.')) {
      resolvedStr = resolvedStr.replace(serverMatch, 'HiddenEnvironmentVariable');
      error = 'Server variables cannot be resolved in the client.';
    } else {
      const [resolvedCode, err] = resolveCode(code, state);

      if (!resolvedCode) {
        error = err ? err : `Cannot resolve ${query}`;
      } else {
        resolvedStr = resolvedStr.replace(serverMatch, resolvedCode);
        valid = true;
      }
    }
  }

  return [valid, error, resolvedStr];
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
      error = err.toString();
    }
  }

  if (withError) return [result, error];
  return result;
}

function getDynamicVariables(text) {
  /* eslint-disable no-useless-escape */
  const matchedParams = text.match(/\{\{(.*?)\}\}/g) || text.match(/\%\%(.*?)\%\%/g);
  return matchedParams;
}
const resolveMultiDynamicReferences = (code, lookupTable) => {
  let resolvedValue = code;

  const isComponentValue = code.includes('components.') || false;

  const allDynamicVariables = getDynamicVariables(code);

  if (allDynamicVariables) {
    allDynamicVariables.forEach((variable) => {
      const variableToResolve = variable.replace(/{{|}}/g, '').trim();

      const { toResolveReference } = inferJSExpAndReferences(variableToResolve, lookupTable.hints);

      if (!isComponentValue && toResolveReference && lookupTable.hints.has(toResolveReference)) {
        const idToLookUp = lookupTable.hints.get(variableToResolve);
        const res = lookupTable.resolvedRefs.get(idToLookUp);

        resolvedValue = resolvedValue.replace(variable, res);
      } else {
        const currentState = useCurrentStateStore.getState();
        const [resolvedCode] = resolveCode(variableToResolve, currentState, {}, true, [], true);

        resolvedValue = resolvedCode;
      }
    });
  }

  return resolvedValue;
};

export const resolveReferences = (query, validationSchema, customResolvers = {}, fxActive = false) => {
  if (!query || typeof query !== 'string') return [false, null, null];
  let resolvedValue = query;
  let error = null;

  const currentState = useCurrentStateStore.getState();

  //Todo : remove resolveWorkspaceVariables when workspace variables are removed
  if (query?.startsWith('%%') && query?.endsWith('%%')) {
    return resolveWorkspaceVariables(query, currentState);
  }

  if ((!validationSchema || isEmpty(validationSchema)) && (!query?.includes('{{') || !query?.includes('}}'))) {
    return [true, error, resolvedValue];
  }

  if (validationSchema && !query?.includes('{{') && !query?.includes('}}')) {
    const [valid, errors, newValue] = validateComponentProperty(query, validationSchema);
    return [valid, errors, newValue, resolvedValue];
  }

  const hasMultiDynamicVariables = getDynamicVariables(query)?.length > 1;

  const { lookupTable } = useResolveStore.getState();
  if (hasMultiDynamicVariables) {
    resolvedValue = resolveMultiDynamicReferences(query, lookupTable);
  } else {
    let value = query?.replace(/{{|}}/g, '').trim();

    if (fxActive && (value.startsWith('#') || value.includes('table-'))) {
      value = JSON.stringify(value);
    }

    const { toResolveReference, jsExpression, jsExpMatch } = inferJSExpAndReferences(value, lookupTable.hints);
    const isComponentValue = toResolveReference?.startsWith('components.') || false; //!Notes: As we removed the updating of references on currentState changes, exposed variable of components are dynamic and cannot be controlled in any form, so we are resolving only components references with our legacy approach.
    if (!isComponentValue && !jsExpMatch && toResolveReference && lookupTable.hints.has(toResolveReference)) {
      const idToLookUp = lookupTable.hints.get(toResolveReference);
      resolvedValue = lookupTable.resolvedRefs.get(idToLookUp);

      if (jsExpression) {
        let jscode = value.replace(toResolveReference, resolvedValue);
        jscode = value.replace(toResolveReference, `'${resolvedValue}'`);

        resolvedValue = resolveCode(jscode, currentState, customResolvers);
      }
    } else {
      const [resolvedCode, errorRef] = resolveCode(value, currentState, customResolvers, true, [], true);

      resolvedValue = resolvedCode;
      error = errorRef || null;
    }
  }

  if (!validationSchema || isEmpty(validationSchema)) {
    return [true, error, resolvedValue];
  }

  if (error) {
    return [false, error, query, query];
  }

  if (hasCircularDependency(resolvedValue)) {
    return [false, `${resolvedValue} has circular dependency, unable to resolve`, query, query];
  }

  if (validationSchema) {
    const [valid, errors, newValue] = validateComponentProperty(resolvedValue, validationSchema);
    return [valid, errors, newValue, resolvedValue];
  }
};

export const paramValidation = (expectedType, value) => {
  const type = getCurrentNodeType(value)?.toLowerCase();

  return type === expectedType;
};

const inferJSExpAndReferences = (code, hintsMap) => {
  if (!code) return { toResolveReference: null, jsExpression: null };

  //check starts with JS expression like JSON.parse or JSON.stringify !
  const jsExpRegex = /(JSON\..+?\(.+?\))/g;

  const jsExpMatch = code.match(jsExpRegex)?.[0];

  if (jsExpMatch) {
    return { toResolveReference: null, jsExpression: null, jsExpMatch };
  }

  // Split the code into segments using '.' as a delimiter
  const segments = code.split('.');
  let referenceChain = '';
  let jsExpression = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const potentialReference = referenceChain ? referenceChain + '.' + segment : segment;

    // Check if the potential reference exists in hintsMap
    if (hintsMap.has(potentialReference)) {
      // If it does, update the referenceChain
      referenceChain = potentialReference;
    } else {
      // If it doesn't, treat the rest as a JS expression
      jsExpression = segments.slice(i).join('.');
      break;
    }
  }

  return {
    toResolveReference: referenceChain || null,
    jsExpression: jsExpression || null,
  };
};

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
  switch: 'Switch',
  checkbox: 'Checkbox',
  slider: 'Slider',
  input: 'Input',
  icon: 'Icon',
  visibility: 'Visibility',
  numberInput: 'NumberInput',
});

export function computeCoercion(oldValue, newValue) {
  const oldValueType = Array.isArray(oldValue) ? 'array' : typeof oldValue;
  const newValueType = Array.isArray(newValue) ? 'array' : typeof newValue;

  if (oldValueType === newValueType) {
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      return [` → ${JSON.stringify(newValue)}`, newValueType, oldValueType];
    }
  } else {
    return [` → ${JSON.stringify(newValue)}`, newValueType, oldValueType];
  }

  return ['', newValueType, oldValueType];
}

export const validateComponentProperty = (resolvedValue, validation) => {
  const validationDefinition = validation?.schema;

  const defaultValue = validation?.defaultValue;

  const schema = _.isUndefined(validationDefinition)
    ? any()
    : generateSchemaFromValidationDefinition(validationDefinition);

  return validate(resolvedValue, schema, defaultValue, true);
};
