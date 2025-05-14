import { Ability, InferSubjects, AbilityBuilder } from '@casl/ability';
import { FEATURE_KEY } from '../../constants';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { App } from '@entities/app.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Repository } from 'typeorm';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { WorkflowSchedulesService } from '@modules/workflows/services/workflow-schedules.service';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  constructor(
    protected abilityService: AbilityService,
    private readonly workflowSchedulesService: WorkflowSchedulesService,
    @InjectRepository(WorkflowExecution)
    private workflowExecutionRepository: Repository<WorkflowExecution>,
    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,
    @InjectRepository(App)
    private appsRepository: Repository<App>
  ) {
    super(abilityService);
  }

  protected getSubjectType() {
    return App;
  }

  async #findAppFromVersion(appVersionId: string): Promise<App> {
    if (!appVersionId) throw new ForbiddenException('appVersionId is not available');
    return (
      await this.appVersionsRepository.findOneOrFail({
        where: { id: appVersionId },
        relations: ['app'],
      })
    ).app;
  }

  protected async defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): Promise<void> {
    return;
  }
}
