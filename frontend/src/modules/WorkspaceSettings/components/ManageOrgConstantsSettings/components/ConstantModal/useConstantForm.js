import { useMemo, useState } from 'react';

export const NAME_MAX_LENGTH = 50;
export const VALUE_MAX_LENGTH = 10000;
export const VALUE_REQUIRED = 'Value is required';
const NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const getNameError = (name) => {
  if (!name) return null;
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer`;
  if (!NAME_PATTERN.test(name)) {
    return 'Name can only contain letters, numbers and underscores, and cannot start with a number';
  }
  return null;
};

// A Secret's stored value is never returned by the server, so its row starts empty and
// stays out of the update body until the user types a replacement.
const buildInitialRows = (constant, environments) => {
  const rows = {};
  (constant?.values ?? []).forEach(({ environment_id: envId, has_value: hasValue, value }) => {
    if (!hasValue) return;
    const env = environments.find((e) => e.id === envId);
    rows[envId] = {
      stored: true,
      initial: constant.type === 'Secret' ? '' : (value ?? ''),
      value: constant.type === 'Secret' ? '' : (value ?? ''),
      removed: false,
      locked: env ? !env.enabled : false,
      touched: false,
    };
  });
  return rows;
};

export function useConstantForm({ mode, constant, environments, multiEnvironment = true }) {
  const isEdit = mode === 'edit';
  const [name, setNameState] = useState(isEdit ? (constant?.name ?? '') : '');
  const [type, setTypeState] = useState(isEdit ? (constant?.type ?? 'Global') : 'Global');
  const [rowMap, setRowMap] = useState(() => (isEdit ? buildInitialRows(constant, environments) : {}));

  const updateRow = (envId, patch) =>
    setRowMap((prev) => (prev[envId] ? { ...prev, [envId]: { ...prev[envId], ...patch } } : prev));

  const isSecretRow = type === 'Secret';

  const rows = useMemo(() => {
    const orderOf = (envId) => {
      const index = environments.findIndex((e) => e.id === envId);
      return index === -1 ? environments.length : index;
    };
    return Object.entries(rowMap)
      .sort(([a], [b]) => orderOf(a) - orderOf(b))
      .map(([environmentId, row]) => ({
        environmentId,
        environmentName:
          environments.find((e) => e.id === environmentId)?.name ??
          constant?.values?.find((v) => v.environment_id === environmentId)?.environment_name ??
          environmentId,
        value: row.value,
        removed: row.removed,
        locked: row.locked,
        stored: row.stored,
        touched: row.touched,
        masked: isEdit && isSecretRow && row.stored,
        error: row.value.length > VALUE_MAX_LENGTH ? `Value must be ${VALUE_MAX_LENGTH} characters or fewer` : null,
      }));
  }, [rowMap, environments, constant, isEdit, isSecretRow]);

  const valueCountAfterSave = rows.filter((r) => !r.removed && !r.locked && (r.stored || r.value !== '')).length;

  const canRemove = (envId) => {
    const row = rowMap[envId];
    if (!row || row.locked || row.removed) return false;
    if (!row.stored) return true;
    return valueCountAfterSave >= 2;
  };

  // A removed row stays in `rows` until save (it sends the delete) but no longer counts as a value.
  const canAddEnvironment = multiEnvironment || rows.every((r) => r.removed);

  const availableEnvironments = environments.filter((e) => !rowMap[e.id] || rowMap[e.id].removed);
  const allEnvironmentsAdded = environments
    .filter((e) => e.enabled)
    .every((e) => rowMap[e.id] && !rowMap[e.id].removed);

  const addEnvironment = (envId) => {
    const env = environments.find((e) => e.id === envId);
    if (!env || !env.enabled || !canAddEnvironment) return;
    // Adding back an environment whose stored value was removed restores that value.
    if (rowMap[envId]) {
      if (rowMap[envId].removed) updateRow(envId, { removed: false });
      return;
    }
    setRowMap((prev) => ({
      ...prev,
      [envId]: { stored: false, initial: '', value: '', removed: false, locked: false, touched: false },
    }));
  };

  const removeRow = (envId) => {
    const row = rowMap[envId];
    if (!row || row.locked) return;
    if (!row.stored) {
      setRowMap(({ [envId]: _dropped, ...rest }) => rest);
      return;
    }
    if (canRemove(envId)) updateRow(envId, { removed: true });
  };

  // A value box that has been left empty is only flagged once the user has been in it.
  const touchRow = (envId) => updateRow(envId, { touched: true });

  const setValue = (envId, value) => {
    const row = rowMap[envId];
    if (row && !row.locked && !row.removed) updateRow(envId, { value });
  };

  const setName = (next) => {
    if (!isEdit) setNameState(next);
  };
  const setType = (next) => {
    if (!isEdit) setTypeState(next);
  };

  const changedValues = [];
  Object.entries(rowMap).forEach(([environmentId, row]) => {
    if (row.removed) {
      changedValues.push({ environment_id: environmentId, value: null });
    } else if (row.value !== '' && (!row.stored || row.value !== row.initial)) {
      changedValues.push({ environment_id: environmentId, value: row.value });
    }
  });
  const orderOf = (envId) => environments.findIndex((e) => e.id === envId);
  changedValues.sort((a, b) => orderOf(a.environment_id) - orderOf(b.environment_id));

  const nameValid = isEdit || (name.length > 0 && getNameError(name) === null);
  const hasRowError = rows.some((r) => r.error);
  const hasEmptiedGlobal =
    isEdit && !isSecretRow && rows.some((r) => r.stored && !r.removed && !r.locked && r.value === '');

  const isDirty = changedValues.length > 0;
  const canSubmit = nameValid && isDirty && !hasRowError && !hasEmptiedGlobal;

  // Say why Save is off, but only where an empty box is what blocks it: a stored Global value that was cleared, or
  // a new box the user left empty while there is nothing else to save. A Secret's empty box means "unchanged", and
  // an empty extra box beside a filled one is ignored on save, so neither is flagged.
  const requiredError = (row) => {
    if (row.removed || row.locked || row.value !== '') return null;
    if (row.stored) return isSecretRow ? null : VALUE_REQUIRED;
    return row.touched && !isDirty ? VALUE_REQUIRED : null;
  };
  const rowsWithErrors = rows.map((row) => ({ ...row, error: row.error ?? requiredError(row) }));

  const toApiBody = () => (isEdit ? { values: changedValues } : { name, type, values: changedValues });

  return {
    name,
    type,
    setName,
    setType,
    nameValid,
    nameError: isEdit ? null : getNameError(name),
    rows: rowsWithErrors,
    availableEnvironments,
    allEnvironmentsAdded,
    canAddEnvironment,
    addEnvironment,
    removeRow,
    touchRow,
    setValue,
    canRemove,
    isDirty,
    canSubmit,
    toApiBody,
  };
}
