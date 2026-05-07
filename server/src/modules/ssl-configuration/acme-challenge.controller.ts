import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_SETTINGS_TYPE } from '@modules/instance-settings/constants';

/**
 * Serves ACME HTTP-01 challenge tokens for SSL certificate acquisition.
 * Registered at /.well-known/acme-challenge/:token (excluded from /api prefix).
 * NestJS route handlers are registered before ServeStaticModule's SPA fallback,
 * so this takes priority and returns the token without being intercepted by index.html.
 */
@Controller('.well-known/acme-challenge')
export class AcmeChallengeController {
  constructor(private readonly instanceSettingsUtilService: InstanceSettingsUtilService) {}

  @Get(':token')
  async serveChallenge(@Param('token') token: string, @Res() res: Response) {
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      return res.status(404).end();
    }

    try {
      const raw = await this.instanceSettingsUtilService.getSettings(
        INSTANCE_SYSTEM_SETTINGS.SSL_ACME_CHALLENGE,
        false,
        INSTANCE_SETTINGS_TYPE.SYSTEM
      );
      const challenges: Record<string, string> = raw ? JSON.parse(raw) : {};
      const keyAuth = challenges[token];

      if (keyAuth) {
        res.setHeader('Content-Type', 'text/plain');
        return res.send(keyAuth);
      }
    } catch {
      // fall through to 404
    }

    return res.status(404).end();
  }
}
