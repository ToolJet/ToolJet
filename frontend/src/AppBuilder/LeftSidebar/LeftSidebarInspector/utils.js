import { toast } from 'react-hot-toast';

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
            type: type,
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

export const copyToClipboard = (data) => {
  const stringified = JSON.stringify(data, null, 2).replace(/\\/g, '');
  navigator.clipboard.writeText(stringified);
  return toast.success('Copied to the clipboard', { position: 'top-center' });
};
