/** @group platform */
import { seedOrgEnvironmentsAndDefaultBranch } from '@helpers/utils.helper';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

// Every organization needs the 3 app_environments rows and a default WorkspaceBranch to have
// anything to key an internal_table_relations row against later. This is the one function all 4
// callers (golden path, the 2 bypass paths, the backfill
// migration) route through, so it's the seam that actually owns the branching worth pinning.
describe('seedOrgEnvironmentsAndDefaultBranch', () => {
  const organizationId = 'org-1';

  function mockManager(existingEnvironmentCount: number, existingDefaultBranchCount: number) {
    const created: any[] = [];
    const saved: any[] = [];
    const manager = {
      count: jest.fn().mockImplementation((entity) => {
        if (entity === AppEnvironment) return Promise.resolve(existingEnvironmentCount);
        if (entity === WorkspaceBranch) return Promise.resolve(existingDefaultBranchCount);
        throw new Error(`unexpected entity in count(): ${entity}`);
      }),
      create: jest.fn().mockImplementation((entity, data) => {
        const entityInstance = { entity, ...data };
        created.push(entityInstance);
        return entityInstance;
      }),
      save: jest.fn().mockImplementation((entityInstance) => {
        saved.push(entityInstance);
        return Promise.resolve(entityInstance);
      }),
    };
    return { manager, created, saved };
  }

  it('creates 3 environments and a default branch for an organization with neither', async () => {
    const { manager, created } = mockManager(0, 0);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, manager as any);

    const envs = created.filter((c) => c.entity === AppEnvironment);
    const branches = created.filter((c) => c.entity === WorkspaceBranch);
    expect(envs).toHaveLength(3);
    expect(envs.map((e) => e.name).sort()).toEqual(['development', 'production', 'staging']);
    expect(envs.every((e) => e.organizationId === organizationId)).toBe(true);
    expect(branches).toEqual([expect.objectContaining({ organizationId, name: 'main', isDefault: true })]);
  });

  it('only creates the branch when environments already exist', async () => {
    const { manager, created } = mockManager(3, 0);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, manager as any);

    expect(created.filter((c) => c.entity === AppEnvironment)).toHaveLength(0);
    expect(created.filter((c) => c.entity === WorkspaceBranch)).toHaveLength(1);
  });

  it('only creates the environments when a default branch already exists', async () => {
    const { manager, created } = mockManager(0, 1);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, manager as any);

    expect(created.filter((c) => c.entity === AppEnvironment)).toHaveLength(3);
    expect(created.filter((c) => c.entity === WorkspaceBranch)).toHaveLength(0);
  });

  it('is a no-op — idempotent — when both already exist', async () => {
    const { manager, created, saved } = mockManager(3, 1);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, manager as any);

    expect(created).toHaveLength(0);
    expect(saved).toHaveLength(0);
  });

  it('calling it twice in a row only ever inserts once', async () => {
    let environmentCount = 0;
    let defaultBranchCount = 0;
    const manager = {
      count: jest.fn().mockImplementation((entity) => {
        if (entity === AppEnvironment) return Promise.resolve(environmentCount);
        if (entity === WorkspaceBranch) return Promise.resolve(defaultBranchCount);
      }),
      create: jest.fn().mockImplementation((entity, data) => ({ entity, ...data })),
      save: jest.fn().mockImplementation((entityInstance) => {
        if (entityInstance.entity === AppEnvironment) environmentCount++;
        if (entityInstance.entity === WorkspaceBranch) defaultBranchCount++;
        return Promise.resolve(entityInstance);
      }),
    };

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, manager as any);
    expect(environmentCount).toBe(3);
    expect(defaultBranchCount).toBe(1);

    await seedOrgEnvironmentsAndDefaultBranch(organizationId, manager as any);
    // Second call sees the state the first call left behind and adds nothing further.
    expect(environmentCount).toBe(3);
    expect(defaultBranchCount).toBe(1);
  });
});
