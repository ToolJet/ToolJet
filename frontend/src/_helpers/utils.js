/* eslint-disable no-useless-escape */
import moment from 'moment';
import _ from 'lodash';
import axios from 'axios';
import JSON5 from 'json5';
import { previewQuery, executeAction } from '@/_helpers/appUtils';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services/authentication.service';

import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { getCurrentState } from '@/_stores/currentStateStore';
import { getCookie, eraseCookie } from '@/_helpers/cookie';

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

function resolveCode(code, state, customObjects = {}, withError = false, reservedKeyword, isJsCode) {
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
      console.log('eval_error', err);
    }
  }

  if (withError) return [result, error];
  return result;
}
export function resolveString(str, state, customObjects, reservedKeyword, withError, forPreviewBox) {
  let resolvedStr = str;

  // Resolve {{object}}
  const codeRegex = /(\{\{.+?\}\})/g;
  const codeMatches = resolvedStr.match(codeRegex);

  if (codeMatches) {
    codeMatches.forEach((codeMatch) => {
      const code = codeMatch.replace('{{', '').replace('}}', '');

      if (reservedKeyword.includes(code)) {
        resolvedStr = resolvedStr.replace(codeMatch, '');
      } else {
        const resolvedCode = resolveCode(code, state, customObjects, withError, reservedKeyword, true);
        if (forPreviewBox) {
          resolvedStr = resolvedStr.replace(codeMatch, resolvedCode[0]);
        } else {
          resolvedStr = resolvedStr.replace(codeMatch, resolvedCode);
        }
      }
    });
  }

  // Resolve %%object%%
  const serverRegex = /(%%.+?%%)/g;
  const serverMatches = resolvedStr.match(serverRegex);

  if (serverMatches) {
    serverMatches.forEach((serverMatch) => {
      const code = serverMatch.replace(/%%/g, '');

      if (code.includes('server.') && !/^server\.[A-Za-z0-9]+$/.test(code)) {
        resolvedStr = resolvedStr.replace(serverMatch, 'HiddenEnvironmentVariable');
      } else {
        const resolvedCode = resolveCode(code, state, customObjects, withError, reservedKeyword, false);
        if (forPreviewBox) {
          resolvedStr = resolvedStr.replace(serverMatch, resolvedCode[0]);
        } else {
          resolvedStr = resolvedStr.replace(serverMatch, resolvedCode);
        }
      }
    });
  }

  return resolvedStr;
}

