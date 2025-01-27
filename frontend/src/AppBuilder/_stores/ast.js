const acorn = require('acorn');
const walk = require('acorn-walk');

function findExpression(input) {
  const matches = [];
  let startIdx = -1;
  let braceCount = 0;

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '{' && input[i + 1] === '{' && braceCount === 0) {
      startIdx = i;
      braceCount = 2;
      i++; // Skip the second '{'
    } else if (input[i] === '{' && braceCount > 0) {
      braceCount++;
    } else if (input[i] === '}' && braceCount > 0) {
      braceCount--;
      if (braceCount === 0 && startIdx !== -1) {
        matches.push({
          fullMatch: input.slice(startIdx, i + 1),
          expression: input.slice(startIdx + 2, i - 1).trim(),
          index: startIdx,
        });
        startIdx = -1;
      }
    }
  }

  return matches;
}

export function extractAndReplaceReferencesFromString(input, componentIdNameMapping = {}, queryIdNameMapping = {}) {
  // Quick check for relevant keywords
  const regexForQuickCheck =
    /\b(components|queries|globals|variables|page|parameters|secrets|constants)(?:\[\S*|\.\S*|\?\.\S*)/;
  if (!regexForQuickCheck.test(input)) {
    return {
      allRefs: [],
      valueWithId: input,
      valueWithBrackets: input,
    };
  }

  const relevantKeywords = /\b(components|queries|globals|variables|page|parameters|secrets|constants)\b/;
  const expressionRegex = /{{(.*?)}}/gs;
  const results = [];
  let lastIndex = 0;
  let replacedString = '';
  let bracketNotationString = '';

  // Precompile the UUID regex
  const uuidRegex =
    /\b(components|queries)(\??\.|\??\.?\[['"]?)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(['"]?\])?/g;

  let match;
  if (input.startsWith('{{{') && input.endsWith('}}}')) {
    const inputContent = input.slice(3, -3);
    input = `{{({${inputContent}})}}`;
    const matches = findExpression(input);
    for (const match of matches) {
      const { fullMatch, expression, index } = match;

      // Check if the expression contains relevant keywords
      if (!relevantKeywords.test(expression)) {
        replacedString += input.slice(lastIndex, index);
        bracketNotationString += input.slice(lastIndex, index);
        replacedString += fullMatch;
        bracketNotationString += fullMatch;
        lastIndex = index + fullMatch.length;
        continue;
      }

      try {
        const { processedExpression, uuidMappings } = preprocessExpression(
          expression,
          uuidRegex,
          componentIdNameMapping,
          queryIdNameMapping
        );
        const parsedResult = parseExpression(
          processedExpression,
          componentIdNameMapping,
          queryIdNameMapping,
          uuidMappings
        );

        replacedString += input.slice(lastIndex, index);
        bracketNotationString += input.slice(lastIndex, index);

        const replacedExpression = replaceIdsInExpression(
          processedExpression,
          componentIdNameMapping,
          queryIdNameMapping,
          false,
          uuidMappings
        );
        const bracketNotationExpression = replaceIdsInExpression(
          processedExpression,
          componentIdNameMapping,
          queryIdNameMapping,
          true,
          uuidMappings
        );

        replacedString += `{{${replacedExpression}}}`;
        bracketNotationString += `{{${bracketNotationExpression}}}`;

        results.push({
          allRefs: parsedResult.references,
          valueWithId: `{{${replacedExpression}}}`,
          valueWithBrackets: `{{${bracketNotationExpression}}}`,
        });
      } catch (error) {
        replacedString += fullMatch;
        bracketNotationString += fullMatch;
        results.push({
          allRefs: [],
          valueWithId: fullMatch,
          valueWithBrackets: fullMatch,
        });
      }

      lastIndex = index + fullMatch.length;
    }

    replacedString += input.slice(lastIndex);
    bracketNotationString += input.slice(lastIndex);
    // remove the parentheses that were added

    return {
      valueWithId: `{{${replacedString.slice(3, -3)}}}`,
      valueWithBrackets: `{{${bracketNotationString.slice(3, -3)}}}`,
      allRefs: results.flatMap((r) => r.allRefs),
    };
  }
  while ((match = expressionRegex.exec(input)) !== null) {
    const fullMatch = match[0];
    const expression = match[1].trim();

    // Check if the expression contains relevant keywords
    if (!relevantKeywords.test(expression)) {
      replacedString += input.slice(lastIndex, match.index);
      bracketNotationString += input.slice(lastIndex, match.index);
      replacedString += fullMatch;
      bracketNotationString += fullMatch;
      lastIndex = match.index + fullMatch.length;
      continue;
    }

    try {
      const { processedExpression, uuidMappings } = preprocessExpression(
        expression,
        uuidRegex,
        componentIdNameMapping,
        queryIdNameMapping
      );
      const parsedResult = parseExpression(
        processedExpression,
        componentIdNameMapping,
        queryIdNameMapping,
        uuidMappings
      );

      replacedString += input.slice(lastIndex, match.index);
      bracketNotationString += input.slice(lastIndex, match.index);

      const replacedExpression = replaceIdsInExpression(
        processedExpression,
        componentIdNameMapping,
        queryIdNameMapping,
        false,
        uuidMappings
      );
      const bracketNotationExpression = replaceIdsInExpression(
        processedExpression,
        componentIdNameMapping,
        queryIdNameMapping,
        true,
        uuidMappings
      );

      replacedString += `{{${replacedExpression}}}`;
      bracketNotationString += `{{${bracketNotationExpression}}}`;

      results.push({
        allRefs: parsedResult.references,
        valueWithId: `{{${replacedExpression}}}`,
        valueWithBrackets: `{{${bracketNotationExpression}}}`,
      });
    } catch (error) {
      replacedString += fullMatch;
      bracketNotationString += fullMatch;
      results.push({
        allRefs: [],
        valueWithId: fullMatch,
        valueWithBrackets: fullMatch,
      });
    }

    lastIndex = match.index + fullMatch.length;
  }

  replacedString += input.slice(lastIndex);
  bracketNotationString += input.slice(lastIndex);

  return {
    allRefs: results.flatMap((r) => r.allRefs),
    valueWithId: replacedString,
    valueWithBrackets: bracketNotationString,
  };
}

function preprocessExpression(expression, uuidRegex, componentIdNameMapping, queryIdNameMapping) {
  const uuidMappings = {};
  let placeholderCounter = 0;

  const processedExpression = expression.replace(uuidRegex, (match, p1, p2, p3, p4) => {
    const placeholder = `__UUID_PLACEHOLDER_${placeholderCounter}__`;
    uuidMappings[placeholder] = (p1 === 'components' ? componentIdNameMapping[p3] : queryIdNameMapping[p3]) || p3;
    placeholderCounter++;
    return `${p1}${p2}${placeholder}${p4 || ''}`;
  });

  return { processedExpression, uuidMappings };
}

function replaceIdsInExpression(
  expression,
  componentIdNameMapping,
  queryIdNameMapping,
  useBracketNotation,
  uuidMappings
) {
  try {
    const ast = acorn.parse(expression, { ecmaVersion: 2020 });
    const replacements = [];

    walk.simple(ast, {
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          (node.object.name === 'components' || node.object.name === 'queries')
        ) {
          const isComponent = node.object.name === 'components';
          const mapping = isComponent ? componentIdNameMapping : queryIdNameMapping;

          if (node.property.type === 'Identifier') {
            const name = node.property.name;
            const nameWithOptionalCheck = node.optional
              ? useBracketNotation
                ? `${node.object.name}?.`
                : `${node.object.name}?`
              : `${node.object.name}`;
            if (mapping[name] || name.startsWith('__UUID_PLACEHOLDER_')) {
              const start = node.start;
              const end = node.end;
              let replacement;
              if (name.startsWith('__UUID_PLACEHOLDER_')) {
                const actualName = uuidMappings[name];
                replacement = useBracketNotation
                  ? `${nameWithOptionalCheck}["${actualName}"]`
                  : `${nameWithOptionalCheck}.${actualName}`;
              } else {
                replacement = useBracketNotation
                  ? `${nameWithOptionalCheck}["${mapping[name]}"]`
                  : `${nameWithOptionalCheck}.${mapping[name]}`;
              }
              replacements.push({ start, end, replacement });
            }
          } else if (node.property.type === 'Literal') {
            const name = node.property.value;
            const nameWithOptionalCheck = node.optional ? `${node.object.name}?.` : `${node.object.name}`;
            if (mapping[name] || name.startsWith('__UUID_PLACEHOLDER_')) {
              const start = node.start;
              const end = node.end;
              let replacement;
              if (name.startsWith('__UUID_PLACEHOLDER_')) {
                const actualName = uuidMappings[name];
                replacement = `${nameWithOptionalCheck}["${actualName}"]`;
              } else {
                replacement = `${nameWithOptionalCheck}["${mapping[name]}"]`;
              }
              replacements.push({ start, end, replacement });
            }
          }
        }
      },
    });

    if (replacements.length === 0) return expression;

    replacements.sort((a, b) => b.start - a.start);

    let result = expression;
    for (const { start, end, replacement } of replacements) {
      result = result.slice(0, start) + replacement + result.slice(end);
    }

    return result;
  } catch (error) {
    return expression;
  }
}

function parseExpression(expression, componentIdNameMapping, queryIdNameMapping, uuidMappings) {
  try {
    const ast = acorn.parse(expression, { ecmaVersion: 2020 });
    const references = [];
    const validRootObjects = {
      components: true,
      queries: true,
      variables: true,
      globals: true,
      page: true,
    };

    walk.simple(ast, {
      MemberExpression: handleMemberExpression,
      OptionalMemberExpression: handleMemberExpression,
    });

    // eslint-disable-next-line no-inner-declarations
    function handleMemberExpression(node) {
      const reference = extractPath(node);
      if (reference) references.push(reference);
    }

    // eslint-disable-next-line no-inner-declarations
    function extractPath(node) {
      const path = [];
      let current = node;
      let rootObject = '';

      while (current) {
        if (current.type === 'Identifier') {
          path.unshift(current.name);
          if (validRootObjects[current.name]) {
            rootObject = current.name;
            break;
          }
        } else if (current.type === 'MemberExpression' || current.type === 'OptionalMemberExpression') {
          if (current.computed) {
            if (
              current.property.type === 'Literal' &&
              (typeof current.property.value === 'string' || typeof current.property.value === 'number')
            ) {
              path.unshift(current.property.value.toString());
            } else {
              break;
            }
          } else {
            path.unshift(current.property.name);
          }
        } else {
          break;
        }
        current = current.object;
      }

      if (
        (rootObject && (rootObject === 'queries' || rootObject === 'components') && path.length >= 3) ||
        ((rootObject === 'variables' || rootObject === 'globals' || rootObject === 'page') && path.length === 2) ||
        (rootObject === 'page' && path.length === 3)
      ) {
        return createReferenceObject(rootObject, path, uuidMappings, componentIdNameMapping, queryIdNameMapping);
      }
      return null;
    }

    return { references };
  } catch (error) {
    return { references: [] };
  }
}

function createReferenceObject(entityType, path, uuidMappings, componentIdNameMapping, queryIdNameMapping) {
  let entityNameOrId, entityKey;

  if (entityType === 'components' || entityType === 'queries') {
    entityNameOrId = path[1];
    entityKey = path[2];

    if (entityNameOrId.startsWith('__UUID_PLACEHOLDER_')) {
      entityNameOrId = uuidMappings[entityNameOrId];
    } else {
      const mapping = entityType === 'components' ? componentIdNameMapping : queryIdNameMapping;
      entityNameOrId = mapping[entityNameOrId] || entityNameOrId;
    }
  } else if (entityType === 'variables' || entityType === 'globals' || (entityType === 'page' && path.length === 2)) {
    entityKey = path[1];
  } else if (entityType === 'page' && path.length === 3) {
    entityNameOrId = path[1];
    entityKey = path[2];
  }

  return { entityType, entityNameOrId, entityKey };
}
