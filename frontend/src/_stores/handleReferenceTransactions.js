import _ from 'lodash';
import { useAppDataStore } from './appDataStore';
import { useEditorStore } from './editorStore';
import { useDataQueriesStore } from './dataQueriesStore';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

//* finding references within deeply nested objects using Depth-First Search (DFS) traversal
function dfs(node, oldRef, newRef) {
  if (typeof node === 'object') {
    for (let key in node) {
      const value = node[key];
      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        const referenceExists = value.includes(oldRef);

        if (referenceExists) {
          node[key] = value.replace(oldRef, newRef);
        }
      } else if (typeof value === 'object') {
        dfs(value, oldRef, newRef);
      }
    }
  }

  return node;
}

export const handleReferenceTransactions = (
  components,
  dataQueries,
  currentAppEvents,
  appDefinition,
  currentPageId,
  currentVersionId,
  updatedEntityNames = []
) => {
  if (updatedEntityNames.length === 0) return;

  const _dataQueries = JSON.parse(JSON.stringify(dataQueries));
  updatedEntityNames.forEach((component) => {
    components.forEach((c) => {
      c.definition = dfs(c.definition, component.name, component.newName);
    });

    _dataQueries.forEach((query) => {
      query.options = dfs(query.options, component.name, component.newName);
    });

    currentAppEvents.forEach((event) => {
      event.event = dfs(event.event, component.name, component.newName);
    });
  });

  const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

  const componentsFromAppDef = newAppDefinition.pages[currentPageId].components;

  components.forEach((component) => {
    componentsFromAppDef[component.id].component.definition = component.definition;
  });
  newAppDefinition.pages[currentPageId].components = componentsFromAppDef;

  const diffPatches = diff(appDefinition, newAppDefinition);

  const queriesToUpdate = _.differenceWith(_dataQueries, dataQueries, _.isEqual).map((q) => {
    return {
      id: q.id,
      options: q.options,
    };
  });

  useAppDataStore.getState().actions.updateState({
    appDiffOptions: { componentDefinitionChanged: true },
    appDefinitionDiff: diffPatches,
  });

  useEditorStore.getState().actions.updateEditorState({
    appDefinition: newAppDefinition,
    isUpdatingEditorStateInProcess: true,
  });

  useDataQueriesStore.getState().actions.updateBulkQueryOptions(queriesToUpdate, currentVersionId);

  const updatedEvents = currentAppEvents.map((event) => {
    return {
      event_id: event.id,
      diff: event,
    };
  });

  useAppDataStore.getState().actions.updateAppVersionEventHandlers(updatedEvents, 'update');
};
