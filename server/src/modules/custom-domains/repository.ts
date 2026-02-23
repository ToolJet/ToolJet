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
    return this.findOne({
      where: { domain: domain.toLowerCase(), status: 'active' },
      relations: ['organization'],
    });
  }

  async findPendingDomains(limit: number): Promise<CustomDomain[]> {
    return this.createQueryBuilder('cd')
      .where('cd.status IN (:...statuses)', { statuses: ['pending_verification', 'pending_ssl'] })
      .take(limit)
      .getMany();
  }
}
