/** @group platform */
import { INestApplication } from '@nestjs/common';
import { seedOrgEnvironmentsAndDefaultBranch, defaultAppEnvironments } from '@helpers/utils.helper';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { createUser, initTestApp, closeTestApp, getDefaultDataSource } from 'test-helper';

// Every organization needs the 3 app_environments rows and a default WorkspaceBranch to have
// anything to key an internal_table_relations row against later. This is the one function all 4
// callers (golden path, the 2 bypass paths, the backfill
// migration) route through, so it's the seam that actually owns the branching worth pinning.
//
// A hand-mocked EntityManager used to stand in here, stubbing `count()` on entity class alone -
// the real correctness question (the `where` predicate: organizationId-scoped, isDefault-scoped)
// was never inspected, so a mutation dropping either predicate shipped green. Real manager instead,
// per testing.md's boundary rule - this function's only job is a persistence-layer read/write.
//
// createUser() already seeds a default WorkspaceBranch at org creation (mirrors prod's
// setup-organization) but never app_environments - so a fresh org from createUser starts at
// "branch: 1, environments: 0", not "neither". Tests build the other starting shapes explicitly.
describe('seedOrgEnvironmentsAndDefaultBranch', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  async function newOrg(): Promise<string> {
    const { organization } = await createUser(app, { email: `seed-org-${Date.now()}-${Math.random()}@tooljet.io` });
    return organization.id;
  }

  async function environmentsFor(organizationId: string) {
    return getDefaultDataSource().manager.find(AppEnvironment, {
      where: { organizationId },
      order: { priority: 'ASC' },
    });
  }

  async function defaultBranchesFor(organizationId: string) {
    return getDefaultDataSource().manager.find(WorkspaceBranch, { where: { organizationId, isDefault: true } });
  }

  it('creates 3 environments and a default branch for an organization with neither', async () => {
    const organizationId = await newOrg();
    await getDefaultDataSource().manager.delete(WorkspaceBranch, { organizationId });
    expect(await environmentsFor(organizationId)).toHaveLength(0);
    expect(await defaultBranchesFor(organizationId)).toHaveLength(0);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);

    const environments = await environmentsFor(organizationId);
    expect(environments.map((e) => [e.name, e.priority, e.isDefault])).toEqual([
      ['development', 1, false],
      ['staging', 2, false],
      ['production', 3, true],
    ]);
    expect(await defaultBranchesFor(organizationId)).toEqual([
      expect.objectContaining({ organizationId, name: 'main', isDefault: true }),
    ]);
  });

  it('only creates the branch when environments already exist', async () => {
    const organizationId = await newOrg();
    await getDefaultDataSource().manager.delete(WorkspaceBranch, { organizationId });
    for (const env of defaultAppEnvironments) {
      await getDefaultDataSource().manager.save(
        getDefaultDataSource().manager.create(AppEnvironment, { organizationId, ...env })
      );
    }
    expect(await environmentsFor(organizationId)).toHaveLength(3);
    expect(await defaultBranchesFor(organizationId)).toHaveLength(0);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);

    expect(await environmentsFor(organizationId)).toHaveLength(3);
    expect(await defaultBranchesFor(organizationId)).toHaveLength(1);
  });

  it('still creates a default branch for an organization whose only branch is not the default one', async () => {
    // The branch count is scoped on isDefault: true, not just organizationId - drop that half of
    // the predicate and a non-default branch (e.g. a git-sync feature branch) reads as "already
    // has its default", leaving the org with no default branch at all (branch_id is NOT NULL
    // elsewhere). A different name than 'main' - createUser()'s own default branch already holds
    // that name, and branch_name is unique per organization.
    const organizationId = await newOrg();
    await getDefaultDataSource().manager.delete(WorkspaceBranch, { organizationId });
    await getDefaultDataSource().manager.save(
      getDefaultDataSource().manager.create(WorkspaceBranch, {
        organizationId,
        name: 'feature-branch',
        isDefault: false,
      })
    );
    expect(await defaultBranchesFor(organizationId)).toHaveLength(0);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);

    expect(await defaultBranchesFor(organizationId)).toHaveLength(1);
    const branches = await getDefaultDataSource().manager.find(WorkspaceBranch, { where: { organizationId } });
    expect(branches.map((b) => [b.name, b.isDefault]).sort()).toEqual([
      ['feature-branch', false],
      ['main', true],
    ]);
  });

  it('only creates the environments when a default branch already exists', async () => {
    const organizationId = await newOrg();
    expect(await environmentsFor(organizationId)).toHaveLength(0);
    expect(await defaultBranchesFor(organizationId)).toHaveLength(1);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);

    expect(await environmentsFor(organizationId)).toHaveLength(3);
    // Not duplicated - the branch createUser() already seeded is still the only one.
    expect(await defaultBranchesFor(organizationId)).toHaveLength(1);
  });

  it('is a no-op - idempotent - when both already exist, and never touches another organization', async () => {
    const organizationId = await newOrg();
    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);
    const before = await environmentsFor(organizationId);

    // A second organization, seeded after the first - proves the count()s this relies on are
    // organizationId-scoped, not "does any org have environments" (a predicate that would make
    // this second call a wrongful no-op, since org 1 already has environments).
    const otherOrganizationId = await newOrg();
    await seedOrgEnvironmentsAndDefaultBranch(otherOrganizationId, getDefaultDataSource().manager);

    // Re-running on org 1 itself stays a no-op...
    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);
    expect(await environmentsFor(organizationId)).toEqual(before);
    expect(await defaultBranchesFor(organizationId)).toHaveLength(1);

    // ...and org 2 got its own full, independent seed, not skipped because org 1 already had one.
    expect((await environmentsFor(otherOrganizationId)).map((e) => e.name).sort()).toEqual([
      'development',
      'production',
      'staging',
    ]);
    expect(await defaultBranchesFor(otherOrganizationId)).toHaveLength(1);
  });

  it('calling it twice in a row only ever inserts once', async () => {
    const organizationId = await newOrg();

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);
    expect(await environmentsFor(organizationId)).toHaveLength(3);
    expect(await defaultBranchesFor(organizationId)).toHaveLength(1);

    // Second call sees the state the first call left behind and adds nothing further.
    await seedOrgEnvironmentsAndDefaultBranch(organizationId, getDefaultDataSource().manager);
    expect(await environmentsFor(organizationId)).toHaveLength(3);
    expect(await defaultBranchesFor(organizationId)).toHaveLength(1);
  });
});
