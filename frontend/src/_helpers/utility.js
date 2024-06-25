import { useResolveStore } from '@/_stores/resolverStore';
import _ from 'lodash';

export function validateMultilineCode(code, isMultiLine = false) {
  const reservedKeywords = ['app', 'this', 'window']; // Case-sensitive reserved keywords except 'window'
  const keywordRegex = new RegExp(`\\b(${reservedKeywords.join('|')})\\b`, 'i');
  let inString = false;
  let inComment = false;
  let currentQuote = null;

  if (!isMultiLine) {
    const codeHasExactMatch = reservedKeywords.some((keyword) => {
      // window.location.href is a valid code, so we need to exclude it
      if (code.includes(`window.`) || code.includes(`.window`) || code.includes('.app')) {
        return false;
      }

      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      return keywordRegex.test(code);
    });

    if (codeHasExactMatch) {
      return {
        status: 'failed',
        data: {
          message: `Code contains reserved keywords`,
          description: 'Cannot resolve code with reserved keywords in it. Please remove them and try again.',
        },
      };
    }
  } else {
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
        const windowIndex = code.indexOf('window');
        if (
          windowIndex !== -1 &&
          (code[windowIndex + 6] === undefined || code[windowIndex + 6] !== '.') &&
          (code[windowIndex - 1] === undefined || code[windowIndex - 1] !== ':') &&
          !code.includes('window:')
        ) {
          return {
            status: 'failed',
            data: {
              message: `Code contains reserved keyword 'window'`,
              description:
                'Cannot resolve code with reserved keyword "window" in it unless it is followed by a dot. Please remove it and try again.',
            },
          };
        }

        if (code.substring(i, i + 7) !== 'window.' || (i > 0 && code[i - 1] === 'app')) {
          // Skip the rest of the loop to avoid checking for reserved keywords
          continue;
        } else if (code.substring(i, i + 6) === 'window' && (code[i + 6] === undefined || code[i + 6] !== '.')) {
          return {
            status: 'failed',
            data: {
              message: `Code contains reserved keyword 'window'`,
              description:
                'Cannot resolve code with reserved keyword "window" in it unless it is followed by a dot. Please remove it and try again.',
            },
          };
        }

        const restOfCode = code.substring(i);
        const match = restOfCode.match(keywordRegex);

        if (match && match.index === 0) {
          // Ensure the match is an exact word
          const before = i > 0 ? code[i - 1] : null;
          const after = i + match[0].length < code.length ? code[i + match[0].length] : null;
          const isExactMatch = (!before || /\W/.test(before)) && (!after || /\W/.test(after));
          const matchedInput = match['input'];
          const isInputExactMatch = matchedInput === match[0];

          if (isExactMatch && isInputExactMatch) {
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
