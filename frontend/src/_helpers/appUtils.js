import React from 'react';
import { toast } from 'react-hot-toast';
import {
  getDynamicVariables,
  resolveReferences,
  executeMultilineJS,
  serializeNestedObjectToQueryParams,
  computeComponentName,
  generateAppActions,
  loadPyodide,
  isQueryRunnable,
} from '@/_helpers/utils';
import { dataqueryService } from '@/_services';
import _ from 'lodash';
import moment from 'moment';
import Tooltip from 'react-bootstrap/Tooltip';
import { componentTypes } from '@/Editor/WidgetManager/components';
import generateCSV from '@/_lib/generate-csv';
import generateFile from '@/_lib/generate-file';
import RunjsIcon from '@/Editor/Icons/runjs.svg';
import RunTooljetDbIcon from '@/Editor/Icons/tooljetdb.svg';
import RunPyIcon from '@/Editor/Icons/runpy.svg';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line import/no-unresolved
import { allSvgs } from '@tooljet/plugins/client';
import urlJoin from 'url-join';
import { tooljetDbOperations } from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/operations';
import { authenticationService } from '@/_services/authentication.service';
import { setCookie } from '@/_helpers/cookie';
import { DataSourceTypes } from '@/Editor/DataSourceManager/SourceComponents';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useCurrentStateStore, getCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { camelizeKeys } from 'humps';
import { useAppDataStore } from '@/_stores/appDataStore';
import { useEditorStore } from '@/_stores/editorStore';

const ERROR_TYPES = Object.freeze({
  ReferenceError: 'ReferenceError',
  SyntaxError: 'SyntaxError',
  TypeError: 'TypeError',
  URIError: 'URIError',
  RangeError: 'RangeError',
  EvalError: 'EvalError',
});

export function setStateAsync(_ref, state) {
  return new Promise((resolve) => {
    _ref.setState(state, resolve);
  });
}

export function setCurrentStateAsync(_ref, changes) {
  return new Promise((resolve) => {
    _ref.setState((prevState) => {
      return {
        currentState: prevState.currentState,
        ...changes,
      };
    }, resolve);
  });
}

export function onComponentOptionsChanged(component, options) {
  const componentName = component.name;
  const components = getCurrentState().components;
  let componentData = components[componentName];
  componentData = componentData || {};

  for (const option of options) {
    componentData[option[0]] = option[1];
  }

  useCurrentStateStore.getState().actions.setCurrentState({
    components: { ...components, [componentName]: componentData },
  });
  return Promise.resolve();
}

export function onComponentOptionChanged(component, option_name, value) {
  const componentName = component.name;
  const components = getCurrentState().components;
  let componentData = components[componentName];
  componentData = componentData || {};
  componentData[option_name] = value;

  if (option_name !== 'id') {
    useCurrentStateStore.getState().actions.setCurrentState({
      components: { ...components, [componentName]: componentData },
    });
  } else if (!componentData?.id) {
    useCurrentStateStore.getState().actions.setCurrentState({
      components: { ...components, [componentName]: componentData },
    });
  }

  return Promise.resolve();
}

export function fetchOAuthToken(authUrl, dataSourceId) {
  localStorage.setItem('sourceWaitingForOAuth', dataSourceId);
  const currentSessionValue = authenticationService.currentSessionValue;
  currentSessionValue?.current_organization_id &&
    setCookie('orgIdForOauth', currentSessionValue?.current_organization_id);
  window.open(authUrl);
}

export function addToLocalStorage(object) {
  localStorage.setItem(object['key'], object['value']);
}

export function getDataFromLocalStorage(key) {
  return localStorage.getItem(key);
}

async function executeRunPycode(_ref, code, query, isPreview, mode) {
  let pyodide;
  try {
    pyodide = await loadPyodide();
  } catch (errorMessage) {
    return {
      data: {
        status: 'failed',
        message: errorMessage,
      },
    };
  }

  function log(line) {
    console.log({ line });
  }

  const evaluatePythonCode = async (pyodide) => {
    let result = {};
    const currentState = getCurrentState();
    try {
      const appStateVars = currentState['variables'] ?? {};

      const actions = generateAppActions(_ref, query.id, mode, isPreview);

      for (const key of Object.keys(currentState.queries)) {
        currentState.queries[key] = {
          ...currentState.queries[key],
          run: () => actions.runQuery(key),
        };
      }

      await pyodide.globals.set('components', currentState['components']);
      await pyodide.globals.set('queries', currentState['queries']);
      await pyodide.globals.set('tj_globals', currentState['globals']);
      await pyodide.globals.set('client', currentState['client']);
      await pyodide.globals.set('server', currentState['server']);
      await pyodide.globals.set('constants', currentState['constants']);
      await pyodide.globals.set('variables', appStateVars);
      await pyodide.globals.set('actions', actions);

      await pyodide.loadPackagesFromImports(code);

      await pyodide.loadPackage('micropip', log);

      let pyresult = await pyodide.runPythonAsync(code);
      result = await pyresult;
    } catch (err) {
      console.error(err);

      const errorType = err.message.includes('SyntaxError') ? 'SyntaxError' : 'NameError';
      const error = err.message.split(errorType + ': ')[1];
      const errorMessage = `${errorType} : ${error}`;

      result = {};

      result = {
        status: 'failed',
        message: errorMessage,
        description: {
          code: query?.options?.code,
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))),
        },
      };
    }

    return pyodide.isPyProxy(result) ? convertMapSet(result.toJs()) : result;
  };

  return { data: await evaluatePythonCode(pyodide, code) };
}

async function exceutePycode(payload, code, currentState, query, mode) {
  let pyodide;
  try {
    pyodide = await loadPyodide();
  } catch (errorMessage) {
    return {
      data: {
        status: 'failed',
        message: errorMessage,
      },
    };
  }

  const evaluatePython = async (pyodide) => {
    let result = {};
    try {
      //remove the comments from the code
      let codeWithoutComments = code.replace(/#.*$/gm, '');
      codeWithoutComments = codeWithoutComments.replace(/^\s+/g, '');
      const _code = codeWithoutComments.replace('return ', '');
      currentState['variables'] = currentState['variables'] ?? {};
      const _currentState = JSON.stringify(currentState);

      let execFunction = await pyodide.runPython(`
        from pyodide.ffi import to_js
        import json
        def exec_code(payload, _currentState):
          data = json.loads(payload)
          currentState = json.loads(_currentState)
          components = currentState['components']
          queries = currentState['queries']
          globals = currentState['globals']
          variables = currentState['variables']
          client = currentState['client']
          server = currentState['server']
          constants = currentState['constants']
          page = currentState['page']
          code_to_execute = ${_code}

          try:
            res = to_js(json.dumps(code_to_execute))
            # convert dictionary to js object
            return res
          except Exception as e:
            print(e)
            return {"error": str(e)}

        exec_code
    `);
      const _data = JSON.stringify(payload);
      result = execFunction(_data, _currentState);
      return JSON.parse(result);
    } catch (err) {
      console.error(err);

      const errorType = err.message.includes('SyntaxError') ? 'SyntaxError' : 'NameError';
      const error = err.message.split(errorType + ': ')[1];
      const errorMessage = `${errorType} : ${error}`;
      result = {};
      if (mode === 'edit') toast.error(errorMessage);

      result = {
        status: 'failed',
        message: errorMessage,
        description: {
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))),
        },
      };
    }

    return result;
  };

  return await evaluatePython(pyodide, code);
}

