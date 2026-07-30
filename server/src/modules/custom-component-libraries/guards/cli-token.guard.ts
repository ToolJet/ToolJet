import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { CliApiToken } from '@entities/cli_api_token.entity';

export const CLI_TOKEN_PREFIX = 'tj_cli_';

export const hashCliToken = (rawToken: string): string => createHash('sha256').update(rawToken).digest('hex');

// Authenticates `Authorization: Bearer tj_cli_...` from the ToolJet CLI (login/init/dev/deploy).
// Modeled on WebhookGuard's bearer parsing; attaches the token's user (org-scoped to the token's
// workspace) as request.user so @User() works identically to session-guarded routes.
@Injectable()
export class CliTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Missing Authorization header');

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token || !token.startsWith(CLI_TOKEN_PREFIX)) {
      throw new UnauthorizedException('Invalid CLI token');
    }

    const tokenHash = hashCliToken(token);
    const cliToken = await dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(CliApiToken, { where: { tokenHash }, relations: ['user'] });
    });
    if (!cliToken) throw new UnauthorizedException('Invalid CLI token');

    const user = cliToken.user;
    user.organizationId = cliToken.organizationId; // token is workspace-scoped, not session-scoped
    request.user = user;
    request.cliApiToken = cliToken;
    return true;
  }
}
