import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';

// Old ListViews and the default never reach the resolver, so they pay nothing per store change.
const NEVER_DISABLED = /^\s*(\{\{\s*false\s*\}\}|false)?\s*$/;

export const isNeverDisabled = (expression) =>
  expression === undefined || expression === null || expression === false || NEVER_DISABLED.test(`${expression}`);

// Only a real `true` disables: a throw, a string or an unresolved `{{...}}` text must not lock a record.
export const isRecordDisabled = (expression, listItem) => {
  const [, , value] = resolveReferences(expression, {}, { listItem });
  return value === true || value === 'true';
};
