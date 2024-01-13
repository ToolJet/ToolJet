import { useResolveStore } from '@/_stores/resolverStore';

const acorn = require('acorn');

const code = `
const array = [1, 2, 3];
const string = "hello";
const object = {};
const boolean = true;
const number = 1;
`;

const ast = acorn.parse(code, { ecmaVersion: 2020 });

function traverseAST(node, callback) {
  callback(node);
  for (let key in node) {
    if (node[key] && typeof node[key] === 'object') {
      traverseAST(node[key], callback);
    }
  }
}

function getMethods(type) {
  const arrayMethods = Object.getOwnPropertyNames(Array.prototype).filter(
    (p) => typeof Array.prototype[p] === 'function'
  );
  const stringMethods = Object.getOwnPropertyNames(String.prototype).filter(
    (p) => typeof String.prototype[p] === 'function'
  );
  const objectMethods = Object.getOwnPropertyNames(Object.prototype).filter(
    (p) => typeof Object.prototype[p] === 'function'
  );
  const booleanMethods = Object.getOwnPropertyNames(Boolean.prototype).filter(
    (p) => typeof Boolean.prototype[p] === 'function'
  );
  const numberMethods = Object.getOwnPropertyNames(Number.prototype).filter(
    (p) => typeof Number.prototype[p] === 'function'
  );

  switch (type) {
    case 'Array':
      return arrayMethods;
    case 'String':
      return stringMethods;
    case 'Object':
      return objectMethods;
    case 'Boolean':
      return booleanMethods;
    case 'Number':
      return numberMethods;
    default:
      return [];
  }
}

function inferType(node) {
  if (node.type === 'ArrayExpression') {
    return 'Array';
  } else if (node.type === 'Literal') {
    if (typeof node.value === 'string') {
      return 'String';
    } else if (typeof node.value === 'number') {
      return 'Number';
    } else if (typeof node.value === 'boolean') {
      return 'Boolean';
    }
  } else if (node.type === 'ObjectExpression') {
    return 'Object';
  }
  return null;
}

export const createJavaScriptSuggestions = () => {
  const allMethods = {};

  traverseAST(ast, (node) => {
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
      const type = inferType(node.init);
      if (type) {
        allMethods[node.id.name] = {
          type: type,
          methods: getMethods(type),
        };
      }
    }
  });

  return allMethods;
};

export function generateSuggestiveHints(suggestionList, query) {
  const result = suggestionList.filter((key) => key.includes(query));

  const suggestions = result.filter((key) => {
    const hintsDelimiterCount = countDelimiter(key, '.');
    const queryDelimiterCount = countDelimiter(query, '.');
    const hintDepth = queryDelimiterCount + 1;

    if (
      hintDepth !== queryDelimiterCount &&
      (hintsDelimiterCount === hintDepth || hintsDelimiterCount === queryDelimiterCount)
    ) {
      return true;
    }
  });

  function countDelimiter(string, delimiter) {
    var stringsearch = delimiter;

    var str = string;
    var count = 0;
    for (var i = (count = 0); i < str.length; count += +(stringsearch === str[i++]));

    return count;
  }

  return suggestions;
}

export const resolveReferences = (query) => {
  let resolvedValue = null;
  let error = null;

  const { lookupTable } = useResolveStore.getState();

  // const idToLookUp = lookupTable.hints.get(query);
  // const value = lookupTable.resolvedRefs.get(idToLookUp);

  if (lookupTable.hints.has(query)) {
    const idToLookUp = lookupTable.hints.get(query);
    resolvedValue = lookupTable.resolvedRefs.get(idToLookUp);
  } else {
    error = `No reference found for ${query}`;
  }

  return [resolvedValue, error];
};
