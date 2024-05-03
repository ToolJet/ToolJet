import { useResolveStore } from '@/_stores/resolverStore';
import _ from 'lodash';

export function validateMultilineCode(code) {
  const reservedKeyword = ['app', 'window', 'this']; // Case-sensitive reserved keywords
  const keywordRegex = new RegExp(`\\b(${reservedKeyword.join('|')})\\b`, 'i');
  let inString = false;
  let inComment = false;
  let currentQuote = null;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];

    // Check if entering or exiting a string
    if ((char === '"' || char === "'") && !inComment) {
      if (inString && char === currentQuote && code[i - 1] !== '\\') {
        inString = false;
        currentQuote = null;
      } else if (!inString) {
        inString = true;
        currentQuote = char;
      }
    }

    if (!inString && char === '/' && nextChar === '/') {
      inComment = true;
    }

    if (inComment && (char === '\n' || char === '\r')) {
      inComment = false;
    }

    // If we are not within a string or a comment, check for keywords
    if (!inString && !inComment) {
      const restOfCode = code.substring(i);
      const match = restOfCode.match(keywordRegex);
      if (match && match.index === 0) {
        return {
          status: 'failed',
          data: {
            message: `Code contains reserved keywords`,
            description: 'Cannot resolve code with reserved keywords in it. Please remove them and try again.',
          },
        };
      }
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
