import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CustomDomain } from '@entities/custom_domain.entity';

@Injectable()
export class CustomDomainRepository extends Repository<CustomDomain> {
  constructor(private readonly dataSource: DataSource) {
    super(CustomDomain, dataSource.createEntityManager());
  }

  async findByOrganizationId(organizationId: string): Promise<CustomDomain | null> {
    return this.findOne({ where: { organizationId } });
  }

  async findActiveByOrganizationId(organizationId: string): Promise<CustomDomain | null> {
    return this.findOne({ where: { organizationId, status: 'active' } });
  }

  async findByDomain(domain: string): Promise<CustomDomain | null> {
    return this.findOne({ where: { domain: domain.toLowerCase() } });
  }

  async findActiveDomain(domain: string): Promise<CustomDomain | null> {
    // Strip port from both the input and the stored value so that local-dev
    // entries like "myapp.local.com:8082" still match when the browser sends
    // only the hostname ("myapp.local.com") via window.location.hostname.
    const hostname = domain.toLowerCase().split(':')[0];
    return this.createQueryBuilder('cd')
      .where("SPLIT_PART(LOWER(cd.domain), ':', 1) = :hostname", { hostname })
      .andWhere('cd.status = :status', { status: 'active' })
      .leftJoinAndSelect('cd.organization', 'organization')
      .getOne();
  }

  async findPendingDomains(limit: number): Promise<CustomDomain[]> {
    return this.createQueryBuilder('cd')
      .where('cd.status IN (:...statuses)', { statuses: ['pending_verification', 'pending_ssl'] })
      .take(limit)
      .getMany();
  }

  async findStalePendingDomains(cutoffDate: Date, limit: number): Promise<CustomDomain[]> {
    return this.createQueryBuilder('cd')
      .where('cd.status IN (:...statuses)', { statuses: ['pending_verification', 'pending_ssl'] })
      .andWhere('cd.updated_at < :cutoff', { cutoff: cutoffDate })
      .take(limit)
      .getMany();
  }
}
