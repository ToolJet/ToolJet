import { Controller, Get, Param, Res } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Response } from 'express';
import { InstanceSettings } from '@entities/instance_settings.entity';

/**
 * Serves ACME HTTP-01 challenge tokens for SSL certificate acquisition.
 * Registered at /.well-known/acme-challenge/:token (excluded from /api prefix).
 * NestJS route handlers are registered before ServeStaticModule's SPA fallback,
 * so this always takes priority over the index.html catch-all.
 */
@Controller('.well-known/acme-challenge')
export class AcmeChallengeController {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  @Get(':token')
  async serveChallenge(@Param('token') token: string, @Res() res: Response) {
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      return res.status(404).end();
    }

    try {
      const setting = await this.entityManager.findOne(InstanceSettings, {
        where: { key: 'SSL_ACME_CHALLENGE', type: 'system' },
      });

      if (setting?.value) {
        const challenges: Record<string, string> = JSON.parse(setting.value);
        const keyAuth = challenges[token];
        if (keyAuth) {
          res.setHeader('Content-Type', 'text/plain');
          return res.send(keyAuth);
        }
      }
    } catch {
      // fall through to 404
    }

    return res.status(404).end();
  }
}
