import { appVersionService } from '@/_services';
import toast from 'react-hot-toast';
import { findAllEntityReferences } from '@/_stores/utils';
import { debounce, replaceEntityReferencesWithIds } from '../utils';
import { isQueryRunnable, isValidUUID, serializeNestedObjectToQueryParams } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import _ from 'lodash';
import { logoutAction } from '@/AppBuilder/_utils/auth';
import { copyToClipboard } from '@/_helpers/appUtils';
import generateCSV from '@/_lib/generate-csv';
import generateFile from '@/_lib/generate-file';
import urlJoin from 'url-join';
import { useCallback } from 'react';
import { navigate } from '@/AppBuilder/_utils/misc';
import moment from 'moment';

// To unsubscribe from the changes when no longer needed
// unsubscribe();

const initialState = {
  module: {
    canvas: {
      events: [],
      eventsUpdatedLoader: false,
      eventsCreatedLoader: false,
      actionsUpdatedLoader: false,
      eventToDeleteLoaderIndex: null,
    },
  },
};

export const useEvents = (moduleId = 'canvas') => {
  const events = useStore((state) => state.eventsSlice.module[moduleId]?.events || []);
  return events;
};

export const useEventActions = (moduleId = 'canvas') => {
  const createAppVersionEventHandlers = useStore((state) => state.eventsSlice.createAppVersionEventHandlers);
  const deleteAppVersionEventHandler = useStore((state) => state.eventsSlice.deleteAppVersionEventHandler);
  const updateAppVersionEventHandlers = useStore((state) => state.eventsSlice.updateAppVersionEventHandlers);
  const updateEventsField = useStore((state) => state.eventsSlice.updateEventsField);

  const memoizedCreateAppVersionEventHandlers = useCallback(
    (event) => createAppVersionEventHandlers(event, moduleId),
    [createAppVersionEventHandlers, moduleId]
  );

  const memoizedDeleteAppVersionEventHandler = useCallback(
    (eventId, index) => deleteAppVersionEventHandler(eventId, index, moduleId),
    [deleteAppVersionEventHandler, moduleId]
  );

  const memoizedUpdateAppVersionEventHandlers = useCallback(
    (events, updateType, param) => updateAppVersionEventHandlers(events, updateType, param, moduleId),
    [updateAppVersionEventHandlers, moduleId]
  );

  const memoizedUpdateEventsField = useCallback(
    (field, value, moduleId) => updateEventsField(field, value, moduleId),
    [updateEventsField]
  );

  return {
    createAppVersionEventHandlers: memoizedCreateAppVersionEventHandlers,
    deleteAppVersionEventHandler: memoizedDeleteAppVersionEventHandler,
    updateAppVersionEventHandlers: memoizedUpdateAppVersionEventHandlers,
    updateEventsField: memoizedUpdateEventsField,
  };
};