export function resolveReferences(
  object,
  state,
  defaultValue,
  customObjects = {},
  withError = false,
  forPreviewBox = false
) {
  if (object === '{{{}}}') return '';
  const reservedKeyword = ['app']; //Keywords that slows down the app
  object = _.clone(object);
  const objectType = typeof object;
  let error;
  switch (objectType) {
    case 'string': {
      if (object.includes('{{') && object.includes('}}') && object.includes('%%') && object.includes('%%')) {
        object = resolveString(object, state, customObjects, reservedKeyword, withError, forPreviewBox);
      }

      if (object.startsWith('{{') && object.endsWith('}}')) {
        if ((object.match(/{{/g) || []).length === 1) {
          const code = object.replace('{{', '').replace('}}', '');

          if (reservedKeyword.includes(code)) {
            error = `${code} is a reserved keyword`;
            return [{}, error];
          }

          return resolveCode(code, state, customObjects, withError, reservedKeyword, true);
        } else {
          const dynamicVariables = getDynamicVariables(object);

          for (const dynamicVariable of dynamicVariables) {
            const value = resolveString(
              dynamicVariable,
              state,
              customObjects,
              reservedKeyword,
              withError,
              forPreviewBox
            );

            if (typeof value !== 'function') {
              object = object.replace(dynamicVariable, value);
            }
          }
        }
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
        const new_array = [];

        object.forEach((element, index) => {
          const resolved_object = resolveReferences(element, state);
          new_array[index] = resolved_object;
        });

        if (withError) return [new_array, error];
        return new_array;
      } else if (!_.isEmpty(object)) {
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
    if (widgetValue === undefined || widgetValue < parseInt(resolvedMinValue)) {
      return {
        isValid: false,
        validationError: `Minimum value is ${resolvedMinValue}`,
      };
    }
  }

  const resolvedMaxValue = resolveWidgetFieldValue(maxValue, currentState, undefined, customResolveObjects);
  if (resolvedMaxValue !== undefined) {
    if (widgetValue === undefined || widgetValue > parseInt(resolvedMaxValue)) {
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
  queryId,
  isPreview,
  mode = '',
  parameters = {},
  hasParamSupport = false
) {
  const currentState = getCurrentState();
  let result = {},
    error = null;

  //if user passes anything other than object, params are reset to empty
  if (typeof parameters !== 'object' || parameters === null) {
    parameters = {};
  }

  const actions = generateAppActions(_ref, queryId, mode, isPreview);

  const queryDetails = useDataQueriesStore.getState().dataQueries.find((q) => q.id === queryId);
  hasParamSupport = !hasParamSupport ? queryDetails?.options?.hasParamSupport : hasParamSupport;

  const defaultParams =
    queryDetails?.options?.parameters?.reduce(
      (paramObj, param) => ({
        ...paramObj,
        [param.name]: resolveReferences(param.defaultValue, {}, undefined), //default values will not be resolved with currentState
      }),
      {}
    ) || {};

  let formattedParams = {};
  if (queryDetails) {
    Object.keys(defaultParams).map((key) => {
      /** The value of param is replaced with defaultValue if its passed undefined */
      formattedParams[key] = parameters[key] === undefined ? defaultParams[key] : parameters[key];
    });
  } else {
    //this will handle the preview case where you cannot find the queryDetails in state.
    formattedParams = { ...parameters };
  }
  for (const key of Object.keys(currentState.queries)) {
    currentState.queries[key] = {
      ...currentState.queries[key],
      run: (params) => {
        if (typeof params !== 'object' || params === null) {
          params = {};
        }
        const processedParams = {};
        const query = useDataQueriesStore.getState().dataQueries.find((q) => q.name === key);
        query.options.parameters?.forEach((arg) => (processedParams[arg.name] = params[arg.name]));
        return actions.runQuery(key, processedParams);
      },
    };
  }

  try {
    const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();
    const fnParams = [
      'moment',
      '_',
      'components',
      'queries',
      'globals',
      'page',
      'axios',
      'variables',
      'actions',
      'client',
      'server',
      'constants',
      ...(hasParamSupport ? ['parameters'] : []), //Add `parameters` in the function signature only if `hasParamSupport` is enabled. Prevents conflicts with user-defined identifiers of the same name
      code,
    ];
    var evalFn = new AsyncFunction(...fnParams);

    const fnArgs = [
      moment,
      _,
      currentState.components,
      currentState.queries,
      currentState.globals,
      currentState.page,
      axios,
      currentState.variables,
      actions,
      currentState?.client,
      currentState?.server,
      currentState?.constants,
      ...(hasParamSupport ? [formattedParams] : []), //Add `parameters` in the function signature only if `hasParamSupport` is enabled. Prevents conflicts with user-defined identifiers of the same name
    ];
    result = {
      status: 'ok',
      data: await evalFn(...fnArgs),
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

export const generateAppActions = (_ref, queryId, mode, isPreview = false) => {
  const currentPageId = _ref.state.currentPageId;
  const currentComponents = _ref.state?.appDefinition?.pages[currentPageId]?.components
    ? Object.entries(_ref.state.appDefinition.pages[currentPageId]?.components)
    : {};
  const runQuery = (queryName = '', parameters) => {
    const query = useDataQueriesStore.getState().dataQueries.find((query) => query.name === queryName);

    const processedParams = {};
    if (_.isEmpty(query) || queryId === query?.id) {
      const errorMsg = queryId === query?.id ? 'Cannot run query from itself' : 'Query not found';
      toast.error(errorMsg);
      return;
    }

    if (!_.isEmpty(query?.options?.parameters)) {
      query.options.parameters?.forEach(
        (param) => parameters && (processedParams[param.name] = parameters?.[param.name])
      );
    }

    if (isPreview) {
      return previewQuery(_ref, query, true, processedParams);
    }

    const event = {
      actionId: 'run-query',
      queryId: query.id,
      queryName: query.name,
      parameters: processedParams,
    };

    return executeAction(_ref, event, mode, {});
  };

  const setVariable = (key = '', value = '') => {
    if (key) {
      const event = {
        actionId: 'set-custom-variable',
        key,
        value,
      };
      return executeAction(_ref, event, mode, {});
    }
  };

  const unSetVariable = (key = '') => {
    if (key) {
      const event = {
        actionId: 'unset-custom-variable',
        key,
      };
      return executeAction(_ref, event, mode, {});
    }
  };

  const showAlert = (alertType = '', message = '') => {
    const event = {
      actionId: 'show-alert',
      alertType,
      message,
    };
    return executeAction(_ref, event, mode, {});
  };

  const logout = () => {
    const event = {
      actionId: 'logout',
    };
    return executeAction(_ref, event, mode, {});
  };

  const showModal = (modalName = '') => {
    let modal = '';
    for (const [key, value] of currentComponents) {
      if (value.component.name === modalName) {
        modal = key;
      }
    }

    const event = {
      actionId: 'show-modal',
      modal,
    };
    return executeAction(_ref, event, mode, {});
  };

  const closeModal = (modalName = '') => {
    let modal = '';
    for (const [key, value] of currentComponents) {
      if (value.component.name === modalName) {
        modal = key;
      }
    }

    const event = {
      actionId: 'close-modal',
      modal,
    };
    return executeAction(_ref, event, mode, {});
  };

  const setLocalStorage = (key = '', value = '') => {
    const event = {
      actionId: 'set-localstorage-value',
      key,
      value,
    };
    return executeAction(_ref, event, mode, {});
  };

  const copyToClipboard = (contentToCopy = '') => {
    const event = {
      actionId: 'copy-to-clipboard',
      contentToCopy,
    };
    return executeAction(_ref, event, mode, {});
  };

  const goToApp = (slug = '', queryParams = []) => {
    const event = {
      actionId: 'go-to-app',
      slug,
      queryParams,
    };
    return executeAction(_ref, event, mode, {});
  };

  const generateFile = (fileName, fileType, data) => {
    if (!fileName || !fileType || !data) {
      return toast.error('Action failed: fileName, fileType and data are required');
    }

    const event = {
      actionId: 'generate-file',
      fileName,
      data,
      fileType,
    };
    return executeAction(_ref, event, mode, {});
  };

  const setPageVariable = (key = '', value = '') => {
    const event = {
      actionId: 'set-page-variable',
      key,
      value,
    };
    return executeAction(_ref, event, mode, {});
  };

  const unsetPageVariable = (key = '') => {
    const event = {
      actionId: 'unset-page-variable',
      key,
    };
    return executeAction(_ref, event, mode, {});
  };

  const switchPage = (pageHandle, queryParams = []) => {
    if (isPreview) {
      mode != 'view' &&
        toast('Page will not be switched for query preview', {
          icon: '⚠️',
        });
      return Promise.resolve();
    }
    const pages = _ref.state.appDefinition.pages;
    const pageId = Object.keys(pages).find((key) => pages[key].handle === pageHandle);

    if (!pageId) {
      mode === 'edit' &&
        toast('Valid page handle is required', {
          icon: '⚠️',
        });
      return Promise.resolve();
    }

    const event = {
      actionId: 'switch-page',
      pageId,
      queryParams,
    };
    return executeAction(_ref, event, mode, {});
  };

  return {
    runQuery,
    setVariable,
    unSetVariable,
    showAlert,
    logout,
    showModal,
    closeModal,
    setLocalStorage,
    copyToClipboard,
    goToApp,
    generateFile,
    setPageVariable,
    unsetPageVariable,
    switchPage,
  };
};

export const loadPyodide = async () => {
  try {
    const pyodide = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.2/full/' });
    return pyodide;
  } catch (error) {
    console.log('loadPyodide error', error);
    throw 'Could not load Pyodide to execute Python';
  }
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

export const pathnameWithoutSubpath = (path) => {
  const subpath = getSubpath();
  if (subpath) return path.replace(subpath, '');
  return path;
};

// will replace or append workspace-id in a path
export const appendWorkspaceId = (workspaceId, path, replaceId = false) => {
  const subpath = getSubpath();
  path = pathnameWithoutSubpath(path);

  let newPath = path;
  if (path === '/:workspaceId' || path.split('/').length === 2) {
    newPath = `/${workspaceId}`;
  } else {
    const paths = path.split('/').filter((path) => path !== '');
    if (replaceId) {
      paths[0] = workspaceId;
    } else {
      paths.unshift(workspaceId);
    }
    newPath = `/${paths.join('/')}`;
  }
  return subpath ? `${subpath}${newPath}` : newPath;
};

export const getWorkspaceIdFromURL = () => {
  const pathname = window.location.pathname;
  const pathnameArray = pathname.split('/').filter((path) => path !== '');
  const subpath = window?.public_config?.SUB_PATH;
  const subpathArray = subpath ? subpath.split('/').filter((path) => path != '') : [];
  const existedPaths = [
    'forgot-password',
    'switch-workspace',
    'reset-password',
    'invitations',
    'organization-invitations',
    'sso',
    'setup',
    'confirm',
    ':workspaceId',
    'confirm-invite',
    'oauth2',
    'applications',
    'integrations',
  ];

  const workspaceId = subpath ? pathnameArray[subpathArray.length] : pathnameArray[0];
  if (workspaceId === 'login') {
    return subpath ? pathnameArray[subpathArray.length + 1] : pathnameArray[1];
  }

  return !existedPaths.includes(workspaceId) ? workspaceId : '';
};

export const getWorkspaceId = () =>
  getWorkspaceIdFromURL() || authenticationService.currentSessionValue?.current_organization_id;

export const excludeWorkspaceIdFromURL = (pathname) => {
  if (!pathname.includes('/applications/')) {
    const paths = pathname?.split('/').filter((path) => path !== '');
    paths.shift();
    const newPath = paths.join('/');
    return newPath ? `/${newPath}` : '/';
  }
  return pathname;
};

export const handleUnSubscription = (subsciption) => {
  setTimeout(() => {
    subsciption.unsubscribe();
  }, 5000);
};

export const getAvatar = (organization) => {
  if (!organization) return;

  const orgName = organization.split(' ').filter((e) => e && !!e.trim());
  if (orgName.length > 1) {
    return `${orgName[0]?.[0]}${orgName[1]?.[0]}`;
  } else if (organization.length >= 2) {
    return `${organization[0]}${organization[1]}`;
  } else {
    return `${organization[0]}${organization[0]}`;
  }
};

export const getSubpath = () =>
  window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : null;
export function isExpectedDataType(data, expectedDataType) {
  function getCurrentDataType(node) {
    return Object.prototype.toString.call(node).slice(8, -1).toLowerCase();
  }

  const currentDataType = getCurrentDataType(data);

  if (currentDataType !== expectedDataType) {
    switch (expectedDataType) {
      case 'string':
        return String(data) ? data : undefined;
      case 'number':
        return Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === 'number' ? data : undefined;
      case 'boolean':
        return Boolean();
      case 'array':
        return Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === 'array' ? data : [];
      case 'object':
        return Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === 'object' ? data : {};
      default:
        return null;
    }
  }

  return data;
}

export const validateName = (name, nameType, showError = false, allowSpecialChars = true) => {
  const newName = name.trim();
  let errorMsg = '';
  if (!newName) {
    errorMsg = `${nameType} can't be empty`;
    showError &&
      toast.error(errorMsg, {
        id: '1',
      });
    return {
      status: false,
      errorMsg,
    };
  }

  //check for alphanumeric
  if (!allowSpecialChars && newName.match(/^[a-z0-9 -]+$/) === null) {
    if (/[A-Z]/.test(newName)) {
      errorMsg = 'Only lowercase letters are accepted.';
    } else {
      errorMsg = `Special characters are not accepted.`;
    }
    showError &&
      toast.error(errorMsg, {
        id: '2',
      });
    return {
      status: false,
      errorMsg,
    };
  }

  if (newName.length > 50) {
    errorMsg = `Maximum length has been reached.`;
    showError &&
      toast.error(errorMsg, {
        id: '3',
      });
    return {
      status: false,
      errorMsg,
    };
  }

  return {
    status: true,
    errorMsg: '',
  };
};

export const handleHttpErrorMessages = ({ statusCode, error }, feature_name) => {
  switch (statusCode) {
    case 500: {
      toast.error(
        `Something went wrong on our end and this ${feature_name} could not be created. Please try \n again or contact our support team if the \n problem persists.`
      );
      break;
    }
    case 503: {
      toast.error(
        `We weren't able to connect to our servers to complete this request. Please check your \n internet connection and try again.`
      );
      break;
    }
    default: {
      toast.error(error ? error : 'Something went wrong. please try again.', {
        position: 'top-center',
      });
      break;
    }
  }
};

export const defaultAppEnvironments = [{ name: 'production', isDefault: true, priority: 3 }];

export function eraseRedirectUrl() {
  const redirectPath = getCookie('redirectPath');
  redirectPath && eraseCookie('redirectPath');
  return redirectPath;
}

export const returnWorkspaceIdIfNeed = (path) => {
  if (path) {
    return !path.includes('applications') && !path.includes('integrations') ? `/${getWorkspaceId()}` : '';
  }
  return `/${getWorkspaceId()}`;
};

export const redirectToWorkspace = () => {
  const path = eraseRedirectUrl();
  const redirectPath = `${returnWorkspaceIdIfNeed(path)}${path && path !== '/' ? path : ''}`;
  window.location = getSubpath() ? `${getSubpath()}${redirectPath}` : redirectPath;
};

export const redirectToDashboard = () => {
  const subpath = getSubpath();
  window.location = `${subpath ? `${subpath}` : ''}/${getWorkspaceId()}`;
};
