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

const buildUserPermissions = ({ editableWorkflowsId = [] as string[], isAllEditable = false, superAdmin = false }) => ({
  superAdmin,
  userPermission: {
    workflowCreate: false,
    [MODULES.WORKFLOWS]: {
      isAllEditable,
      isAllExecutable: false,
      editableWorkflowsId,
      executableWorkflowsId: [],
    },
  },
});

const makeBuilder = () => new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>);

describe('FeatureAbilityFactory :: approval requests', () => {
  let factory: FeatureAbilityFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
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

  const abilityFor = async (feature: FEATURE_KEY, userPerms: any) => {
    const request = { params: {}, query: {}, body: {} };
    const metadata = { moduleName: MODULES.WORKFLOWS, features: [feature] };
    const { can, build } = makeBuilder();
    await (factory as any).defineAbilityFor(can, userPerms, metadata, request);
    return build();
  };

  describe.each([FEATURE_KEY.LIST_APPROVAL_REQUESTS, FEATURE_KEY.HUMAN_IN_THE_LOOP])('%s', (feature) => {
    it('grants it to an admin (all workflows editable)', async () => {
      const ability = await abilityFor(feature, buildUserPermissions({ isAllEditable: true }));
      expect(ability.can(feature, App)).toBe(true);
    });

    it('grants it to a builder with at least one editable workflow', async () => {
      const ability = await abilityFor(feature, buildUserPermissions({ editableWorkflowsId: ['app-uuid-1'] }));
      expect(ability.can(feature, App)).toBe(true);
    });

    it('grants it to a super admin', async () => {
      const ability = await abilityFor(feature, buildUserPermissions({ superAdmin: true }));
      expect(ability.can(feature, App)).toBe(true);
    });

    it('denies it to an end-user with no editable workflows', async () => {
      const ability = await abilityFor(feature, buildUserPermissions({}));
      expect(ability.can(feature, App)).toBe(false);
    });
  });
});
