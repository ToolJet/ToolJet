/// <reference types="jest" />
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { VersionRepository } from '@modules/versions/repository';
import { APP_TYPES } from '@modules/apps/constants';

type Row = { where: unknown; payload: unknown };

/**
 * A faithful-enough EntityManager stub: `findOne` mirrors TypeORM's
 * null-returning lookup and `findOneOrFail` mirrors its throwing one, so a
 * regression back to findOneOrFail fails these tests the same way the live
 * API regressed to a 500.
 */
const makeManager = (rows: Row[]) => {
  const match = (options: { where: unknown }) =>
    rows.find((row) => JSON.stringify(row.where) === JSON.stringify(options.where))?.payload ?? null;
  const manager = {
    findOne: jest.fn(async (_entity: unknown, options: { where: unknown }) => match(options)),
    findOneOrFail: jest.fn(async (_entity: unknown, options: { where: unknown }) => {
      const found = match(options);
      if (found === null) {
        throw new Error(`Could not find any entity matching: ${JSON.stringify(options.where)}`);
      }
      return found;
    }),
  };
  return manager as unknown as EntityManager & typeof manager;
};

const makeRepository = () => {
  const dataSource = { createEntityManager: () => ({}) } as never;
  return new VersionRepository(dataSource) as unknown as {
    findAppFromVersion: (id: string, orgId: string, manager?: EntityManager) => Promise<App | null>;
  };
};

describe('VersionRepository.findAppFromVersion', () => {
  const orgA = 'org-a';
  const orgB = 'org-b';
  const workflowApp = { id: 'app-2', type: APP_TYPES.WORKFLOW } as unknown as App;

  it('returns null for a versionId that does not resolve in the caller org, instead of throwing', async () => {
    const repo = makeRepository();
    const manager = makeManager([]);
    await expect(repo.findAppFromVersion('version-1', orgA, manager)).resolves.toBeNull();
  });

  it('scopes the lookup to the organization, so a cross-org version id is a 404, not a leak or a 500', async () => {
    const repo = makeRepository();
    // A workflow app keeps the test on the no-overlay path; the metadata
    // overlay itself is e2e territory.
    const manager = makeManager([
      { where: { id: 'version-1', app: { organizationId: orgA } }, payload: { id: 'version-1', branchId: null, app: workflowApp } },
    ]);

    await expect(repo.findAppFromVersion('version-1', orgA, manager)).resolves.toBe(workflowApp);
    await expect(repo.findAppFromVersion('version-1', orgB, manager)).resolves.toBeNull();
  });

  it('returns the workflow app without the non-workflow metadata overlay', async () => {
    const repo = makeRepository();
    const manager = makeManager([
      { where: { id: 'version-2', app: { organizationId: orgA } }, payload: { id: 'version-2', branchId: null, app: workflowApp } },
    ]);

    await expect(repo.findAppFromVersion('version-2', orgA, manager)).resolves.toBe(workflowApp);
  });
});
