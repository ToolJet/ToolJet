/**
 * ValidateTargetDataSourceGuard on PUT /data-queries/:id/versions/:versionId/data-source.
 *
 * Moving a query onto a data source is equivalent to creating a query against it, so the target
 * (`body.data_source_id`) must pass the same data-source ability check as query creation. The
 * route's other guards only see the query's current data source, so without this guard a builder
 * could repoint a query to a data source they have not been granted.
 *
 * Uses the real data-source CASL ability factory; only the repository lookup is stubbed.
 */
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbilityFactory as DataSourceFeatureAbilityFactory } from '@modules/data-queries/ability/data-source';
import { ValidateTargetDataSourceGuard } from '@modules/data-queries/guards/validate-target-data-source.guard';
import { UserPermissions } from '@modules/ability/types';
import { DataQueriesController } from '@modules/data-queries/controller';

describe('ValidateTargetDataSourceGuard', () => {
  const findOne = jest.fn();
  const guard = new ValidateTargetDataSourceGuard(
    { findOne } as unknown as ConstructorParameters<typeof ValidateTargetDataSourceGuard>[0],
    // Permissions come pre-resolved on the request, so the ability service is never consulted.
    new DataSourceFeatureAbilityFactory(
      null as unknown as ConstructorParameters<typeof DataSourceFeatureAbilityFactory>[0]
    )
  );

  const builderPermissions = (dataSourcePermissions: Record<string, unknown>) =>
    ({
      isAdmin: false,
      isSuperAdmin: false,
      isBuilder: true,
      isEndUser: false,
      dataSourceCreate: false,
      dataSourceDelete: false,
      [MODULES.GLOBAL_DATA_SOURCE]: {
        isAllConfigurable: false,
        configurableDataSourceId: [],
        isAllUsable: false,
        usableDataSourcesId: [],
        ...dataSourcePermissions,
      },
    }) as unknown as UserPermissions;

  const contextFor = (targetId: string | undefined, permissions: UserPermissions) => {
    const request = {
      user: { id: 'user1', organizationId: 'org1' },
      body: { data_source_id: targetId },
      tj_user_permissions: permissions,
      tj_resource_id: 'current-source',
    };
    return {
      request,
      context: { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findOne.mockImplementation(async ({ where }) => (where.organizationId === 'org1' ? { id: where.id } : null));
  });

  describe('PUT /data-queries/:id/versions/:versionId/data-source', () => {
    it('should forbid moving a query to a data source the builder has not been granted', async () => {
      const { context } = contextFor(
        'ungranted-source',
        builderPermissions({ usableDataSourcesId: ['current-source'] })
      );

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should allow moving a query to a data source the builder can use', async () => {
      const { context, request } = contextFor(
        'granted-source',
        builderPermissions({ usableDataSourcesId: ['current-source', 'granted-source'] })
      );

      await expect(guard.canActivate(context)).resolves.toBe(true);
      // The request keeps authorizing against the query's current source.
      expect(request.tj_resource_id).toBe('current-source');
    });

    it('should allow a builder who can use or configure every data source', async () => {
      await expect(
        guard.canActivate(contextFor('any', builderPermissions({ isAllUsable: true })).context)
      ).resolves.toBe(true);
      await expect(
        guard.canActivate(contextFor('any', builderPermissions({ configurableDataSourceId: ['any'] })).context)
      ).resolves.toBe(true);
    });

    it('should allow an admin to move a query to any data source in the workspace', async () => {
      const adminPermissions = { ...builderPermissions({}), isAdmin: true } as UserPermissions;

      await expect(guard.canActivate(contextFor('any', adminPermissions).context)).resolves.toBe(true);
    });

    it('should return 404 for a target data source outside the caller workspace', async () => {
      findOne.mockResolvedValue(null);
      const adminPermissions = { ...builderPermissions({}), isAdmin: true } as UserPermissions;

      await expect(guard.canActivate(contextFor('foreign-source', adminPermissions).context)).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'foreign-source', organizationId: 'org1' } })
      );
    });
  });
});

describe('DataQueriesController.changeQueryDataSource guards', () => {
  it('should authorize the target data source, not only the query current one', () => {
    const guards = Reflect.getMetadata('__guards__', DataQueriesController.prototype.changeQueryDataSource);

    expect(guards).toContain(ValidateTargetDataSourceGuard);
  });
});
