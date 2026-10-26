// server/test/modules/app/unit/ability-factory.spec.ts
import { AbilityFactory } from '@modules/app/ability-factory';

class TestAbilityFactory extends AbilityFactory<string, any> {
  protected getSubjectType() {
    return class Subject {} as any;
  }
  protected defineAbilityFor() {
    // stubbed per-test via jest.spyOn
  }
}

describe('AbilityFactory.createAbility', () => {
  let abilityService: { resourceActionsPermission: jest.Mock };
  let factory: TestAbilityFactory;
  let defineAbilityForSpy: jest.SpyInstance;

  beforeEach(() => {
    abilityService = { resourceActionsPermission: jest.fn().mockResolvedValue({}) };
    factory = new TestAbilityFactory(abilityService as any);
    defineAbilityForSpy = jest.spyOn(factory as any, 'defineAbilityFor').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  const metadata = { moduleName: 'app', features: ['GET'] };

  it('reads permissions from request.tj_user_permissions when already cached, never calling the ability service', async () => {
    const cached = { isAdmin: true };
    const request: any = { tj_user_permissions: cached };
    const user = { id: 'u1', organizationId: 'org-1' } as any;

    await factory.createAbility(user, metadata, [], request);

    expect(abilityService.resourceActionsPermission).not.toHaveBeenCalled();
    expect(defineAbilityForSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userPermission: cached }),
      metadata,
      request
    );
  });

  it('writes resolved permissions back onto request.tj_user_permissions on a cache miss', async () => {
    const resolved = { isBuilder: true };
    abilityService.resourceActionsPermission.mockResolvedValue(resolved);
    const request: any = {};
    const user = { id: 'u1', organizationId: 'org-1' } as any;

    await factory.createAbility(user, metadata, [], request);

    expect(abilityService.resourceActionsPermission).toHaveBeenCalledTimes(1);
    expect(request.tj_user_permissions).toBe(resolved);
  });

  it('falls back to user.defaultOrganizationId when user.organizationId is absent', async () => {
    const user = { id: 'u1', organizationId: undefined, defaultOrganizationId: 'default-org' } as any;

    await factory.createAbility(user, metadata, [], undefined);

    expect(abilityService.resourceActionsPermission).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ organizationId: 'default-org' })
    );
  });

  it('maps resource[] to resources query entries when non-empty', async () => {
    const user = { id: 'u1', organizationId: 'org-1' } as any;
    const resource = [{ resourceType: 'app' as any }, { resourceType: 'workflow' as any }];

    await factory.createAbility(user, metadata, resource, undefined);

    expect(abilityService.resourceActionsPermission).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ resources: [{ resource: 'app' }, { resource: 'workflow' }] })
    );
  });

  it('omits resources from the query entirely when the resource array is empty', async () => {
    const user = { id: 'u1', organizationId: 'org-1' } as any;

    await factory.createAbility(user, metadata, [], undefined);

    const [, queryArg] = abilityService.resourceActionsPermission.mock.calls[0];
    expect(queryArg).not.toHaveProperty('resources');
  });

  it('omits resources from the query when resource is undefined', async () => {
    const user = { id: 'u1', organizationId: 'org-1' } as any;

    await factory.createAbility(user, metadata, undefined, undefined);

    const [, queryArg] = abilityService.resourceActionsPermission.mock.calls[0];
    expect(queryArg).not.toHaveProperty('resources');
  });

  it('defaults every role flag to false when userPermission is null', async () => {
    abilityService.resourceActionsPermission.mockResolvedValue(null);
    const user = { id: 'u1', organizationId: 'org-1' } as any;

    await factory.createAbility(user, metadata, [], undefined);

    expect(defineAbilityForSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        superAdmin: false,
        isAdmin: false,
        isBuilder: false,
        isEndUser: false,
      }),
      metadata,
      undefined
    );
  });

  it('derives role flags from userPermission when present', async () => {
    abilityService.resourceActionsPermission.mockResolvedValue({
      isSuperAdmin: true,
      isAdmin: true,
      isBuilder: false,
      isEndUser: false,
    });
    const user = { id: 'u1', organizationId: 'org-1' } as any;

    await factory.createAbility(user, metadata, [], undefined);

    expect(defineAbilityForSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ superAdmin: true, isAdmin: true, isBuilder: false, isEndUser: false }),
      metadata,
      undefined
    );
  });
});
