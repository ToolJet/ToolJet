import { useResolveStore } from '@/_stores/resolverStore';
import _ from 'lodash';

export function validateMultilineCode(code, isMultiLine = false) {
  return {
    status: 'success',
    data: {
      message: 'No reserved keywords found.',
    },
  };
}

export function updateParentNodes(path, newValue) {
  const pathsToUpdate = [];

  const updateReceivedPath = path;

  const allPathsToBeUpdated = updateReceivedPath.split('.');

  let currentPath = '';

  for (let i = 0; i < allPathsToBeUpdated.length; i++) {
    currentPath = currentPath + allPathsToBeUpdated[i];

    if (i !== allPathsToBeUpdated.length - 1) {
      const lookUpTable = useResolveStore.getState().lookupTable;

      const existingRef = lookUpTable.resolvedRefs?.get(lookUpTable.hints?.get(currentPath));

      if (typeof existingRef === 'function') return;

      const updatePath = allPathsToBeUpdated.slice(i + 1).join('.');

      const newRef = _.set(existingRef, updatePath, newValue);

      pathsToUpdate.push({ hint: currentPath, newRef });
    }

    currentPath = currentPath + '.';
  }

  return pathsToUpdate;
}
