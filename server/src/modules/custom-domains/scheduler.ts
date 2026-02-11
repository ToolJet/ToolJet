import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomDomain } from '@entities/custom_domain.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager, In } from 'typeorm';

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
            moved: 'failed',
            deleted: 'deleted',
          };

          const newStatus = statusMap[data.result.status] || 'pending_verification';
          const newSslStatus = data.result.ssl?.status || null;

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
}
