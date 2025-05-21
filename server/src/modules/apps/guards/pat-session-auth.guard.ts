import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SessionUtilService } from '@modules/session/util.service';
import { ConfigService } from '@nestjs/config';
import { UserSessionRepository } from '@modules/session/repository';
import { JWTPayload } from '@modules/session/interfaces/IService';

@Injectable()
export class PatSessionAuthGuard implements CanActivate {
  constructor(
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly configService: ConfigService,
    protected readonly sessionRepository: UserSessionRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const embedToken = req.cookies['tj_embed_auth_token'];

    let payload: JWTPayload | undefined;

    // If token exists, try decoding it
    if (embedToken) {
      try {
        payload = this.sessionUtilService.verifyToken(embedToken);
      } catch {
        throw new ForbiddenException('Invalid embed token');
      }
    }

    // ✅ If isPATLogin is true, embed token MUST be present and valid
    if (payload?.isPatLogin) {
      if (!payload.sessionId || !payload.username) {
        throw new ForbiddenException('Invalid PAT session payload');
      }

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

      if (session.pat.expiresAt < now) {
        throw new ForbiddenException('PAT expired');
      }

      if (session.expiry < now) {
        throw new ForbiddenException('PAT session expired');
      }
    }

    // Allow request if either:
    // - it's not a PAT login
    // - or PAT login validated successfully
    return true;
  }
}