export async function runPythonTransformation(currentState, rawData, transformation, query, mode) {
  const data = rawData;

  try {
    return await exceutePycode(data, transformation, currentState, query, mode);
  } catch (error) {
    console.log(error);
  }
}

export async function runTransformation(
  _ref,
  rawData,
  transformation,
  transformationLanguage = 'javascript',
  query,
  mode = 'edit'
) {
  const data = rawData;

  let result = [];

  const currentState = getCurrentState() || {};

  if (transformationLanguage === 'python') {
    result = await runPythonTransformation(currentState, data, transformation, query, mode);

    return result;
  }

  if (transformationLanguage === 'javascript') {
    try {
      const evalFunction = Function(
        ['data', 'moment', '_', 'components', 'queries', 'globals', 'variables', 'page'],
        transformation
      );

      result = evalFunction(
        data,
        moment,
        _,
        currentState.components,
        currentState.queries,
        currentState.globals,
        currentState.variables,
        currentState.page
      );
    } catch (err) {
      const $error = err.name;
      const $errorMessage = _.has(ERROR_TYPES, $error) ? `${$error} : ${err.message}` : err || 'Unknown error';
      if (mode === 'edit') toast.error($errorMessage);
      result = {
        message: err.stack.split('\n')[0],
        status: 'failed',
        data: data,
      };
    }

    return result;
  }
}

export async function executeActionsForEventId(_ref, eventId, events = [], mode, customVariables) {
  const filteredEvents = events.filter((event) => event?.event.eventId === eventId);

  for (const event of filteredEvents) {
    await executeAction(_ref, event.event, mode, customVariables); // skipcq: JS-0032
  }
}

export function onComponentClick(_ref, id, component, mode = 'edit') {
  executeActionsForEventId(_ref, 'onClick', component, mode);
}

export function onQueryConfirmOrCancel(_ref, queryConfirmationData, isConfirm = false, mode = 'edit') {
  const filtertedQueryConfirmation = _ref?.queryConfirmationList.filter(
    (query) => query.queryId !== queryConfirmationData.queryId
  );

  _ref.updateQueryConfirmationList(filtertedQueryConfirmation, 'check');
  isConfirm && runQuery(_ref, queryConfirmationData.queryId, queryConfirmationData.queryName, true, mode);
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (err) {
    console.log('Failed to copy!', err);
  }
}

function showModal(_ref, modal, show) {
  const modalId = modal?.id ?? modal;
  if (_.isEmpty(modalId)) {
    console.log('No modal is associated with this event.');
    return Promise.resolve();
  }

  const modalMeta = _ref.appDefinition.pages[_ref.currentPageId].components[modalId]; //! NeedToFix

  const _components = {
    ...getCurrentState().components,
    [modalMeta.component.name]: {
      ...getCurrentState().components[modalMeta.component.name],
      show: show,
    },
  };
  useCurrentStateStore.getState().actions.setCurrentState({
    components: _components,
  });
  return Promise.resolve();
}

function logoutAction() {
  localStorage.clear();
  authenticationService.logout(true);

  return Promise.resolve();
}

