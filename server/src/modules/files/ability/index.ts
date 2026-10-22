import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { File } from '@entities/file.entity';
import { FilesRepository } from '@modules/files/repository';

type Subjects = InferSubjects<typeof File> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  constructor(
    protected abilityService: AbilityService,
    private readonly filesRepository: FilesRepository
  ) {
    super(abilityService);
  }

  protected getSubjectType() {
    return File;
  }

  protected async defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    _extractedMetadata: { moduleName: string; features: string[] },
    request?: { params?: { id?: string } }
  ): Promise<void> {
    const { superAdmin, isAdmin, isBuilder, user } = UserAllPermissions;
    const fileId = request?.params?.id;
    if (!fileId) {
      return;
    }

    // Admin and builder can view any avatar within their own organization; anyone can
    // view their own avatar. A file with no known avatar owner has no basis to grant
    // access, so it is denied rather than defaulting open.
    const avatarOwner = await this.filesRepository.getAvatarOwnerContext(fileId, user.organizationId);
    if (!avatarOwner) {
      return;
    }

    if (avatarOwner.ownerId === user.id) {
      can([FEATURE_KEY.GET], File);
      return;
    }

    if ((superAdmin || isAdmin || isBuilder) && avatarOwner.ownerInRequesterOrganization) {
      can([FEATURE_KEY.GET], File);
    }
  }
}
