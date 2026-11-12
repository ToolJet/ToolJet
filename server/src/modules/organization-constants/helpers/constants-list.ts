import { OrganizationConstant } from '@entities/organization_constants.entity';
import { OrgEnvironmentConstantValue } from '@entities/org_environment_constant_values.entity';
import { User } from '@entities/user.entity';
import { ConstantListSort, ConstantSource, OrganizationConstantType } from '../constants';
import { ConstantUserRef, ConstantWithEnvironmentValues } from '../types';

/**
 * One constant as it appears in the list for a single environment. Rows hold no plaintext Secret value:
 * `value` is the stored (encrypted) value for workspace rows, the plaintext for `.env` Globals, and null
 * for `.env` Secrets. A constant with no value in the environment is still a row: `hasValue` is false and
 * `value` is null.
 */
export interface ConstantListRow {
  id: string;
  name: string;
  type: OrganizationConstantType;
  source: ConstantSource;
  value: string | null;
  hasValue: boolean;
  environmentIdsWithValue: string[];
  lastModifiedAt: Date | null;
  owner: ConstantUserRef | null;
  modifiedBy: ConstantUserRef | null;
}

export interface ConstantsPageQuery {
  type: OrganizationConstantType;
  search?: string;
  sources: ConstantSource[];
  sort: ConstantListSort;
  page: number;
  perPage: number;
}

export interface ConstantsPage {
  items: ConstantListRow[];
  total: number;
  counts: { secrets: number; globals: number };
}

export type WorkspaceConstantRecord = Pick<OrganizationConstant, 'id' | 'constantName' | 'type' | 'updatedAt'> & {
  orgEnvironmentConstantValues: Pick<OrgEnvironmentConstantValue, 'environmentId' | 'value'>[];
  createdByUser: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  updatedByUser: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
};

export const toUserRef = (user: Pick<User, 'id' | 'firstName' | 'lastName'> | null): ConstantUserRef | null =>
  user ? { id: user.id, name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() } : null;

// An empty string is how an unset environment value is stored.
const hasValue = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

// `.env` values parsed from JSON can be numbers or booleans.
const valueToString = (value: unknown): string => (typeof value === 'string' ? value : JSON.stringify(value));

export function toWorkspaceConstantRow(record: WorkspaceConstantRecord, environmentId: string): ConstantListRow {
  const selected = record.orgEnvironmentConstantValues.find((v) => v.environmentId === environmentId);
  const hasSelectedValue = hasValue(selected?.value);

  return {
    id: record.id,
    name: record.constantName,
    type: record.type,
    source: ConstantSource.WORKSPACE,
    value: hasSelectedValue ? selected.value : null,
    hasValue: hasSelectedValue,
    environmentIdsWithValue: record.orgEnvironmentConstantValues
      .filter((v) => hasValue(v.value))
      .map((v) => v.environmentId),
    lastModifiedAt: record.updatedAt,
    owner: toUserRef(record.createdByUser),
    modifiedBy: toUserRef(record.updatedByUser),
  };
}

/**
 * Reads a `.env` constant without mutating it (the source objects belong to a process-level cache).
 * Null when it has no value in the environment: a variable that is not set there is not a constant there.
 * A Secret's value is dropped here so it cannot leak later.
 */
export function toEnvironmentConstantRow(
  constant: ConstantWithEnvironmentValues,
  environmentId: string
): ConstantListRow | null {
  const selected = constant.values.find((v) => v.id === environmentId);
  if (!selected || !hasValue(selected.value)) return null;

  return {
    id: `env:${constant.type}:${constant.name}`,
    name: constant.name,
    type: constant.type,
    source: ConstantSource.ENV,
    value: constant.type === OrganizationConstantType.GLOBAL ? valueToString(selected.value) : null,
    hasValue: true,
    environmentIdsWithValue: constant.values.filter((v) => v.id && hasValue(v.value)).map((v) => v.id),
    lastModifiedAt: null,
    owner: null,
    modifiedBy: null,
  };
}

// `.env` wins so the list agrees with what an app resolves at run time.
export function mergeConstantRows(workspaceRows: ConstantListRow[], envRows: ConstantListRow[]): ConstantListRow[] {
  const envKeys = new Set(envRows.map((r) => `${r.type}:${r.name}`));
  return [...envRows, ...workspaceRows.filter((r) => !envKeys.has(`${r.type}:${r.name}`))];
}

const compareNames = (a: ConstantListRow, b: ConstantListRow): number =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' });

const compareIds = (a: ConstantListRow, b: ConstantListRow): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// Rows without a modified date (`.env` and legacy rows) go last in both directions.
function compareModified(direction: 1 | -1) {
  return (a: ConstantListRow, b: ConstantListRow): number => {
    if (!a.lastModifiedAt && !b.lastModifiedAt) return compareNames(a, b) || compareIds(a, b);
    if (!a.lastModifiedAt) return 1;
    if (!b.lastModifiedAt) return -1;
    const byDate = (a.lastModifiedAt.getTime() - b.lastModifiedAt.getTime()) * direction;
    return byDate || compareNames(a, b) || compareIds(a, b);
  };
}

const COMPARATORS: Record<ConstantListSort, (a: ConstantListRow, b: ConstantListRow) => number> = {
  [ConstantListSort.NAME_ASC]: (a, b) => compareNames(a, b) || compareIds(a, b),
  [ConstantListSort.NAME_DESC]: (a, b) => compareNames(b, a) || compareIds(a, b),
  [ConstantListSort.MODIFIED_ASC]: compareModified(1),
  [ConstantListSort.MODIFIED_DESC]: compareModified(-1),
};

/**
 * Filters, counts, sorts and slices already-merged rows. The counts cover both types after the search and
 * source filters, so each tab's count follows the search; `total` is the active type only.
 */
export function buildConstantsPage(rows: ConstantListRow[], query: ConstantsPageQuery): ConstantsPage {
  const search = query.search?.trim().toLowerCase();
  const scoped = rows.filter(
    (r) => query.sources.includes(r.source) && (!search || r.name.toLowerCase().includes(search))
  );

  const ofActiveType = scoped.filter((r) => r.type === query.type).sort(COMPARATORS[query.sort]);
  const start = (query.page - 1) * query.perPage;

  return {
    items: ofActiveType.slice(start, start + query.perPage),
    total: ofActiveType.length,
    counts: {
      secrets: scoped.filter((r) => r.type === OrganizationConstantType.SECRET).length,
      globals: scoped.filter((r) => r.type === OrganizationConstantType.GLOBAL).length,
    },
  };
}
