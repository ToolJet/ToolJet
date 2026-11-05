import useStore from '@/AppBuilder/_stores/store';

// Old ListViews and the default never reach the resolver, so they pay nothing per store change.
const NEVER_DISABLED = /^\s*(\{\{\s*false\s*\}\}|false)?\s*$/;

export const isNeverDisabled = (expression) =>
  expression === undefined || expression === null || expression === false || NEVER_DISABLED.test(`${expression}`);

// Same reading as the boolean schema (trimmed, any-case "true"); an error or anything else leaves the record enabled.
export const isRecordDisabled = (expression, listItem, moduleId) => {
  let value;
  try {
    value = useStore.getState().getResolvedValue(expression, { listItem }, moduleId);
  } catch {
    return false;
  }
  return value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true');
};
