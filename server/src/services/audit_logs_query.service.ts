import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/entities/audit_log.entity';
import { User } from 'src/entities/user.entity';
import { Between, In, Repository } from 'typeorm';

@Injectable()
export class AuditLogsQueryService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  public async findPerPage(user: User, page: number, perPage: number, searchParams: any): Promise<AuditLog[]> {
    const { timeFrom, timeTo, users, actions, resources } = searchParams;

    const whereClause = {
      ...(timeFrom && timeTo && { createdAt: Between(timeFrom, timeTo) }),
      ...(users && { userId: In(users.split(',')) }),
      ...(resources && { resourceType: In(resources.split(',')) }),
      ...(actions && { actionType: In(actions.split(',')) }),
    };

    return this.auditLogRepository.find({
      where: { organizationId: user.organizationId, ...whereClause },
      take: perPage,
      skip: perPage * (page - 1),
      order: { createdAt: 'DESC' },
    });
  }

  public async count(user: User, searchParams: any): Promise<number> {
    const { timeFrom, timeTo, users, actions, resources } = searchParams;

    const whereClause = {
      ...(timeFrom && timeTo && { createdAt: Between(timeFrom, timeTo) }),
      ...(users && { userId: In(users.split(',')) }),
      ...(resources && { resourceType: In(resources.split(',')) }),
      ...(actions && { actionType: In(actions.split(',')) }),
    };
    return this.auditLogRepository.count({
      where: { organizationId: user.organizationId, ...whereClause },
    });
  }
}
