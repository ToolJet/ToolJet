import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomDomain } from '@entities/custom_domain.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager, In, LessThan } from 'typeorm';

const STALE_TTL_SECONDS = parseInt(process.env.CUSTOM_DOMAIN_STALE_TTL_SECONDS || '172800', 10);
const cronKey = process.env.CUSTOM_DOMAIN_CLEANUP_INTERVAL || 'EVERY_DAY_AT_MIDNIGHT';
const CLEANUP_CRON = CronExpression[cronKey as keyof typeof CronExpression] || CronExpression.EVERY_DAY_AT_MIDNIGHT;

@Injectable()
export class CustomDomainStatusScheduler {
  private readonly logger = new Logger(CustomDomainStatusScheduler.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const pendingDomains = await manager.find(CustomDomain, {
        where: { status: In(['pending_verification', 'pending_ssl']) },
        take: 50,
      });

      if (pendingDomains.length === 0) return;

      this.logger.log(`Polling status for ${pendingDomains.length} pending custom domains`);

      for (const domain of pendingDomains) {
        try {
          if (!domain.providerHostnameId) continue;

          const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${domain.providerHostnameId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();
          if (!data.success) continue;

          const statusMap: Record<string, string> = {
            pending: 'pending_verification',
            active: 'active',
            active_redeploying: 'active',
            blocked: 'failed',
            moved: 'failed',
            deleted: 'deleted',
          };

          const sslStatusMap: Record<string, string> = {
            pending_validation: 'pending',
            pending_issuance: 'pending',
            pending_deployment: 'pending',
            active: 'active',
            pending_deletion: 'deleted',
            deleted: 'deleted',
          };

          const newStatus = statusMap[data.result.status] || 'pending_verification';
          const rawSslStatus = data.result.ssl?.status;
          const newSslStatus = rawSslStatus ? (sslStatusMap[rawSslStatus] || 'pending') : null;

          if (newStatus !== domain.status || newSslStatus !== domain.sslStatus) {
            await manager.update(CustomDomain, domain.id, {
              status: newStatus,
              sslStatus: newSslStatus,
              verificationErrors: data.result.verification_errors || null,
            });
            this.logger.log(`Domain ${domain.domain}: ${domain.status} -> ${newStatus}`);
          }
        } catch (error) {
          this.logger.error(`Failed to poll status for ${domain.domain}: ${error.message}`);
        }
      }
    });
  }

  @Cron(CLEANUP_CRON)
  async handleStaleCleanup() {
    if (process.env.ENABLE_CUSTOM_DOMAINS !== 'true') return;

    const cutoffDate = new Date(Date.now() - STALE_TTL_SECONDS * 1000);

    await dbTransactionWrap(async (manager: EntityManager) => {
      const staleDomains = await manager.find(CustomDomain, {
        where: { status: In(['pending_verification', 'pending_ssl']), updatedAt: LessThan(cutoffDate) },
        take: 50,
      });

      if (staleDomains.length === 0) return;

      this.logger.log(`Found ${staleDomains.length} stale pending custom domains for cleanup`);

      for (const domain of staleDomains) {
        try {
          if (domain.providerHostnameId) {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${domain.providerHostnameId}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!response.ok && response.status !== 404) {
              const data = await response.json();
              throw new Error(`Cloudflare DELETE failed: ${JSON.stringify(data.errors)}`);
            }
          }

          await manager.remove(domain);
          this.logger.log(
            `Cleaned up stale domain ${domain.domain} (org: ${domain.organizationId}, stale >${STALE_TTL_SECONDS}s)`
          );
        } catch (error) {
          this.logger.error(`Failed to clean up stale domain ${domain.domain}: ${error.message}`);
        }
      }
    });
  }
}
