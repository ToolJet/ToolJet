/**
 * Reads a nested value map from the options object.
 *
 * When a parseKey is provided (e.g. 'list_rows.where_filters') the function
 * traverses the options object along that dot-separated path.
 * When no parseKey is provided it falls back to options[getter].
 */
export function readValueMapFromOptions(options, getter, parseKey) {
  if (parseKey) {
    const pathSegments = parseKey.split('.');
    let current = options;
    for (const segment of pathSegments) {
      current = current?.[segment];
    }
    return current ?? {};
  }
  return options?.[getter] ?? {};
}

/**
 * Builds the arguments for handleOptionChange after an update.
 *
 * When parseKey is 'list_rows.where_filters' the function updates
 * options['list_rows'] with the new data and returns
 * ['list_rows', updatedListRowsObject].
 * When no parseKey is provided it returns [getter, newValue].
 */
export function buildOptionChangeArgs(options, getter, parseKey, newValue) {
  if (parseKey) {
    const pathSegments = parseKey.split('.');
    const topLevelKey = pathSegments[0];
    const nestedSegments = pathSegments.slice(1);

    const updatedTopLevelObject = { ...options?.[topLevelKey] };
    let pointer = updatedTopLevelObject;

    for (let index = 0; index < nestedSegments.length - 1; index++) {
      pointer[nestedSegments[index]] = { ...pointer[nestedSegments[index]] };
      pointer = pointer[nestedSegments[index]];
    }

    pointer[nestedSegments[nestedSegments.length - 1]] = newValue;

    return [topLevelKey, updatedTopLevelObject];
  }

  return [getter, newValue];
}
