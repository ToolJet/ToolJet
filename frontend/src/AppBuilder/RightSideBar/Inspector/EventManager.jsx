import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNewEventAutoPopoverOpen } from './hooks/useNewEventAutoPopoverOpen';

import { ArrowRight, Copy, MousePointerClick, Plus, Trash2 } from 'lucide-react';
import { ActionTypes } from './ActionTypes';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Input,
  Switch,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  Select as RocketSelect,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  ToggleGroup as RocketToggleGroup,
  ToggleGroupItem as RocketToggleGroupItem,
} from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';
import { FieldRow, SelectContent, SelectItem, OptionCombobox } from './ActionConfigurationPanels/shared';
import { GotoApp } from './ActionConfigurationPanels/GotoApp';
import { SwitchPage } from './ActionConfigurationPanels/SwitchPage';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useDraggableInPortal from '@/_hooks/useDraggableInPortal';
import _, { get } from 'lodash';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import { useTranslation } from 'react-i18next';
import RunjsParameters from './ActionConfigurationPanels/RunjsParamters';
import { useAppDataActions } from '@/_stores/appDataStore';
import { isQueryRunnable } from '@/_helpers/utils';
import { shallow } from 'zustand/shallow';
import CodeHinter from '@/AppBuilder/CodeEditor';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { handleLowPriorityWork } from '@/_helpers/editorHelpers';
import { appService } from '@/_services';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import useStore from '@/AppBuilder/_stores/store';
import { useEventActions, useEvents } from '@/AppBuilder/_stores/slices/eventsSlice';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import './EventManager.scss';

