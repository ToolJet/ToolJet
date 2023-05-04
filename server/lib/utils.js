/* eslint-disable no-useless-escape */
import moment from 'moment';
import * as _ from 'lodash';
import { clone, isEmpty } from 'lodash';
import JSON5 from 'json5';
import { VM } from 'vm2';

export function findProp(obj, prop, defval) {
  if (typeof defval === 'undefined') defval = null;
  prop = prop.split('.');
  console.log('prop', prop);
  console.log('obj', obj);
  for (var i = 0; i < prop.length; i++) {
    if (prop[i].endsWith(']')) {
      const actual_prop = prop[i].split('[')[0];
      const index = prop[i].split('[')[1].split(']')[0];
      if (obj[actual_prop]) {
        obj = obj[actual_prop][index];
      } else {
        obj = undefined;
      }
    } else if (obj !== undefined) {
      if (typeof obj[prop[i]] === 'undefined') return defval;
      obj = obj[prop[i]];
    }
  }
  return obj;
}

export function stripTrailingSlash(str) {
  return str.replace(/[/]+$/, '');
}

export const pluralize = (count, noun, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;

export function resolve(data, state) {
  if (data.startsWith('{{queries.') || data.startsWith('{{globals.') || data.startsWith('{{components.')) {
    let prop = data.replace('{{', '').replace('}}', '');
    return findProp(state, prop, '');
  }
}

export function resolveCode(code, state, customObjects = {}, withError = false, reservedKeyword = [], isJsCode = true) {
  let result = '';
  let error;

  // dont resolve if code starts with "queries." and ends with "run()"
  if (code.startsWith('queries.') && code.endsWith('run()')) {
    error = `Cannot resolve function call ${code}`;
  } else {
    try {
      const vm = new VM({
        sandbox: {
          _,
          moment,
          ...state,
          ...customObjects,
          ...Object.fromEntries(reservedKeyword.map((keyWord) => [keyWord, null])),
        },
      });
      result = vm.run(code);
    } catch (err) {
      error = err;
      console.log('eval_error', err);
    }
  }

  if (withError) return [result, error];
  return result;
}

export function resolveReferences(object, state, defaultValue, customObjects = {}, withError = false) {
  if (object === '{{{}}}') return '';
  const reservedKeyword = ['app']; //Keywords that slows down the app
  object = clone(object);
  const objectType = typeof object;
  let error;
  switch (objectType) {
    case 'string': {
      if (object.startsWith('{{') && object.endsWith('}}')) {
        const code = object.replace('{{', '').replace('}}', '');

        if (reservedKeyword.includes(code)) {
          error = `${code} is a reserved keyword`;
          return [{}, error];
        }

        return resolveCode(code, state, customObjects, withError, reservedKeyword, true);
      } else if (object.startsWith('%%') && object.endsWith('%%')) {
        const code = object.replaceAll('%%', '');

        if (code.includes('server.') && !new RegExp('^server.[A-Za-z0-9]+$').test(code)) {
          error = `${code} is invalid. Server variables can't be used like this`;
          return [{}, error];
        }

        return resolveCode(code, state, customObjects, withError, reservedKeyword, false);
      }

      const dynamicVariables = getDynamicVariables(object);

      if (dynamicVariables) {
        if (dynamicVariables.length === 1 && dynamicVariables[0] === object) {
          object = resolveReferences(dynamicVariables[0], state, null, customObjects);
        } else {
          for (const dynamicVariable of dynamicVariables) {
            const value = resolveReferences(dynamicVariable, state, null, customObjects);
            if (typeof value !== 'function') {
              object = object.replace(dynamicVariable, value);
            }
          }
        }
      }
      if (withError) return [object, error];
      return object;
    }

    case 'object': {
      if (Array.isArray(object)) {
        console.log(`[Resolver] Resolving as array ${typeof object}`);

        const new_array = [];

        object.forEach((element, index) => {
          const resolved_object = resolveReferences(element, state);
          new_array[index] = resolved_object;
        });

        if (withError) return [new_array, error];
        return new_array;
      } else if (!isEmpty(object)) {
        console.log(`[Resolver] Resolving as object ${typeof object}, state: ${state}`);
        Object.keys(object).forEach((key) => {
          const resolved_object = resolveReferences(object[key], state);
          object[key] = resolved_object;
        });
        if (withError) return [object, error];
        return object;
      }
    }
    // eslint-disable-next-line no-fallthrough
    default: {
      if (withError) return [object, error];
      return object;
    }
  }
}

export function getDynamicVariables(text) {
  const matchedParams = text.match(/\{\{(.*?)\}\}/g) || text.match(/\%\%(.*?)\%\%/g);
  return matchedParams;
}

export function computeComponentName(componentType, currentComponents) {
  const currentComponentsForKind = Object.values(currentComponents).filter(
    (component) => component.component.component === componentType
  );
  let found = false;
  let componentName = '';
  let currentNumber = currentComponentsForKind.length + 1;

  while (!found) {
    componentName = `${componentType.toLowerCase()}${currentNumber}`;
    if (
      Object.values(currentComponents).find((component) => component.component.name === componentName) === undefined
    ) {
      found = true;
    }
    currentNumber = currentNumber + 1;
  }

  return componentName;
}

export function computeActionName(actions) {
  const values = actions ? actions.value : [];

  let currentNumber = values.length;
  let found = false;
  let actionName = '';

  while (!found) {
    actionName = `Action${currentNumber}`;
    if (values.find((action) => action.name === actionName) === undefined) {
      found = true;
    }
    currentNumber += 1;
  }

  return actionName;
}

export function validateQueryName(name) {
  const nameRegex = new RegExp('^[A-Za-z0-9_-]*$');
  return nameRegex.test(name);
}

export const convertToKebabCase = (string) =>
  string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

export const serializeNestedObjectToQueryParams = function (obj, prefix) {
  var str = [],
    p;
  for (p in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, p)) {
      var k = prefix ? prefix + '[' + p + ']' : p,
        v = obj[p];
      str.push(
        // eslint-disable-next-line no-undef
        v !== null && typeof v === 'object' ? serialize(v, k) : encodeURIComponent(k) + '=' + encodeURIComponent(v)
      );
    }
  }
  return str.join('&');
};

