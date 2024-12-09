export function updateEntityReferences(node, resourceMapping: Record<string, string> = {}) {
  if (typeof node === 'object') {
    for (const key in node) {
      let value = node[key];
      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        const referenceExists = value;

        if (referenceExists) {
          const matches = value.match(/{{(.*?)}}/g);
          // gett all references {{entityName}}
          if (matches) {
            matches.forEach((match) => {
              // remove curly braces and extract the entity "component.entityName.something"
              const ref = match.slice(2, -2).trim();
              const entityRegex = /(components|queries)\.[^{}]*/g;
              const entityMatches = ref.match(entityRegex)?.[0] || ref;
              const entityName = entityMatches.split('.')[1];

              if (resourceMapping[entityName]) {
                const newValue = value.replace(entityName, resourceMapping[entityName]);

                node[key] = newValue;
                value = newValue;
              }
            });
          } else {
            // kept this logic for fallback, although it should not be needed
            const ref = value.replace('{{', '').replace('}}', '');

            const entityName = ref.split('.')[1];

            if (resourceMapping[entityName]) {
              const newValue = value.replace(entityName, resourceMapping[entityName]);

              node[key] = newValue;
            }
          }
        }
      } else if (typeof value === 'object') {
        value = updateEntityReferences(value, resourceMapping);
      }
    }
  }

  return node;
}

function containsBracketNotation(queryString) {
  const bracketNotationRegex = /\[\s*['"][^'"]+['"]\s*\]/;
  return bracketNotationRegex.test(queryString);
}

export function findAllEntityReferences(node, allRefs): [] {
  if (typeof node === 'object') {
    for (const key in node) {
      const value = node[key];

      if (typeof value === 'string' && containsBracketNotation(value)) {
        //skip if the value is a bracket notation

        break;
      }

      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        const referenceExists = value;

        if (referenceExists) {
          const matches = value.match(/{{(.*?)}}/g);
          if (matches) {
            matches.forEach((match) => {
              const ref = match.slice(2, -2).trim(); // Remove {{ and }}
              const entityRegex = /(components|queries)\.[^{}]*/g;
              const entityMatches = ref.match(entityRegex)?.[0] || ref;
              const entityName = entityMatches.split('.')[1];
              if (entityName && !allRefs.includes(entityName)) {
                allRefs.push(entityName);
              }
            });
          } else {
            // kept this logic for fallback, although it should not be needed
            const ref = value.replace('{{', '').replace('}}', '');

            const entityName = ref.split('.')[1];

            allRefs.push(entityName);
          }
        }
      } else if (typeof value === 'object') {
        findAllEntityReferences(value, allRefs);
      }
    }
  }
  return allRefs;
}

export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
