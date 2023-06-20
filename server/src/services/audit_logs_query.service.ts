import { Injectable } from '@nestjs/common';
import { AuditLog } from 'src/entities/audit_log.entity';
import { User } from 'src/entities/user.entity';
import { createQueryBuilder } from 'typeorm';

@Injectable()
export class AuditLogsQueryService {
  public async findPerPage(user: User, page = 1, perPage = 10, searchParams: any): Promise<AuditLog[]> {
    return await this.#getQuery(user.organizationId, searchParams)
      .take(perPage)
      .skip(perPage * (page - 1))
      .getMany();
  }

  public async count(user: User, searchParams: any): Promise<number> {
    return await this.#getQuery(user.organizationId, searchParams).getCount();
  }

  #getQuery(organizationId: string, searchParams: any) {
    const { timeFrom, timeTo, users, apps, actions, resources } = searchParams;

    const query = createQueryBuilder(AuditLog, 'audit_log')
      .leftJoin('audit_log.user', 'user')
      .addSelect(['user.id', 'user.email', 'user.firstName', 'user.lastName']);

    if (timeFrom) {
      query.andWhere("audit_log.created_at AT TIME ZONE current_setting('TIMEZONE') >= :timeFrom", {
        timeFrom,
      });
    }

    if (timeTo) {
      query.andWhere("audit_log.created_at AT TIME ZONE current_setting('TIMEZONE') <= :timeTo", {
        timeTo,
      });
    }

    if (users) {
      query.andWhere('audit_log.userId IN(:...users)', { users: users.split(',') });
    }

    if (apps) {
      query.andWhere('audit_log.resourceId IN(:...apps)', { apps: apps.split(',') });
    }

    if (resources) {
      query.andWhere('audit_log.resourceType IN(:...resources)', { resources: resources.split(',') });
    }

    if (actions) {
      query.andWhere('audit_log.actionType IN(:...actions)', { actions: actions.split(',') });
    }

    query
      .andWhere('audit_log.organizationId = :organizationId', { organizationId })
      .orderBy('audit_log.createdAt', 'DESC');
    return query;
  }
}
