import React from 'react';
import { toast } from 'react-toastify';
import { getDynamicVariables, resolveReferences , serializeNestedObjectToQueryParams } from '@/_helpers/utils';
import { dataqueryService } from '@/_services';
import _ from 'lodash';
import moment from 'moment';
import Tooltip from 'react-bootstrap/Tooltip';
import { componentTypes } from '../Editor/Components/components';

export function setStateAsync(_ref, state) {
  return new Promise((resolve) => {
    _ref.setState(state, resolve);
  });
}

export function onComponentOptionsChanged(_ref, component, options) {
  const componentName = component.name;
  const components = _ref.state.currentState.components;
  let componentData = components[componentName];
  componentData = componentData || { };

  for (const option of options) {
    componentData[option[0]] = option[1];
  }

  return setStateAsync(_ref, {
    currentState: { ..._ref.state.currentState, components: { ...components, [componentName]: componentData } }
  });
}

export function onComponentOptionChanged(_ref, component, option_name, value) {
  const componentName = component.name;
  const components = _ref.state.currentState.components;
  let componentData = components[componentName];
  componentData = componentData || { };
  componentData[option_name] = value;

  return setStateAsync(_ref, {
    currentState: { ..._ref.state.currentState, components: { ...components, [componentName]: componentData } }
  });
}

export function fetchOAuthToken(authUrl, dataSourceId) {
  localStorage.setItem('sourceWaitingForOAuth', dataSourceId);
  window.open(authUrl);
}

export function runTransformation(_ref, rawData, transformation, query) {
  const data = rawData;
  const evalFunction = Function(['data', 'moment', '_', 'components', 'queries', 'globals'], transformation);
  let result = [];

  const currentState = _ref.state.currentState || {};

  try {
    result = evalFunction(data, moment, _, currentState.components, currentState.queries, currentState.globals);
  } catch (err) {
    console.log('Transformation failed for query: ', query.name ,err);
    toast.error(err.message, { hideProgressBar: true });
  }

  return result;
}

export async function executeActionsForEventId(_ref, eventId, component, mode) {
  const events = component.definition.events || [];
  const filteredEvents = events.filter(event => event.eventId === eventId);

  for(const event of filteredEvents) {
    await executeAction(_ref, event, mode);
  };

}

export function onComponentClick(_ref, id, component, mode = 'edit') {
  executeActionsForEventId(_ref, 'onClick', component, mode);
}

export function onQueryConfirm(_ref, queryConfirmationData) {
  _ref.setState({
    showQueryConfirmation: false
  });
  runQuery(_ref, queryConfirmationData.queryId, queryConfirmationData.queryName, true);
}

