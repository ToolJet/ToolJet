import React from 'react';
import { toast } from 'react-hot-toast';
import {
  getDynamicVariables,
  resolveReferences,
  executeMultilineJS,
  serializeNestedObjectToQueryParams,
} from '@/_helpers/utils';
import { dataqueryService } from '@/_services';
import _ from 'lodash';
import moment from 'moment';
import Tooltip from 'react-bootstrap/Tooltip';
import { componentTypes } from '@/Editor/Components/components';
import generateCSV from '@/_lib/generate-csv';
import generateFile from '@/_lib/generate-file';
import { allSvgs } from '@tooljet/plugins/client';

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

  return setCurrentStateAsync(_ref, { components: { ...components, [componentName]: componentData } });
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

export function runTransformation(_ref, rawData, transformation, query) {
  const data = rawData;
  const evalFunction = Function(
    ['data', 'moment', '_', 'components', 'queries', 'globals', 'variables'],
    transformation
  );
  let result = [];

  const currentState = _ref.state.currentState || {};

  try {
    result = evalFunction(
      data,
      moment,
      _,
      currentState.components,
      currentState.queries,
      currentState.globals,
      currentState.variables
    );
  } catch (err) {
    console.log('Transformation failed for query: ', query.name, err);
    result = { message: err.stack.split('\n')[0], status: 'failed', data: data };
  }

  return result;
}

export async function executeActionsForEventId(_ref, eventId, component, mode, customVariables) {
  const events = component.definition.events || [];
  const filteredEvents = events.filter((event) => event.eventId === eventId);

  for (const event of filteredEvents) {
    await executeAction(_ref, event, mode, customVariables); // skipcq: JS-0032
  }
}

export function onComponentClick(_ref, id, component, mode = 'edit') {
  executeActionsForEventId(_ref, 'onClick', component, mode);
}

export function onQueryConfirm(_ref, queryConfirmationData) {
  _ref.setState({
    showQueryConfirmation: false,
  });
  runQuery(_ref, queryConfirmationData.queryId, queryConfirmationData.queryName, true);
}

export function onQueryCancel(_ref) {
  _ref.setState({
    showQueryConfirmation: false,
  });
}

async function copyToClipboard(text) {
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

  const modalMeta = _ref.state.appDefinition.components[modalId];

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
function executeAction(_ref, event, mode, customVariables) {
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
        return runQuery(_ref, queryId, queryName, true, mode);
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
            window.open(url, '_blank');
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

        const csv = generateCSV(data);
        generateFile(fileName, csv);
        return Promise.resolve();
      }

      case 'set-table-page': {
        setTablePageIndex(_ref, event.table, event.pageIndex);
        break;
      }

      case 'set-custom-variable': {
        const key = resolveReferences(event.key, _ref.state.currentState, undefined, customVariables);
        const value = resolveReferences(event.value, _ref.state.currentState, undefined, customVariables);
        const customVariables = { ..._ref.state.currentState.variables };
        customVariables[key] = value;

        return _ref.setState({
          currentState: {
            ..._ref.state.currentState,
            variables: customVariables,
          },
        });
      }

      case 'unset-custom-variable': {
        const key = resolveReferences(event.key, _ref.state.currentState, undefined, customVariables);
        const customVariables = { ..._ref.state.currentState.variables };
        delete customVariables[key];

        return _ref.setState({
          currentState: {
            ..._ref.state.currentState,
            variables: customVariables,
          },
        });
      }
    }
  }
}

