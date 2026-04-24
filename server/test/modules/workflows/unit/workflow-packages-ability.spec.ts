/// <reference types="jest" />
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AbilityBuilder, Ability, AbilityClass } from '@casl/ability';
import { FeatureAbilityFactory, FeatureAbility } from '@ee/workflows/ability/app/index';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { WorkflowSchedulesService } from '@ee/workflows/services/workflow-schedules.service';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { FEATURE_KEY } from '@modules/workflows/constants';
import { MODULES } from '@modules/app/constants/modules';

const mockRepo = () => ({ findOne: jest.fn(), findOneOrFail: jest.fn() });

const buildUserPermissions = (editableWorkflowsId: string[]) => ({
  superAdmin: false,
  userPermission: {
    workflowCreate: false,
    [MODULES.WORKFLOWS]: {
      isAllEditable: false,
      isAllExecutable: false,
      editableWorkflowsId,
      executableWorkflowsId: [],
    },
  },
});

const makeBuilder = () => new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>);

describe('FeatureAbilityFactory :: WORKFLOW_PACKAGES', () => {
  let factory: FeatureAbilityFactory;
  let module: any;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        FeatureAbilityFactory,
        { provide: AbilityService, useValue: { resourceActionsPermission: jest.fn() } },
        { provide: WorkflowSchedulesService, useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(WorkflowExecution), useFactory: mockRepo },
        { provide: getRepositoryToken(AppVersion), useFactory: mockRepo },
        { provide: getRepositoryToken(App), useFactory: mockRepo },
      ],
    }).compile();
    factory = module.get(FeatureAbilityFactory);
  });

  it('grants WORKFLOW_PACKAGES on search endpoint when user has granular edit access to at least one workflow', async () => {
    const request = { params: {}, query: {}, body: {} }; // no appVersionId
    const metadata = { moduleName: MODULES.WORKFLOWS, features: [FEATURE_KEY.WORKFLOW_PACKAGES] };
    const userPerms = buildUserPermissions(['app-uuid-1']);

    const { can, build } = makeBuilder();
    await (factory as any).defineAbilityFor(can, userPerms, metadata, request);
    const ability = build();

    expect(ability.can(FEATURE_KEY.WORKFLOW_PACKAGES, App)).toBe(true);
  });

  it('denies WORKFLOW_PACKAGES on search endpoint when user has no editable workflows', async () => {
    const request = { params: {}, query: {}, body: {} };
    const metadata = { moduleName: MODULES.WORKFLOWS, features: [FEATURE_KEY.WORKFLOW_PACKAGES] };
    const userPerms = buildUserPermissions([]);

    const { can, build } = makeBuilder();
    await (factory as any).defineAbilityFor(can, userPerms, metadata, request);
    const ability = build();

    expect(ability.can(FEATURE_KEY.WORKFLOW_PACKAGES, App)).toBe(false);
  });

  it('grants WORKFLOW_PACKAGES when isAllEditable is true regardless of applicationId', async () => {
    const request = { params: {}, query: {}, body: {} };
    const metadata = { moduleName: MODULES.WORKFLOWS, features: [FEATURE_KEY.WORKFLOW_PACKAGES] };
    const userPerms = {
      superAdmin: false,
      userPermission: {
        workflowCreate: false,
        [MODULES.WORKFLOWS]: {
          isAllEditable: true,
          isAllExecutable: false,
          editableWorkflowsId: [],
          executableWorkflowsId: [],
        },
      },
    };

    const { can, build } = makeBuilder();
    await (factory as any).defineAbilityFor(can, userPerms, metadata, request);
    const ability = build();

    expect(ability.can(FEATURE_KEY.WORKFLOW_PACKAGES, App)).toBe(true);
  });

  it('denies WORKFLOW_PACKAGES on scoped route when user cannot edit the resolved app', async () => {
    const appVersionsRepo = module.get(getRepositoryToken(AppVersion));
    appVersionsRepo.findOneOrFail.mockResolvedValue({ app: { id: 'app-uuid-other' } });

    const request = { params: { appVersionId: 'some-version-id' }, query: {}, body: {} };
    const metadata = { moduleName: MODULES.WORKFLOWS, features: [FEATURE_KEY.WORKFLOW_PACKAGES] };
    const userPerms = buildUserPermissions(['app-uuid-1']); // can edit app-uuid-1, not app-uuid-other

    const { can, build } = makeBuilder();
    await (factory as any).defineAbilityFor(can, userPerms, metadata, request);
    const ability = build();

    expect(ability.can(FEATURE_KEY.WORKFLOW_PACKAGES, App)).toBe(false);
  });
});
