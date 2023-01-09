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

export function onComponentOptionsChanged(_ref, component, options) {
  const componentName = component.name;
  const components = _ref.state.currentState.components;
  let componentData = components[componentName];
  componentData = componentData || {};

  for (const option of options) {
    componentData[option[0]] = option[1];
  }

  return setCurrentStateAsync(_ref, {
    components: { ...components, [componentName]: componentData },
  });
}

export function onComponentOptionChanged(_ref, component, option_name, value) {
  const componentName = component.name;
  const components = _ref.state.currentState.components;
  let componentData = components[componentName];
  componentData = componentData || {};
  componentData[option_name] = value;

  return setCurrentStateAsync(_ref, {
    components: { ...components, [componentName]: componentData },
  });
}

export function fetchOAuthToken(authUrl, dataSourceId) {
  localStorage.setItem('sourceWaitingForOAuth', dataSourceId);
  window.open(authUrl);
}

export function addToLocalStorage(object) {
  localStorage.setItem(object['key'], object['value']);
}

export function getDataFromLocalStorage(key) {
  return localStorage.getItem(key);
}

async function executeRunPycode(_ref, code, query, editorState, isPreview, mode) {
  const pyodide = await loadPyodide();

  const evaluatePythonCode = async (pyodide) => {
    let result = {};
    const { currentState } = _ref.state;
    try {
      const appStateVars = currentState['variables'] ?? {};

      const actions = generateAppActions(_ref, query.id, mode, editorState, isPreview);

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
      await pyodide.globals.set('variables', appStateVars);
      await pyodide.globals.set('actions', actions);

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

    return pyodide.isPyProxy(result) ? result.toJs() : result;
  };

  return { data: await evaluatePythonCode(pyodide, code) };
}

async function exceutePycode(payload, code, currentState, query, mode) {
  const pyodide = await loadPyodide();

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

  const currentState = _ref.state.currentState || {};

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

export async function executeActionsForEventId(_ref, eventId, component, mode, customVariables) {
  const events = component?.definition?.events || [];
  const filteredEvents = events.filter((event) => event.eventId === eventId);

  for (const event of filteredEvents) {
    await executeAction(_ref, event, mode, customVariables); // skipcq: JS-0032
  }
}

export function onComponentClick(_ref, id, component, mode = 'edit') {
  executeActionsForEventId(_ref, 'onClick', component, mode);
}

export function onQueryConfirmOrCancel(_ref, queryConfirmationData, isConfirm = false, mode = 'edit') {
  const filtertedQueryConfirmation = _ref.state?.queryConfirmationList.filter(
    (query) => query.queryId !== queryConfirmationData.queryId
  );

  _ref.setState({
    queryConfirmationList: filtertedQueryConfirmation,
  });
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

  const modalMeta = _ref.state.appDefinition.pages[_ref.state.currentPageId].components[modalId];
  const newState = {
    currentState: {
      ..._ref.state.currentState,
      components: {
        ..._ref.state.currentState.components,
        [modalMeta.component.name]: {
          ..._ref.state.currentState.components[modalMeta.component.name],
          show: show,
        },
      },
    },
  };
  _ref.setState(newState);

  return Promise.resolve();
}

function logoutAction(_ref) {
  localStorage.clear();
  _ref.props.history.push('/login');
  window.location.href = '/login';

  return Promise.resolve();
}
export const executeAction = (_ref, event, mode, customVariables) => {
  console.log('nopski', customVariables);
  if (event) {
    switch (event.actionId) {
      case 'show-alert': {
        const message = resolveReferences(event.message, _ref.state.currentState, undefined, customVariables);
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
        return runQuery(_ref, queryId, queryName, undefined, mode);
      }
      case 'logout': {
        return logoutAction(_ref);
      }

      case 'open-webpage': {
        const url = resolveReferences(event.url, _ref.state.currentState, undefined, customVariables);
        window.open(url, '_blank');
        return Promise.resolve();
      }

      case 'go-to-app': {
        const slug = resolveReferences(event.slug, _ref.state.currentState, undefined, customVariables);
        const queryParams = event.queryParams?.reduce(
          (result, queryParam) => ({
            ...result,
            ...{
              [resolveReferences(queryParam[0], _ref.state.currentState)]: resolveReferences(
                queryParam[1],
                _ref.state.currentState,
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
          _ref.props.history.push(url);
          _ref.props.history.go();
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
        const contentToCopy = resolveReferences(
          event.contentToCopy,
          _ref.state.currentState,
          undefined,
          customVariables
        );
        copyToClipboard(contentToCopy);

        return Promise.resolve();
      }

      case 'set-localstorage-value': {
        const key = resolveReferences(event.key, _ref.state.currentState, undefined, customVariables);
        const value = resolveReferences(event.value, _ref.state.currentState, undefined, customVariables);
        localStorage.setItem(key, value);

        return Promise.resolve();
      }

      case 'generate-file': {
        // const fileType = event.fileType;
        const data = resolveReferences(event.data, _ref.state.currentState, undefined, customVariables) ?? [];
        const fileName =
          resolveReferences(event.fileName, _ref.state.currentState, undefined, customVariables) ?? 'data.txt';
        const fileType =
          resolveReferences(event.fileType, _ref.state.currentState, undefined, customVariables) ?? 'csv';
        const fileData = {
          csv: generateCSV,
          plaintext: (plaintext) => plaintext,
        }[fileType](data);
        generateFile(fileName, fileData, fileType);
        return Promise.resolve();
      }

      case 'set-table-page': {
        setTablePageIndex(_ref, event.table, event.pageIndex);
        break;
      }

      case 'set-custom-variable': {
        const key = resolveReferences(event.key, _ref.state.currentState, undefined, customVariables);
        const value = resolveReferences(event.value, _ref.state.currentState, undefined, customVariables);
        const customAppVariables = { ..._ref.state.currentState.variables };
        customAppVariables[key] = value;

        return _ref.setState({
          currentState: {
            ..._ref.state.currentState,
            variables: customAppVariables,
          },
        });
      }

      case 'unset-custom-variable': {
        const key = resolveReferences(event.key, _ref.state.currentState, undefined, customVariables);
        const customAppVariables = { ..._ref.state.currentState.variables };
        delete customAppVariables[key];

        return _ref.setState({
          currentState: {
            ..._ref.state.currentState,
            variables: customAppVariables,
          },
        });
      }

      case 'set-page-variable': {
        const key = resolveReferences(event.key, _ref.state.currentState, undefined, customVariables);
        const value = resolveReferences(event.value, _ref.state.currentState, undefined, customVariables);
        const customPageVariables = {
          ..._ref.state.currentState.page.variables,
          [key]: value,
        };

        return _ref.setState({
          currentState: {
            ..._ref.state.currentState,
            page: {
              ..._ref.state.currentState.page,
              variables: customPageVariables,
            },
          },
        });
      }

      case 'unset-page-variable': {
        const key = resolveReferences(event.key, _ref.state.currentState, undefined, customVariables);
        const customPageVariables = _.omit(_ref.state.currentState.page.variables, key);

        return _ref.setState({
          currentState: {
            ..._ref.state.currentState,
            page: {
              ..._ref.state.currentState.page,
              variables: customPageVariables,
            },
          },
        });
      }

      case 'control-component': {
        const component = Object.values(_ref.state.currentState?.components ?? {}).filter(
          (component) => component.id === event.componentId
        )[0];
        const action = component[event.componentSpecificActionHandle];
        const actionArguments = _.map(event.componentSpecificActionParams, (param) => ({
          ...param,
          value: resolveReferences(param.value, _ref.state.currentState, undefined, customVariables),
        }));
        const actionPromise = action(...actionArguments.map((argument) => argument.value));
        return actionPromise ?? Promise.resolve();
      }

      case 'switch-page': {
        _ref.switchPage(
          event.pageId,
          resolveReferences(event.queryParams, _ref.state.currentState, [], customVariables)
        );
        return Promise.resolve();
      }
    }
  }
};

export async function onEvent(_ref, eventName, options, mode = 'edit') {
  let _self = _ref;
  console.log('Event: ', eventName);

  const { customVariables } = options;

  if (eventName === 'onPageLoad') {
    await executeActionsForEventId(_ref, 'onPageLoad', { definition: { events: [options] } }, mode, customVariables);
  }

  if (eventName === 'onTrigger') {
    const { component, queryId, queryName } = options;
    _self.setState(
      {
        currentState: {
          ..._self.state.currentState,
          components: {
            ..._self.state.currentState.components,
            [component.name]: {
              ..._self.state.currentState.components[component.name],
            },
          },
        },
      },
      () => {
        runQuery(_ref, queryId, queryName, true, mode);
      }
    );
  }

  if (eventName === 'onCalendarEventSelect') {
    const { component, calendarEvent } = options;
    _self.setState(
      {
        currentState: {
          ..._self.state.currentState,
          components: {
            ..._self.state.currentState.components,
            [component.name]: {
              ..._self.state.currentState.components[component.name],
              selectedEvent: { ...calendarEvent },
            },
          },
        },
      },
      () => {
        executeActionsForEventId(_ref, 'onCalendarEventSelect', component, mode, customVariables);
      }
    );
  }

  if (eventName === 'onCalendarSlotSelect') {
    const { component, selectedSlots } = options;
    _self.setState(
      {
        currentState: {
          ..._self.state.currentState,
          components: {
            ..._self.state.currentState.components,
            [component.name]: {
              ..._self.state.currentState.components[component.name],
              selectedSlots,
            },
          },
        },
      },
      () => {
        executeActionsForEventId(_ref, 'onCalendarSlotSelect', component, mode, customVariables);
      }
    );
  }

  if (eventName === 'onTableActionButtonClicked') {
    const { component, data, action, rowId } = options;
    _self.setState(
      {
        currentState: {
          ..._self.state.currentState,
          components: {
            ..._self.state.currentState.components,
            [component.name]: {
              ..._self.state.currentState.components[component.name],
              selectedRow: data,
              selectedRowId: rowId,
            },
          },
        },
      },
      async () => {
        if (action && action.events) {
          for (const event of action.events) {
            if (event.actionId) {
              // the event param uses a hacky workaround for using same format used by event manager ( multiple handlers )
              await executeAction(_self, { ...event, ...event.options }, mode, customVariables);
            }
          }
        } else {
          console.log('No action is associated with this event');
        }
      }
    );
  }

  if (eventName === 'OnTableToggleCellChanged') {
    const { component, column, rowId, row } = options;
    _self.setState(
      {
        currentState: {
          ..._self.state.currentState,
          components: {
            ..._self.state.currentState.components,
            [component.name]: {
              ..._self.state.currentState.components[component.name],
              selectedRow: row,
              selectedRowId: rowId,
            },
          },
        },
      },
      async () => {
        if (column && column.events) {
          for (const event of column.events) {
            if (event.actionId) {
              // the event param uses a hacky workaround for using same format used by event manager ( multiple handlers )
              await executeAction(_self, { ...event, ...event.options }, mode, customVariables);
            }
          }
        } else {
          console.log('No action is associated with this event');
        }
      }
    );
  }

  if (
    [
      'onDetect',
      'onCheck',
      'onUnCheck',
      'onBoundsChange',
      'onCreateMarker',
      'onMarkerClick',
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
      'onCardAdded',
      'onCardRemoved',
      'onCardMoved',
      'onCardSelected',
      'onCardUpdated',
      'onTabSwitch',
      'onFocus',
      'onBlur',
      'onOpen',
      'onClose',
      'onRowClicked',
      'onCancelChanges',
      'onSort',
      'onCellValueChanged',
      'onFilterChanged',
      'onRowHovered',
      'onSubmit',
      'onInvalid',
    ].includes(eventName)
  ) {
    const { component } = options;
    executeActionsForEventId(_ref, eventName, component, mode, customVariables);
  }

  if (eventName === 'onBulkUpdate') {
    onComponentOptionChanged(_self, options.component, 'isSavingChanges', true);
    await executeActionsForEventId(_self, eventName, options.component, mode, customVariables);
    onComponentOptionChanged(_self, options.component, 'isSavingChanges', false);
  }

  if (['onDataQuerySuccess', 'onDataQueryFailure'].includes(eventName)) {
    await executeActionsForEventId(_self, eventName, options, mode, customVariables);
  }
}

export function getQueryVariables(options, state) {
  let queryVariables = {};
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

export function previewQuery(_ref, query, editorState, calledFromQuery = false) {
  const options = getQueryVariables(query.options, _ref.props.currentState);

  _ref.setState({ previewLoading: true });

  return new Promise(function (resolve, reject) {
    let queryExecutionPromise = null;
    if (query.kind === 'runjs') {
      queryExecutionPromise = executeMultilineJS(_ref, query.options.code, editorState, query?.id, true);
    } else if (query.kind === 'tooljetdb') {
      const { organization_id } = JSON.parse(localStorage.getItem('currentUser'));
      queryExecutionPromise = tooljetDbOperations.perform(query.options, organization_id, _ref.state.currentState);
    } else if (query.kind === 'runpy') {
      queryExecutionPromise = executeRunPycode(_ref, query.options.code, query, editorState, true, 'edit');
    } else {
      queryExecutionPromise = dataqueryService.preview(query, options, editorState?.state?.editingVersion?.id);
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
          _ref.setState({ previewLoading: false });
        } else {
          _ref.setState({ previewLoading: false, queryPreviewData: finalData });
        }

        const queryStatus =
          query.kind === 'tooljetdb'
            ? data.statusText
            : query.kind === 'runpy'
            ? data?.data?.status ?? 'ok'
            : data.status;
        switch (queryStatus) {
          case 'Bad Request':
          case 'failed': {
            const err = query.kind == 'tooljetdb' ? data.error : _.isEmpty(data.data) ? data : data.data;
            toast.error(`${err.message}`);
            break;
          }
          case 'needs_oauth': {
            const url = data.data.auth_url; // Backend generates and return sthe auth url
            fetchOAuthToken(url, query.data_source_id);
            break;
          }
          case 'ok':
          case 'OK':
          case 'Created':
          case 'Accepted':
          case 'No Content': {
            toast(`Query completed.`, {
              icon: '🚀',
            });
            break;
          }
        }

        resolve({ status: data.status, data: finalData });
      })
      .catch(({ error, data }) => {
        _ref.setState({ previewLoading: false, queryPreviewData: data });
        toast.error(error);
        reject({ error, data });
      });
  });
}

export function runQuery(_ref, queryId, queryName, confirmed = undefined, mode = 'edit') {
  const query = _ref.state.app.data_queries.find((query) => query.id === queryId);
  let dataQuery = {};

  if (query) {
    dataQuery = JSON.parse(JSON.stringify(query));
  } else {
    toast.error('No query has been associated with the action.');
    return;
  }

  const options = getQueryVariables(dataQuery.options, _ref.state.currentState);

  if (dataQuery.options.requestConfirmation) {
    const queryConfirmationList = _ref.state?.queryConfirmationList ? [..._ref.state?.queryConfirmationList] : [];
    const queryConfirmation = {
      queryId,
      queryName,
    };
    if (!queryConfirmationList.some((query) => queryId === query.queryId)) {
      queryConfirmationList.push(queryConfirmation);
    }

    if (confirmed === undefined) {
      _ref.setState({
        queryConfirmationList,
      });
      return;
    }
  }
  const newState = {
    ..._ref.state.currentState,
    queries: {
      ..._ref.state.currentState.queries,
      [queryName]: {
        ..._ref.state.currentState.queries[queryName],
        isLoading: true,
        data: [],
        rawData: [],
      },
    },
    errors: {},
  };

  let _self = _ref;

  // eslint-disable-next-line no-unused-vars
  return new Promise(function (resolve, reject) {
    _self.setState({ currentState: newState }, () => {
      let queryExecutionPromise = null;
      if (query.kind === 'runjs') {
        queryExecutionPromise = executeMultilineJS(_self, query.options.code, _ref, query?.id, false, confirmed, mode);
      } else if (query.kind === 'runpy') {
        queryExecutionPromise = executeRunPycode(_self, query.options.code, query, _ref, false, mode);
      } else if (query.kind === 'tooljetdb') {
        const { organization_id } = JSON.parse(localStorage.getItem('currentUser'));
        queryExecutionPromise = tooljetDbOperations.perform(query.options, organization_id, _self.state.currentState);
      } else {
        queryExecutionPromise = dataqueryService.run(queryId, options);
      }

      queryExecutionPromise
        .then(async (data) => {
          if (data.status === 'needs_oauth') {
            const url = data.data.auth_url; // Backend generates and return sthe auth url
            fetchOAuthToken(url, dataQuery['data_source_id'] || dataQuery['dataSourceId']);
          }

          const promiseStatus =
            query.kind === 'tooljetdb'
              ? data.statusText
              : query.kind === 'runpy'
              ? data?.data?.status ?? 'ok'
              : data.status;

          if (promiseStatus === 'failed' || promiseStatus === 'Bad Request') {
            const errorData = query.kind === 'runpy' ? data.data : data;
            return _self.setState(
              {
                currentState: {
                  ..._self.state.currentState,
                  queries: {
                    ..._self.state.currentState.queries,
                    [queryName]: _.assign(
                      {
                        ..._self.state.currentState.queries[queryName],
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
                  errors: {
                    ..._self.state.currentState.errors,
                    [queryName]: {
                      type: 'query',
                      kind: query.kind,
                      data: errorData,
                      options: options,
                    },
                  },
                },
              },
              () => {
                resolve(data);
                onEvent(_self, 'onDataQueryFailure', {
                  definition: { events: dataQuery.options.events },
                });
                if (mode !== 'view') {
                  const err = query.kind == 'tooljetdb' ? data.error : _.isEmpty(data.data) ? data : data.data;
                  toast.error(err.message);
                }
              }
            );
          }

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
              console.log('runPythonTransformation', finalData);
              return _self.setState(
                {
                  currentState: {
                    ..._self.state.currentState,
                    queries: {
                      ..._self.state.currentState.queries,
                      [queryName]: {
                        ..._self.state.currentState.queries[queryName],
                        isLoading: false,
                      },
                    },
                    errors: {
                      ..._self.state.currentState.errors,
                      [queryName]: {
                        type: 'transformations',
                        data: finalData,
                        options: options,
                      },
                    },
                  },
                },
                () => {
                  resolve(finalData);
                  onEvent(_self, 'onDataQueryFailure', {
                    definition: { events: dataQuery.options.events },
                  });
                }
              );
            }
          }

          if (dataQuery.options.showSuccessNotification) {
            const notificationDuration = dataQuery.options.notificationDuration * 1000 || 5000;
            toast.success(dataQuery.options.successMessage, {
              duration: notificationDuration,
            });
          }

          _self.setState(
            {
              currentState: {
                ..._self.state.currentState,
                queries: {
                  ..._self.state.currentState.queries,
                  [queryName]: _.assign(
                    {
                      ..._self.state.currentState.queries[queryName],
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
              },
            },
            () => {
              resolve({ status: 'ok', data: finalData });
              onEvent(_self, 'onDataQuerySuccess', { definition: { events: dataQuery.options.events } }, mode);

              if (mode !== 'view') {
                toast(`Query (${queryName}) completed.`, {
                  icon: '🚀',
                });
              }
            }
          );
        })
        .catch(({ error }) => {
          if (mode !== 'view') toast.error(error ?? 'Unknown error');
          _self.setState(
            {
              currentState: {
                ..._self.state.currentState,
                queries: {
                  ..._self.state.currentState.queries,
                  [queryName]: {
                    isLoading: false,
                  },
                },
              },
            },
            () => {
              resolve({ status: 'failed', message: error });
            }
          );
        });
    });
  });
}

export function setTablePageIndex(_ref, tableId, index) {
  if (_.isEmpty(tableId)) {
    console.log('No table is associated with this event.');
    return Promise.resolve();
  }

  const table = Object.entries(_ref.state.currentState.components).filter((entry) => entry[1].id === tableId)[0][1];
  const newPageIndex = resolveReferences(index, _ref.state.currentState);
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

export function computeComponentState(_ref, components = {}) {
  let componentState = {};
  const currentComponents = _ref.state.currentState.components;
  Object.keys(components).forEach((key) => {
    const component = components[key];
    const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

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
        componentState[component.component.name] = {
          ...componentMeta.exposedVariables,
          id: key,
          ...existingValues,
        };
      }
    } else {
      componentState[component.component.name] = {
        ...componentMeta.exposedVariables,
        id: key,
        ...existingValues,
      };
    }
  });

  return setStateAsync(_ref, {
    currentState: {
      ..._ref.state.currentState,
      components: {
        ...componentState,
      },
    },
    defaultComponentStateComputed: true,
  });
}

export const getSvgIcon = (key, height = 50, width = 50, iconFile = undefined, styles = {}) => {
  if (iconFile) return <img src={`data:image/svg+xml;base64,${iconFile}`} style={{ height, width }} />;
  if (key === 'runjs') return <RunjsIcon style={{ height, width }} />;
  if (key === 'tooljetdb') return <RunTooljetDbIcon />;
  if (key === 'runpy') return <RunPyIcon />;
  const Icon = allSvgs[key];

  if (!Icon) return <></>;

  return <Icon style={{ height, width, ...styles }} />;
};

export const debuggerActions = {
  error: (_self, errors) => {
    _self.setState((prevState) => ({
      ...prevState,
      currentState: {
        ...prevState.currentState,
        errors: {
          ...prevState.currentState.errors,
          ...errors,
        },
      },
    }));
  },

  flush: (_self) => {
    _self.setState((prevState) => ({
      ...prevState,
      currentState: {
        ...prevState.currentState,
        errors: {},
      },
    }));
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
};

export const getComponentName = (currentState, id) => {
  try {
    const name = Object.entries(currentState?.components).filter(([_, component]) => component.id === id)[0][0];
    return name;
  } catch {
    return '';
  }
};

const updateNewComponents = (pageId, appDefinition, newComponents, updateAppDefinition) => {
  const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));
  newComponents.forEach((newComponent) => {
    newComponent.component.name = computeComponentName(
      newComponent.component.component,
      newAppDefinition.pages[pageId].components
    );
    newAppDefinition.pages[pageId].components[newComponent.id] = newComponent;
  });
  updateAppDefinition(newAppDefinition);
};

export const cloneComponents = (_ref, updateAppDefinition, isCloning = true, isCut = false) => {
  const { selectedComponents, appDefinition, currentPageId } = _ref.state;
  if (selectedComponents.length < 1) return getSelectedText();
  const { components: allComponents } = appDefinition.pages[currentPageId];
  let newDefinition = _.cloneDeep(appDefinition);
  let newComponents = [],
    newComponentObj = {},
    addedComponentId = new Set();
  for (let selectedComponent of selectedComponents) {
    if (addedComponentId.has(selectedComponent.id)) continue;
    const component = {
      id: selectedComponent.id,
      component: allComponents[selectedComponent.id]?.component,
      layouts: allComponents[selectedComponent.id]?.layouts,
      parent: allComponents[selectedComponent.id]?.parent,
    };
    addedComponentId.add(selectedComponent.id);
    let clonedComponent = JSON.parse(JSON.stringify(component));
    clonedComponent.parent = undefined;
    clonedComponent.children = [];
    clonedComponent.children = [...getChildComponents(allComponents, component, clonedComponent, addedComponentId)];
    newComponents = [...newComponents, clonedComponent];
    newComponentObj = {
      newComponents,
      isCloning,
      isCut,
    };
  }
  if (isCloning) {
    addComponents(currentPageId, appDefinition, updateAppDefinition, undefined, newComponentObj);
    toast.success('Component cloned succesfully');
  } else if (isCut) {
    navigator.clipboard.writeText(JSON.stringify(newComponentObj));
    removeSelectedComponent(currentPageId, newDefinition, selectedComponents);
    updateAppDefinition(newDefinition);
  } else {
    navigator.clipboard.writeText(JSON.stringify(newComponentObj));
    toast.success('Component copied succesfully');
  }
  _ref.setState({ currentSidebarTab: 2 });
};

const getChildComponents = (allComponents, component, parentComponent, addedComponentId) => {
  let childComponents = [],
    selectedChildComponents = [];

  if (component.component.component === 'Tabs' || component.component.component === 'Calendar') {
    childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent?.startsWith(component.id));
  } else {
    childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent === component.id);
  }

  childComponents.forEach((componentId) => {
    let childComponent = JSON.parse(JSON.stringify(allComponents[componentId]));
    childComponent.id = componentId;
    const newComponent = JSON.parse(
      JSON.stringify({
        id: componentId,
        component: allComponents[componentId]?.component,
        layouts: allComponents[componentId]?.layouts,
        parent: allComponents[componentId]?.parent,
      })
    );
    addedComponentId.add(componentId);

    if ((component.component.component === 'Tabs') | (component.component.component === 'Calendar')) {
      const childTabId = childComponent.parent.split('-').at(-1);
      childComponent.parent = `${parentComponent.id}-${childTabId}`;
    } else {
      childComponent.parent = parentComponent.id;
    }
    parentComponent.children = [...(parentComponent.children || []), childComponent];
    childComponent.children = [...getChildComponents(allComponents, newComponent, childComponent, addedComponentId)];
    selectedChildComponents.push(childComponent);
  });

  return selectedChildComponents;
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
      } else if (!isCut) {
        component.layouts[layout].top = component.layouts[layout].top + component.layouts[layout].height;
      }
    });
  });
};

export const addComponents = (pageId, appDefinition, appDefinitionChanged, parentId = undefined, newComponentObj) => {
  console.log({ pageId, newComponentObj });
  const finalComponents = [];
  let parentComponent = undefined;
  const { isCloning, isCut, newComponents: pastedComponent = [] } = newComponentObj;

  if (parentId) {
    const id = Object.keys(appDefinition.pages[pageId].components).filter((key) => parentId.startsWith(key));
    parentComponent = JSON.parse(JSON.stringify(appDefinition.pages[pageId].components[id[0]]));
    parentComponent.id = parentId;
  }

  !isCloning && updateComponentLayout(pastedComponent, parentId, isCut);

  const buildComponents = (components, parentComponent = undefined, skipTabCalendarCheck = false) => {
    if (Array.isArray(components) && components.length > 0) {
      components.forEach((component) => {
        const newComponent = {
          id: uuidv4(),
          component: component?.component,
          layouts: component?.layouts,
        };
        if (parentComponent) {
          if (
            !skipTabCalendarCheck &&
            (parentComponent.component.component === 'Tabs' || parentComponent.component.component === 'Calendar')
          ) {
            const childTabId = component.parent.split('-').at(-1);
            newComponent.parent = `${parentComponent.id}-${childTabId}`;
          } else {
            newComponent.parent = parentComponent.id;
          }
        }
        finalComponents.push(newComponent);
        if (component.children.length > 0) {
          buildComponents(component.children, newComponent);
        }
      });
    }
  };

  buildComponents(pastedComponent, parentComponent, true);

  updateNewComponents(pageId, appDefinition, finalComponents, appDefinitionChanged);
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

  left = (left * 100) / subContainerWidth;

  if (currentLayout === 'mobile') {
    componentData.definition.others.showOnDesktop.value = false;
    componentData.definition.others.showOnMobile.value = true;
  }

  const widgetsWithDefaultComponents = ['Listview', 'Tabs', 'Form'];

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
export const removeSelectedComponent = (pageId, newDefinition, selectedComponents) => {
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
