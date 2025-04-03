import { appVersionService } from '@/_services';
import toast from 'react-hot-toast';
import { findAllEntityReferences } from '@/_stores/utils';
import { debounce, extractAndReplaceReferencesFromString, resolveCode, replaceEntityReferencesWithIds } from '../utils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { dfs } from '@/_stores/handleReferenceTransactions';
import { isQueryRunnable, isValidUUID, serializeNestedObjectToQueryParams } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { handleLowPriorityWork } from '@/AppBuilder/_helpers/editorHelpers';
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
    (field, value) => updateEventsField(field, value, moduleId),
    [updateEventsField, moduleId]
  );

  return {
    createAppVersionEventHandlers: memoizedCreateAppVersionEventHandlers,
    deleteAppVersionEventHandler: memoizedDeleteAppVersionEventHandler,
    updateAppVersionEventHandlers: memoizedUpdateAppVersionEventHandlers,
    updateEventsField: memoizedUpdateEventsField,
  };
};

export const createEventsSlice = (set, get) => ({
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
      const { eventsSlice } = get();
      const {
        handleEvent,
        isEditorLoading,
        module: {
          [moduleId]: { events },
        },
      } = eventsSlice;
      const componentEvents = events.filter((event) => event.sourceId === id);
      const mode = get().currentMode;
      if (isEditorLoading) return;
      // if (mode === 'edit' && eventName === 'onClick') {
      //   onComponentClick(id, component);
      // }
      handleEvent(
        eventName,
        componentEvents,
        { ...options, customVariables: { ...customResolvables } },
        'canvas',
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
      executeActionsForEventId('onClick', componentEvents, mode);
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
      get().eventsSlice.updateEventsField('eventsCreatedLoader', true);
      const appId = get().app.appId;
      const versionId = get().currentVersionId;
      appVersionService
        .createAppVersionEventHandler(appId, versionId, event)
        .then((response) => {
          get().eventsSlice.updateEventsField('eventsCreatedLoader', false);
          get().eventsSlice.addEvent(response);
        })
        .catch((err) => {
          get().eventsSlice.updateEventsField('eventsCreatedLoader', false);
          toast.error(err?.error || 'An error occurred while creating the event handler');
        });
    },
    deleteAppVersionEventHandler: async (eventId, index, moduleId = 'canvas') => {
      const appId = get().app.appId;
      const versionId = get().currentVersionId;
      get().eventsSlice.updateEventsField('eventToDeleteLoaderIndex', index);
      const response = await appVersionService.deleteAppVersionEventHandler(appId, versionId, eventId);
      get().eventsSlice.updateEventsField('eventToDeleteLoaderIndex', null);
      if (response?.affected === 1) {
        get().eventsSlice.removeEvent(eventId);
      }
    },
    updateAppVersionEventHandlers: async (events, updateType = 'update', param, moduleId = 'canvas') => {
      if (param === 'actionId') {
        get().eventsSlice.updateEventsField('actionsUpdatedLoader', true);
      }
      if (param === 'eventId') {
        get().eventsSlice.updateEventsField('eventsUpdatedLoader', true);
      }
      const componentNameIdMapping = get().modules['canvas'].componentNameIdMapping;
      const queryNameIdMapping = get().modules['canvas'].queryNameIdMapping;
      //! Revisit this
      const appId = get().app.appId;
      const versionId = get().currentVersionId;
      const newEvents = replaceEntityReferencesWithIds(events, componentNameIdMapping, queryNameIdMapping);
      const response = await appVersionService.saveAppVersionEventHandlers(appId, versionId, newEvents, updateType);
      get().eventsSlice.updateEventsField('actionsUpdatedLoader', false);
      get().eventsSlice.updateEventsField('eventsUpdatedLoader', false);
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
        return get().eventsSlice.onEvent(eventName, filteredEvents, options, mode);
      } catch (error) {
        console.error(error);
      }
    },
    onEvent: async (eventName, events, options = {}, mode = 'edit') => {
      const executeActionsForEventId = get().eventsSlice.executeActionsForEventId;
      const customVariables = options?.customVariables ?? {};
      const { setExposedValue } = get();

      if (eventName === 'onPageLoad') {
        // for onPageLoad events, we need to execute the actions after the page is loaded
        executeActionsForEventId('onPageLoad', events, mode, customVariables);
      }
      if (eventName === 'onTrigger') {
        const { queryPanel, dataQuery } = get();
        const queries = dataQuery.queries.modules.canvas;
        const { runQuery } = queryPanel;
        const { queryName, parameters } = options;
        const queryId = queries.filter((query) => query.name === queryName && isQueryRunnable(query))?.[0]?.id;
        if (!queryId) return;
        runQuery(queryId, queryName, true, mode, parameters);
      }
      if (eventName === 'onTableActionButtonClicked') {
        const { action, tableActionEvents } = options;
        const executeableActions = tableActionEvents.filter((event) => event?.event?.ref === action?.name);

        if (action && executeableActions) {
          for (const event of executeableActions) {
            if (event?.event?.actionId) {
              await get().eventsSlice.executeAction(event.event, mode, customVariables);
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
              await get().eventsSlice.executeAction(event.event, mode, customVariables);
            }
          }
        } else {
          console.log('No action is associated with this event');
        }
      }

      if (eventName === 'onCalendarEventSelect') {
        const { id, calendarEvent } = options;
        setExposedValue(id, 'selectedEvent', calendarEvent);
        executeActionsForEventId('onCalendarEventSelect', events, mode, customVariables);
      }

      if (eventName === 'onCalendarSlotSelect') {
        const { id, selectedSlots } = options;
        setExposedValue(id, 'selectedSlots', selectedSlots);
        executeActionsForEventId('onCalendarSlotSelect', events, mode, customVariables);
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
        executeActionsForEventId(eventName, events, mode, customVariables);
      }
      if (eventName === 'onBulkUpdate') {
        await executeActionsForEventId(eventName, events, mode, customVariables);
      }

      if (['onDataQuerySuccess', 'onDataQueryFailure'].includes(eventName)) {
        if (!events || !Array.isArray(events) || events.length === 0) return;
        await executeActionsForEventId(eventName, events, mode, customVariables);
      }
    },
    executeActionsForEventId: async (eventId, events = [], mode, customVariables) => {
      if (!events || !Array.isArray(events) || events.length === 0) return;
      const filteredEvents = events
        ?.filter((event) => event?.event.eventId === eventId)
        ?.sort((a, b) => a.index - b.index);

      for (const event of filteredEvents) {
        await get().eventsSlice.executeAction(event, mode, customVariables);
      }
    },
    logError(errorType, errorKind, error, eventObj = '', options = {}, logLevel = 'error') {
      const { event = eventObj } = eventObj;
      const pages = get().modules.canvas.pages;
      const currentPageId = get().currentPageId;
      const currentPage = pages.find((page) => page.id === currentPageId);
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
          page: `[Page ${pageName}] [Event ${event.eventId}] [Action ${event.actionId}]`,
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
    executeAction: debounce(async (eventObj, mode, customVariables = {}) => {
      const { event = eventObj } = eventObj;
      const { getExposedValueOfComponent, getResolvedValue } = get();

      if (event?.runOnlyIf) {
        const shouldRun = getResolvedValue(event.runOnlyIf, customVariables);
        if (!shouldRun) {
          return false;
        }
      }

      if (event) {
        //! TODO run only if conditions
        switch (event.actionId) {
          case 'show-alert': {
            let message = getResolvedValue(event.message, customVariables);
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
              const resolvedParams = {};
              if (params) {
                Object.keys(params).map(
                  (param) => (resolvedParams[param] = getResolvedValue(params[param], undefined))
                );
              }
              // !Todo tackle confirm query part once done
              return get().queryPanel.runQuery(
                queryId,
                queryName,
                undefined,
                undefined,
                resolvedParams,
                component,
                eventId,
                false,
                false,
                'canvas'
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
            const resolvedValue = getResolvedValue(event.url, customVariables);
            // const url = resolveReferences(event.url, undefined, customVariables);
            window.open(resolvedValue, '_blank');
            return Promise.resolve();
          }
          case 'go-to-app': {
            try {
              if (!event.slug) {
                throw new Error('No application slug provided');
              }
              const resolvedValue = getResolvedValue(event.slug, customVariables);
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
            const contentToCopy = getResolvedValue(event.contentToCopy, customVariables);
            copyToClipboard(contentToCopy);

            return Promise.resolve();
          }
          case 'set-localstorage-value': {
            const key = getResolvedValue(event.key, customVariables);
            const value = getResolvedValue(event.value, customVariables);
            localStorage.setItem(key, value);

            return Promise.resolve();
          }
          case 'generate-file': {
            // const fileType = event.fileType;
            const data = getResolvedValue(event.data, customVariables) || [];
            const fileName = getResolvedValue(event.fileName, customVariables) || 'data.txt';
            const fileType = getResolvedValue(event.fileType, customVariables) || 'csv';
            const fileData = {
              csv: generateCSV,
              plaintext: (plaintext) => plaintext,
              pdf: (pdfData) => pdfData,
            }[fileType](data);
            generateFile(fileName, fileData, fileType);
            return Promise.resolve();
          }

          case 'set-table-page': {
            get().eventsSlice.setTablePageIndex(event.table, getResolvedValue(event.pageIndex), eventObj);
            break;
          }

          case 'set-custom-variable': {
            const { setVariable } = get();
            const key = getResolvedValue(event.key, customVariables);
            const value = getResolvedValue(event.value, customVariables);
            setVariable(key, value);
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
            const key = getResolvedValue(event.key, customVariables);
            return getVariable(key);
          }

          case 'unset-custom-variable': {
            const { unsetVariable } = get();
            const key = getResolvedValue(event.key, customVariables);
            unsetVariable(key);
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
            const key = getResolvedValue(event.key, customVariables);
            const value = getResolvedValue(event.value, customVariables);
            setPageVariable(key, value);
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
            const key = getResolvedValue(event.key, customVariables);
            return getPageVariable(key);
          }

          case 'unset-page-variable': {
            const { unsetPageVariable } = get();
            const key = getResolvedValue(event.key, customVariables);
            unsetPageVariable(key);
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
                const value = getResolvedValue(param.value, customVariables);
                return {
                  ...param,
                  value: value,
                  // value: resolveCode(re.valueWithBrackets, getAllExposedValues()),
                };
              });
              // const actionArguments = _.map(event.componentSpecificActionParams, (param) => ({
              //   ...param,
              //   value: resolveReferences(param.value, getAllExposedValues(), customVariables),
              // }));

              const actionPromise = action && action(...actionArguments.map((argument) => argument.value));
              return actionPromise ?? Promise.resolve();
            } catch (error) {
              get().eventsSlice.logError('control_component', 'control-component', error, eventObj, {
                eventId: event.eventId,
              });

              return Promise.reject(error);
            }
          }
          case 'switch-page': {
            try {
              const { pageId } = event;
              if (!pageId) {
                throw new Error('No page ID provided');
              }
              const { switchPage } = get();
              const page = get().modules.canvas.pages.find((page) => page.id === event.pageId);
              const queryParams = event.queryParams || [];
              if (!page.disabled) {
                const resolvedQueryParams = [];
                queryParams.forEach((param) => {
                  resolvedQueryParams.push([
                    getResolvedValue(param[0], customVariables),
                    getResolvedValue(param[1], customVariables),
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
                switchPage(page.id, page.handle, resolvedQueryParams);
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

    generateAppActions: (queryId, mode, isPreview = false) => {
      const { getCurrentPageComponents, dataQuery, eventsSlice, queryPanel, modules } = get();
      const { previewQuery } = queryPanel;
      const { executeAction } = eventsSlice;
      const currentComponents = Object.entries(getCurrentPageComponents());

      const runQuery = (queryName = '', parameters) => {
        const query = dataQuery.queries.modules['canvas'].find((query) => {
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

        return executeAction(event, mode, {});
      };

      const setVariable = (key = '', value = '') => {
        if (key) {
          const event = {
            actionId: 'set-custom-variable',
            key,
            value,
          };
          return executeAction(event, mode, {});
        }
      };

      const getVariable = (key = '') => {
        if (key) {
          const event = {
            actionId: 'get-custom-variable',
            key,
          };
          return executeAction(event, mode, {});
        }
      };

      const unSetVariable = (key = '') => {
        if (key) {
          const event = {
            actionId: 'unset-custom-variable',
            key,
          };
          return executeAction(event, mode, {});
        }
      };

      const showAlert = (alertType = '', message = '') => {
        const event = {
          actionId: 'show-alert',
          alertType,
          message,
        };
        return executeAction(event, mode, {});
      };

      const logout = () => {
        const event = {
          actionId: 'logout',
        };
        return executeAction(event, mode, {});
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
        return executeAction(event, mode, {});
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
        return executeAction(event, mode, {});
      };

      const setLocalStorage = (key = '', value = '') => {
        const event = {
          actionId: 'set-localstorage-value',
          key,
          value,
        };
        return executeAction(event, mode, {});
      };

      const copyToClipboard = (contentToCopy = '') => {
        const event = {
          actionId: 'copy-to-clipboard',
          contentToCopy,
        };
        return executeAction(event, mode, {});
      };

      const goToApp = (slug = '', queryParams = []) => {
        const event = {
          actionId: 'go-to-app',
          slug,
          queryParams,
        };
        return executeAction(event, mode, {});
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
        return executeAction(event, mode, {});
      };

      const setPageVariable = (key = '', value = '') => {
        const event = {
          actionId: 'set-page-variable',
          key,
          value,
        };
        return executeAction(event, mode, {});
      };

      const getPageVariable = (key = '') => {
        const event = {
          actionId: 'get-page-variable',
          key,
        };
        return executeAction(event, mode, {});
      };

      const unsetPageVariable = (key = '') => {
        const event = {
          actionId: 'unset-page-variable',
          key,
        };
        return executeAction(event, mode, {});
      };

      const switchPage = (pageHandle, queryParams = []) => {
        if (isPreview) {
          mode != 'view' &&
            toast('Page will not be switched for query preview', {
              icon: '⚠️',
            });
          return Promise.resolve();
        }
        const pages = modules.canvas.pages;
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
        return executeAction(event, mode, {});
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
        return executeAction(event, mode, {});
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
        return executeAction(event, mode, {});
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
        return executeAction(event, mode, {});
      };

      return {
        runQuery,
        setVariable,
        getVariable,
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
        unsetPageVariable,
        switchPage,
        logInfo,
        log,
        logError,
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
