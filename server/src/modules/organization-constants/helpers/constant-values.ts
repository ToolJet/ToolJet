import { BadRequestException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/** One environment's value as sent by a client. `null` asks to clear the environment (update only). */
export interface ConstantValueEntry {
  environment_id: string;
  value: string | null;
}

export type NewConstantValueEntry = ConstantValueEntry & { value: string };

/** What to store for one environment. An empty string means the environment has no value. */
export interface EnvironmentValueWrite {
  environmentId: string;
  value: string;
}

const UNIQUE_VIOLATION = '23505';
const NAME_TYPE_CONSTRAINT = 'UQ_organization_constant_name_type';

export function isDuplicateConstantError(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as { code?: string; constraint?: string } | undefined;
  return driverError?.code === UNIQUE_VIOLATION && driverError.constraint === NAME_TYPE_CONSTRAINT;
}

function assertEntriesAreValid(
  entries: Pick<ConstantValueEntry, 'environment_id'>[],
  workspaceEnvironmentIds: string[]
): void {
  if (entries.length === 0) {
    throw new BadRequestException('values must contain at least one entry');
  }
  const seen = new Set<string>();
  for (const { environment_id } of entries) {
    if (seen.has(environment_id)) {
      throw new BadRequestException('values must not list an environment more than once');
    }
    seen.add(environment_id);
    if (!workspaceEnvironmentIds.includes(environment_id)) {
      throw new BadRequestException('environment_id is not an environment of this workspace');
    }
  }
}

// Without the multi-environment license an environment cannot hold its own value, so the one value goes
// everywhere. This keeps the constant usable if the workspace later upgrades.
function toAllEnvironments(value: string, workspaceEnvironmentIds: string[]): EnvironmentValueWrite[] {
  return workspaceEnvironmentIds.map((environmentId) => ({ environmentId, value }));
}

/** The values a new constant gets. Environments not written stay unset. Throws 400 on an invalid request. */
export function resolveCreateWrites(
  entries: NewConstantValueEntry[],
  workspaceEnvironmentIds: string[],
  isMultiEnvironmentEnabled: boolean
): EnvironmentValueWrite[] {
  assertEntriesAreValid(entries, workspaceEnvironmentIds);

  if (!isMultiEnvironmentEnabled) {
    if (entries.length !== 1) {
      throw new BadRequestException('values must contain exactly one entry: this workspace has one value per constant');
    }
    return toAllEnvironments(entries[0].value, workspaceEnvironmentIds);
  }
  return entries.map(({ environment_id, value }) => ({ environmentId: environment_id, value }));
}

/**
 * The writes an update makes, decided before anything is stored. A `null` entry becomes an empty string.
 * Throws 400 when the request is invalid or would leave the constant with no value in any environment.
 */
export function resolveUpdateWrites(
  entries: ConstantValueEntry[],
  workspaceEnvironmentIds: string[],
  environmentIdsWithValue: string[],
  isMultiEnvironmentEnabled: boolean
): EnvironmentValueWrite[] {
  assertEntriesAreValid(entries, workspaceEnvironmentIds);

  if (!isMultiEnvironmentEnabled) {
    if (entries.length !== 1 || entries[0].value === null) {
      throw new BadRequestException('values must contain exactly one entry with a value');
    }
    return toAllEnvironments(entries[0].value, workspaceEnvironmentIds);
  }

  const writes = entries.map(({ environment_id, value }) => ({ environmentId: environment_id, value: value ?? '' }));
  const written = new Set(writes.map((write) => write.environmentId));
  const remaining = new Set(environmentIdsWithValue.filter((id) => !written.has(id)));
  writes.filter((write) => write.value !== '').forEach((write) => remaining.add(write.environmentId));

  if (remaining.size === 0) {
    throw new BadRequestException('A constant must keep a value in at least one environment');
  }
  return writes;
}