export async function onEvent(_ref, eventName, options, mode = 'edit') {
  let _self = _ref;
  console.log('Event: ', eventName);

  const { customVariables } = options;

  if (eventName === 'onRowClicked') {
    const { component, data, rowId } = options;
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
      () => {
        executeActionsForEventId(_ref, 'onRowClicked', component, mode, customVariables);
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
      'onSelectionChange',
      'onSelect',
      'onClick',
      'onFileSelected',
      'onStart',
      'onResume',
      'onReset',
      'onPause',
      'onCountDownFinish',
      'onCalendarNavigate',
      'onCalendarViewChange',
      'onSearchTextChanged',
      'onPageChange',
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

export function previewQuery(_ref, query) {
  const options = getQueryVariables(query.options, _ref.props.currentState);

  _ref.setState({ previewLoading: true });

  return new Promise(function (resolve, reject) {
    let queryExecutionPromise = null;
    if (query.kind === 'runjs') {
      queryExecutionPromise = executeMultilineJS(_ref.state.currentState, query.options.code);
    } else {
      queryExecutionPromise = dataqueryService.preview(query, options);
    }

    queryExecutionPromise
      .then((data) => {
        let finalData = data.data;

        if (query.options.enableTransformation) {
          finalData = runTransformation(_ref, finalData, query.options.transformation, query);
        }

        _ref.setState({ previewLoading: false, queryPreviewData: finalData });
        switch (data.status) {
          case 'failed': {
            toast.error(`${data.message}: ${data.description}`);
            break;
          }
          case 'needs_oauth': {
            const url = data.data.auth_url; // Backend generates and return sthe auth url
            fetchOAuthToken(url, query.data_source_id);
            break;
          }
          case 'ok': {
            toast(`Query completed.`, {
              icon: '🚀',
            });
            break;
          }
        }

        resolve();
      })
      .catch(({ error, data }) => {
        _ref.setState({ previewLoading: false, queryPreviewData: data });
        toast.error(error);
        reject({ error, data });
      });
  });
}

export function runQuery(_ref, queryId, queryName, confirmed = undefined, mode) {
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
    if (confirmed === undefined) {
      _ref.setState({
        showQueryConfirmation: true,
        queryConfirmationData: {
          queryId,
          queryName,
        },
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
        console.log('here');
        queryExecutionPromise = executeMultilineJS(_self.state.currentState, query.options.code);
      } else {
        queryExecutionPromise = dataqueryService.run(queryId, options);
      }

      queryExecutionPromise
        .then((data) => {
          if (data.status === 'needs_oauth') {
            const url = data.data.auth_url; // Backend generates and return sthe auth url
            fetchOAuthToken(url, dataQuery.data_source_id);
          }

          if (data.status === 'failed') {
            console.error(data.message);
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
                      data: data,
                      options: options,
                    },
                  },
                },
              },
              () => {
                resolve();
                onEvent(_self, 'onDataQueryFailure', { definition: { events: dataQuery.options.events } });
              }
            );
          }

          let rawData = data.data;
          let finalData = data.data;

          if (dataQuery.options.enableTransformation) {
            finalData = runTransformation(_self, rawData, dataQuery.options.transformation, dataQuery);
            if (finalData.status === 'failed') {
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
                  resolve();
                  onEvent(_self, 'onDataQueryFailure', { definition: { events: dataQuery.options.events } });
                }
              );
            }
          }

          if (dataQuery.options.showSuccessNotification) {
            const notificationDuration = dataQuery.options.notificationDuration || 5000;
            toast.success(dataQuery.options.successMessage, {
              duration: notificationDuration,
            });
          }

          if (dataQuery.options.requestConfirmation) {
            toast(`Query (${dataQuery.name}) completed.`);
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
                      ? { request: data.request, response: data.response, responseHeaders: data.responseHeaders }
                      : {}
                  ),
                },
              },
            },
            () => {
              resolve();
              onEvent(_self, 'onDataQuerySuccess', { definition: { events: dataQuery.options.events } }, mode);
            }
          );
        })
        .catch(({ error }) => {
          toast.error(error);
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
              resolve();
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
      let isListView = false;
      try {
        isListView = parentComponent.component.component === 'Listview';
      } catch {
        console.log('error');
      }

      if (!isListView) {
        componentState[component.component.name] = { ...componentMeta.exposedVariables, id: key, ...existingValues };
      }
    } else {
      componentState[component.component.name] = { ...componentMeta.exposedVariables, id: key, ...existingValues };
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

export const getSvgIcon = (key, height = 50, width = 50) => {
  const Icon = allSvgs[key];

  return <Icon style={{ height, width }} />;
};