export function onQueryCancel(_ref) {
  _ref.setState({
    showQueryConfirmation: false
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!', { hideProgressBar: true, autoClose: 3000 });
  } catch (err) {
    console.log('Failed to copy!', err);
  }
};

function showModal(_ref, modalId, show) {
  const modalMeta = _ref.state.appDefinition.components[modalId];

  const newState = {
    currentState: {
      ..._ref.state.currentState,
      components: {
        ..._ref.state.currentState.components,
        [modalMeta.component.name]: {
          ..._ref.state.currentState.components[modalMeta.component.name],
          show: show
        }
      }
    }
  }

  _ref.setState(newState)

  return new Promise(function (resolve, reject) {
    resolve();
  })
}

function executeAction(_ref, event, mode) {
  if (event) {
    if (event.actionId === 'show-alert') {
      const message = resolveReferences(event.message, _ref.state.currentState);
      toast(message, { hideProgressBar: true });
      return new Promise(function (resolve, reject) {
        resolve();
      })
    }

    if (event.actionId === 'run-query') {
      const { queryId, queryName } = event;
      return runQuery(_ref, queryId, queryName);
    }

    if (event.actionId === 'open-webpage') {
      const url = resolveReferences(event.url, _ref.state.currentState);
      window.open(url, '_blank');
      return new Promise(function (resolve, reject) {
        resolve();
      })
    }

    if (event.actionId === 'go-to-app') {
      const slug = resolveReferences(event.slug, _ref.state.currentState);
      const queryParams = event.queryParams?.reduce((result, queryParam) => ({
        ...result,
        ...{
          [resolveReferences(queryParam[0], _ref.state.currentState)]: resolveReferences(queryParam[1], _ref.state.currentState)
        }
      }), {})

      let url =`/applications/${slug}`;

      if (queryParams) {
        const queryPart = serializeNestedObjectToQueryParams(queryParams)

        if (queryPart.length > 0)
          url = url + `?${queryPart}`
      }

      if(mode === 'view') {
        _ref.props.history.push(url);
      } else {
        if(confirm("The app will be opened in a new tab as the action is triggered from the editor.")) {
          window.open(url, '_blank');
        }
      }
      return new Promise(function (resolve, reject) {
        resolve();
      })
    }

    if (event.actionId === 'show-modal')
      return showModal(_ref, event.modal, true)

    if (event.actionId === 'close-modal')
      return showModal(_ref, event.modal, false)

    if (event.actionId === 'copy-to-clipboard') {
      const contentToCopy = resolveReferences(event.contentToCopy, _ref.state.currentState);
      copyToClipboard(contentToCopy);

      return new Promise(function (resolve, reject) {
        resolve();
      })
    }
  }
}

export async function onEvent(_ref, eventName, options, mode = 'edit') {
  let _self = _ref;
  console.log('Event: ', eventName);


  if (eventName === 'onRowClicked') {
    const { component, data } = options;
    _self.setState({
      currentState: {
        ..._self.state.currentState,
        components: {
          ..._self.state.currentState.components,
          [component.name]: {
            ..._self.state.currentState.components[component.name],
            selectedRow: data
          }
        }
      }
    }, () => {
      executeActionsForEventId(_ref, 'onRowClicked', component, mode);
    });
  }

  if (eventName === 'onTableActionButtonClicked') {
    const { component, data, action } = options;

    _self.setState({
      currentState: {
        ..._self.state.currentState,
        components: {
          ..._self.state.currentState.components,
          [component.name]: {
            ..._self.state.currentState.components[component.name],
            selectedRow: data
          }
        }
      }
    }, () => {
      if(action) {
        action.events?.forEach((event => {
          if (event.actionId) {
            // the event param uses a hacky workaround for using same format used by event manager ( multiple handlers )
            executeAction(_self, { ...event, ...event.options } , mode);
          }
        }) )
      } else {
        console.log('No action is associated with this event');
      }
    });
  }

  if (['onDetect', 'onCheck', 'onUnCheck', 'onBoundsChange', 'onCreateMarker', 'onMarkerClick', 'onPageChanged', 'onSearch', 'onChange', 'onSelectionChange', 'onSelect'].includes(eventName)) {
    const { component } = options;
    executeActionsForEventId(_ref, eventName, component, mode);
  }

  if (eventName === 'onBulkUpdate') {
    onComponentOptionChanged(_self, options.component, 'isSavingChanges', true);
    await executeActionsForEventId(_self, eventName, options.component, mode);
    onComponentOptionChanged(_self, options.component, 'isSavingChanges', false);
  }

  if (['onDataQuerySuccess', 'onDataQueryFailure'].includes(eventName)) {
    await executeActionsForEventId(_self, eventName, options, mode);
  }
}

function getQueryVariables(options, state) {

  let queryVariables = {};

  if( typeof options === 'string' ) {
    const dynamicVariables = getDynamicVariables(options) || [];
    dynamicVariables.forEach((variable) => {
      queryVariables[variable] = resolveReferences(variable, state);
    });
  } else if(Array.isArray(options)) {
    options.forEach((element) => {
      _.merge(queryVariables, getQueryVariables(element, state))
    })
  } else if(typeof options ==="object") {
    Object.keys(options || {}).forEach((key) => {
      _.merge(queryVariables, getQueryVariables(options[key], state))
    })
  }

  return queryVariables;
}

export function previewQuery(_ref, query) {
  const options = getQueryVariables(query.options, _ref.props.currentState);

  _ref.setState({ previewLoading: true });

  return new Promise(function (resolve, reject) {
    dataqueryService.preview(query, options).then(data => {

      let finalData = data.data;

      if (query.options.enableTransformation) {
        finalData = runTransformation(_ref, finalData, query.options.transformation, query);
      }

      _ref.setState({ previewLoading: false, queryPreviewData: finalData });

      if(data.status === 'failed') {
        toast.error(`${data.message}: ${data.description}`, { position: 'bottom-center', hideProgressBar: true, autoClose: 10000 });
      } else {
        if (data.status === 'needs_oauth') {
          const url = data.data.auth_url; // Backend generates and return sthe auth url
          fetchOAuthToken(url, query.data_source_id);
        }
        if(data.status === 'ok') {
          toast.info(`Query completed.`, {
            hideProgressBar: true,
            position: 'bottom-center',
          });
        }
      }

      resolve();
    }).catch(({ error, data } ) => {
      _ref.setState({ previewLoading: false, queryPreviewData: data });
      toast.error(error, { hideProgressBar: true, autoClose: 3000 });
      reject( { error, data });
    });;
  });
}

export function runQuery(_ref, queryId, queryName, confirmed = undefined) {
  const query = _ref.state.app.data_queries.find(query => query.id === queryId);
  let dataQuery = {};

  if (query) {
    dataQuery = JSON.parse(JSON.stringify(query));
  } else {
    toast.error('No query has been associated with the action.', { hideProgressBar: true, autoClose: 3000 });
    return;
  }

  const options = getQueryVariables(dataQuery.options, _ref.state.currentState);

  if (options.requestConfirmation) {
    if (confirmed === undefined) {
      _ref.setState({
        showQueryConfirmation: true,
        queryConfirmationData: {
          queryId, queryName
        }
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
        rawData: []
      }
    },
    errors: {}
  };

  let _self = _ref;

  return new Promise(function (resolve, reject) {
    _self.setState({ currentState: newState }, () => {
      dataqueryService.run(queryId, options).then(data => {

        if (data.status === 'needs_oauth') {
          const url = data.data.auth_url; // Backend generates and return sthe auth url
          fetchOAuthToken(url, dataQuery.data_source_id);
        }

        if (data.status === 'failed') {
          toast.error(data.message, { hideProgressBar: true, autoClose: 3000 });

          return (
            _self.setState({
              currentState: {
                ..._self.state.currentState,
                queries: {
                  ..._self.state.currentState.queries,
                  [queryName]: {
                    ..._self.state.currentState.queries[queryName],
                    isLoading: false
                  }
                },
                errors: {
                  ..._self.state.currentState.errors,
                  [queryName]: {
                    type: 'query',
                    data: data,
                    options: options
                  }
                }
              }
            }, () => {
              resolve();
              onEvent(
                _self,
                'onDataQueryFailure',
                { definition: { events: dataQuery.options.events } }
              )
            })
          )
        }

        let rawData = data.data;
        let finalData = data.data;

        if (dataQuery.options.enableTransformation) {
          finalData = runTransformation(_self, rawData, dataQuery.options.transformation, dataQuery);
        }

        if (dataQuery.options.showSuccessNotification) {
          const notificationDuration = dataQuery.options.notificationDuration || 5;
          toast.success(dataQuery.options.successMessage, { hideProgressBar: true, autoClose: notificationDuration * 1000 });
        }

        _self.setState({
          currentState: {
            ..._self.state.currentState,
            queries: {
              ..._self.state.currentState.queries,
              [queryName]: {
                ..._self.state.currentState.queries[queryName],
                data: finalData,
                rawData,
                isLoading: false
              }
            }
          }
        }, () => {
          resolve();
          onEvent(
            _self,
            'onDataQuerySuccess',
            { definition: { events: dataQuery.options.events } }
          )
        });
      }).catch(( { error } ) => {
        toast.error(error, { hideProgressBar: true, autoClose: 3000 });
        _self.setState({
          currentState: {
            ..._self.state.currentState,
            queries: {
              ..._self.state.currentState.queries,
              [queryName]: {
                isLoading: false
              }
            }
          }
        }, () => {
          resolve();
        });
      });
    });
  });
}

export function renderTooltip({props, text}) {
  return <Tooltip id="button-tooltip" {...props}>
    {text}
  </Tooltip>
};

export function computeComponentState(_ref, components) {
  let componentState = {};
  const currentComponents = _ref.state.currentState.components;
  Object.keys(components).forEach((key) => {
    const component = components[key];
    const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

    const existingComponentName = Object.keys(currentComponents).find((comp) => currentComponents[comp].id === key);
    const existingValues = currentComponents[existingComponentName];

    componentState[component.component.name] = { ...componentMeta.exposedVariables, id: key, ...existingValues };

  });

  _ref.setState({
    currentState: {
      ..._ref.state.currentState,
      components: {
        ...componentState,
      },
    },
    defaultComponentStateComputed: true
  }, () => {
    console.log('Default component state computed and set')
  });

}