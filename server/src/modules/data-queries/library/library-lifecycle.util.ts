import { BadRequestException } from '@nestjs/common';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';

export type LibraryVersionView = {
  id: string;
  name: string;
  versionNumber: number;
  description: string | null;
  createdFromVersionId: string | null;
  createdFrom: string | null;
  environment: { id: string; name: string; priority: number } | null;
  isReleased: boolean;
  createdAt: Date;
  kind: string;
  dataSourceId: string | null;
  options: Record<string, unknown>;
};

export type LibraryDraftView = Pick<
  LibraryQueryDraft,
  'id' | 'name' | 'description' | 'createdFromVersionId' | 'kind' | 'dataSourceId' | 'options' | 'createdAt'
> & { createdFrom: string | null };
export type LibraryQueryVersionsView = {
  drafts: LibraryDraftView[];
  versions: LibraryVersionView[];
  nextVersionNumber: number;
};
type Environment = { name: string; priority: number; isDefault?: boolean };

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

type VersionRow = Pick<
  LibraryQueryVersion,
  | 'id'
  | 'name'
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
  state: Pick<LibraryQueryState, 'releasedVersionId'>,
  rows: VersionRow[],
  environments: EnvironmentRow[],
  drafts: LibraryQueryDraft[]
): LibraryQueryVersionsView {
  const names = new Map(rows.map((row) => [row.id, row.name]));
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? null) : null);
  return {
    drafts: drafts.map(({ id, name, description, createdFromVersionId, kind, dataSourceId, options, createdAt }) => ({
      id,
      name,
      description: description ?? null,
      createdFromVersionId,
      createdFrom: nameOf(createdFromVersionId),
      kind,
      dataSourceId,
      options,
      createdAt,
    })),
    versions: rows
      .filter((row) => !row.deletedAt)
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map((row) => {
        const environment = environments.find((env) => env.id === row.currentEnvironmentId);
        return {
          id: row.id,
          name: row.name,
          versionNumber: row.versionNumber,
          description: row.description ?? null,
          createdFromVersionId: row.createdFromVersionId ?? null,
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
