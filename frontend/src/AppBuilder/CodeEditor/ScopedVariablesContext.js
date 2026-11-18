import { createContext } from 'react';
import { traverseObjectToHints } from './hintTraversal';

// Extra variables that only exist for the code editors inside one part of the UI, such as
// `app` in the "All apps" nav item's hide expression, which runs once per generated link.
// Value: `{ [name]: sampleValue }`. Every nested CodeHinter then:
//   - lists `name` and its fields first in autocomplete, and
//   - resolves its preview with the sample value.
// Same shape of solution as TableColumnContext (rowData/cellValue), for any caller.
export const ScopedVariablesContext = createContext(null);

/** Autocomplete hints for the scoped variables, flagged as context hints so they rank first. */
export const scopedVariableHints = (variables) =>
  Object.entries(variables ?? {}).flatMap(([name, value]) => [
    { hint: name, type: Object.prototype.toString.call(value).slice(8, -1), isContext: true },
    ...traverseObjectToHints(value, name).map((hint) => ({ ...hint, isContext: true })),
  ]);
