import { Injectable, ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { subject } from '@casl/ability';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.MODULES,
    };
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  /**
   * Always store the built ability on request.tj_ability so the canActivate
   * override below can access it after a class-level check fails.
   */
  protected forwardAbility(): boolean {
    return true;
  }

  /**
   * Override canActivate to add a second CASL check against the actual App
   * instance when the class-level check fails. This allows CASL conditions
   * (e.g. { userId: user.id } for owner-based DELETE) to be evaluated.
   *
   * Base guard: ability.can(feature, App, resourceId) — class-level, no condition evaluation
   * This override: if class-level check throws ForbiddenException AND request.tj_app
   * is available, retry with subject(App, appInstance) so CASL evaluates property
   * conditions (owner check). Only then re-throw.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      return await super.canActivate(context);
    } catch (err) {
      if (!(err instanceof ForbiddenException)) throw err;

      // Class-level check failed — retry with App instance so CASL evaluates
      // property-level conditions (e.g. owner condition { userId: user.id }).
      const app: App = request.tj_app;
      const ability = request.tj_ability;
      if (!app || !ability) throw err;

      let features: string[] = this.reflector?.get<string[]>('tjFeatureId', context.getHandler()) ?? [];
      if (!Array.isArray(features)) features = [features];
      if (!features.length) throw err;

      const appSubject = subject(App, app);
      if (features.every((feature) => ability.can(feature, appSubject))) {
        return true;
      }

      throw err;
    }
  }
}
