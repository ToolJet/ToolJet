import { User } from 'src/entities/user.entity';
import { AbilityBuilder, Ability, AbilityClass, ExtractSubjectType, Normalize } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { ResourceDetails, UserAllPermissions } from './types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { UserPermissions } from '@modules/ability/types';

@Injectable()
export abstract class AbilityFactory<TActions extends string, TSubject> {
  constructor(protected abilityService: AbilityService) {}

  protected abstract getSubjectType(): new (...args: any[]) => TSubject;

  async createAbility(
    user: User,
    extractedMetadata: { moduleName: string; features: string[] },
    resource?: ResourceDetails[],
    request?: any
  ) {
    const { can, build } = new AbilityBuilder<Ability<[TActions, TSubject | 'all']>>(
      Ability as AbilityClass<Ability<[TActions, TSubject | 'all']>>
    );

    const resourceArray = resource?.map((resource) => {
      return { resource: resource.resourceType };
    });

    const userPermission: UserPermissions =
      request?.tj_user_permissions ||
      (await this.abilityService.resourceActionsPermission(user, {
        organizationId: user.organizationId || user.defaultOrganizationId,
        ...(resource?.length
          ? {
              resources: resourceArray,
            }
          : {}),
      }));

    if (request) {
      request.tj_user_permissions = userPermission;
    }

    const superAdmin = userPermission?.isSuperAdmin || false;
    const isAdmin = userPermission?.isAdmin || false;
    const isBuilder = userPermission?.isBuilder || false;
    const isEndUser = userPermission?.isEndUser || false;

    await this.defineAbilityFor(
      can,
      { userPermission, superAdmin, isAdmin, isBuilder, isEndUser, user },
      extractedMetadata,
      request
    );

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Normalize<[TActions, TSubject | 'all']>[1]>,
    });
  }

  protected abstract defineAbilityFor(
    can: AbilityBuilder<Ability<[TActions, TSubject | 'all']>>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void | Promise<void>;
}
