import { Controller, Get, Request, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { User } from 'src/entities/user.entity';
import { AuditLogsQueryService } from '@services/audit_logs_query.service';
import { decamelizeKeys } from 'humps';

@Controller('audit_logs')
export class AuditLogsController {
  constructor(private auditLogsQueryService: AuditLogsQueryService) {}

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('accessAuditLogs', User))
  @Get()
  async index(@Request() req, @Query() query): Promise<object> {
    const { resources, actions, timeFrom, timeTo, users, apps } = query;
    const searchParams = { resources, actions, timeFrom, timeTo, users, apps };
    const page = parseInt(query.page || 1);
    const perPage = parseInt(query.perPage || 50);
    const auditLogs = await this.auditLogsQueryService.findPerPage(req.user, page, perPage, searchParams);
    const totalCount = await this.auditLogsQueryService.count(req.user, searchParams);
    const meta = {
      totalPages: Math.ceil(totalCount / perPage),
      totalCount,
      currentPage: page,
    };

    return decamelizeKeys({ auditLogs, meta });
  }
}
