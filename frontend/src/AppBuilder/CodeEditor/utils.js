import moment from 'moment';
import _, { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { any } from 'superstruct';
import { generateSchemaFromValidationDefinition, validate } from '@/AppBuilder/_utils/component-properties-validation';
import { hasCircularDependency, resolveReferences as olderResolverMethod } from '@/_helpers/utils';
import { validateMultilineCode } from '@/_helpers/utility';
import { removeNestedDoubleCurlyBraces } from '../_stores/utils';

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

const resolveWorkspaceVariables = (query) => {
  let resolvedStr = query;
  let error = null;
  let valid = false;

  // Resolve %%object%%
  const serverRegex = /(%%.+?%%)/g;
  const serverMatches = resolvedStr.match(serverRegex);

  if (serverMatches) {
    serverMatches.forEach((serverMatch) => {
      const code = serverMatch.replace(/%%/g, '');

      if (code.includes('server.') && !/^server\.[A-Za-z0-9]+$/.test(code)) {
        resolvedStr = resolvedStr.replace(serverMatch, 'HiddenEnvironmentVariable');
      } else {
        const resolvedCode = resolveCode(code);

        resolvedStr = resolvedStr.replace(serverMatch, resolvedCode);
      }
    });

    valid = true;
  }

  return [valid, error, resolvedStr];
};

function resolveCode(code, customObjects = {}, withError = false, reservedKeyword, isJsCode) {
  let result = '';
  let error;

  // dont resolve if code starts with "queries." and ends with "run()"
  if (code.startsWith('queries.') && code.endsWith('run()')) {
    error = `Cannot resolve function call ${code}`;
  } else {
    try {
      const state = useStore.getState().getResolvedState();
      const evalFunction = Function(
        [
          'variables',
          'components',
          'queries',
          'globals',
          'page',
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
const resolveMultiDynamicReferences = (code, lookupTable = {}, queryHasJSCode, customResolvers = {}) => {
  try {
    let resolvedValue = code;

    // const isComponentValue = code.includes('components.') || code.includes('queries.') || false;

    const allDynamicVariables = getDynamicVariables(code) || [];
    let isJSCodeResolver = queryHasJSCode && (allDynamicVariables.length === 1 || allDynamicVariables.length === 0);

    if (!isJSCodeResolver) {
      allDynamicVariables.forEach((variable) => {
        const variableToResolve = removeNestedDoubleCurlyBraces(variable);
        const [resolvedCode] = resolveCode(variableToResolve, customResolvers, true, [], true);

        resolvedValue = resolvedValue.replace(variable, resolvedCode);
      });
    } else {
      const variableToResolve = removeNestedDoubleCurlyBraces(code);
      const [resolvedCode] = resolveCode(variableToResolve, customResolvers, true, [], true);

      resolvedValue = typeof resolvedCode === 'string' ? resolvedValue.replace(code, resolvedCode) : resolvedCode;
    }

    return resolvedValue;
  } catch (error) {
    console.error('Error resolving code', error);
  }
};

const queryHasStringOtherThanVariable = (query) => {
  const startsWithDoubleCurly = query.startsWith('{{');
  const endsWithDoubleCurly = query.endsWith('}}');

  if (startsWithDoubleCurly && endsWithDoubleCurly) {
    const content = query.slice(2, -2).trim();

    if (content.includes(' ')) {
      return true;
    }

    //* Check if the content includes a template literal
    //!Note: Do not delete this regex, it is used to check if the content includes a template literal
    //used for cases like {{queries.runjs1.data[0][`${components.textinput1.value}`]}}
    const templateLiteralRegex = /\$\{[^}]+\}/;
    return templateLiteralRegex.test(content);
  }

  return false;
};

export const resolveReferences = (query, validationSchema, customResolvers = {}, validationFn = undefined) => {
  if (typeof query === 'number') {
    return [true, null, query];
  }
  if (query !== '' && (!query || typeof query !== 'string')) {
    // fallback to old resolver for non-string values
    const resolvedValue = olderResolverMethod(query);
    return [true, null, resolvedValue];
  }
  let resolvedValue = query;
  let error = null;

  //Todo : remove resolveWorkspaceVariables when workspace variables are removed
  if (query?.startsWith('%%') && query?.endsWith('%%')) {
    return resolveWorkspaceVariables(query);
  }

  if (query?.startsWith('{{') && query?.endsWith('}}')) {
    const { status, data } = validateMultilineCode(query);

    if (status === 'failed') {
      const errMessage = `${data.message} -  ${data.description}`;

      return [false, errMessage, query, query];
    }
  }

  if (
    (!validationSchema || isEmpty(validationSchema)) &&
    (!query?.includes('{{') || !query?.includes('}}')) &&
    !validationFn
  ) {
    return [true, error, resolvedValue];
  }

  if (validationSchema && !validationFn && !query?.includes('{{') && !query?.includes('}}')) {
    const [valid, errors, newValue] = validateComponentProperty(query, validationSchema);
    return [valid, errors, newValue, resolvedValue];
  }

  const queryHasJSCode = queryHasStringOtherThanVariable(query);
  let useJSResolvers = queryHasJSCode || getDynamicVariables(query)?.length > 1;

  if (
    !queryHasJSCode &&
    getDynamicVariables(query)?.length === 1 &&
    (!query.startsWith('{{') || !query.endsWith('}}')) &&
    query.includes('{{')
  ) {
    useJSResolvers = true;
  }

  // const lookupTable = { hints: new Map(), resolvedRefs: new Map() };
  // const { lookupTable } = useResolveStore.getState();
  if (validationFn && !(query.includes('{{') && query.includes('}}'))) {
    const [valid, errors] = validationFn(query);
    return [valid, errors, query, query];
  }

  if (useJSResolvers) {
    resolvedValue = resolveMultiDynamicReferences(query, {}, queryHasJSCode, customResolvers);
  } else {
    let value = removeNestedDoubleCurlyBraces(query);

    if (value.startsWith('#') || value.includes('table-')) {
      value = JSON.stringify(value);
    }
    const [resolvedCode, errorRef] = resolveCode(value, customResolvers, true, [], true);

    resolvedValue = resolvedCode;
    error = errorRef || null;
  }

  if (validationFn) {
    const val = resolvedValue ? resolvedValue : query;
    const [valid, errors] = validationFn(val);
    return [valid, errors, val, val];
  }

  if (!validationSchema || isEmpty(validationSchema)) {
    return [true, error, resolvedValue, resolvedValue];
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

export const FxParamTypeMapping = Object.freeze({
  text: 'Text',
  string: 'Text',
  color: 'Color',
  json: 'Json',
  code: 'Code',
  toggle: 'Toggle',
  select: 'Select',
  alignButtons: 'AlignButtons',
  datepicker: 'Datepicker',
  timepicker: 'TimePicker',
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
  tableRowHeightInput: 'TableRowHeightInput',
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

export function hasDeepChildren(obj, currentDepth = 1, maxDepth = 3) {
  if (currentDepth > maxDepth) {
    return true;
  }

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasDeepChildren(obj[key], currentDepth + 1, maxDepth)) {
        return true;
      }
    }
  }

  return false;
}
