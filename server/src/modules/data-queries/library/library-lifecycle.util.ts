import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { isSameLibrarySnapshot, libraryVersionName } from './library-query.util';

// Lifecycle of one library query, copying module versions: one Draft, frozen saved `vN` versions that move
// Development → Staging → Production, and one Released version.

export type LibraryVersionView = {
  id: string;
  name: string;
  versionNumber: number;
  description: string | null;
  createdFrom: string | null;
  environment: { id: string; name: string; priority: number } | null;
  isReleased: boolean;
  createdAt: Date;
  kind: string;
  dataSourceId: string | null;
  options: Record<string, unknown>;
};

export type LibraryQueryVersionsView = {
  draft: { createdFrom: string | null; description: string | null } | null;
  versions: LibraryVersionView[];
  // The number the next Save version gets: deleted versions count, so a number is never reused.
  nextVersionNumber: number;
};

type DraftState = Pick<LibraryQueryState, 'hasDraft'>;
type Snapshot = { kind: string; dataSourceId: string | null; options: unknown };
type Environment = { name: string; priority: number; isDefault?: boolean };

export function assertCanSaveDraft(
  state: DraftState,
  latest: (Snapshot & { versionNumber: number }) | null,
  snapshot: Snapshot
): void {
  if (!state.hasDraft) throw new ConflictException('This query has no draft to save');
  if (latest && isSameLibrarySnapshot(latest, snapshot)) {
    throw new BadRequestException(`Nothing changed since ${libraryVersionName(latest)}`);
  }
}

export function assertCanCreateDraft(state: DraftState, sourceVersion: object | null): void {
  if (state.hasDraft) throw new ConflictException('Save or delete the current draft first');
  if (!sourceVersion) throw new NotFoundException('Library query version not found');
}

// Deleting the only working copy of a never-saved query would leave nothing to edit.
export function assertCanDiscardDraft(state: DraftState, savedCount: number): void {
  if (!state.hasDraft) throw new ConflictException('This query has no draft');
  if (savedCount === 0) throw new BadRequestException('Save a version before deleting the draft');
}

// A version with no environment (seeded outside Save version) starts below development.
export function nextEnvironmentForPromote<T extends Environment>(current: Environment | null, environments: T[]): T {
  const next = environments
    .filter((environment) => environment.priority > (current?.priority ?? 0))
    .sort((a, b) => a.priority - b.priority)[0];
  if (!next) throw new BadRequestException(`This version is already in ${current?.name}`);
  return next;
}

// Same rule as app release: with the multi-environment licence only from production (the default environment);
// without it from anywhere (CE rollback).
export function assertCanRelease(environment: Environment | null, multiEnvironmentLicensed: boolean): void {
  if (multiEnvironmentLicensed && !environment?.isDefault) {
    throw new BadRequestException('You can only release a version that is in production');
  }
}

export function assertVersionDeletable(
  version: { id: string },
  state: Pick<LibraryQueryState, 'releasedVersionId'>
): void {
  if (version.id === state.releasedVersionId) throw new BadRequestException("The released version can't be deleted");
}

export function assertDraftEditable(state: DraftState): void {
  if (!state.hasDraft) throw new BadRequestException('Create a draft version to edit this query');
}

type VersionRow = Pick<
  LibraryQueryVersion,
  | 'id'
  | 'versionNumber'
  | 'description'
  | 'createdFromVersionId'
  | 'currentEnvironmentId'
  | 'createdAt'
  | 'kind'
  | 'dataSourceId'
  | 'options'
  | 'deletedAt'
>;
type EnvironmentRow = { id: string; name: string; priority: number };

// `rows` includes soft-deleted versions so "created from" still names a deleted source; they are not listed.
export function toLibraryQueryVersionsView(
  state: Pick<LibraryQueryState, 'hasDraft' | 'draftCreatedFromVersionId' | 'draftDescription' | 'releasedVersionId'>,
  rows: VersionRow[],
  environments: EnvironmentRow[]
): LibraryQueryVersionsView {
  const names = new Map(rows.map((row) => [row.id, libraryVersionName(row)]));
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? null) : null);
  return {
    draft: state.hasDraft
      ? { createdFrom: nameOf(state.draftCreatedFromVersionId), description: state.draftDescription ?? null }
      : null,
    versions: rows
      .filter((row) => !row.deletedAt)
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map((row) => {
        const environment = environments.find((env) => env.id === row.currentEnvironmentId);
        return {
          id: row.id,
          name: libraryVersionName(row),
          versionNumber: row.versionNumber,
          description: row.description ?? null,
          createdFrom: nameOf(row.createdFromVersionId),
          environment: environment
            ? { id: environment.id, name: environment.name, priority: environment.priority }
            : null,
          isReleased: row.id === state.releasedVersionId,
          createdAt: row.createdAt,
          kind: row.kind,
          dataSourceId: row.dataSourceId ?? null,
          options: row.options,
        };
      }),
    nextVersionNumber: Math.max(0, ...rows.map((row) => row.versionNumber)) + 1,
  };
}
