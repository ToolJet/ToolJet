import { useResolveStore } from '@/_stores/resolverStore';
import _ from 'lodash';

const acorn = require('acorn');

export function validateMultilineCode(code) {
  const reservedKeyword = ['app', 'window', 'this']; // Case-sensitive reserved keywords

  for (let token of acorn.tokenizer(code)) {
    if (reservedKeyword.includes(token.value)) {
      return {
        status: 'failed',
        data: {
          message: `Code contains reserved keywords`,
          description: 'Cannot resolve code with reserved keywords in it. Please remove them and try again.',
        },
      };
    }
  }

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
