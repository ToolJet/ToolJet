import { useMemo, useState } from 'react';
import type {
  ConstantDetail,
  CreateConstantBody,
  UpdateConstantBody,
  ConstantValueChange,
} from '@/_services/types/organizationConstantsV2.types';
import { ConstantTypes, type ConstantType } from '../../helpers/constantType';

export const NAME_MAX_LENGTH = 50;
export const VALUE_MAX_LENGTH = 10000;
export const VALUE_REQUIRED = 'Value is required';
const NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** An environment as the modal lists it: the API's `enabled` flag says whether the licence covers it. */
export interface ConstantEnvironment {
  id: string;
  name: string;
  enabled: boolean;
}

interface StoredRow {
  stored: boolean;
  initial: string;
  value: string;
  removed: boolean;
  locked: boolean;
  touched: boolean;
}

export interface FormRow {
  environmentId: string;
  environmentName: string;
  value: string;
  removed: boolean;
  locked: boolean;
  stored: boolean;
  touched: boolean;
  masked: boolean;
  error: string | null;
}

export interface UseConstantFormOptions {
  mode: 'create' | 'edit';
  constant?: ConstantDetail | null;
  environments: ConstantEnvironment[];
  /** False when the licence allows one value for every environment only. */
  multiEnvironment?: boolean;
  /** The type a new constant starts with; an edited constant keeps its own. */
  defaultType?: ConstantType;
}

const getNameError = (name: string): string | null => {
  if (!name) return null;
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer`;
  if (!NAME_PATTERN.test(name)) {
    return 'Name can only contain letters, numbers and underscores, and cannot start with a number';
  }
  return null;
};

// Without the multi-environment licence the server stores one value in every environment, so the form shows that one
// value. It takes the first environment the licence covers, since a locked environment's value cannot be edited.
const keepOneRow = (
  rows: Record<string, StoredRow>,
  environments: ConstantEnvironment[]
): Record<string, StoredRow> => {
  const keptId =
    environments.find((e) => e.enabled && rows[e.id])?.id ??
    environments.find((e) => rows[e.id])?.id ??
    Object.keys(rows)[0];
  return keptId === undefined ? {} : { [keptId]: rows[keptId] };
};

// A Secret's stored value is never returned by the server, so its row starts empty and
// stays out of the update body until the user types a replacement.
const buildInitialRows = (
  constant: ConstantDetail | null | undefined,
  environments: ConstantEnvironment[],
  multiEnvironment: boolean
): Record<string, StoredRow> => {
  const rows: Record<string, StoredRow> = {};
  const isSecret = constant?.type === ConstantTypes.Secret;
  (constant?.values ?? []).forEach(({ environment_id: envId, has_value: hasValue, value }) => {
    if (!hasValue) return;
    const env = environments.find((e) => e.id === envId);
    rows[envId] = {
      stored: true,
      initial: isSecret ? '' : (value ?? ''),
      value: isSecret ? '' : (value ?? ''),
      removed: false,
      locked: env ? !env.enabled : false,
      touched: false,
    };
  });
  return multiEnvironment ? rows : keepOneRow(rows, environments);
};

export function useConstantForm({
  mode,
  constant,
  environments,
  multiEnvironment = true,
  defaultType = ConstantTypes.Global,
}: UseConstantFormOptions) {
  const isEdit = mode === 'edit';
  const [name, setNameState] = useState<string>(isEdit ? (constant?.name ?? '') : '');
  const [type, setTypeState] = useState<ConstantType>(isEdit ? (constant?.type ?? ConstantTypes.Global) : defaultType);
  const [rowMap, setRowMap] = useState<Record<string, StoredRow>>(() =>
    isEdit ? buildInitialRows(constant, environments, multiEnvironment) : {}
  );

  const updateRow = (envId: string, patch: Partial<StoredRow>) =>
    setRowMap((prev) => (prev[envId] ? { ...prev, [envId]: { ...prev[envId], ...patch } } : prev));

  const isSecretRow = type === ConstantTypes.Secret;

  const rows: FormRow[] = useMemo(() => {
    const orderOf = (envId: string) => {
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

  const canRemove = (envId: string): boolean => {
    const row = rowMap[envId];
    if (!row || row.locked || row.removed) return false;
    if (!row.stored) return true;
    return multiEnvironment && valueCountAfterSave >= 2;
  };

  // A removed row stays in `rows` until save (it sends the delete) but no longer counts as a value.
  const canAddEnvironment = multiEnvironment || rows.every((r) => r.removed);

  const availableEnvironments = environments.filter((e) => !rowMap[e.id] || rowMap[e.id].removed);
  // Locked environments count: until they have a value too, the Add environment menu stays so they can be seen.
  const allEnvironmentsAdded = environments.every((e) => rowMap[e.id] && !rowMap[e.id].removed);

  const addEnvironment = (envId: string) => {
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

  const removeRow = (envId: string) => {
    const row = rowMap[envId];
    if (!row || row.locked) return;
    if (!row.stored) {
      setRowMap(({ [envId]: _dropped, ...rest }) => rest);
      return;
    }
    if (canRemove(envId)) updateRow(envId, { removed: true });
  };

  // A value box that has been left empty is only flagged once the user has been in it.
  const touchRow = (envId: string) => updateRow(envId, { touched: true });

  const setValue = (envId: string, value: string) => {
    const row = rowMap[envId];
    if (row && !row.locked && !row.removed) updateRow(envId, { value });
  };

  const setName = (next: string) => {
    if (!isEdit) setNameState(next);
  };
  const setType = (next: ConstantType) => {
    if (!isEdit) setTypeState(next);
  };

  const changedValues: ConstantValueChange[] = [];
  Object.entries(rowMap).forEach(([environmentId, row]) => {
    if (row.removed) {
      changedValues.push({ environment_id: environmentId, value: null });
    } else if (row.value !== '' && (!row.stored || row.value !== row.initial)) {
      changedValues.push({ environment_id: environmentId, value: row.value });
    }
  });
  const orderOf = (envId: string) => environments.findIndex((e) => e.id === envId);
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
  const requiredError = (row: FormRow): string | null => {
    if (row.removed || row.locked || row.value !== '') return null;
    if (row.stored) return isSecretRow ? null : VALUE_REQUIRED;
    return row.touched && !isDirty ? VALUE_REQUIRED : null;
  };
  const rowsWithErrors = rows.map((row) => ({ ...row, error: row.error ?? requiredError(row) }));

  const toApiBody = (): CreateConstantBody | UpdateConstantBody =>
    isEdit ? { values: changedValues } : { name, type, values: changedValues };

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
