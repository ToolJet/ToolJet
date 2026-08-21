import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { CliApiToken } from '@entities/cli_api_token.entity';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const CLI_TOKEN_PREFIX = 'tj_cli_';

export const hashCliToken = (rawToken: string): string => createHash('sha256').update(rawToken).digest('hex');

@Injectable()
export class CliTokenGuard implements CanActivate {
  constructor(protected readonly licenseTermsService: LicenseTermsService) {}

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
    if (cliToken.expiresAt && cliToken.expiresAt < new Date()) {
      // Expired = dead credential; deliberately NOT stamped as "used" — lastUsedAt only
      // records successful auths (product decision, 2026-08-07).
      throw new UnauthorizedException('CLI token expired');
    }

    if (
      !(await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.CUSTOM_COMPONENT_LIBRARIES,
        cliToken.organizationId
      ))
    ) {
      throw new HttpException(
        `Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.`,
        451
      );
    }

    // "Last used" for the profile-settings token table. Per-auth write, no throttling —
    // CLI call volume (login/init/dev-save/deploy) is trivially low.
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(CliApiToken, { id: cliToken.id }, { lastUsedAt: new Date() });
    });

    const user = cliToken.user;
    user.organizationId = cliToken.organizationId; // token is workspace-scoped, not session-scoped
    request.user = user;
    request.cliApiToken = cliToken;
    return true;
  }
}
