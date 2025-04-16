export const formatInspectorDataMisc = (obj) => {
  if (typeof obj !== 'object' || obj === null) return [];
  const data = Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
  const reduceData = (obj) => {
    let data = obj;
    if (!obj || typeof obj !== 'object') return [];
    else if (!Array.isArray(obj)) {
      data = Object.entries(obj);
    }
    return data.reduce((acc, [name, value]) => {
      return [...acc, { name, children: reduceData(value), metadata: { type: 'misc' } }];
    }, []);
  };

  return reduceData(data);
};

export const formatInspectorComponentData = (componentIdNameMapping, exposedComponentsVariables) => {
  const data = Object.entries(componentIdNameMapping)
    .map(([key, name]) => ({
      key,
      name: name || key,
      value: exposedComponentsVariables[key] ?? { id: key },
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const reduceData = (obj) => {
    let data = obj;
    if (!obj || typeof obj !== 'object') return [];
    else if (!Array.isArray(obj)) {
      data = Object.entries(obj);
    }
    return data
      .filter((item) => item.name)
      .reduce((acc, { key, name, value }) => {
        return [...acc, { name, children: reduceData(value), metadata: { type: 'components' } }];
      }, []);
  };

  return reduceData(data);
};

export const formatInspectorQueryData = (queryNameIdMapping, exposedQueries) => {
  const reverseMapping = Object.fromEntries(Object.entries(queryNameIdMapping).map(([name, id]) => [id, name]));
  const _sortedQueries = Object.entries(exposedQueries)
    .map(([key, value]) => ({
      key,
      name: reverseMapping[key] || key,
      value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const reduceData = (obj) => {
    let data = obj;
    if (!obj || typeof obj !== 'object') return [];
    else if (!Array.isArray(obj)) {
      data = Object.entries(obj);
    }
    return data
      .filter((item) => item.name)
      .reduce((acc, { id, name, value }) => {
        return [...acc, { name, children: reduceData(value), metadata: { type: 'queries' } }];
      }, []);
  };

  return reduceData(_sortedQueries);
};

export const extractComponentName = (path) => {
  // Match the last part of the URL before ".svg" using a regular expression
  const match = path.match(/\/([^/]+)\.svg$/);

  if (match && match[1]) {
    return match[1]; // Return the matched component name
  } else {
    return null; // Return null if the pattern doesn't match
  }
};
