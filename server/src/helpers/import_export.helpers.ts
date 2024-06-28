export function updateEntityReferences(node, resourceMapping: Record<string, string> = {}) {
  if (typeof node === 'object') {
    for (const key in node) {
      let value = node[key];
      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        const referenceExists = value;

        if (referenceExists) {
          const ref = value.replace('{{', '').replace('}}', '');

          const entityName = ref.split('.')[1];

          if (resourceMapping[entityName]) {
            const newValue = value.replace(entityName, resourceMapping[entityName]);

            node[key] = newValue;
          }
        }
      } else if (typeof value === 'object') {
        value = updateEntityReferences(value, resourceMapping);
      }
    }
  }

  return node;
}

export function findAllEntityReferences(node, allRefs): [] {
  if (typeof node === 'object') {
    for (const key in node) {
      const value = node[key];
      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        const referenceExists = value;

        if (referenceExists) {
          const ref = value.replace('{{', '').replace('}}', '');

          const entityName = ref.split('.')[1];

          allRefs.push(entityName);
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