export function resolveWidgetFieldValue(prop, state, _default = [], customResolveObjects = {}) {
  const widgetFieldValue = prop;

  try {
    return resolveReferences(widgetFieldValue, state, _default, customResolveObjects);
  } catch (err) {
    console.log(err);
  }

  return widgetFieldValue;
}

export function validateWidget({ validationObject, widgetValue, currentState, customResolveObjects }) {
  let isValid = true;
  let validationError = null;

  const regex = validationObject?.regex?.value;
  const minLength = validationObject?.minLength?.value;
  const maxLength = validationObject?.maxLength?.value;
  const minValue = validationObject?.minValue?.value;
  const maxValue = validationObject?.maxValue?.value;
  const customRule = validationObject?.customRule?.value;

  const validationRegex = resolveWidgetFieldValue(regex, currentState, '', customResolveObjects);
  const re = new RegExp(validationRegex, 'g');

  if (!re.test(widgetValue)) {
    return {
      isValid: false,
      validationError: 'The input should match pattern',
    };
  }

  const resolvedMinLength = resolveWidgetFieldValue(minLength, currentState, 0, customResolveObjects);
  if ((widgetValue || '').length < parseInt(resolvedMinLength)) {
    return {
      isValid: false,
      validationError: `Minimum ${resolvedMinLength} characters is needed`,
    };
  }

  const resolvedMaxLength = resolveWidgetFieldValue(maxLength, currentState, undefined, customResolveObjects);
  if (resolvedMaxLength !== undefined) {
    if ((widgetValue || '').length > parseInt(resolvedMaxLength)) {
      return {
        isValid: false,
        validationError: `Maximum ${resolvedMaxLength} characters is allowed`,
      };
    }
  }

  const resolvedMinValue = resolveWidgetFieldValue(minValue, currentState, undefined, customResolveObjects);
  if (resolvedMinValue !== undefined) {
    if (widgetValue < parseInt(resolvedMinValue)) {
      return {
        isValid: false,
        validationError: `Minimum value is ${resolvedMinValue}`,
      };
    }
  }

  const resolvedMaxValue = resolveWidgetFieldValue(maxValue, currentState, undefined, customResolveObjects);
  if (resolvedMaxValue !== undefined) {
    if (widgetValue > parseInt(resolvedMaxValue)) {
      return {
        isValid: false,
        validationError: `Maximum value is ${resolvedMaxValue}`,
      };
    }
  }

  const resolvedCustomRule = resolveWidgetFieldValue(customRule, currentState, false, customResolveObjects);
  if (typeof resolvedCustomRule === 'string') {
    return { isValid: false, validationError: resolvedCustomRule };
  }

  return {
    isValid,
    validationError,
  };
}

