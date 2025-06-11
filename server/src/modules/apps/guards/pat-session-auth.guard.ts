import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SessionUtilService } from '@modules/session/util.service';
import { ConfigService } from '@nestjs/config';
import { UserSessionRepository } from '@modules/session/repository';
import { UserRepository } from '@modules/users/repositories/repository';
import { UserPermissions } from '@modules/ability/types';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { AbilityService } from '@modules/ability/interfaces/IService';

@Injectable()
export class PatSessionAuthGuard implements CanActivate {
  constructor(
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly configService: ConfigService,
    protected readonly sessionRepository: UserSessionRepository,
    protected readonly userRepository: UserRepository,
    protected readonly abilityService: AbilityService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    // Get the PAT token from the 'x-embed-pat' header
    const patHeader = req.headers['x-embed-pat'];
    let payload;
    if (!patHeader) {
      return true;
    }

    // If x-embed-pat header exists, decode and verify
    if (typeof patHeader === 'string') {
      try {
        payload = JSON.parse(patHeader);
      } catch {
        throw new ForbiddenException('Malformed PAT token');
      }
    }

    // Check for PAT login payload
    if (!payload.sessionId || !payload.userId) {
      throw new ForbiddenException('Invalid PAT session payload');
    }

    // Find the session corresponding to the sessionId from payload
    const session = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
      relations: ['pat'],
    });

    if (!session || session.sessionType !== 'pat') {
      throw new ForbiddenException('Invalid PAT session');
    }

    const now = new Date();

    if (!session.pat) {
      throw new ForbiddenException('PAT token missing');
    }

    // Check if the PAT token has expired
    if (session.pat.expiresAt < now) {
      throw new ForbiddenException('PAT expired');
    }

    // Check if the session has expired
    if (session.expiry < now) {
      throw new ForbiddenException('PAT session expired');
    }
    const user = await this.userRepository.getUser({ id: payload.userId }, undefined, [
      'organizationUsers',
      'organizationUsers.organization',
    ]);

    const orgIds = user.organizationUsers.map((ou) => ou.organizationId);
    user.organizationIds = payload.scope === 'app' ? [payload.workspaceId] : orgIds;
    user.organizationId = payload.workspaceId;
    user.sessionId = session.id;
    user.isPasswordLogin = false;
    user.isSSOLogin = false;

    const userPermission: UserPermissions = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
      resources: [
        {
          resource: MODULES.APP,
          resourceId: payload?.appId,
        },
      ],
    });
    const isSuperAdmin = userPermission?.isSuperAdmin || false;
    const isAdmin = userPermission?.isAdmin || false;

    const userAppPermissions = userPermission?.[MODULES.APP];
    const isAllAppsEditable = !!userAppPermissions?.isAllEditable;
    const isAllAppsViewable = !!userAppPermissions?.isAllViewable;

    if (
      isSuperAdmin ||
      isAdmin ||
      isAllAppsEditable ||
      isAllAppsViewable ||
      (userAppPermissions?.viewableAppsId?.length &&
        payload?.appId &&
        userAppPermissions.viewableAppsId.includes(payload?.appId))
    )
      // // If the token isn't PAT or if validation is successful, allow the request
      return true;
  }
}
