import { v4 as uuidv4 } from 'uuid';

// Input values are stored as `options.params` rows tagged `source: 'input'`, saved after Params rows
// so they win when the request is built (last key wins).

const INPUT_SOURCE = 'input';

const isInputRow = (param) => param?.source === INPUT_SOURCE;

// [] for legacy versions (no `workflowInputs`) and versions declaring none.
export const getDeclaredInputs = (inputs) => {
  return Array.isArray(inputs) ? inputs.filter((input) => input?.key) : [];
};

// Input rows the selected version doesn't declare fall back to Params.
export const isParamsRow = (param, declaredInputKeys) => !isInputRow(param) || !declaredInputKeys.has(param.key);

const findInputRowIndex = (params, key) => {
  for (let i = params.length - 1; i >= 0; i--) {
    if (isInputRow(params[i]) && params[i].key === key) return i;
  }
  return -1;
};

export const getInputParamValue = (params, key) => params[findInputRowIndex(params, key)]?.value ?? '';

// Params row whose key is a declared input that already has a value.
export const isConflictingParamsRow = (param, params, declaredInputKeys) =>
  !isInputRow(param) && declaredInputKeys.has(param.key) && getInputParamValue(params, param.key) !== '';

// Empty value removes the row so the input default applies. Same array when unchanged.
export const upsertInputParam = (params, key, value) => {
  const index = findInputRowIndex(params, key);
  if (value === '' || value === undefined) {
    return index === -1 ? params : params.filter((param) => !(isInputRow(param) && param.key === key));
  }
  if (index === -1) return [...params, { key, value, id: uuidv4(), source: INPUT_SOURCE }];
  if (params[index].value === value) return params;
  return params.map((param, i) => (i === index ? { ...param, value } : param));
};

// Applied on save. Same array when already ordered.
export const orderInputRowsLast = (params) => {
  const firstInputRow = params.findIndex(isInputRow);
  if (firstInputRow === -1 || params.slice(firstInputRow).every(isInputRow)) return params;
  return [...params.filter((param) => !isInputRow(param)), ...params.filter(isInputRow)];
};

export const formatInputDefault = (value) => (typeof value === 'string' ? value : JSON.stringify(value));
