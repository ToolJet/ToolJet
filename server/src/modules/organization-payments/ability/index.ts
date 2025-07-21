import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '@modules/organization-payments/constants';
import { OrganizationSubscription } from '@entities/organization_subscription.entity';

type Subjects = InferSubjects<typeof OrganizationSubscription> | 'all';
export type OrganizationPaymentsAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return OrganizationSubscription;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<OrganizationPaymentsAbility>['can'],
    userPermissions: UserAllPermissions
  ): void {
    const { isAdmin } = userPermissions;

    if (isAdmin) {
      can(
        [
          FEATURE_KEY.CREATE_PORTAL_LINK,
          FEATURE_KEY.GET_CURRENT_PLAN_DETAILS,
          FEATURE_KEY.GET_PRORATION,
          FEATURE_KEY.GET_REDIRECT_URL,
          FEATURE_KEY.GET_UPCOMING_INVOICE,
          FEATURE_KEY.UPDATE_INVOICE,
          FEATURE_KEY.UPDATE_SUBSCRIPTION,
        ],
        OrganizationSubscription
      );
    }

    can([FEATURE_KEY.STRIPE_WEBHOOK], OrganizationSubscription);
  }
}