function debounce(func) {
  let timer;
  return (...args) => {
    const event = args[1] || {};
    if (event.debounce === undefined) {
      return func.apply(this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, Number(event.debounce));
  };
}

export const executeAction = debounce(executeActionWithDebounce);

function executeActionWithDebounce(_ref, event, mode, customVariables) {
  if (event) {
    if (event.runOnlyIf) {
      const shouldRun = resolveReferences(event.runOnlyIf, getCurrentState(), undefined, customVariables);
      if (!shouldRun) {
        return false;
      }
    }
    switch (event.actionId) {
      case 'show-alert': {
        const message = resolveReferences(event.message, getCurrentState(), undefined, customVariables);
        switch (event.alertType) {
          case 'success':
          case 'error':
            toast[event.alertType](message);
            break;
          case 'info':
            toast(message);
            break;
          case 'warning':
            toast(message, {
              icon: '⚠️',
            });
            break;
        }
        return Promise.resolve();
      }

      case 'run-query': {
        const { queryId, queryName } = event;
        const params = event['parameters'];
        const resolvedParams = {};
        if (params) {
          Object.keys(params).map(
            (param) => (resolvedParams[param] = resolveReferences(params[param], getCurrentState(), undefined))
          );
        }
        const name =
          useDataQueriesStore.getState().dataQueries.find((query) => query.id === queryId)?.name ?? queryName;
        return runQuery(_ref, queryId, name, undefined, mode, resolvedParams);
      }
      case 'logout': {
        return logoutAction();
      }

      case 'open-webpage': {
        const url = resolveReferences(event.url, getCurrentState(), undefined, customVariables);
        window.open(url, '_blank');
        return Promise.resolve();
      }

      case 'go-to-app': {
        const slug = resolveReferences(event.slug, getCurrentState(), undefined, customVariables);
        const queryParams = event.queryParams?.reduce(
          (result, queryParam) => ({
            ...result,
            ...{
              [resolveReferences(queryParam[0], getCurrentState())]: resolveReferences(
                queryParam[1],
                getCurrentState(),
                undefined,
                customVariables
              ),
            },
          }),
          {}
        );

        let url = `/applications/${slug}`;

        if (queryParams) {
          const queryPart = serializeNestedObjectToQueryParams(queryParams);

          if (queryPart.length > 0) url = url + `?${queryPart}`;
        }

        if (mode === 'view') {
          _ref.navigate(url);
        } else {
          if (confirm('The app will be opened in a new tab as the action is triggered from the editor.')) {
            window.open(urlJoin(window.public_config?.TOOLJET_HOST, url));
          }
        }
        return Promise.resolve();
      }

      case 'show-modal':
        return showModal(_ref, event.modal, true);

      case 'close-modal':
        return showModal(_ref, event.modal, false);

      case 'copy-to-clipboard': {
        const contentToCopy = resolveReferences(event.contentToCopy, getCurrentState(), undefined, customVariables);
        copyToClipboard(contentToCopy);

        return Promise.resolve();
      }

      case 'set-localstorage-value': {
        const key = resolveReferences(event.key, getCurrentState(), undefined, customVariables);
        const value = resolveReferences(event.value, getCurrentState(), undefined, customVariables);
        localStorage.setItem(key, value);

        return Promise.resolve();
      }

      case 'generate-file': {
        // const fileType = event.fileType;
        const data = resolveReferences(event.data, getCurrentState(), undefined, customVariables) ?? [];
        const fileName = resolveReferences(event.fileName, getCurrentState(), undefined, customVariables) ?? 'data.txt';
        const fileType = resolveReferences(event.fileType, getCurrentState(), undefined, customVariables) ?? 'csv';
        const fileData = {
          csv: generateCSV,
          plaintext: (plaintext) => plaintext,
          pdf: (pdfData) => pdfData,
        }[fileType](data);
        generateFile(fileName, fileData, fileType);
        return Promise.resolve();
      }

      case 'set-table-page': {
        setTablePageIndex(event.table, event.pageIndex);
        break;
      }

      case 'set-custom-variable': {
        const key = resolveReferences(event.key, getCurrentState(), undefined, customVariables);
        const value = resolveReferences(event.value, getCurrentState(), undefined, customVariables);
        const customAppVariables = { ...getCurrentState().variables };
        customAppVariables[key] = value;
        return useCurrentStateStore.getState().actions.setCurrentState({
          variables: customAppVariables,
        });
      }

      case 'unset-custom-variable': {
        const key = resolveReferences(event.key, getCurrentState(), undefined, customVariables);
        const customAppVariables = { ...getCurrentState().variables };
        delete customAppVariables[key];
        return useCurrentStateStore.getState().actions.setCurrentState({
          variables: customAppVariables,
        });
      }

      case 'set-page-variable': {
        const key = resolveReferences(event.key, getCurrentState(), undefined, customVariables);
        const value = resolveReferences(event.value, getCurrentState(), undefined, customVariables);
        const customPageVariables = {
          ...getCurrentState().page.variables,
          [key]: value,
        };
        return useCurrentStateStore.getState().actions.setCurrentState({
          page: {
            ...getCurrentState().page,
            variables: customPageVariables,
          },
        });
      }

      case 'unset-page-variable': {
        const key = resolveReferences(event.key, getCurrentState(), undefined, customVariables);
        const customPageVariables = _.omit(getCurrentState().page.variables, key);
        return useCurrentStateStore.getState().actions.setCurrentState({
          page: {
            ...getCurrentState().page,
            variables: customPageVariables,
          },
        });
      }

      case 'control-component': {
        const component = Object.values(getCurrentState()?.components ?? {}).filter(
          (component) => component.id === event.componentId
        )[0];
        const action = component?.[event.componentSpecificActionHandle];
        const actionArguments = _.map(event.componentSpecificActionParams, (param) => ({
          ...param,
          value: resolveReferences(param.value, getCurrentState(), undefined, customVariables),
        }));
        const actionPromise = action && action(...actionArguments.map((argument) => argument.value));
        return actionPromise ?? Promise.resolve();
      }

      case 'switch-page': {
        const { name, disabled } = _ref.appDefinition.pages[event.pageId];

        // Don't allow switching to disabled page in editor as well as viewer
        if (!disabled) {
          _ref.switchPage(event.pageId, resolveReferences(event.queryParams, getCurrentState(), [], customVariables));
        }
        if (_ref.appDefinition.pages[event.pageId]) {
          if (disabled) {
            const generalProps = {
              navToDisablePage: {
                type: 'navToDisablePage',
                page: name,
                data: {
                  message: `Attempt to switch to disabled page ${name} blocked.`,
                  status: true,
                },
              },
            };
            useCurrentStateStore.getState().actions.setErrors(generalProps);
          }
        }

        return Promise.resolve();
      }
    }
  }
}

export async function onEvent(_ref, eventName, events, options = {}, mode = 'edit') {
  let _self = _ref;

  const { customVariables } = options;
  if (eventName === 'onPageLoad') {
    //hack to make sure that the page is loaded before executing the actions
    setTimeout(async () => {
      return await executeActionsForEventId(_ref, 'onPageLoad', events, mode, customVariables);
    }, 0);
  }

  if (eventName === 'onTrigger') {
    const { component, queryId, queryName, parameters } = options;
    useCurrentStateStore.getState().actions.setCurrentState({
      components: {
        ...getCurrentState().components,
        [component.name]: {
          ...getCurrentState().components[component.name],
        },
      },
    });
    runQuery(_ref, queryId, queryName, true, mode, parameters);
  }

  if (eventName === 'onCalendarEventSelect') {
    const { component, calendarEvent } = options;

    useCurrentStateStore.getState().actions.setCurrentState({
      components: {
        ...getCurrentState().components,
        [component.name]: {
          ...getCurrentState().components[component.name],
          selectedEvent: { ...calendarEvent },
        },
      },
    });

    executeActionsForEventId(_ref, 'onCalendarEventSelect', events, mode, customVariables);
  }

  if (eventName === 'onCalendarSlotSelect') {
    const { component, selectedSlots } = options;
    useCurrentStateStore.getState().actions.setCurrentState({
      components: {
        ...getCurrentState().components,
        [component.name]: {
          ...getCurrentState().components[component.name],
          selectedSlots,
        },
      },
    });

    executeActionsForEventId(_ref, 'onCalendarSlotSelect', events, mode, customVariables);
  }

  if (eventName === 'onTableActionButtonClicked') {
    const { action, tableActionEvents } = options;
    const executeableActions = tableActionEvents.filter((event) => event?.event?.ref === action?.name);

    if (action && executeableActions) {
      for (const event of executeableActions) {
        if (event?.event?.actionId) {
          await executeAction(_self, event.event, mode, customVariables);
        }
      }
    } else {
      console.log('No action is associated with this event');
    }
  }

  if (eventName === 'OnTableToggleCellChanged') {
    const { column, tableColumnEvents } = options;

    if (column && tableColumnEvents) {
      for (const event of tableColumnEvents) {
        if (event?.event?.actionId) {
          await executeAction(_self, event.event, mode, customVariables);
        }
      }
    } else {
      console.log('No action is associated with this event');
    }
  }

  if (
    [
      'onDetect',
      'onCheck',
      'onUnCheck',
      'onBoundsChange',
      'onCreateMarker',
      'onMarkerClick',
      'onPolygonClick',
      'onPageChanged',
      'onSearch',
      'onChange',
      'onEnterPressed',
      'onSelectionChange',
      'onSelect',
      'onClick',
      'onHover',
      'onFileSelected',
      'onFileLoaded',
      'onFileDeselected',
      'onStart',
      'onResume',
      'onReset',
      'onPause',
      'onCountDownFinish',
      'onCalendarNavigate',
      'onCalendarViewChange',
      'onSearchTextChanged',
      'onPageChange',
      'onAddCardClick',
      'onCardAdded',
      'onCardRemoved',
      'onCardMoved',
      'onCardSelected',
      'onCardUpdated',
      'onUpdate',
      'onTabSwitch',
      'onFocus',
      'onBlur',
      'onOpen',
      'onClose',
      'onRowClicked',
      'onRecordClicked',
      'onCancelChanges',
      'onSort',
      'onCellValueChanged',
      'onFilterChanged',
      'onRowHovered',
      'onSubmit',
      'onInvalid',
      'onNewRowsAdded',
    ].includes(eventName)
  ) {
    executeActionsForEventId(_ref, eventName, events, mode, customVariables);
  }

  if (eventName === 'onBulkUpdate') {
    await executeActionsForEventId(_self, eventName, events, mode, customVariables);
  }

  if (['onDataQuerySuccess', 'onDataQueryFailure'].includes(eventName)) {
    await executeActionsForEventId(_self, eventName, events, mode, customVariables);
  }
}

export function getQueryVariables(options, state) {
  let queryVariables = {};
  const optionsType = typeof options;
  switch (optionsType) {
    case 'string': {
      options = options.replace(/\n/g, ' ');
      if (options.match(/\{\{(.*?)\}\}/g)?.length > 1 && options.includes('{{constants.')) {
        const constantVariables = options.match(/\{\{(constants.*?)\}\}/g);

        constantVariables.forEach((constant) => {
          options = options.replace(constant, 'HiddenOrganizationConstant');
        });
      }

      if (options.includes('{{') && options.includes('%%')) {
        const vars =
          options.includes('{{constants.') && !options.includes('%%')
            ? 'HiddenOrganizationConstant'
            : resolveReferences(options, state);
        queryVariables[options] = vars;
      } else {
        const dynamicVariables = getDynamicVariables(options) || [];
        dynamicVariables.forEach((variable) => {
          queryVariables[variable] = resolveReferences(variable, state);
        });
      }

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

export function previewQuery(_ref, query, calledFromQuery = false, parameters = {}, hasParamSupport = false) {
  const options = getQueryVariables(query.options, getCurrentState());

  const { setPreviewLoading, setPreviewData } = useQueryPanelStore.getState().actions;
  setPreviewLoading(true);

  return new Promise(function (resolve, reject) {
    let queryExecutionPromise = null;
    if (query.kind === 'runjs') {
      const formattedParams = (query.options.parameters || []).reduce(
        (paramObj, param) => ({
          ...paramObj,
          [param.name]:
            parameters?.[param.name] === undefined
              ? resolveReferences(param.defaultValue, {}) //default values will not be resolved with currentState
              : parameters?.[param.name],
        }),
        {}
      );
      queryExecutionPromise = executeMultilineJS(
        _ref,
        query.options.code,
        query?.id,
        true,
        '',
        formattedParams,
        hasParamSupport
      );
    } else if (query.kind === 'tooljetdb') {
      queryExecutionPromise = tooljetDbOperations.perform(query, getCurrentState());
    } else if (query.kind === 'runpy') {
      queryExecutionPromise = executeRunPycode(_ref, query.options.code, query, true, 'edit');
    } else {
      queryExecutionPromise = dataqueryService.preview(
        query,
        options,
        useAppVersionStore.getState().editingVersion?.id
      );
    }

    queryExecutionPromise
      .then(async (data) => {
        let finalData = data.data;

        if (query.options.enableTransformation) {
          finalData = await runTransformation(
            _ref,
            finalData,
            query.options.transformation,
            query.options.transformationLanguage,
            query,
            'edit'
          );
        }

        if (calledFromQuery) {
          setPreviewLoading(false);
        } else {
          setPreviewLoading(false);
          setPreviewData(finalData);
        }
        let queryStatusCode = data?.status ?? null;
        const queryStatus =
          query.kind === 'tooljetdb'
            ? data.statusText
            : query.kind === 'runpy'
            ? data?.data?.status ?? 'ok'
            : data.status;

        switch (true) {
          // Note: Need to move away from statusText -> statusCode
          case queryStatus === 'Bad Request' ||
            queryStatus === 'Not Found' ||
            queryStatus === 'Unprocessable Entity' ||
            queryStatus === 'failed' ||
            queryStatusCode === 400 ||
            queryStatusCode === 404 ||
            queryStatusCode === 422: {
            const err = query.kind == 'tooljetdb' ? data?.error || data : _.isEmpty(data.data) ? data : data.data;
            toast.error(`${err.message}`);
            break;
          }
          case queryStatus === 'needs_oauth': {
            const url = data.data.auth_url; // Backend generates and return sthe auth url
            fetchOAuthToken(url, query.data_source_id);
            break;
          }
          case queryStatus === 'ok' ||
            queryStatus === 'OK' ||
            queryStatus === 'Created' ||
            queryStatus === 'Accepted' ||
            queryStatus === 'No Content': {
            toast(`Query ${'(' + query.name + ') ' || ''}completed.`, {
              icon: '🚀',
            });
            break;
          }
        }

        resolve({ status: data.status, data: finalData });
      })
      .catch(({ error, data }) => {
        setPreviewLoading(false);
        setPreviewData(data);
        toast.error(error);
        reject({ error, data });
      });
  });
}

export function runQuery(_ref, queryId, queryName, confirmed = undefined, mode = 'edit', parameters = {}) {
  const query = useDataQueriesStore.getState().dataQueries.find((query) => query.id === queryId);
  const queryEvents = useAppDataStore
    .getState()
    .events.filter((event) => event.target === 'data_query' && event.sourceId === queryId);

  let dataQuery = {};

  if (query) {
    dataQuery = JSON.parse(JSON.stringify(query));
  } else {
    toast.error('No query has been associated with the action.');
    return;
  }

  const options = getQueryVariables(dataQuery.options, getCurrentState());

  if (dataQuery.options?.requestConfirmation) {
    const runOnPageLoad = dataQuery.options?.runOnPageLoad ?? false;
    const queryConfirmationList = runOnPageLoad ? _ref.queryConfirmationList : [];

    const queryConfirmation = {
      queryId,
      queryName,
    };
    if (!queryConfirmationList.some((query) => queryId === query.queryId)) {
      queryConfirmationList.push(queryConfirmation);
    }

    if (confirmed === undefined) {
      //!check
      _ref.updateQueryConfirmationList(queryConfirmationList);
      return;
    }
  }

  let _self = _ref;

  // eslint-disable-next-line no-unused-vars
  return new Promise(function (resolve, reject) {
    useCurrentStateStore.getState().actions.setCurrentState({
      queries: {
        ...getCurrentState().queries,
        [queryName]: {
          ...getCurrentState().queries[queryName],
          isLoading: true,
          data: [],
          rawData: [],
        },
      },
      errors: {},
    });
    let queryExecutionPromise = null;
    if (query.kind === 'runjs') {
      queryExecutionPromise = executeMultilineJS(_self, query.options.code, query?.id, false, mode, parameters);
    } else if (query.kind === 'runpy') {
      queryExecutionPromise = executeRunPycode(_self, query.options.code, query, false, mode);
    } else if (query.kind === 'tooljetdb') {
      queryExecutionPromise = tooljetDbOperations.perform(query, getCurrentState());
    } else {
      queryExecutionPromise = dataqueryService.run(queryId, options, query?.options);
    }

    queryExecutionPromise
      .then(async (data) => {
        if (data.status === 'needs_oauth') {
          const url = data.data.auth_url; // Backend generates and return sthe auth url
          fetchOAuthToken(url, dataQuery['data_source_id'] || dataQuery['dataSourceId']);
        }

        let queryStatusCode = data?.status ?? null;
        const promiseStatus =
          query.kind === 'tooljetdb'
            ? data.statusText
            : query.kind === 'runpy'
            ? data?.data?.status ?? 'ok'
            : data.status;
        // Note: Need to move away from statusText -> statusCode
        if (
          promiseStatus === 'failed' ||
          promiseStatus === 'Bad Request' ||
          promiseStatus === 'Not Found' ||
          promiseStatus === 'Unprocessable Entity' ||
          queryStatusCode === 400 ||
          queryStatusCode === 404 ||
          queryStatusCode === 422
        ) {
          let errorData = {};
          switch (query.kind) {
            case 'runpy':
              errorData = data.data;
              break;
            case 'tooljetdb':
              if (data?.error) {
                errorData = {
                  message: data?.error?.message || 'Something went wrong',
                  description: data?.error?.message || 'Something went wrong',
                  status: data?.statusText || 'Failed',
                  data: data?.error || {},
                };
              } else {
                errorData = data;
              }
              break;
            default:
              errorData = data;
              break;
          }
          // errorData = query.kind === 'runpy' ? data.data : data;
          useCurrentStateStore.getState().actions.setErrors({
            [queryName]: {
              type: 'query',
              kind: query.kind,
              data: errorData,
              options: options,
            },
          });

          useCurrentStateStore.getState().actions.setCurrentState({
            queries: {
              ...getCurrentState().queries,
              [queryName]: _.assign(
                {
                  ...getCurrentState().queries[queryName],
                  isLoading: false,
                },
                query.kind === 'restapi'
                  ? {
                      request: data.data.requestObject,
                      response: data.data.responseObject,
                      responseHeaders: data.data.responseHeaders,
                    }
                  : {}
              ),
            },
          });
          resolve(data);
          onEvent(_self, 'onDataQueryFailure', queryEvents);
          if (mode !== 'view') {
            const err = query.kind == 'tooljetdb' ? data?.error || data : _.isEmpty(data.data) ? data : data.data;
            toast.error(err?.message);
          }
          return;
        } else {
          let rawData = data.data;
          let finalData = data.data;

          if (dataQuery.options.enableTransformation) {
            finalData = await runTransformation(
              _ref,
              finalData,
              query.options.transformation,
              query.options.transformationLanguage,
              query,
              'edit'
            );
            if (finalData.status === 'failed') {
              useCurrentStateStore.getState().actions.setCurrentState({
                queries: {
                  ...getCurrentState().queries,
                  [queryName]: {
                    ...getCurrentState().queries[queryName],
                    isLoading: false,
                  },
                },
              });

              useCurrentStateStore.getState().actions.setErrors({
                [queryName]: {
                  type: 'transformations',
                  data: finalData,
                  options: options,
                },
              });
              resolve(finalData);
              onEvent(_self, 'onDataQueryFailure', queryEvents);
              return;
            }
          }

          if (dataQuery.options.showSuccessNotification) {
            const notificationDuration = dataQuery.options.notificationDuration * 1000 || 5000;
            toast.success(dataQuery.options.successMessage, {
              duration: notificationDuration,
            });
          }
          useCurrentStateStore.getState().actions.setCurrentState({
            queries: {
              ...getCurrentState().queries,
              [queryName]: _.assign(
                {
                  ...getCurrentState().queries[queryName],
                  isLoading: false,
                  data: finalData,
                  rawData,
                },
                query.kind === 'restapi'
                  ? {
                      request: data.request,
                      response: data.response,
                      responseHeaders: data.responseHeaders,
                    }
                  : {}
              ),
            },
            // Used to generate logs
            succededQuery: {
              [queryName]: {
                type: 'query',
                kind: query.kind,
              },
            },
          });
          resolve({ status: 'ok', data: finalData });
          onEvent(_self, 'onDataQuerySuccess', queryEvents, mode);
        }
      })
      .catch(({ error }) => {
        if (mode !== 'view') toast.error(error ?? 'Unknown error');
        useCurrentStateStore.getState().actions.setCurrentState({
          queries: {
            ...getCurrentState().queries,
            [queryName]: {
              isLoading: false,
            },
          },
        });

        resolve({ status: 'failed', message: error });
      });
  });
}

export function setTablePageIndex(tableId, index) {
  if (_.isEmpty(tableId)) {
    console.log('No table is associated with this event.');
    return Promise.resolve();
  }

  const table = Object.entries(getCurrentState().components).filter((entry) => entry[1].id === tableId)[0][1];
  const newPageIndex = resolveReferences(index, getCurrentState());
  table.setPage(newPageIndex ?? 1);
  return Promise.resolve();
}

export function renderTooltip({ props, text }) {
  if (text === '') return <></>;
  return (
    <Tooltip id="button-tooltip" {...props}>
      {text}
    </Tooltip>
  );
}

export function computeComponentState(components = {}) {
  let componentState = {};
  const currentComponents = getCurrentState().components;

  Object.keys(components).forEach((key) => {
    if (!components[key]) return;

    const { component } = components[key];
    const componentMeta = componentTypes.find((comp) => component.component === comp.component);

    const existingComponentName = Object.keys(currentComponents).find((comp) => currentComponents[comp].id === key);
    const existingValues = currentComponents[existingComponentName];

    if (component.parent) {
      const parentComponent = components[component.parent];
      let isListView = false,
        isForm = false;
      try {
        isListView = parentComponent.component.component === 'Listview';
        isForm = parentComponent.component.component === 'Form';
      } catch {
        console.log('error');
      }

      if (!isListView && !isForm) {
        componentState[component.name] = {
          ...componentMeta.exposedVariables,
          id: key,
          ...existingValues,
        };
      }
    } else {
      componentState[component.name] = {
        ...componentMeta.exposedVariables,
        id: key,
        ...existingValues,
      };
    }
  });

  useCurrentStateStore.getState().actions.setCurrentState({
    components: {
      ...componentState,
    },
  });

  return new Promise((resolve) => {
    useEditorStore.getState().actions.updateEditorState({
      defaultComponentStateComputed: true,
    });
    resolve();
  });
}

export const getSvgIcon = (key, height = 50, width = 50, iconFile = undefined, styles = {}) => {
  if (iconFile) return <img src={`data:image/svg+xml;base64,${iconFile}`} style={{ height, width }} />;
  if (key === 'runjs') return <RunjsIcon style={{ height, width }} />;
  if (key === 'tooljetdb') return <RunTooljetDbIcon style={{ height, width }} />;
  if (key === 'runpy') return <RunPyIcon style={{ height, width }} />;
  const Icon = allSvgs[key];

  if (!Icon) return <></>;

  return <Icon style={{ height, width, ...styles }} />;
};

export const debuggerActions = {
  error: (errors) => {
    useCurrentStateStore.getState().actions.setErrors({
      ...errors,
    });
  },

  flush: () => {
    useCurrentStateStore.getState().actions.setCurrentState({
      errors: {},
    });
  },

  //* @params: errors - Object
  generateErrorLogs: (errors) => {
    const errorsArr = [];
    Object.entries(errors).forEach(([key, value]) => {
      const errorType =
        value.type === 'query' && (value.kind === 'restapi' || value.kind === 'tooljetdb' || value.kind === 'runjs')
          ? value.kind
          : value.type;

      const error = {};
      const generalProps = {
        key,
        type: value.type,
        kind: errorType !== 'transformations' ? value.kind : 'transformations',
        page: value.page,
        timestamp: moment(),
        strace: value.strace ?? 'app_level',
      };

      switch (errorType) {
        case 'restapi':
          generalProps.message = value.data.message;
          generalProps.description = value.data.description;
          error.substitutedVariables = value.options;
          error.request = value.data.data.requestObject;
          error.response = value.data.data.responseObject;
          break;

        case 'tooljetdb':
          generalProps.message = value.data.message;
          generalProps.description = value.data.description;
          error.substitutedVariables = value.options;
          error.request = value.data.data.requestObject;
          error.response = value.data.data.responseObject;
          break;

        case 'runjs':
          error.message = value.data.data.message;
          error.description = value.data.data.description;
          break;

        case 'query':
          error.message = value.data.message;
          error.description = value.data.description;
          error.substitutedVariables = value.options;
          break;

        case 'transformations':
          generalProps.message = value.data.message;
          error.data = value.data.data ?? value.data;
          break;

        case 'component':
          generalProps.message = value.data.message;
          generalProps.property = key.split('- ')[1];
          error.resolvedProperties = value.resolvedProperties;
          break;
        case 'navToDisablePage':
          generalProps.message = value.data.message;
          break;

        default:
          break;
      }
      errorsArr.push({
        error,
        ...generalProps,
      });
    });
    return errorsArr;
  },

  generateQuerySuccessLogs: (logs) => {
    const querySuccesslogs = [];
    Object.entries(logs).forEach(([key, value]) => {
      const generalProps = {
        key,
        type: value.type,
        page: value.page,
        timestamp: moment(),
        message: 'Completed',
        description: value?.data?.description ?? '',
        isQuerySuccessLog: true,
      };

      querySuccesslogs.push(generalProps);
    });
    return querySuccesslogs;
  },
  flushAllLog: () => {
    useCurrentStateStore.getState().actions.setCurrentState({
      succededQuery: {},
    });
  },
};

export const getComponentName = (currentState, id) => {
  try {
    const name = Object.entries(currentState?.components).filter(([_, component]) => component.id === id)[0][0];
    return name;
  } catch {
    return '';
  }
};

const updateNewComponents = (pageId, appDefinition, newComponents, updateAppDefinition, componentMap, isCut) => {
  const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

  newAppDefinition.pages[pageId].components = {
    ...newAppDefinition.pages[pageId].components,
    ...newComponents,
  };

  const opts = {
    componentAdded: true,
    containerChanges: true,
  };

  if (!isCut) {
    opts.cloningComponent = componentMap;
  }

  updateAppDefinition(newAppDefinition, opts);
};

export const cloneComponents = (
  selectedComponents,
  appDefinition,
  currentPageId,
  updateAppDefinition,
  isCloning = true,
  isCut = false
) => {
  if (selectedComponents.length < 1) return getSelectedText();

  const { components: allComponents } = appDefinition.pages[currentPageId];
  let newDefinition = _.cloneDeep(appDefinition);
  let newComponents = [],
    newComponentObj = {},
    addedComponentId = new Set();
  for (let selectedComponent of selectedComponents) {
    if (addedComponentId.has(selectedComponent.id)) continue;
    const component = {
      component: allComponents[selectedComponent.id]?.component,
      layouts: allComponents[selectedComponent.id]?.layouts,
      parent: allComponents[selectedComponent.id]?.parent,
      componentId: selectedComponent.id,
    };
    addedComponentId.add(selectedComponent.id);
    let clonedComponent = JSON.parse(JSON.stringify(component));

    newComponents.push(clonedComponent);
    const children = getAllChildComponents(allComponents, selectedComponent.id);

    if (children.length > 0) {
      newComponents.push(...children);
    }

    newComponentObj = {
      newComponents,
      isCloning,
      isCut,
    };
  }

  if (isCloning) {
    const parentId = selectedComponents[0]['component']?.parent ?? undefined;

    addComponents(currentPageId, appDefinition, updateAppDefinition, parentId, newComponentObj, true);
    toast.success('Component cloned succesfully');
  } else if (isCut) {
    navigator.clipboard.writeText(JSON.stringify(newComponentObj));
    removeSelectedComponent(currentPageId, newDefinition, selectedComponents, updateAppDefinition);
  } else {
    navigator.clipboard.writeText(JSON.stringify(newComponentObj));
    const successMessage =
      newComponentObj.newComponents.length > 1 ? 'Components copied successfully' : 'Component copied successfully';
    toast.success(successMessage);
  }

  return new Promise((resolve) => {
    useEditorStore.getState().actions.updateEditorState({
      currentSidebarTab: 2,
    });
    resolve();
  });
};

const getAllChildComponents = (allComponents, parentId) => {
  const childComponents = [];

  Object.keys(allComponents).forEach((componentId) => {
    const componentParentId = allComponents[componentId].component?.parent;

    const isParentTabORCalendar =
      allComponents[parentId]?.component?.component === 'Tabs' ||
      allComponents[parentId]?.component?.component === 'Calendar';

    if (componentParentId && isParentTabORCalendar) {
      const childComponent = allComponents[componentId];
      const childTabId = componentParentId.split('-').at(-1);
      if (componentParentId === `${parentId}-${childTabId}`) {
        childComponent.componentId = componentId;
        childComponents.push(childComponent);
      }
    }

    if (componentParentId === parentId) {
      const childComponent = allComponents[componentId];
      childComponent.componentId = componentId;
      childComponents.push(childComponent);
    }
  });

  return childComponents;
};

const updateComponentLayout = (components, parentId, isCut = false) => {
  let prevComponent;
  components.forEach((component, index) => {
    Object.keys(component.layouts).map((layout) => {
      if (parentId !== undefined) {
        if (index > 0) {
          component.layouts[layout].top = prevComponent.layouts[layout].top + prevComponent.layouts[layout].height;
          component.layouts[layout].left = 0;
        } else {
          component.layouts[layout].top = 0;
          component.layouts[layout].left = 0;
        }
        prevComponent = component;
      } else if (!isCut && !component.component.parent) {
        component.layouts[layout].top = component.layouts[layout].top + component.layouts[layout].height;
      }
    });
  });
};

const isChildOfTabsOrCalendar = (component, allComponents = [], componentParentId = undefined) => {
  const parentId = componentParentId ?? component.component?.parent?.split('-').slice(0, -1).join('-');

  const parentComponent = allComponents.find((comp) => comp.componentId === parentId);

  if (parentComponent) {
    return parentComponent.component.component === 'Tabs' || parentComponent.component.component === 'Calendar';
  }

  return false;
};

export const addComponents = (
  pageId,
  appDefinition,
  appDefinitionChanged,
  parentId = undefined,
  newComponentObj,
  fromClipboard = false
) => {
  const finalComponents = {};
  const componentMap = {};
  let parentComponent = undefined;
  const { isCloning, isCut, newComponents: pastedComponents = [] } = newComponentObj;

  if (parentId) {
    const id = Object.keys(appDefinition.pages[pageId].components).filter((key) => parentId.startsWith(key));
    parentComponent = JSON.parse(JSON.stringify(appDefinition.pages[pageId].components[id[0]]));
  }

  pastedComponents.forEach((component) => {
    const newComponentId = uuidv4();
    const componentName = computeComponentName(component.component.component, {
      ...appDefinition.pages[pageId].components,
      ...finalComponents,
    });

    const isParentAlsoCopied = component.component.parent && componentMap[component.component.parent];

    componentMap[component.componentId] = newComponentId;
    let isChild = parentId ? parentId : component.component.parent;
    const componentData = JSON.parse(JSON.stringify(component.component));

    if (isCloning && parentId && !componentData.parent) {
      isChild = component.component.parent;
    }

    if (!parentComponent && !isParentAlsoCopied && isChild && fromClipboard) {
      isChild = undefined;
      componentData.parent = undefined;
    }

    if (!isCloning && parentComponent && fromClipboard) {
      componentData.parent = isParentAlsoCopied ?? parentId;
    } else if (isChild && isChildOfTabsOrCalendar(component, pastedComponents, parentId)) {
      const parentId = component.component.parent.split('-').slice(0, -1).join('-');
      const childTabId = component.component.parent.split('-').at(-1);

      componentData.parent = `${componentMap[parentId]}-${childTabId}`;
    } else if (isChild) {
      const isParentInMap = componentMap[isChild] !== undefined;

      componentData.parent = isParentInMap ? componentMap[isChild] : isChild;
    }

    const newComponent = {
      component: {
        ...componentData,
        name: componentName,
      },
      layouts: component.layouts,
    };
    finalComponents[newComponentId] = newComponent;
  });

  !isCloning && updateComponentLayout(pastedComponents, parentId, isCut);

  updateNewComponents(pageId, appDefinition, finalComponents, appDefinitionChanged, componentMap, isCut);
  !isCloning && toast.success('Component pasted succesfully');
};

export const addNewWidgetToTheEditor = (
  componentMeta,
  eventMonitorObject,
  currentComponents,
  canvasBoundingRect,
  currentLayout,
  shouldSnapToGrid,
  zoomLevel,
  isInSubContainer = false,
  addingDefault = false
) => {
  const componentMetaData = _.cloneDeep(componentMeta);
  const componentData = _.cloneDeep(componentMetaData);

  const defaultWidth = isInSubContainer
    ? (componentMetaData.defaultSize.width * 100) / 43
    : componentMetaData.defaultSize.width;
  const defaultHeight = componentMetaData.defaultSize.height;

  componentData.name = computeComponentName(componentData.component, currentComponents);

  let left = 0;
  let top = 0;

  if (isInSubContainer && addingDefault) {
    const newComponent = {
      id: uuidv4(),
      component: componentData,
      layout: {
        [currentLayout]: {
          top: top,
          left: left,
        },
      },
    };

    return newComponent;
  }

  const offsetFromTopOfWindow = canvasBoundingRect.top;
  const offsetFromLeftOfWindow = canvasBoundingRect.left;
  const currentOffset = eventMonitorObject.getSourceClientOffset();
  const initialClientOffset = eventMonitorObject.getInitialClientOffset();
  const delta = eventMonitorObject.getDifferenceFromInitialOffset();
  const subContainerWidth = canvasBoundingRect.width;

  left = Math.round(currentOffset?.x + currentOffset?.x * (1 - zoomLevel) - offsetFromLeftOfWindow);
  top = Math.round(
    initialClientOffset?.y - 10 + delta.y + initialClientOffset?.y * (1 - zoomLevel) - offsetFromTopOfWindow
  );

  if (shouldSnapToGrid) {
    [left, top] = snapToGrid(subContainerWidth, left, top);
  }

  const gridWidth = subContainerWidth / 43;
  left = Math.round(left / gridWidth);
  console.log('Top calc', { top, initialClientOffset, delta, zoomLevel, offsetFromTopOfWindow, subContainerWidth });
  // left = (left * 100) / subContainerWidth;

  if (currentLayout === 'mobile') {
    componentData.definition.others.showOnDesktop.value = false;
    componentData.definition.others.showOnMobile.value = true;
  }

  const widgetsWithDefaultComponents = ['Listview', 'Tabs', 'Form', 'Kanban'];

  const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';
  const newComponent = {
    id: uuidv4(),
    component: componentData,
    layout: {
      [currentLayout]: {
        top: top,
        left: left,
        width: defaultWidth,
        height: defaultHeight,
      },
      [nonActiveLayout]: {
        top: top,
        left: left,
        width: defaultWidth,
        height: defaultHeight,
      },
    },

    withDefaultChildren: widgetsWithDefaultComponents.includes(componentData.component),
  };

  return newComponent;
};

export function snapToGrid(canvasWidth, x, y) {
  const gridX = canvasWidth / 43;

  const snappedX = Math.round(x / gridX) * gridX;
  const snappedY = Math.round(y / 10) * 10;
  return [snappedX, snappedY];
}
export const removeSelectedComponent = (pageId, newDefinition, selectedComponents, updateAppDefinition) => {
  selectedComponents.forEach((component) => {
    let childComponents = [];

    if (newDefinition.pages[pageId].components[component.id]?.component?.component === 'Tabs') {
      childComponents = Object.keys(newDefinition.pages[pageId].components).filter((key) =>
        newDefinition.pages[pageId].components[key].parent?.startsWith(component.id)
      );
    } else {
      childComponents = Object.keys(newDefinition.pages[pageId].components).filter(
        (key) => newDefinition.pages[pageId].components[key].parent === component.id
      );
    }

    childComponents.forEach((componentId) => {
      delete newDefinition.pages[pageId].components[componentId];
    });

    delete newDefinition.pages[pageId].components[component.id];
  });

  updateAppDefinition(newDefinition, { componentDefinitionChanged: true, componentDeleted: true });
};

const getSelectedText = () => {
  if (window.getSelection) {
    navigator.clipboard.writeText(window.getSelection());
  }
  if (window.document.getSelection) {
    navigator.clipboard.writeText(window.document.getSelection());
  }
  if (window.document.selection) {
    navigator.clipboard.writeText(window.document.selection.createRange().text);
  }
};

function convertMapSet(obj) {
  if (obj instanceof Map) {
    return Object.fromEntries(Array.from(obj, ([key, value]) => [key, convertMapSet(value)]));
  } else if (obj instanceof Set) {
    return Array.from(obj).map(convertMapSet);
  } else if (Array.isArray(obj)) {
    return obj.map(convertMapSet);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, convertMapSet(value)]));
  } else {
    return obj;
  }
}

export const checkExistingQueryName = (newName) =>
  useDataQueriesStore.getState().dataQueries.some((query) => query.name === newName);

export const runQueries = (queries, _ref) => {
  queries.forEach((query) => {
    if (query.options.runOnPageLoad && isQueryRunnable(query)) {
      runQuery(_ref, query.id, query.name);
    }
  });
};

export const computeQueryState = (queries) => {
  let queryState = {};
  queries.forEach((query) => {
    if (query.plugin?.plugin_id) {
      queryState[query.name] = {
        ...query.plugin.manifest_file.data?.source?.exposedVariables,
        kind: query.plugin.manifest_file.data.source.kind,
        ...getCurrentState().queries[query.name],
      };
    } else {
      queryState[query.name] = {
        ...DataSourceTypes.find((source) => source.kind === query.kind)?.exposedVariables,
        kind: DataSourceTypes.find((source) => source.kind === query.kind)?.kind,
        ...getCurrentState()?.queries[query.name],
      };
    }
  });
  const hasDiffQueryState = !_.isEqual(getCurrentState()?.queries, queryState);
  if (hasDiffQueryState) {
    useCurrentStateStore.getState().actions.setCurrentState({
      queries: {
        ...queryState,
      },
    });
  }
};

export const buildComponentMetaDefinition = (components = {}) => {
  for (const componentId in components) {
    const currentComponentData = components[componentId];

    const componentMeta = componentTypes.find((comp) => currentComponentData.component.component === comp.component);

    const mergedDefinition = {
      ...componentMeta.definition,

      properties: {
        ...componentMeta.definition.properties,
        ...currentComponentData?.component.definition.properties,
      },

      styles: {
        ...componentMeta.definition.styles,
        ...currentComponentData?.component.definition.styles,
      },
      generalStyles: {
        ...componentMeta.definition.generalStyles,
        ...currentComponentData?.component.definition.generalStyles,
      },
      validation: {
        ...componentMeta.definition.validation,
        ...currentComponentData?.component.definition.validation,
      },
      others: {
        ...componentMeta.definition.others,
        ...currentComponentData?.component.definition.others,
      },
      general: {
        ...componentMeta.definition.general,
        ...currentComponentData?.component.definition.general,
      },
    };

    const mergedComponent = {
      component: {
        ...componentMeta,
        ...currentComponentData.component,
      },
      layouts: {
        ...currentComponentData.layouts,
      },
      withDefaultChildren: componentMeta.withDefaultChildren ?? false,
    };

    mergedComponent.component.definition = mergedDefinition;

    components[componentId] = mergedComponent;
  }

  return components;
};

export const buildAppDefinition = (data) => {
  const editingVersion = _.omit(camelizeKeys(data.editing_version), ['definition', 'updatedAt', 'createdAt', 'name']);

  editingVersion['currentVersionId'] = editingVersion.id;
  _.unset(editingVersion, 'id');

  const pages = data.pages.reduce((acc, page) => {
    const currentComponents = buildComponentMetaDefinition(_.cloneDeep(page?.components));

    page.components = currentComponents;

    acc[page.id] = page;

    return acc;
  }, {});

  const appJSON = {
    globalSettings: editingVersion.globalSettings,
    homePageId: editingVersion.homePageId,
    showViewerNavigation: editingVersion.showViewerNavigation ?? true,
    pages: pages,
  };

  return appJSON;
};

export const removeFunctionObjects = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'function') {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeFunctionObjects(obj[key]);
    }
  }
  return obj;
};
