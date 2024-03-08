import _ from 'lodash';
import { useAppDataStore } from './appDataStore';
import { useEditorStore } from './editorStore';
import { useDataQueriesStore } from './dataQueriesStore';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { useResolverStoreActions } from './resolverStore';

//*  using binary search to find and replace it with new hint (re-named entities) from the currentSuggestions array
function binarySearchUpdate(array, obj) {
  const { old, newHint } = obj;
  let start = 0;
  let end = array.length - 1;
  while (start <= end) {
    let middle = Math.floor((start + end) / 2);
    if (array[middle].hint === old) {
      array[middle].hint = newHint;
      return;
    } else if (array[middle].hint < old) {
      start = middle + 1;
    } else {
      end = middle - 1;
    }
  }
}

export function removeAppSuggestions(suggestionsArray, deleteAndReplaceArray) {
  const sortedSuggestionsArray = JSON.parse(
    JSON.stringify(suggestionsArray.sort((a, b) => a.hint.localeCompare(b.hint)))
  );

  deleteAndReplaceArray.forEach((suggestion) => {
    binarySearchUpdate(sortedSuggestionsArray, suggestion);
  });

  return sortedSuggestionsArray;
}

//* finding references and update within deeply nested objects using Depth-First Search (DFS) traversal
export function dfs(node, oldRef, newRef) {
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
  // Start Transaction
  const transactionSnapshot = {
    components: JSON.parse(JSON.stringify(components)),
    dataQueries: JSON.parse(JSON.stringify(dataQueries)),
    events: JSON.parse(JSON.stringify(currentAppEvents)),
    appDefinition: JSON.parse(JSON.stringify(appDefinition)),
  };

  try {
    if (updatedEntityNames.length === 0) return;

    // Update Operations
    const _components = JSON.parse(JSON.stringify(components));
    const _dataQueries = JSON.parse(JSON.stringify(dataQueries));
    const events = JSON.parse(JSON.stringify(currentAppEvents));
    updatedEntityNames.forEach((entity) => {
      _components.forEach((c) => {
        c.definition = dfs(c.definition, entity.name, entity.newName);
      });

      _dataQueries.forEach((query) => {
        query.options = dfs(query.options, entity.name, entity.newName);
      });

      events.forEach((event) => {
        event.event = dfs(event.event, entity.name, entity.newName);
      });
    });

    // Commit Transaction
    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const componentsFromAppDef = newAppDefinition.pages[currentPageId].components;

    _components.forEach((component) => {
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

    if (diffPatches) {
      useAppDataStore.getState().actions.updateState({
        appDiffOptions: { componentDefinitionChanged: true },
        appDefinitionDiff: diffPatches,
      });

      useEditorStore.getState().actions.updateEditorState({
        appDefinition: newAppDefinition,
        isUpdatingEditorStateInProcess: true,
      });
    }

    if (queriesToUpdate.length > 0) {
      useDataQueriesStore.getState().actions.updateBulkQueryOptions(queriesToUpdate, currentVersionId);
    }

    const eventsToUpdate = _.differenceWith(events, currentAppEvents, _.isEqual).map((event) => {
      return {
        event_id: event.id,
        diff: event,
      };
    });

    if (eventsToUpdate.length > 0) {
      useAppDataStore.getState().actions.updateAppVersionEventHandlers(eventsToUpdate, 'update');
    }
  } catch (error) {
    /**
     * !Revert to the transaction snapshot
     * Rollback any changes made during the transaction
     */

    console.error('Transaction failed:', error);

    useEditorStore.getState().actions.updateEditorState({
      appDefinition: transactionSnapshot.appDefinition,
      isUpdatingEditorStateInProcess: false,
    });

    useAppDataStore.getState().actions.updateState({
      appDiffOptions: { componentDefinitionChanged: false },
      appDefinitionDiff: {},
    });

    useDataQueriesStore.getState().actions.updateBulkQueryOptions(transactionSnapshot.dataQueries, currentVersionId);

    useAppDataStore.getState().actions.updateAppVersionEventHandlers(transactionSnapshot.events, 'update');
  }

  updatedEntityNames.forEach((entity) => {
    useResolverStoreActions().handleUpdatesOnReferencingEnities(entity);
  });
};
