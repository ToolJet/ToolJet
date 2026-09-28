import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';
import { PAT_TOKEN_PREFIX } from '../constants';

export const hashPat = (rawToken: string): string => `sha256:${createHash('sha256').update(rawToken).digest('hex')}`;

@Injectable()
export class PatAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Missing Authorization header');

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token || !token.startsWith(PAT_TOKEN_PREFIX)) {
      throw new UnauthorizedException('Invalid personal access token');
    }

    const tokenHash = hashPat(token);
    const pat = await dbTransactionWrap(async (manager: EntityManager) => {
      // scope filter = species isolation: this lookup can never return an embed ticket
      // (and the embed exchange, keyed on app_id, can never return one of ours).
      return manager.findOne(UserPersonalAccessToken, {
        where: { tokenHash, scope: PersonalAccessTokenScope.WORKSPACE },
        relations: ['user'],
      });
    });
    if (!pat) throw new UnauthorizedException('Invalid personal access token');
    if (pat.expiresAt < new Date()) {
      throw new UnauthorizedException('Personal access token expired');
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(UserPersonalAccessToken, { id: pat.id }, { lastUsedAt: new Date() });
    });

    const user = pat.user;
    user.organizationId = pat.organizationId; // the TOKEN's workspace, not any session's
    request.user = user;
    request.personalAccessToken = pat;
    return true;
  }
}
