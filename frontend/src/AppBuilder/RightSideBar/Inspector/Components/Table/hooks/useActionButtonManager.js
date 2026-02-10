import { useCallback } from 'react';
import { computeActionName } from '@/_helpers/utils';
import { useAppDataStore } from '@/_stores/appDataStore';

export const useActionButtonManager = ({ component, paramUpdated }) => {
  const actions = component?.component?.definition?.properties?.actions;
  const actionValues = actions?.value || [];

  // Delete events helper
  const deleteEvents = useCallback(async (ref, eventTarget) => {
    const events = useAppDataStore.getState().events.filter((event) => event.target === eventTarget);
    const toDelete = events?.filter((e) => e.event?.ref === ref.ref);

    return Promise.all(
      toDelete?.map((e) => useAppDataStore.getState().actions.deleteAppVersionEventHandler(e.id)) || []
    );
  }, []);

  // Add new action
  const addAction = useCallback(() => {
    const newAction = {
      name: computeActionName(actions),
      buttonText: 'Button',
      backgroundColor: 'var(--cc-surface2-surface)',
      textColor: 'var(--cc-primary-text)',
      events: [],
    };
    paramUpdated({ name: 'actions' }, 'value', [...actionValues, newAction], 'properties', true);
  }, [actions, actionValues, paramUpdated]);

  // Remove action by index
  const removeAction = useCallback(
    (index, ref) => {
      const newValue = [...actionValues];
      newValue.splice(index, 1);
      paramUpdated({ name: 'actions' }, 'value', newValue, 'properties', true);
      deleteEvents(ref, 'table_action');
    },
    [actionValues, paramUpdated, deleteEvents]
  );

  // Update action property
  const updateActionProperty = useCallback(
    (index, property, value) => {
      const newActions = [...actionValues];
      newActions[index] = { ...newActions[index], [property]: value };
      paramUpdated({ name: 'actions' }, 'value', newActions, 'properties', true);
    },
    [actionValues, paramUpdated]
  );

  // Update action events
  const updateActionEvents = useCallback(
    (index, events) => {
      const newActions = [...actionValues];
      newActions[index] = { ...newActions[index], events };
      paramUpdated({ name: 'actions' }, 'value', newActions, 'properties', true);
    },
    [actionValues, paramUpdated]
  );

  // Update action event (legacy format)
  const updateActionEvent = useCallback(
    (event, value, extraData) => {
      const index = extraData.index;
      const newActions = [...actionValues];
      newActions[index] = {
        ...newActions[index],
        [event.name]: { actionId: value },
      };
      paramUpdated({ name: 'actions' }, 'value', newActions, 'properties', true);
    },
    [actionValues, paramUpdated]
  );

  // Update action event option
  const updateActionEventOption = useCallback(
    (event, option, value, extraData) => {
      const index = extraData.index;
      const newActions = [...actionValues];
      const options = newActions[index][event.name]?.options || {};
      newActions[index] = {
        ...newActions[index],
        [event.name]: {
          ...newActions[index][event.name],
          options: { ...options, [option]: value },
        },
      };
      paramUpdated({ name: 'actions' }, 'value', newActions, 'properties', true);
    },
    [actionValues, paramUpdated]
  );

  return {
    actions: actionValues,
    addAction,
    removeAction,
    updateActionProperty,
    updateActionEvents,
    updateActionEvent,
    updateActionEventOption,
  };
};
