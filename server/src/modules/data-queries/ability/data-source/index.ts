import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { DataSource } from '@entities/data_source.entity';
// import { MODULES } from '@modules/app/constants/modules';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AbilityService } from '@modules/ability/interfaces/IService';

type Subjects = InferSubjects<typeof DataSource> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  constructor(private readonly dataSourceRepository: DataSourcesRepository, protected abilityService: AbilityService) {
    super(abilityService);
  }
  protected getSubjectType() {
    return DataSource;
  }

  protected async defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): Promise<void> {
    // Data source permissions
    // EE - data source create/delete -> full access
    // CE - Admin - full access. builder -> use access

    // const { userPermission } = UserAllPermissions;
    // const staticDataSources = await this.dataSourceRepository.getAllStaticDataSources(request.params.versionId);

    // const resourcePermissions = userPermission?.[MODULES.GLOBAL_DATA_SOURCE];
    // const isAllEditable = !!resourcePermissions?.isAllConfigurable;
    // const isCanCreate = userPermission.dataSourceCreate;
    // const isCanDelete = userPermission.dataSourceDelete;
    // const isAllViewable = !!resourcePermissions?.isAllUsable;

    can(
      [
        FEATURE_KEY.CREATE,
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.UPDATE_DATA_SOURCE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
      ],
      DataSource
    );
    return;
  }
}
