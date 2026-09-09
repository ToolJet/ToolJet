import { autocompletion } from '@codemirror/autocomplete';

// Matches while the cursor is inside an open "{{table." token, e.g. "{{table.sec|" - the |
// marks the cursor. Used to offer table-name completions for the second stage of typing.
const TABLE_NAME_TRIGGER = /\{\{table\.[\w-]*$/;
// Matches while the cursor is inside an open "{{" token not yet past "table.", e.g. "{{se|" or
// "{{|" - offers the top-level "self"/"table." choices.
const ROOT_TRIGGER = /\{\{[\w.]*$/;

function placeholderCompletionSource({ allowTableRef, tableNames }) {
  return (context) => {
    const tableMatch = context.matchBefore(TABLE_NAME_TRIGGER);
    if (allowTableRef && tableMatch) {
      const dotIndex = tableMatch.text.lastIndexOf('.');
      return {
        from: tableMatch.from + dotIndex + 1,
        options: tableNames.map((name) => ({
          label: name,
          type: 'class',
          apply: `${name}}}`,
        })),
        validFor: /^[\w-]*$/,
      };
    }

    const rootMatch = context.matchBefore(ROOT_TRIGGER);
    if (!rootMatch) return null;

    const options = [{ label: 'self', type: 'keyword', apply: 'self}}', detail: 'this table' }];
    if (allowTableRef) {
      options.push({ label: 'table.', type: 'keyword', apply: 'table.', detail: 'reference another table' });
    }
    return { from: rootMatch.from + 2, options, validFor: /^[\w.]*$/ };
  };
}

/**
 * CodeMirror extension offering `{{self}}`/`{{table.<name>}}` completions on `{{` - the only
 * legal way to name a table in either TJDB SQL surface. Standalone: unlike App Builder's
 * CodeEditor completion (AppBuilder/CodeEditor/autocompleteExtensionConfig.js), this has no
 * dependency on the AppBuilder Zustand store/context, which SqlEditor.jsx doesn't have.
 */
export function createPlaceholderCompletion({ allowTableRef = false, tableNames = [] } = {}) {
  return autocompletion({ override: [placeholderCompletionSource({ allowTableRef, tableNames })] });
}