export const EventManager = ({
  sourceId,
  eventSourceType,
  eventMetaDefinition,
  excludeEvents,
  popOverCallback,
  popoverPlacement,
  hideEmptyEventsAlert,
  callerQueryId,
  customEventRefs = undefined,
  callerQueryName,
  component,
}) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const components = useStore((state) => state.getCurrentPageComponents());
  const pages = useStore((state) => _.get(state, 'modules.canvas.pages', []), shallow).filter(
    (page) => !page.disabled && !page.isPageGroup
  );
  const moduleInputDummyQueries = useStore((state) => state?.getModuleInputDummyQueries?.(), shallow) || {};

  const dataQueries = useStore((state) => {
    const queries = state.dataQuery?.queries?.modules?.canvas || [];
    if (callerQueryId) {
      return queries.filter((query) => query.id != callerQueryId);
    }
    return queries;
  });
  const allAppEvents = useEvents();
  const { createAppVersionEventHandlers, deleteAppVersionEventHandler, updateAppVersionEventHandlers } =
    useEventActions();
  const appId = useStore((state) => state.appStore.modules[moduleId].app.appId);

  const eventsUpdatedLoader = useStore((state) => state.eventsSlice.getEventsUpdatedLoader(), shallow);
  const eventsCreatedLoader = useStore((state) => state.eventsSlice.getEventsCreatedLoader(), shallow);
  const actionsUpdatedLoader = useStore((state) => state.eventsSlice.getActionsUpdatedLoader(), shallow);
  const eventToDeleteLoaderIndex = useStore((state) => state.eventsSlice.getEventToDeleteLoaderIndex(), shallow);

  const { updateState } = useAppDataActions();

  const currentEvents = allAppEvents?.filter((event) => {
    if (customEventRefs) {
      if (event.event.ref !== customEventRefs.ref) {
        return false;
      }
    }

    return event.sourceId === sourceId && event.target === eventSourceType;
  });

  const [events, setEvents] = useState([]);
  const [focusedEventIndex, setFocusedEventIndex] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const lastFocusedEventIndex = useRef(null);

  const {
    autoOpenActionSelect,
    markEventCreationPending,
    cancelPendingEventCreation,
    onEventHandlersUpdated,
    dismissEventPopoverAutoOpen,
  } = useNewEventAutoPopoverOpen(focusedEventIndex, setFocusedEventIndex);

  const { t } = useTranslation();

  useEffect(() => {
    if (_.isEqual(currentEvents, events)) return;

    const sortedEvents = (currentEvents || []).slice().sort((a, b) => a.index - b.index);
    onEventHandlersUpdated(sortedEvents, events);
    setEvents(sortedEvents, moduleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(currentEvents), moduleId]);

  let groupedOptions = ActionTypes.reduce((acc, action) => {
    const groupName = action.group;

    if (!acc[groupName]) {
      acc[groupName] = [];
    }

    acc[groupName].push({
      label: action.name,
      value: action.id,
    });

    return acc;
  }, {});

  let actionOptions = Object.keys(groupedOptions).map((groupName) => {
    return { label: groupName, options: groupedOptions[groupName] };
  });

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const actionLookup = Object.fromEntries(ActionTypes.map((actionType) => [actionType.id, actionType]));

  let alertTypes = [
    {
      name: 'Info',
      id: 'info',
    },
    {
      name: 'Success',
      id: 'success',
    },
    {
      name: 'Warning',
      id: 'warning',
    },
    {
      name: 'Error',
      id: 'error',
    },
  ];

  let alertOptions = alertTypes.map((alert) => {
    return { name: alert.name, value: alert.id };
  });

  excludeEvents = excludeEvents || [];

  /* Filter events based on excludesEvents ( a list of event ids to exclude ) */
  let possibleEvents = Object.keys(eventMetaDefinition.events)
    .filter((eventId) => !excludeEvents.includes(eventId))
    .map((eventId) => {
      return {
        name: eventMetaDefinition?.events[eventId]?.displayName,
        value: eventId,
      };
    });

  function getComponentOptions(componentType = '') {
    let componentOptions = [];
    Object.keys(components || {}).forEach((key) => {
      if (componentType === '' || components[key].component.component === componentType) {
        componentOptions.push({
          name: components[key].component.name,
          value: key,
        });
      }
    });
    return componentOptions;
  }

  function isChildOfModal(componentId) {
    const parentId = components[componentId]?.component?.parent?.slice(0, 36);
    if (!parentId) return false;
    const parentComponent = components[parentId];
    if (!parentComponent) return false;
    if (parentComponent.component.component === 'Modal' || parentComponent.component.component === 'ModalV2') {
      return true;
    }
    return isChildOfModal(parentId);
  }

  function getComponentsOptionsWithoutModalChilds() {
    let componentOptions = [];
    Object.keys(components || {}).forEach((key) => {
      if (!isChildOfModal(key)) {
        componentOptions.push({
          name: components[key].component.name,
          value: key,
        });
      }
    });
    return componentOptions;
  }

  function getComponentOptionsOfComponentsWithActions(componentType = '') {
    let componentOptions = [];
    Object.keys(components || {}).forEach((key) => {
      const targetComponentMeta = componentTypes.find(
        (componentType) => components[key].component.component === componentType.component
      );
      if ((targetComponentMeta?.actions?.length ?? 0) > 0) {
        if (componentType === '' || components[key].component.component === componentType) {
          componentOptions.push({
            name: components[key].component.name,
            value: key,
          });
        }
      }
    });
    return componentOptions;
  }

  function getComponentActionOptions(componentId) {
    if (componentId == undefined) return [];
    const filteredComponents = Object.entries(components ?? {}).filter(([key, _value]) => key === componentId);
    if (_.isEmpty(filteredComponents)) return [];
    const component = filteredComponents[0][1];
    const targetComponentMeta = componentTypes.find(
      (componentType) => component.component.component === componentType.component
    );
    const actions = targetComponentMeta.actions;

    const options = (actions || []).map((action) => ({
      name: action?.displayName,
      value: action.handle,
    }));

    return options;
  }

  function getAction(componentId, actionHandle) {
    if (componentId == undefined || actionHandle == undefined) return {};
    const filteredComponents = Object.entries(components ?? {}).filter(([key, _value]) => key === componentId);
    if (_.isEmpty(filteredComponents)) return {};
    const component = filteredComponents[0][1];
    const targetComponentMeta = componentTypes.find(
      (componentType) => component.component.component === componentType.component
    );
    const actions = targetComponentMeta.actions;
    return (actions || []).find((action) => action.handle === actionHandle);
  }

  function getComponentActionDefaultParams(componentId, actionHandle) {
    const action = getAction(componentId, actionHandle);
    const defaultParams = (action?.params ?? []).map((param) => ({
      handle: param.handle,
      value: param.defaultValue,
    }));
    return defaultParams;
  }

  const fetchApps = async (page) => {
    const { apps } = await appService.getAllAddableApps();
    updateState({
      apps: apps.map((app) => ({
        id: app.id,
        name: app.name,
        slug: app.slug,
        current_version_id: app.current_version_id,
      })),
    });

    return apps;
  };

  async function getAllApps() {
    const apps = await fetchApps(0);
    let appsOptionsList = [];
    apps
      .filter((item) => item.slug !== undefined && item.id !== appId && item.current_version_id)
      .forEach((item) => {
        appsOptionsList.push({
          name: item.name,
          value: item.slug,
        });
      });
    return appsOptionsList;
  }

  function getPageOptions(event) {
    // If disabled page is already selected then don't remove from page options

    if (!Array.isArray(pages) || pages.length === 0) return [];

    if (pages.find((page) => page.id === event.pageId)?.disabled) {
      return pages.map((page) => ({
        name: page.name,
        value: page.id,
      }));
    }
    return pages
      .filter((page) => !page.disabled)
      .map((page) => ({
        name: page.name,
        value: page.id,
      }));
  }

  function handleQueryChange(index, updates) {
    let newEvents = deepClone(events);
    let updatedEvent = newEvents[index];

    updatedEvent.event = {
      ...updatedEvent.event,
      ...updates,
    };

    newEvents[index] = updatedEvent;

    updateAppVersionEventHandlers(
      [
        {
          event_id: updatedEvent.id,
          diff: updatedEvent,
        },
      ],
      'update'
    );
  }

  function handlerChanged(index, param, value) {
    let newEvents = deepClone(events);
    let updatedEvent = newEvents[index];

    if (param === 'name') {
      updatedEvent.name = value;
    } else {
      updatedEvent.event[param] = value;
    }

    // Remove debounce key if it's empty
    if (param === 'debounce' && value === '') {
      delete updatedEvent.event.debounce;
    }

    if (param === 'componentSpecificActionHandle') {
      const getDefault = getComponentActionDefaultParams(updatedEvent.event?.componentId, value);
      updatedEvent.event['componentSpecificActionParams'] = getDefault;
    }

    const shouldUpdateEvent = !_.isEmpty(diff(events[index], updatedEvent));
    if (!shouldUpdateEvent) return;

    handleLowPriorityWork(() => {
      updateAppVersionEventHandlers(
        [
          {
            event_id: updatedEvent.id,
            diff: updatedEvent,
          },
        ],
        'update',
        param
      );
    });
  }

  function getDefaultEventName() {
    return `Event #${events.length + 1}`;
  }

  function removeHandler(index) {
    const eventsHandler = deepClone(events);
    const eventId = eventsHandler[index].id;
    deleteAppVersionEventHandler(eventId, index);
  }

  function duplicateHandler(index) {
    const source = events[index];
    if (!source) return;
    createAppVersionEventHandlers({
      name: `${source.name} copy`,
      event: deepClone(source.event),
      eventType: source.target,
      attachedTo: source.sourceId,
      index: events.length,
    });
  }

  async function addHandler(eventId) {
    let newEvents = events;
    const eventIndex = newEvents.length;
    const selectedEventId = eventId || Object.keys(eventMetaDefinition?.events)[0];
    //----------------- Posthog Analytics for event handlers -----------------//
    let postHogEventType = 'Event Handler';

    switch (eventSourceType) {
      case 'component':
        postHogEventType = components[sourceId]['component']['component'];
        break;

      case 'page':
        postHogEventType = `Page - ${sourceId}`;
        break;

      case 'data_query':
        postHogEventType = `Query - ${sourceId}`;
        break;

      default:
        break;
    }

    posthogHelper.captureEvent('click_add_event_handler', { widget: postHogEventType });
    //----------------- Posthog Analytics -----------------//
    markEventCreationPending();
    const createdEvent = await createAppVersionEventHandlers({
      name: getDefaultEventName(),
      event: {
        eventId: selectedEventId,
        actionId: 'show-alert',
        message: 'Hello world!',
        alertType: 'info',
        component: eventMetaDefinition.name,
        ...customEventRefs,
      },
      eventType: eventSourceType,
      attachedTo: sourceId,
      index: eventIndex,
    });
    if (!createdEvent) cancelPendingEventCreation();
  }

  //following two are functions responsible for on change and value for the control specific actions
  const onChangeHandlerForComponentSpecificActionHandle = (value, index, param, event) => {
    const newParam = { ...param, value: value };
    const params = event?.componentSpecificActionParams ?? [];

    const newParams =
      params.length > 0
        ? params.map((paramOfParamList) => {
            return paramOfParamList.handle === param.handle ? newParam : paramOfParamList;
          })
        : [newParam];

    return handlerChanged(index, 'componentSpecificActionParams', newParams);
  };
  const valueForComponentSpecificActionHandle = (event, param) => {
    const componentSpecificActionParamsExits = Array.isArray(event?.componentSpecificActionParams);
    const defaultValue = param.defaultValue ?? '';

    if (componentSpecificActionParamsExits) {
      const paramValue =
        event?.componentSpecificActionParams?.find((paramItem) => paramItem.handle === param.handle)?.value ??
        defaultValue;

      return paramValue;
    }

    return defaultValue;
  };

  const constructDataQueryOptions = () => {
    const queries = dataQueries.filter((qry) => isQueryRunnable(qry)).map((qry) => ({ name: qry.name, value: qry.id }));
    const moduleInputs = Object.entries(moduleInputDummyQueries).map(([key, value]) => ({ name: value, value: key }));
    return [...moduleInputs, ...queries];
  };
  function eventPopover(eventHandler, index) {
    const event = eventHandler?.event || {};

    return (
      <>
        <div className="tw-flex tw-h-11 tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4 tw-py-2">
          <span className="tw-font-title-default tw-text-text-default">
            {t('editor.inspector.eventManager.editEvent', 'Edit event')}
          </span>
          <div className="tw-flex tw-items-center tw-gap-0.5">
            <Button
              variant="ghost"
              size="medium"
              iconOnly
              leadingVisual={<Copy className="tw-h-3.5 tw-w-3.5 tw-text-icon-strong" />}
              onClick={() => {
                setFocusedEventIndex(null);
                duplicateHandler(index);
              }}
              aria-label={t('editor.inspector.eventManager.duplicate', 'Duplicate')}
              data-cy="event-duplicate-btn"
            ></Button>
            <Button
              variant="ghost"
              size="medium"
              iconOnly
              leadingVisual={<Trash2 className="tw-h-3.5 tw-w-3.5 tw-text-icon-strong" />}
              onClick={() => {
                setFocusedEventIndex(null);
                removeHandler(index);
              }}
              aria-label={t('editor.inspector.eventManager.delete', 'Delete')}
              data-cy="event-delete-btn"
            ></Button>
          </div>
        </div>
        <div className="tw-p-4">
          <div className="tw-flex tw-flex-col tw-gap-3">
            <div className="tw-flex tw-flex-col tw-gap-2">
              <FieldRow
                label={t('editor.inspector.eventManager.enableEvent', 'Enable event')}
                dataCy="event-enabled-label"
              >
                <div className="tw-flex tw-justify-end">
                  <Switch
                    checked={!event.disabled}
                    onCheckedChange={(checked) => handlerChanged(index, 'disabled', !checked)}
                    aria-label={t('editor.inspector.eventManager.enableEvent', 'Enable event')}
                    data-cy="event-disabled-toggle"
                  />
                </div>
              </FieldRow>
              <FieldRow label={t('editor.inspector.eventManager.eventName', 'Event name')} dataCy="event-name-label">
                <Input
                  key={eventHandler?.id}
                  type="text"
                  defaultValue={eventHandler?.name ?? ''}
                  onBlur={(e) => handlerChanged(index, 'name', e.target.value)}
                  className="tw-w-full"
                  data-cy="event-name-input"
                />
              </FieldRow>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-3">
              <FieldRow label={t('editor.inspector.eventManager.event', 'Event')} dataCy="event-label">
                <div data-cy="event-selection">
                  <RocketSelect
                    value={event.eventId}
                    onValueChange={(value) => handlerChanged(index, 'eventId', value)}
                  >
                    <SelectTrigger className="tw-w-full">
                      <SelectValue placeholder={t('globals.select', 'Select') + '...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {possibleEvents.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </RocketSelect>
                </div>
              </FieldRow>
              <FieldRow label={t('editor.inspector.eventManager.action', 'Action')} dataCy="action-label">
                <div data-cy="action-selection">
                  <RocketSelect
                    value={event.actionId}
                    onValueChange={(value) => {
                      dismissEventPopoverAutoOpen();
                      handlerChanged(index, 'actionId', value);
                    }}
                    open={autoOpenActionSelect && index === focusedEventIndex ? true : undefined}
                    onOpenChange={(open) => {
                      if (!open && autoOpenActionSelect) dismissEventPopoverAutoOpen();
                    }}
                  >
                    <SelectTrigger className="tw-w-full">
                      <SelectValue placeholder={t('globals.select', 'Select') + '...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {actionOptions.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </RocketSelect>
                </div>
              </FieldRow>
              <FieldRow label={t('editor.inspector.eventManager.runOnlyIf', 'Run Only If')} dataCy="alert-type-label">
                <CodeHinter
                  type="basic"
                  initialValue={event.runOnlyIf}
                  onChange={(value) => handlerChanged(index, 'runOnlyIf', value)}
                  usePortalEditor={false}
                  component={component}
                  cyLabel={`run-only-if`}
                />
              </FieldRow>
            </div>
          </div>

          {actionLookup[event.actionId]?.options?.length > 0 && (
            <div className="tw-my-3 tw-flex tw-h-5 tw-items-center tw-gap-1.5" data-cy="action-option">
              <div className="tw-h-px tw-flex-1 tw-border-0 tw-border-t tw-border-border-weak tw-border-dashed" />
              <span className="tw-font-title-small tw-text-text-placeholder">
                {t('editor.inspector.eventManager.configureAction', 'Configure action')}
              </span>
              <div className="tw-h-px tw-flex-1 tw-border-0 tw-border-t tw-border-border-weak tw-border-dashed" />
            </div>
          )}
          <div
            className={cn(
              'tw-flex tw-flex-col tw-gap-3',
              !(actionLookup[event.actionId]?.options?.length > 0) && 'tw-mt-3'
            )}
          >
            {event.actionId === 'show-alert' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.message', 'Message')} dataCy="message-label">
                  <div data-cy="alert-message-input-field">
                    <CodeHinter
                      type="basic"
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.message}
                      onChange={(value) => handlerChanged(index, 'message', value)}
                      usePortalEditor={false}
                      component={component}
                    />
                  </div>
                </FieldRow>
                <FieldRow label={t('editor.inspector.eventManager.alertType', 'Alert Type')} dataCy="alert-type-label">
                  <div data-cy="alert-message-type">
                    <RocketSelect
                      value={event.alertType}
                      onValueChange={(value) => handlerChanged(index, 'alertType', value)}
                    >
                      <SelectTrigger className="tw-w-full">
                        <SelectValue placeholder={t('globals.select', 'Select') + '...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {alertOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </RocketSelect>
                  </div>
                </FieldRow>
              </>
            )}

            {event.actionId === 'open-webpage' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.url', 'URL')} dataCy="url-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.url}
                    onChange={(value) => handlerChanged(index, 'url', value)}
                    usePortalEditor={false}
                    component={component}
                  />
                </FieldRow>
                <FieldRow label="Open in" dataCy="open-in-label">
                  <RocketToggleGroup
                    type="single"
                    value={event?.windowTarget || 'newTab'}
                    onValueChange={(_value) => _value && handlerChanged(index, 'windowTarget', _value)}
                    className="tw-w-full"
                  >
                    <RocketToggleGroupItem value="newTab" className="tw-flex-1">
                      New tab
                    </RocketToggleGroupItem>
                    <RocketToggleGroupItem value="currentTab" className="tw-flex-1">
                      Current tab
                    </RocketToggleGroupItem>
                  </RocketToggleGroup>
                </FieldRow>
              </>
            )}

            {event.actionId === 'go-to-app' && (
              <GotoApp
                event={deepClone(event)}
                handlerChanged={handlerChanged}
                eventIndex={index}
                getAllApps={getAllApps}
                component={component}
              />
            )}

            {event.actionId === 'show-modal' && (
              <FieldRow label={t('editor.inspector.eventManager.modal', 'Modal')} dataCy="modal-label">
                <OptionCombobox
                  options={[...getComponentOptions('Modal'), ...getComponentOptions('ModalV2')]}
                  value={event.modal?.id ?? event.modal}
                  onChange={(value) => handlerChanged(index, 'modal', value)}
                />
              </FieldRow>
            )}

            {event.actionId === 'close-modal' && (
              <FieldRow label={t('editor.inspector.eventManager.modal', 'Modal')} dataCy="modal-label">
                <OptionCombobox
                  options={[...getComponentOptions('Modal'), ...getComponentOptions('ModalV2')]}
                  value={event.modal?.id ?? event.modal}
                  onChange={(value) => handlerChanged(index, 'modal', value)}
                />
              </FieldRow>
            )}

            {event.actionId === 'copy-to-clipboard' && (
              <FieldRow label={t('editor.inspector.eventManager.text', 'Text')} dataCy="text-label">
                <CodeHinter
                  type="basic"
                  initialValue={event.contentToCopy}
                  onChange={(value) => handlerChanged(index, 'contentToCopy', value)}
                  usePortalEditor={false}
                  component={component}
                />
              </FieldRow>
            )}

            {['run-query', 'reset-query', 'abort-query'].includes(event.actionId) && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.query', 'Query')} dataCy="query-label">
                  <div data-cy="query-selection-field">
                    <OptionCombobox
                      options={constructDataQueryOptions()}
                      value={event?.queryId}
                      onChange={(value) => {
                        if (value == null) return;
                        const query = dataQueries.find((dataquery) => dataquery.id === value);
                        if (isModuleEditor && query === undefined) {
                          handleQueryChange(index, {
                            queryId: value,
                            queryName: moduleInputDummyQueries[value],
                            parameters: {},
                          });
                        } else {
                          const parameters = (query?.options?.parameters ?? []).reduce(
                            (paramObj, param) => ({
                              ...paramObj,
                              [param.name]: param.defaultValue,
                            }),
                            {}
                          );
                          handleQueryChange(index, {
                            queryId: query.id,
                            queryName: query.name,
                            parameters: parameters,
                          });
                        }
                      }}
                    />
                  </div>
                </FieldRow>
                {event.actionId === 'run-query' && (
                  <RunjsParameters event={event} darkMode={darkMode} index={index} handlerChanged={handlerChanged} />
                )}
              </>
            )}

            {event.actionId === 'set-localstorage-value' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.key', 'Key')} dataCy="key-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.key}
                    onChange={(value) => handlerChanged(index, 'key', value)}
                    usePortalEditor={false}
                    component={component}
                  />
                </FieldRow>
                <FieldRow label={t('editor.inspector.eventManager.value', 'Value')} dataCy="value-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.value}
                    onChange={(value) => handlerChanged(index, 'value', value)}
                    usePortalEditor={false}
                    component={component}
                  />
                </FieldRow>
              </>
            )}
            {event.actionId === 'generate-file' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.type', 'Type')} dataCy="type-label">
                  <OptionCombobox
                    options={[
                      { name: 'CSV', value: 'csv' },
                      { name: 'Text', value: 'plaintext' },
                      { name: 'PDF', value: 'pdf' },
                    ]}
                    value={event.fileType ?? 'csv'}
                    onChange={(value) => handlerChanged(index, 'fileType', value)}
                  />
                </FieldRow>
                <FieldRow label={t('editor.inspector.eventManager.fileName', 'File name')} dataCy="file-name-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.fileName}
                    onChange={(value) => handlerChanged(index, 'fileName', value)}
                    component={component}
                  />
                </FieldRow>
                <FieldRow label={t('editor.inspector.eventManager.data', 'Data')} dataCy="data-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.data}
                    onChange={(value) => handlerChanged(index, 'data', value)}
                    component={component}
                  />
                </FieldRow>
              </>
            )}
            {event.actionId === 'set-table-page' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.table', 'Table')} dataCy="table-label">
                  <OptionCombobox
                    options={getComponentOptions('Table')}
                    value={event.table}
                    onChange={(value) => handlerChanged(index, 'table', value)}
                  />
                </FieldRow>
                <FieldRow label={t('editor.inspector.eventManager.pageIndex', 'Page index')} dataCy="page-index-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.pageIndex ?? '{{1}}'}
                    onChange={(value) => handlerChanged(index, 'pageIndex', value)}
                    usePortalEditor={false}
                    component={component}
                  />
                </FieldRow>
              </>
            )}
            {event.actionId === 'set-custom-variable' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.key', 'Key')} dataCy="key-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.key}
                    onChange={(value) => handlerChanged(index, 'key', value)}
                    enablePreview={true}
                    cyLabel={`event-key`}
                    component={component}
                  />
                </FieldRow>
                <FieldRow label={t('editor.inspector.eventManager.value', 'Value')} dataCy="value-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.value}
                    onChange={(value) => handlerChanged(index, 'value', value)}
                    cyLabel={`variable`}
                    component={component}
                  />
                </FieldRow>
              </>
            )}
            {event.actionId === 'unset-custom-variable' && (
              <FieldRow label={t('editor.inspector.eventManager.key', 'Key')} dataCy="key-label">
                <CodeHinter
                  type="basic"
                  initialValue={event.key}
                  onChange={(value) => handlerChanged(index, 'key', value)}
                  component={component}
                />
              </FieldRow>
            )}
            {event.actionId === 'set-page-variable' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.key', 'Key')} dataCy="key-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.key}
                    onChange={(value) => handlerChanged(index, 'key', value)}
                    cyLabel={`key`}
                    component={component}
                  />
                </FieldRow>
                <FieldRow label={t('editor.inspector.eventManager.value', 'Value')} dataCy="value-label">
                  <CodeHinter
                    type="basic"
                    initialValue={event.value}
                    onChange={(value) => handlerChanged(index, 'value', value)}
                    cyLabel={`variable`}
                    component={component}
                  />
                </FieldRow>
              </>
            )}
            {event.actionId === 'unset-page-variable' && (
              <FieldRow label={t('editor.inspector.eventManager.key', 'Key')} dataCy="key-label">
                <CodeHinter
                  type="basic"
                  initialValue={event.key}
                  onChange={(value) => handlerChanged(index, 'key', value)}
                  cyLabel={`key`}
                  component={component}
                />
              </FieldRow>
            )}
            {event.actionId === 'switch-page' && (
              <SwitchPage
                event={deepClone(event)}
                handlerChanged={handlerChanged}
                eventIndex={index}
                getPages={() => getPageOptions(event)}
                component={component}
              />
            )}
            {event.actionId === 'scroll-component-into-view' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.component', 'Component')} dataCy="component-label">
                  <OptionCombobox
                    options={getComponentsOptionsWithoutModalChilds()}
                    value={event.componentId}
                    onChange={(value) => handlerChanged(index, 'componentId', value)}
                  />
                </FieldRow>
                <FieldRow label="Behaviour" dataCy="scroll-behavior-label">
                  <RocketSelect
                    value={event.scrollBehavior ?? 'smooth'}
                    onValueChange={(value) => handlerChanged(index, 'scrollBehavior', value)}
                  >
                    <SelectTrigger className="tw-w-full">
                      <SelectValue placeholder={t('globals.select', 'Select') + '...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { name: 'Smooth', value: 'smooth' },
                        { name: 'Instant', value: 'instant' },
                        { name: 'Auto', value: 'auto' },
                      ].map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </RocketSelect>
                </FieldRow>
                <FieldRow label="Block" dataCy="scroll-block-label">
                  <RocketSelect
                    value={event.scrollBlock ?? 'nearest'}
                    onValueChange={(value) => handlerChanged(index, 'scrollBlock', value)}
                  >
                    <SelectTrigger className="tw-w-full">
                      <SelectValue placeholder={t('globals.select', 'Select') + '...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { name: 'Nearest', value: 'nearest' },
                        { name: 'Start', value: 'start' },
                        { name: 'Center', value: 'center' },
                        { name: 'End', value: 'end' },
                      ].map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </RocketSelect>
                </FieldRow>
              </>
            )}
            {event.actionId === 'control-component' && (
              <>
                <FieldRow
                  label={t('editor.inspector.eventManager.component', 'Component')}
                  dataCy="action-options-component-field-label"
                >
                  <div data-cy="action-options-component-selection-field">
                    <OptionCombobox
                      options={getComponentOptionsOfComponentsWithActions()}
                      value={event?.componentId}
                      onChange={(value) => handlerChanged(index, 'componentId', value)}
                    />
                  </div>
                </FieldRow>
                <FieldRow
                  label={t('editor.inspector.eventManager.action', 'Action')}
                  dataCy="action-options-action-field-label"
                >
                  <div data-cy="action-options-action-selection-field">
                    <OptionCombobox
                      options={getComponentActionOptions(event?.componentId)}
                      value={event?.componentSpecificActionHandle}
                      onChange={(value) => handlerChanged(index, 'componentSpecificActionHandle', value)}
                    />
                  </div>
                </FieldRow>
                {event?.componentId &&
                  event?.componentSpecificActionHandle &&
                  (getAction(event?.componentId, event?.componentSpecificActionHandle)?.params ?? []).map((param) => {
                    const optionsList = param.isDynamicOpiton
                      ? get({ ...components[event?.componentId] }, param.optionsGetter, []).map((tab) => ({
                          name: tab.title,
                          value: tab.id,
                        }))
                      : param.options;
                    const currentValue = valueForComponentSpecificActionHandle(event, param);

                    if (param.type === 'select') {
                      return (
                        <FieldRow
                          key={param.handle}
                          label={param?.displayName}
                          dataCy={`action-options-${param?.displayName}-field-label`}
                        >
                          <div data-cy="action-options-action-selection-field">
                            <OptionCombobox
                              options={optionsList ?? []}
                              value={currentValue}
                              onChange={(value) =>
                                onChangeHandlerForComponentSpecificActionHandle(value, index, param, event)
                              }
                            />
                          </div>
                        </FieldRow>
                      );
                    }

                    return (
                      <FieldRow
                        key={param.handle}
                        label={param?.displayName}
                        dataCy={`action-options-${param?.displayName}-field-label`}
                      >
                        <div data-cy="action-options-text-input-field">
                          <CodeHinter
                            type="fxEditor"
                            initialValue={currentValue}
                            onChange={(value) => {
                              onChangeHandlerForComponentSpecificActionHandle(value, index, param, event);
                            }}
                            paramLabel={' '}
                            paramType={param?.type}
                            fieldMeta={{ options: param?.options }}
                            cyLabel={`event-${param.displayName}`}
                            component={component}
                            isEventManagerParam={true}
                          />
                        </div>
                      </FieldRow>
                    );
                  })}
              </>
            )}
            {event.actionId === 'toggle-app-mode' && (
              <>
                <FieldRow label={t('editor.inspector.eventManager.appMode', 'App mode')} dataCy="app-mode-label">
                  <div data-cy="query-selection-field">
                    <OptionCombobox
                      options={[
                        { name: 'Light', value: 'light' },
                        { name: 'Dark', value: 'dark' },
                      ]}
                      value={event?.appMode}
                      onChange={(value) => handlerChanged(index, 'appMode', value)}
                    />
                  </div>
                </FieldRow>
                <RunjsParameters event={event} darkMode={darkMode} index={index} handlerChanged={handlerChanged} />
              </>
            )}
            <FieldRow label={t('editor.inspector.eventManager.debounce', 'Debounce')} dataCy="debounce-label">
              <CodeHinter
                type="basic"
                initialValue={event.debounce}
                onChange={(value) => handlerChanged(index, 'debounce', value)}
                usePortalEditor={false}
                component={component}
                cyLabel={'debounce'}
              />
            </FieldRow>
          </div>
        </div>
      </>
    );
  }

  const reorderEvents = (startIndex, endIndex) => {
    const result = deepClone(events);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reorderedEvents = result.map((event, index) => {
      return {
        ...event,
        index: index,
      };
    });

    updateAppVersionEventHandlers(
      reorderedEvents.map((event) => ({
        event_id: event.id,
        diff: event,
      })),
      'reorder'
    );
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    reorderEvents(source.index, destination.index);
  };

  const renderDraggable = useDraggableInPortal();
  const renderHandlers = (events) => {
    return (
      <TooltipProvider delayDuration={100}>
        <DragDropContext
          onDragEnd={(result) => {
            onDragEnd(result);
          }}
          className="w-100"
        >
          <Droppable droppableId="droppable">
            {({ innerRef, droppableProps, placeholder }) => (
              <div {...droppableProps} ref={innerRef}>
                {events.map((event, index) => {
                  const actionMeta = ActionTypes.find((action) => action.id === event.event.actionId);
                  // const rowClassName = `card-body p-0 ${focusedEventIndex === index ? ' bg-azure-lt' : ''}`;
                  return (
                    <Draggable key={index} draggableId={`${event.eventId}-${index}`} index={index}>
                      {renderDraggable((provided, snapshot) => {
                        if (snapshot.isDragging && focusedEventIndex !== null) {
                          setFocusedEventIndex(null);
                        }
                        const isOpen = focusedEventIndex === index && !snapshot.isDragging;
                        return (
                          <Popover
                            open={isOpen}
                            onOpenChange={(showing) => {
                              if (showing) {
                                setFocusedEventIndex(index);
                                lastFocusedEventIndex.current = index;
                              } else {
                                setFocusedEventIndex(null);
                                dismissEventPopoverAutoOpen();
                              }
                              if (typeof popOverCallback === 'function') popOverCallback(showing);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <div
                                key={index}
                                id={`${sourceId}-${index}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                data-cy="event-handler-card"
                                className="tw-mb-1 tw-h-14 tw-flex tw-cursor-pointer tw-items-start tw-gap-2 tw-rounded-md tw-bg-interactive-default tw-p-2 hover:tw-bg-interactive-hover"
                              >
                                <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center tw-gap-0.5">
                                  <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className="tw-min-w-0 tw-leading-5 tw-flex-1 tw-truncate tw-font-title-default tw-text-text-default"
                                          data-cy="event-handler-name"
                                        >
                                          {event?.name}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="left"
                                        showArrow={false}
                                        className="tw-z-[10001] tw-max-w-[260px]"
                                        data-cy="event-row-tooltip-name"
                                      >
                                        {event?.name}
                                      </TooltipContent>
                                    </Tooltip>
                                    {(index === focusedEventIndex && (actionsUpdatedLoader || eventsUpdatedLoader)) ||
                                    index === eventToDeleteLoaderIndex ? (
                                      <Spinner size="default" className="tw-text-icon-brand" />
                                    ) : (
                                      <Switch
                                        checked={!event.event.disabled}
                                        onCheckedChange={(checked) => handlerChanged(index, 'disabled', !checked)}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={t('editor.inspector.eventManager.enableEvent', 'Enable event')}
                                        data-cy="event-row-switch"
                                      />
                                    )}
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-1">
                                        <span className="tw-truncate tw-font-body-default tw-text-text-placeholder">
                                          {eventMetaDefinition?.events[event.event.eventId]?.displayName}
                                        </span>
                                        <ArrowRight className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-text-placeholder" />
                                        <span className="tw-min-w-0 tw-text-left tw-flex-1 tw-truncate tw-font-body-default tw-text-text-placeholder">
                                          {actionMeta.name}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="left"
                                      showArrow={false}
                                      className="tw-z-[10001] tw-max-w-[260px]"
                                      data-cy="event-row-tooltip-action"
                                    >
                                      {eventMetaDefinition?.events[event.event.eventId]?.displayName}
                                      {' → '}
                                      {actionMeta.name}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              side={popoverPlacement || 'left'}
                              align="center"
                              sideOffset={8}
                              className={cn(
                                'inspector-event-manager-popover tw-z-[1042] tw-w-[300px] tw-max-w-[300px] tw-gap-0 tw-overflow-hidden tw-p-0',
                                darkMode && 'dark-theme'
                              )}
                              data-cy="popover-card"
                              onInteractOutside={(e) => {
                                const autocomplete = document.querySelector('.cm-completionListIncompleteBottom');
                                if (autocomplete && autocomplete.contains(e.target)) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              {eventPopover(event, index)}
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                    </Draggable>
                  );
                })}
                {placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </TooltipProvider>
    );
  };

  const renderAddHandlerBtn = () => {
    return (
      <Popover
        open={addMenuOpen}
        onOpenChange={(showing) => {
          setAddMenuOpen(showing);
          if (typeof popOverCallback === 'function') popOverCallback(showing);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="default"
            leadingVisual={<Plus className="tw-h-4 tw-w-4" />}
            className="tw-shadow-elevation-100 tw-mt-1"
            data-cy="add-event-handler"
          >
            {t('editor.inspector.eventManager.addHandler', 'Add new event handler')}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="center"
          className={cn(
            'tw-z-[10001] tw-max-h-[280px] tw-w-[260px] tw-gap-0 tw-overflow-auto tw-p-2',
            darkMode && 'dark-theme'
          )}
          data-cy="add-event-menu"
        >
          {possibleEvents.length === 0 ? (
            <div className="tw-px-2 tw-py-1.5 tw-font-body-default tw-text-text-placeholder">
              {t('editor.inspector.eventManager.noEventsAvailable', 'No events available')}
            </div>
          ) : (
            possibleEvents.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => {
                  addHandler(e.value);
                  setAddMenuOpen(false);
                }}
                className="tw-w-full tw-cursor-pointer tw-appearance-none tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-left tw-font-body-default tw-text-text-default hover:tw-bg-interactive-hover"
                data-cy={`event-trigger-option-${e.value}`}
              >
                {e.name}
              </button>
            ))
          )}
        </PopoverContent>
      </Popover>
    );
  };

  if (events.length === 0) {
    if (hideEmptyEventsAlert) {
      return <div className="d-flex">{renderAddHandlerBtn()}</div>;
    }
    return (
      <Empty size="small" className="tw-px-0" data-cy="no-event-handler-message">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MousePointerClick />
          </EmptyMedia>
          <EmptyTitle>{t('editor.inspector.eventManager.emptyTitle', 'No events added yet.')}</EmptyTitle>
          <EmptyDescription>
            {t(
              'editor.inspector.eventManager.emptyDescription',
              'Add events to make your component interactive — like button clicks or form submissions'
            )}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>{renderAddHandlerBtn()}</EmptyContent>
      </Empty>
    );
  }

  return (
    <>
      {renderHandlers(events)}
      <div className="[&_button]:tw-w-full">{renderAddHandlerBtn()}</div>
    </>
  );
};
