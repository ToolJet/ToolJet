import { toast } from 'react-hot-toast';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const ARRAY_INDEX = /^(0|[1-9]\d*)$/;

// Inspector paths are written the way they are typed inside {{ }}: a.b, a[0], a["my key"].
// Joining keys with dots breaks for names with a space, dash, dot or leading digit.
export const appendPathSegment = (path, key) => {
  const name = String(key);
  if (IDENTIFIER.test(name)) return path ? `${path}.${name}` : name;
  return `${path}[${ARRAY_INDEX.test(name) ? name : JSON.stringify(name)}]`;
};

// The keys of a path built by appendPathSegment (plain dotted paths split the same way).
export const splitPath = (path = '') =>
  (path.match(/\[\d+\]|\["(?:[^"\\]|\\.)*"\]|[^.[\]]+/g) ?? []).map((part) =>
    part.startsWith('["') ? JSON.parse(part.slice(1, -1)) : part.replace(/^\[|\]$/g, '')
  );

export const noDataFoundChildDataFormat = (path, keyName) => ({
  id: `empty-${path}`,
  name: `No ${keyName || path} found`,
  children: [],
  metadata: { noData: true },
});

export const formatInspectorDataMisc = (obj, type, searchablePaths = new Set()) => {
  if (typeof obj !== 'object' || obj === null) return [];
  const data = Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
  const reduceData = (obj, path, level = 1) => {
    let data = obj;
    if (!obj || typeof obj !== 'object' || (path === 'page.variables' ? level > 2 : level > 1)) return [];
    else if (!Array.isArray(obj)) {
      data = Object.entries(obj);
    }

    if (path === 'page.variables' && level === 2 && data?.length === 0) {
      const key = path.split('.').at(-1);

      return [noDataFoundChildDataFormat(path, key)];
    }

    return data.reduce((acc, [name, value]) => {
      const currentPath = appendPathSegment(path, name);
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
        const currentPath = appendPathSegment(path, name);
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

// Value copies are JSON so they paste back as the same value; paths (includeQuotes off) are copied as typed.
export const copyToClipboard = (data, includeQuotes = true) => {
  let text;
  if (typeof data === 'function') text = 'function';
  else if (typeof data === 'string' && !includeQuotes) text = data;
  else text = JSON.stringify(data, null, 2) ?? String(data);
  navigator.clipboard.writeText(text);
  return toast.success('Copied to the clipboard', { position: 'top-center' });
};

// Rewrites any Inspector path (including old dot-joined ones such as a.0.b) as a {{ }} reference.
export const formatPathForCopy = (path) => splitPath(path).reduce(appendPathSegment, '');