export function validateEmail(email) {
  const emailRegex =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return emailRegex.test(email);
}

// eslint-disable-next-line no-unused-vars
export async function executeMultilineJS(
  _ref,
  code,
  editorState,
  queryId,
  isPreview,
  // eslint-disable-next-line no-unused-vars
  confirmed = undefined,
  mode = ''
) {
  //:: confirmed arg is unused
  const { currentState } = _ref.state;
  let result = {},
    error = null;

  try {
    const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();
    var evalFn = new AsyncFunction(
      'moment',
      '_',
      'components',
      'queries',
      'globals',
      'page',
      'variables',
      'client',
      'server',
      code
    );
    result = {
      status: 'ok',
      data: await evalFn(
        moment,
        _,
        currentState.components,
        currentState.queries,
        currentState.globals,
        currentState.page,
        currentState.variables,
        currentState?.client,
        currentState?.server
      ),
    };
  } catch (err) {
    console.log('JS execution failed: ', err);
    error = err.stack.split('\n')[0];
    result = { status: 'failed', data: { message: error, description: error } };
  }

  return result;
}

export function toQuery(params, delimiter = '&') {
  const keys = Object.keys(params);

  return keys.reduce((str, key, index) => {
    let query = `${str}${key}=${params[key]}`;

    if (index < keys.length - 1) {
      query += delimiter;
    }

    return query;
  }, '');
}

export const isJson = (str) => {
  try {
    JSON5.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export function buildURLWithQuery(url, query = {}) {
  return `${url}?${toQuery(query)}`;
}

export const handleCircularStructureToJSON = () => {
  const seen = new WeakSet();

  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return 'Object';
      }
      seen.add(value);
    }
    return value;
  };
};

export function hasCircularDependency(obj) {
  try {
    JSON.stringify(obj);
  } catch (e) {
    return String(e).includes('Converting circular structure to JSON');
  }
  return false;
}

export const hightlightMentionedUserInComment = (comment) => {
  var regex = /(\()([^)]+)(\))/g;
  return comment.replace(regex, '<span class=mentioned-user>$2</span>');
};

export function safelyParseJSON(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.log('JSON parse error');
  }
  return;
}

export const getuserName = (formData) => {
  let nameArray = formData?.name?.trim().split(' ');
  if (nameArray?.length > 0)
    return `${nameArray?.[0][0]}${nameArray?.[1] != undefined && nameArray?.[1] != '' ? nameArray?.[1][0] : ''} `;
  return '';
};

export function getQueryVariables(options, state) {
  const queryVariables = {};
  const optionsType = typeof options;
  switch (optionsType) {
    case 'string': {
      options = options.replace(/\n/g, ' ');
      const dynamicVariables = getDynamicVariables(options) || [];
      dynamicVariables.forEach((variable) => {
        queryVariables[variable] = resolveReferences(variable, state);
      });
      break;
    }

    case 'object': {
      if (Array.isArray(options)) {
        options.forEach((element) => {
          _.merge(queryVariables, getQueryVariables(element, state));
        });
      } else {
        Object.keys(options || {}).forEach((key) => {
          _.merge(queryVariables, getQueryVariables(options[key], state));
        });
      }
      break;
    }

    default:
      break;
  }
  return queryVariables;
}
