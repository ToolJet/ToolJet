export const formatInspectorDataMisc = (obj, type, searchablePaths = new Set()) => {
  if (typeof obj !== 'object' || obj === null) return [];
  const data = Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
  const reduceData = (obj, path, level = 1) => {
    let data = obj;
    if (!obj || typeof obj !== 'object' || (path === 'page.variables' ? level > 2 : level > 1)) return [];
    else if (!Array.isArray(obj)) {
      data = Object.entries(obj);
    }
    return data.reduce((acc, [name, value]) => {
      const currentPath = path + `.${name}`;
      searchablePaths.add(currentPath);
      return [
        ...acc,
        {
          id: currentPath,
          name,
          children: reduceData(value, currentPath, level + 1),
          metadata: {
            type: 'misc',
            path: currentPath,
            ...((path === 'page.variables' ? level === 2 : level === 1) && {
              data: typeof value === 'object' ? JSON.stringify(value) : value,
            }),
          },
        },
      ];
    }, []);
  };

  return reduceData(data, type);
};

export const formatInspectorComponentData = (
  componentIdNameMapping,
  exposedComponentsVariables,
  searchablePaths = new Set()
) => {
  const data = Object.entries(componentIdNameMapping)
    .map(([key, name]) => ({
      key,
      name: name || key,
      value: exposedComponentsVariables[key] ?? { id: key },
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const reduceData = (obj, path = 'components', level = 1) => {
    let data = obj;
    if (!obj || typeof obj !== 'object' || level > 1) return [];
    else if (!Array.isArray(obj)) {
      data = Object.entries(obj);
    }
    return data
      .filter((item) => item.name)
      .reduce((acc, { key, name, value }) => {
        const currentPath = path + `.${name}`;
        searchablePaths.add(currentPath);
        return [
          ...acc,
          {
            id: currentPath,
            name,
            children: reduceData(value, currentPath, level + 1),
            metadata: {
              type: 'components',
              path: currentPath,
              ...(level === 1 && { data: typeof value === 'object' ? JSON.stringify(value) : value }),
            },
          },
        ];
      }, []);
  };

  return reduceData(data);
};

export const formatInspectorQueryData = (queryNameIdMapping, exposedQueries, searchablePaths = new Set()) => {
  const reverseMapping = Object.fromEntries(Object.entries(queryNameIdMapping).map(([name, id]) => [id, name]));
  const _sortedQueries = Object.entries(exposedQueries)
    .map(([key, value]) => ({
      key,
      name: reverseMapping[key] || key,
      value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const reduceData = (obj, path = 'queries', level = 1) => {
    let data = obj;
    if (!obj || typeof obj !== 'object' || level > 1) return [];
    else if (!Array.isArray(obj)) {
      data = Object.entries(obj);
    }
    return data
      .filter((item) => item.name)
      .reduce((acc, { id, name, value }) => {
        const currentPath = path + `.${name}`;
        searchablePaths.add(currentPath);
        return [
          ...acc,
          {
            id: currentPath,
            name,
            children: reduceData(value, currentPath, level + 1),
            metadata: {
              type: 'queries',
              path: currentPath,
              ...(level === 1 && { data: typeof value === 'object' ? JSON.stringify(value) : value }),
            },
          },
        ];
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

export const getTheme = (darkMode) => {
  return {
    scheme: 'custom',
    author: 'chris kempson (http://chriskempson.com)',
    base00: 'transparent',
    base01: '#303030',
    base02: '#505050',
    base03: '#b0b0b0',
    base04: '#d0d0d0',
    base05: '#1B1F24',
    base06: '#f5f5f5',
    base07: '#ffffff',
    base08: '#fb0120',
    base09: '#9467BD',
    base0A: '#fda331',
    base0B: '#2CA02C',
    base0C: '#76c7b7',
    base0D: '#e4e0db',
    base0E: '#d381c3',
    base0F: '#be643c',
  };
};
