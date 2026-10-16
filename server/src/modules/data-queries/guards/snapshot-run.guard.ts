import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { FEATURE_KEY } from '../constants';
import { FeatureAbilityFactory } from '../ability/app';

/**
 * A run that carries `snapshotId` renders a query as an AI-edit snapshot had it (the compare
 * view's "before" side), which can be code the draft no longer has. View-only users may run
 * editor-mode queries (previews), so such a run also needs edit access to the app, like the
 * compare view itself. Uses the permissions the app ability guard already loaded on the request.
 */
@Injectable()
export class SnapshotRunGuard implements CanActivate {
  constructor(private readonly moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.body?.snapshotId) return true;
    const factory = await this.moduleRef.resolve(FeatureAbilityFactory);
    const resourceType = request.tj_app?.type === APP_TYPES.MODULE ? MODULES.MODULES : MODULES.APP;
    const ability = await factory.createAbility(
      request.user,
      { moduleName: MODULES.DATA_QUERY, features: [FEATURE_KEY.UPDATE] },
      [{ resourceType }],
      request
    );
    if (!ability.can(FEATURE_KEY.UPDATE, App))
      throw new ForbiddenException('Only builders who can edit this app can run its AI-edit snapshots');
    return true;
  }
}