export const createEventsSlice = (set, get) => ({
  initializeEventsSlice: (moduleId) => {
    set(
      (state) => {
        state.eventsSlice.module[moduleId] = {
          ...initialState.module.canvas,
        };
      },
      false,
      'initializeEventsSlice'
    );
  },
  eventsSlice: {
    ...initialState,
    setEvents: (events, moduleId = 'canvas') => {
      const entityReferencesInEvents = findAllEntityReferences(events, [])?.filter(
        (entity) => entity && isValidUUID(entity)
      );
      // let newEvents = events;
      // console.log(get().modules['canvas']);
      // if (Array.isArray(entityReferencesInEvents) && entityReferencesInEvents?.length > 0) {
      //   entityReferencesInEvents.forEach((entity) => {
      //     const entityId = entity;
      //     const entityName = get().getComponentNameFromId(entityId);
      //     if (entityName) {
      //       newEvents = dfs(events, entity, entityName);
      //     }
      //   });
      // }
      set(
        (state) => {
          state.eventsSlice.module[moduleId].events = events;
        },
        false,
        'setEvents'
      );
    },
    fireEvent: (eventName, id, moduleId, customResolvables, options) => {
      const { eventsSlice, getCurrentMode, getEditorLoading } = get();
      const { handleEvent } = eventsSlice;
      const events = get().eventsSlice.module[moduleId].events;
      const componentEvents = events.filter((event) => event.sourceId === id);
      const mode = getCurrentMode(moduleId);
      if (getEditorLoading(moduleId)) return;
      handleEvent(
        eventName,
        componentEvents,
        { ...options, customVariables: { ...customResolvables } },
        moduleId,
        mode
      );
    },
    onComponentClickEvent(id, mode = 'edit', moduleId = 'canvas') {
      const { eventsSlice } = get();
      const {
        executeActionsForEventId,
        module: {
          [moduleId]: { events },
        },
      } = eventsSlice;
      const componentEvents = events.filter((event) => event.sourceId === id);
      executeActionsForEventId('onClick', componentEvents, mode, moduleId);
    },
    addEvent: (event, moduleId = 'canvas') =>
      set((state) => {
        const events = state.eventsSlice.module[moduleId].events;
        events.push(event);
      }),
    removeEvent: (eventId, moduleId = 'canvas') =>
      set((state) => {
        const events = state.eventsSlice.module[moduleId].events;
        events.splice(
          events.findIndex((event) => event.id === eventId),
          1
        );
      }),
    setEventToDeleteLoaderIndex: (index, moduleId = 'canvas') =>
      set(
        (state) => {
          state.eventsSlice.module[moduleId].eventToDeleteLoaderIndex = index;
        },
        false,
        'setEventToDeleteLoaderIndex'
      ),
    getModuleEvents: (moduleId = 'canvas') => get().eventsSlice.module[moduleId]?.events || [],
    updateEventsField: (field, value, moduleId = 'canvas') =>
      set(
        (state) => {
          state.eventsSlice.module[moduleId][field] = value;
        },
        false,
        `update-${field}`
      ),
    createAppVersionEventHandlers: async (event, moduleId) => {
      // get().actions.setIsSaving(true);
      // set({ eventsCreatedLoader: true });
      get().eventsSlice.updateEventsField('eventsCreatedLoader', true, moduleId);
      const appId = get().appStore.modules[moduleId].app.appId;
      const versionId = get().currentVersionId;
      appVersionService
        .createAppVersionEventHandler(appId, versionId, event)
        .then((response) => {
          get().eventsSlice.updateEventsField('eventsCreatedLoader', false, moduleId);
          get().eventsSlice.addEvent(response, moduleId);
        })
        .catch((err) => {
          get().eventsSlice.updateEventsField('eventsCreatedLoader', false, moduleId);
          toast.error(err?.error || 'An error occurred while creating the event handler');
        });
    },
    deleteAppVersionEventHandler: async (eventId, index, moduleId = 'canvas') => {
      const appId = get().appStore.modules[moduleId].app.appId;
      const versionId = get().currentVersionId;
      get().eventsSlice.updateEventsField('eventToDeleteLoaderIndex', index, moduleId);
      const response = await appVersionService.deleteAppVersionEventHandler(appId, versionId, eventId);
      get().eventsSlice.updateEventsField('eventToDeleteLoaderIndex', null, moduleId);
      if (response?.affected === 1) {
        get().eventsSlice.removeEvent(eventId, moduleId);
      }
    },
    updateAppVersionEventHandlers: async (events, updateType = 'update', param, moduleId = 'canvas') => {
      if (param === 'actionId') {
        get().eventsSlice.updateEventsField('actionsUpdatedLoader', true, moduleId);
      }
      if (param === 'eventId') {
        get().eventsSlice.updateEventsField('eventsUpdatedLoader', true, moduleId);
      }
      const componentNameIdMapping = get().modules['canvas'].componentNameIdMapping;
      const queryNameIdMapping = get().modules['canvas'].queryNameIdMapping;
      //! Revisit this
      const appId = get().appStore.modules[moduleId].app.appId;
      const versionId = get().currentVersionId;
      const newEvents = replaceEntityReferencesWithIds(events, componentNameIdMapping, queryNameIdMapping);
      const response = await appVersionService.saveAppVersionEventHandlers(appId, versionId, newEvents, updateType);
      get().eventsSlice.updateEventsField('actionsUpdatedLoader', false, moduleId);
      get().eventsSlice.updateEventsField('eventsUpdatedLoader', false, moduleId);
      set((state) => {
        const eventsInState = state.eventsSlice.getModuleEvents('canvas');
        const newEvents = eventsInState.map((event) => {
          const updatedEvent = response.find((r) => r.id === event.id);
          if (updatedEvent) {
            return updatedEvent;
          }
          return event;
        });

        // state.eventsSlice.setEvents(newEvents);
        state.eventsSlice.module[moduleId].events = newEvents;
      });
    },
    setTablePageIndex: (tableId, index, eventObj) => {
      try {
        const { getExposedValueOfComponent } = get();
        if (typeof index !== 'number' && index !== undefined) {
          throw new Error('Invalid page index.');
        }
        const exposedValue = getExposedValueOfComponent(tableId);
        if (!exposedValue) {
          throw new Error('No table is associated with this event.');
        }
        exposedValue.setPage(index);
        return Promise.resolve();
      } catch (error) {
        get().eventsSlice.logError('set_table_page_index', 'set-table-page-index', error, eventObj, {
          eventId: eventObj.eventType,
        });
      }
    },
    showModal: (modal, show, eventObj) => {
      try {
        const { getExposedValueOfComponent } = get();
        const modalId = modal?.id ?? modal;
        if (_.isEmpty(modalId)) {
          throw new Error('No modal is associated with this event.');
        }
        const exposedValue = getExposedValueOfComponent(modalId);
        show ? exposedValue.open() : exposedValue.close();

        return Promise.resolve();
      } catch (error) {
        get().eventsSlice.logError(
          show ? 'show_modal' : 'close_modal',
          show ? 'show-modal' : 'close_modal',
          error,
          eventObj,
          {
            eventId: eventObj.eventType,
          }
        );
      }
    },
    handleEvent: (eventName, events, options, moduleId = 'canvas', mode = 'edit') => {
      const latestEvents = get().eventsSlice.getModuleEvents(moduleId);
      const filteredEvents = latestEvents.filter((event) => {
        const foundEvent = events.find((e) => e.id === event.id);
        return foundEvent && foundEvent.name === eventName;
      });
      try {
        return get().eventsSlice.onEvent(eventName, filteredEvents, options, mode, moduleId);
      } catch (error) {
        console.error(error);
      }
    },
    onEvent: async (eventName, events, options = {}, mode = 'edit', moduleId = 'canvas') => {
      const executeActionsForEventId = get().eventsSlice.executeActionsForEventId;
      const customVariables = options?.customVariables ?? {};
      const { setExposedValue } = get();

      if (eventName === 'onPageLoad') {
        // for onPageLoad events, we need to execute the actions after the page is loaded
        executeActionsForEventId('onPageLoad', events, mode, customVariables, moduleId);
      }
      if (eventName === 'onTrigger') {
        const { queryPanel, dataQuery } = get();
        const queries = dataQuery.queries.modules.canvas;
        const { runQuery } = queryPanel;
        const { queryName, parameters } = options;
        const queryId = queries.filter((query) => query.name === queryName && isQueryRunnable(query))?.[0]?.id;
        if (!queryId) return;
        runQuery(queryId, queryName, true, mode, parameters, undefined, undefined, false, false, moduleId);
      }
      if (eventName === 'onTableActionButtonClicked') {
        const { action, tableActionEvents } = options;
        const executeableActions = tableActionEvents.filter((event) => event?.event?.ref === action?.name);

        if (action && executeableActions) {
          for (const event of executeableActions) {
            if (event?.event?.actionId) {
              await get().eventsSlice.executeAction(event.event, mode, customVariables, moduleId);
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
              await get().eventsSlice.executeAction(event.event, mode, customVariables, moduleId);
            }
          }
        } else {
          console.log('No action is associated with this event');
        }
      }

      if (eventName === 'onCalendarEventSelect') {
        const { id, calendarEvent } = options;
        setExposedValue(id, 'selectedEvent', calendarEvent);
        executeActionsForEventId('onCalendarEventSelect', events, mode, customVariables, moduleId);
      }

      if (eventName === 'onCalendarSlotSelect') {
        const { id, selectedSlots } = options;
        setExposedValue(id, 'selectedSlots', selectedSlots);
        executeActionsForEventId('onCalendarSlotSelect', events, mode, customVariables, moduleId);
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
          'onDoubleClick',
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
          'onTableDataDownload',
        ].includes(eventName)
      ) {
        executeActionsForEventId(eventName, events, mode, customVariables, moduleId);
      }
      if (eventName === 'onBulkUpdate') {
        await executeActionsForEventId(eventName, events, mode, customVariables, moduleId);
      }

      if (['onDataQuerySuccess', 'onDataQueryFailure'].includes(eventName)) {
        if (!events || !Array.isArray(events) || events.length === 0) return;
        await executeActionsForEventId(eventName, events, mode, customVariables, moduleId);
      }
    },
    executeActionsForEventId: async (eventId, events = [], mode, customVariables, moduleId = 'canvas') => {
      if (!events || !Array.isArray(events) || events.length === 0) return;
      const filteredEvents = events
        ?.filter((event) => event?.event.eventId === eventId)
        ?.sort((a, b) => a.index - b.index);

      for (const event of filteredEvents) {
        await get().eventsSlice.executeAction(event, mode, customVariables, moduleId);
      }
    },
    logError(errorType, errorKind, error, eventObj = '', options = {}, logLevel = 'error', page) {
      const { event = eventObj } = eventObj;
      const pages = get().modules.canvas.pages;
      const currentPageId = get().getCurrentPageId('canvas');
      const currentPage = page ? page : pages.find((page) => page.id === currentPageId);
      const componentIdMapping = get().modules['canvas'].componentNameIdMapping;
      const componentName = Object.keys(componentIdMapping).find(
        (key) => componentIdMapping[key] === eventObj?.sourceId
      );
      const componentId = eventObj?.sourceId;

      const getSource = () => {
        if (eventObj.eventType) {
          return eventObj.eventType === 'data_query' ? 'query' : eventObj.eventType;
        }

        const sourceMap = {
          onDataQueryFailure: 'query',
          onDataQuerySuccess: 'query',
          onPageLoad: 'page',
        };

        return sourceMap[event.eventId] || 'component';
      };

      const getQueryName = () => {
        const queries = get().dataQuery.queries.modules.canvas;
        return queries.find((query) => query.id === eventObj?.sourceId || '')?.name || '';
      };

      const constructErrorHeader = () => {
        const source = getSource();
        const pageName = currentPage.name;

        const headerMap = {
          component: `[Page ${pageName}] [Component ${componentName}] [Event ${event?.eventId}] [Action ${event.actionId}]`,
          page: `[Page ${pageName}] ${event.eventId ? `[Event ${event.eventId}]` : ''} ${
            event.actionId ? `[Action ${event.actionId}]` : ''
          }`,
          query: `[Query ${getQueryName()}] [Event ${event.eventId}] [Action ${event.actionId}]`,
          customLog: `${event.key}`,
        };

        return headerMap[source] || '';
      };

      const constructErrorTarget = () => {
        const source = getSource();

        const errorTargetMap = {
          page: 'Event Errors with page',
          component: 'Component Event',
          query: 'Event Errors with query',
          customLog: 'Queries',
        };

        return errorTargetMap[source];
      };
      useStore.getState().debugger.log({
        logLevel: logLevel ? logLevel : 'error',
        type: errorType ? errorType : 'event',
        kind: errorKind,
        key: constructErrorHeader(),
        error: {
          message: error.message,
          description: JSON.stringify(error.message, null, 2),
          ...(event.component === 'component' && componentId && { componentId: componentId }),
        },
        description: event?.description,
        errorTarget: constructErrorTarget(),
        options: options,
        strace: 'app_level',
        timestamp: moment().toISOString(),
      });
    },
    executeAction: debounce(async (eventObj, mode, customVariables = {}, moduleId = 'canvas') => {
      const { event = eventObj } = eventObj;
      const { getExposedValueOfComponent, getResolvedValue } = get();

      if (event?.runOnlyIf) {
        const shouldRun = getResolvedValue(event.runOnlyIf, customVariables, moduleId);
        if (!shouldRun) {
          return false;
        }
      }

      if (event) {
        //! TODO run only if conditions
        switch (event.actionId) {
          case 'show-alert': {
            let message = getResolvedValue(event.message, customVariables, moduleId);

            if (typeof message === 'object') message = JSON.stringify(message);

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
          case 'log-info': {
            get().eventsSlice.logError(
              'Custom Log',
              'Custom-log',
              '',
              eventObj,
              {
                eventId: event.eventId,
              },
              'success'
            );
            break;
          }
          case 'log': {
            get().eventsSlice.logError(
              'Custom Log',
              'Custom-log',
              '',
              eventObj,
              {
                eventId: event.eventId,
              },
              'success'
            );
            break;
          }
          case 'log-error': {
            get().eventsSlice.logError('Custom Log', 'Custom-log', '', eventObj, {
              eventId: event.eventId,
            });
            break;
          }
          case 'run-query': {
            try {
              const { queryId, queryName, component, eventId } = event;
              const params = event['parameters'];
              if (!queryId && !queryName) {
                throw new Error('No query selected');
              }
              // Check and replace the module input dummy queries with the linked query id
              /* Logic starts here */
              const moduleInputDummyQueries = get()?.getModuleInputDummyQueries?.() || {};
              let updatedQueryId = queryId,
                updatedQueryName = queryName,
                updatedModuleId = moduleId;
              if (moduleInputDummyQueries[queryId]) {
                updatedQueryId =
                  get().resolvedStore.modules[moduleId].exposedValues.input[moduleInputDummyQueries[queryId]]?.id;
                updatedModuleId = 'canvas'; // Updating the moduleId to canvas as the query is a module input query which will be present on canvas
              }
              /* Logic ends here */

              if (!updatedQueryId) {
                throw new Error('No query selected');
              }
              const resolvedParams = {};
              if (params) {
                Object.keys(params).map(
                  (param) => (resolvedParams[param] = getResolvedValue(params[param], undefined, moduleId))
                );
              }
              // !Todo tackle confirm query part once done
              return get().queryPanel.runQuery(
                updatedQueryId,
                updatedQueryName,
                undefined,
                undefined,
                resolvedParams,
                component,
                eventId,
                false,
                false,
                updatedModuleId
              );
            } catch (error) {
              get().eventsSlice.logError('run_query', 'run-query', error, eventObj, {
                eventId: event.eventId,
              });
              return Promise.reject(error);
            }
          }
          case 'logout': {
            return logoutAction();
          }
          case 'open-webpage': {
            //! if resolvecode default value should be the value itself not empty string ... Ask KAVIN
            const resolvedValue = getResolvedValue(event.url, customVariables, moduleId);
            // const url = resolveReferences(event.url, undefined, customVariables);
            window.open(resolvedValue, event?.windowTarget === 'newTab' ? '_blank' : '_self');
            return Promise.resolve();
          }
          case 'go-to-app': {
            try {
              if (!event.slug) {
                throw new Error('No application slug provided');
              }
              const resolvedValue = getResolvedValue(event.slug, customVariables, moduleId);
              const slug = resolvedValue;
              const queryParams = event.queryParams?.reduce(
                (result, queryParam) => ({
                  ...result,
                  ...{
                    [getResolvedValue(queryParam[0])]: getResolvedValue(queryParam[1], undefined, customVariables),
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
                navigate(url);
              } else {
                if (confirm('The app will be opened in a new tab as the action is triggered from the editor.')) {
                  window.open(urlJoin(window.public_config?.TOOLJET_HOST, url));
                }
              }
              return Promise.resolve();
            } catch (error) {
              get().eventsSlice.logError('go_to_app', 'go-to-app', error, eventObj, { eventId: event.eventId });
              return Promise.reject();
            }
          }

          case 'show-modal':
            return get().eventsSlice.showModal(event.modal, true, eventObj);

          case 'close-modal':
            return get().eventsSlice.showModal(event.modal, false, eventObj);
          case 'copy-to-clipboard': {
            const contentToCopy = getResolvedValue(event.contentToCopy, customVariables, moduleId);
            copyToClipboard(contentToCopy);

            return Promise.resolve();
          }
          case 'set-localstorage-value': {
            const key = getResolvedValue(event.key, customVariables, moduleId);
            const value = getResolvedValue(event.value, customVariables, moduleId);
            localStorage.setItem(key, value);

            return Promise.resolve();
          }
          case 'generate-file': {
            // const fileType = event.fileType;
            const data = getResolvedValue(event.data, customVariables, moduleId) || [];
            const fileName = getResolvedValue(event.fileName, customVariables, moduleId) || 'data.txt';
            const fileType = getResolvedValue(event.fileType, customVariables, moduleId) || 'csv';
            const fileData = {
              csv: generateCSV,
              plaintext: (plaintext) => plaintext,
              pdf: (pdfData) => pdfData,
            }[fileType](data);
            generateFile(fileName, fileData, fileType);
            return Promise.resolve();
          }

          case 'set-table-page': {
            get().eventsSlice.setTablePageIndex(
              event.table,
              getResolvedValue(event.pageIndex, undefined, moduleId),
              eventObj
            );
            break;
          }

          case 'set-custom-variable': {
            const { setVariable } = get();
            const key = getResolvedValue(event.key, customVariables, moduleId);
            const value = getResolvedValue(event.value, customVariables, moduleId);

            console.log('here--- set-custom-variable', key, value, moduleId);

            setVariable(key, value, moduleId);
            return Promise.resolve();
            // customAppVariables[key] = value;
            // const resp = useCurrentStateStore.getState().actions.setCurrentState({
            //   variables: customAppVariables,
            // });

            // return useStore.getState().setVariable(key, value);
            // console.log("useStore.getState->", useStore.getState());

            // useResolveStore.getState().actions.addAppSuggestions({
            //   variables: customAppVariables,
            // });

            // useResolveStore.getState().actions.resetHintsByKey(`variables.${key}`);

            // return resp;
          }

          case 'get-custom-variable': {
            const { getVariable } = get();
            const key = getResolvedValue(event.key, customVariables, moduleId);
            return getVariable(key, moduleId);
          }

          case 'unset-all-custom-variables': {
            const { unsetAllVariables } = get();
            unsetAllVariables(moduleId);
            return Promise.resolve();
          }

          case 'unset-custom-variable': {
            const { unsetVariable } = get();
            const key = getResolvedValue(event.key, customVariables, moduleId);
            unsetVariable(key, moduleId);
            return Promise.resolve();
            // const customAppVariables = { ...getCurrentState().variables };
            // delete customAppVariables[key];
            // useResolveStore.getState().actions.removeAppSuggestions([`variables.${key}`]);
            // useResolveStore
            //   .getState()
            //   .actions.updateResolvedRefsOfHints([{ hint: 'variables', newRef: customAppVariables }]);

            // return useCurrentStateStore.getState().actions.setCurrentState({
            //   variables: customAppVariables,
            // });
            // return useStore.getState().unsetVariable(key);
          }

          case 'set-page-variable': {
            const { setPageVariable } = get();
            const key = getResolvedValue(event.key, customVariables, moduleId);
            const value = getResolvedValue(event.value, customVariables, moduleId);
            setPageVariable(key, value, moduleId);
            return Promise.resolve();
            // const customPageVariables = {
            //   ...getCurrentState().page.variables,
            //   [key]: value,
            // };

            // useResolveStore.getState().actions.addAppSuggestions({
            //   page: {
            //     ...getCurrentState().page,
            //     variables: customPageVariables,
            //   },
            // });

            // const resp = useCurrentStateStore.getState().actions.setCurrentState({
            //   page: {
            //     ...getCurrentState().page,
            //     variables: customPageVariables,
            //   },
            // });

            // useResolveStore.getState().actions.resetHintsByKey(`page.variables.${key}`);

            // const resp = useStore.getState().setPageVariable(key, value);

            // return resp;
          }

          case 'get-page-variable': {
            const { getPageVariable } = get();
            const key = getResolvedValue(event.key, customVariables, moduleId);
            return getPageVariable(key, moduleId);
          }

          case 'unset-all-page-variables': {
            const { unsetAllPageVariables } = get();
            unsetAllPageVariables(moduleId);
            return Promise.resolve();
          }

          case 'unset-page-variable': {
            const { unsetPageVariable } = get();
            const key = getResolvedValue(event.key, customVariables, moduleId);
            unsetPageVariable(key, moduleId);
            return Promise.resolve();

            // useStore.getState().unsetPageVariable(key);
            // const customPageVariables = _.omit(getCurrentState().page.variables, key);

            // useResolveStore.getState().actions.removeAppSuggestions([`page.variables.${key}`]);

            // const pageRef = {
            //   page: {
            //     ...getCurrentState().page,
            //     variables: customPageVariables,
            //   },
            // };

            // const toUpdateRefs = [
            //   { hint: 'page', newRef: pageRef },
            //   { hint: 'page.variables', newRef: customPageVariables },
            // ];

            // useResolveStore.getState().actions.updateResolvedRefsOfHints(toUpdateRefs);

            // return useCurrentStateStore.getState().actions.setCurrentState({
            //   page: {
            //     ...getCurrentState().page,
            //     variables: customPageVariables,
            //   },
            // });
            // return;
          }
          case 'control-component': {
            try {
              // let component = Object.values(getCurrentState()?.components ?? {}).filter(
              //   (component) => component.id === event.componentId
              // )[0];
              const { event } = eventObj;
              if (!event.componentSpecificActionHandle) {
                throw new Error('No component-specific action handle provided.');
              }
              const component = getExposedValueOfComponent(event.componentId);
              if (!event.componentId || !Object.keys(component).length) {
                throw new Error('No component ID provided for control-component action.');
              }
              const action = component?.[event.componentSpecificActionHandle];
              // let action = '';
              // let actionArguments = '';
              // check if component id not found then try to find if its available as child widget else continue
              //  with normal flow finding action
              // if (component == undefined) {
              //   component = _ref.appDefinition.pages[getCurrentState()?.page?.id].components[event.componentId].component;
              //   const parent = Object.values(getCurrentState()?.components ?? {}).find(
              //     (item) => item.id === component.parent
              //   );
              //   const child = Object.values(parent?.children).find((item) => item.id === event.componentId);
              //   if (child) {
              //     action = child[event.componentSpecificActionHandle];
              //   }
              // } else {
              //   //normal component outside a container ex : form
              //   action = component?.[event.componentSpecificActionHandle];
              // }
              // actionArguments = _.map(event.componentSpecificActionParams, (param) => ({
              //   ...param,
              //   value: resolveReferences(param.value, undefined, customVariables),
              // }));
              // console.log('actionArguments', event.componentSpecificActionParams);
              const actionArguments = event.componentSpecificActionParams.map((param) => {
                const value = getResolvedValue(param.value, customVariables, moduleId);
                return {
                  ...param,
                  value: value,
                };
              });

              const actionPromise = action && action(...actionArguments.map((argument) => argument.value));
              return actionPromise ?? Promise.resolve();
            } catch (error) {
              get().eventsSlice.logError('control_component', 'control-component', error, eventObj, {
                eventId: event.eventId,
              });
              return Promise.reject(error);
            }
          }
          case 'toggle-app-mode': {
            const { updateAppMode } = get();
            updateAppMode(event.appMode);
            return Promise.resolve();
          }
          case 'switch-page': {
            try {
              const { pageId } = event;
              if (!pageId) {
                throw new Error('No page ID provided');
              }
              const { switchPage } = get();
              const page = get().modules[moduleId].pages.find((page) => page.id === event.pageId);
              const queryParams = event.queryParams || [];
              if (page.restricted && mode !== 'edit') {
                toast.error('Access to this page is restricted. Contact admin to know more.');
              } else if (!page.disabled) {
                const resolvedQueryParams = [];
                queryParams.forEach((param) => {
                  resolvedQueryParams.push([
                    getResolvedValue(param[0], customVariables, moduleId),
                    getResolvedValue(param[1], customVariables, moduleId),
                  ]);
                });
                const currentUrlParams = new URLSearchParams(window.location.search);
                currentUrlParams.forEach((value, key) => {
                  if (key === 'version' || key === 'env') {
                    // if version or env is in current url query param but not in resolved params then add it to resolvedQueryParams
                    const exists = resolvedQueryParams.some(([resolvedKey]) => resolvedKey === key);
                    if (!exists) {
                      resolvedQueryParams.unshift([key, value]);
                    }
                  }
                });
                switchPage(page.id, page.handle, resolvedQueryParams, moduleId);
              } else {
                toast.error('Page is disabled');
                //!TODO push to debugger
                get().debugger.log({
                  logLevel: 'error',
                  type: 'navToDisablePage',
                  kind: 'page',
                  message: `Attempt to switch to disabled page ${page.name} blocked.`,
                  error: 'Page is disabled',
                });
              }

              return Promise.resolve();
            } catch (error) {
              get().eventsSlice.logError('switch_page', 'switch-page', error, eventObj, {
                eventId: event.eventId,
              });
            }
          }
        }
      }
    }),

    generateAppActions: (queryId, mode, isPreview = false, moduleId = 'canvas') => {
      const {
        getCurrentPageComponents,
        dataQuery,
        eventsSlice,
        queryPanel,
        modules,
        globalSettings: { appMode },
      } = get();
      const { previewQuery } = queryPanel;
      const { executeAction } = eventsSlice;
      const currentComponents = Object.entries(getCurrentPageComponents(moduleId));

      const runQuery = (queryName = '', parameters, moduleId = 'canvas') => {
        const query = dataQuery.queries.modules[moduleId].find((query) => {
          const isFound = query.name === queryName;
          if (isPreview) {
            return isFound;
          } else {
            return isFound && isQueryRunnable(query);
          }
        });

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
          return previewQuery(query, true, processedParams);
        }

        const event = {
          actionId: 'run-query',
          queryId: query.id,
          queryName: query.name,
          parameters: processedParams,
        };

        return executeAction(event, mode, {}, moduleId);
      };

      const setVariable = (key = '', value = '') => {
        if (key) {
          const event = {
            actionId: 'set-custom-variable',
            key,
            value,
          };
          return executeAction(event, mode, {}, moduleId);
        }
      };

      const getVariable = (key = '') => {
        if (key) {
          const event = {
            actionId: 'get-custom-variable',
            key,
          };
          return executeAction(event, mode, {}, moduleId);
        }
      };

      const unsetAllVariables = () => {
        const event = {
          actionId: 'unset-all-custom-variables',
        };
        return executeAction(event, mode, {});
      };

      const unSetVariable = (key = '') => {
        if (key) {
          const event = {
            actionId: 'unset-custom-variable',
            key,
          };
          return executeAction(event, mode, {}, moduleId);
        }
      };

      const showAlert = (alertType = '', message = '') => {
        const event = {
          actionId: 'show-alert',
          alertType,
          message,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const logout = () => {
        const event = {
          actionId: 'logout',
        };
        return executeAction(event, mode, {}, moduleId);
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
        return executeAction(event, mode, {}, moduleId);
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
        return executeAction(event, mode, {}, moduleId);
      };

      const setLocalStorage = (key = '', value = '') => {
        const event = {
          actionId: 'set-localstorage-value',
          key,
          value,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const copyToClipboard = (contentToCopy = '') => {
        const event = {
          actionId: 'copy-to-clipboard',
          contentToCopy,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const goToApp = (slug = '', queryParams = []) => {
        const event = {
          actionId: 'go-to-app',
          slug,
          queryParams,
        };
        return executeAction(event, mode, {}, moduleId);
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
        return executeAction(event, mode, {}, moduleId);
      };

      const setPageVariable = (key = '', value = '') => {
        const event = {
          actionId: 'set-page-variable',
          key,
          value,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const getPageVariable = (key = '') => {
        const event = {
          actionId: 'get-page-variable',
          key,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const unsetAllPageVariables = () => {
        const event = {
          actionId: 'unset-all-page-variables',
        };
        return executeAction(event, mode, {});
      };

      const unsetPageVariable = (key = '') => {
        const event = {
          actionId: 'unset-page-variable',
          key,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const switchPage = (pageHandle, queryParams = [], moduleId = 'canvas') => {
        if (isPreview) {
          mode != 'view' &&
            toast('Page will not be switched for query preview', {
              icon: '⚠️',
            });
          return Promise.resolve();
        }
        const pages = modules[moduleId].pages;
        const transformedPageHandle = pageHandle?.toLowerCase();
        const pageId = pages.find((page) => page.handle === transformedPageHandle)?.id;

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
        return executeAction(event, mode, {}, moduleId);
      };

      const logInfo = (log, isFromTransformation) => {
        const query = dataQuery.queries.modules['canvas'].find((query) => query.id == queryId);
        const error = new Error();
        const stackLine = error.stack.split('\n')[isFromTransformation ? 3 : 2];
        const lineNumberMatch = stackLine.match(/:(\d+):\d+\)$/);
        const lineNumber = lineNumberMatch ? lineNumberMatch[1] : 'unknown';
        const event = {
          actionId: 'log-info',
          key: `${query.name}${isFromTransformation ? ', transformation' : ''}, line ${lineNumber - 2}`,
          description: log,
          eventType: 'customLog',
          query,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const logError = (log, isFromTransformation = false) => {
        const query = dataQuery.queries.modules['canvas'].find((query) => query.id == queryId);
        const error = new Error();
        const stackLine = error.stack.split('\n')[isFromTransformation ? 3 : 2];
        const lineNumberMatch = stackLine.match(/:(\d+):\d+\)$/);
        const lineNumber = lineNumberMatch ? lineNumberMatch[1] : 'unknown';
        const event = {
          actionId: 'log-error',
          key: `${query.name}${isFromTransformation ? ', transformation' : ''}, line ${lineNumber - 2}`,
          description: log,
          eventType: 'customLog',
          query,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const log = (log, isFromTransformation = false) => {
        const query = dataQuery.queries.modules['canvas'].find((query) => query.id == queryId);
        const error = new Error();
        const stackLine = error.stack.split('\n')[isFromTransformation ? 3 : 2];
        const lineNumberMatch = stackLine.match(/:(\d+):\d+\)$/);
        const lineNumber = lineNumberMatch ? lineNumberMatch[1] : 'unknown';
        const event = {
          actionId: 'log',
          key: `${query.name}${isFromTransformation ? ', transformation' : ''}, line ${lineNumber - 2}`,
          description: log,
          eventType: 'customLog',
          query,
        };
        return executeAction(event, mode, {}, moduleId);
      };

      const toggleAppMode = (value) => {
        if (value && value !== 'light' && value !== 'dark' && value !== 'auto') {
          return;
        }
        if (!value) {
          value = appMode === 'dark' ? 'light' : 'dark';
        }
        const event = {
          actionId: 'toggle-app-mode',
          appMode: value,
        };
        return executeAction(event, mode, {});
      };

      return {
        runQuery,
        setVariable,
        getVariable,
        unsetAllVariables,
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
        getPageVariable,
        unsetAllPageVariables,
        unsetPageVariable,
        switchPage,
        logInfo,
        log,
        logError,
        toggleAppMode,
      };
    },
    // Selectors
    getEventsByComponentsId: (componentId, moduleId = 'canvas') => {
      const { eventsSlice } = get();
      return eventsSlice.module[moduleId]?.events?.filter((event) => event.sourceId === componentId);
    },

    getEventsUpdatedLoader: (moduleId = 'canvas') => {
      return get().eventsSlice.module[moduleId].eventsUpdatedLoader;
    },
    getEventsCreatedLoader: (moduleId = 'canvas') => {
      return get().eventsSlice.module[moduleId].eventsCreatedLoader;
    },
    getActionsUpdatedLoader: (moduleId = 'canvas') => {
      return get().eventsSlice.module[moduleId].actionsUpdatedLoader;
    },
    getEventToDeleteLoaderIndex: (moduleId = 'canvas') => {
      return get().eventsSlice.module[moduleId].eventToDeleteLoaderIndex;
    },
  },
});
