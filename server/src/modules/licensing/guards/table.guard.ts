import { Injectable, CanActivate, ExecutionContext, HttpException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { EntityManager, Repository } from 'typeorm';
import { LicenseTermsService } from '../interfaces/IService';
import { LICENSE_FIELD, LICENSE_LIMIT, ORGANIZATION_INSTANCE_KEY } from '../constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

@Injectable()
export class TableCountGuard implements CanActivate {
  constructor(
    protected licenseTermsService: LicenseTermsService,
    @InjectRepository(InternalTable)
    protected tablesRepository: Repository<InternalTable>
  ) {}
  async fetchTotalTablesCount(manager: EntityManager, organizationId: string): Promise<number> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const whereCondition: any = {
      organization: {},
    };
    if (edition === TOOLJET_EDITIONS.Cloud) {
      if (!organizationId || organizationId === ORGANIZATION_INSTANCE_KEY) {
        throw new BadRequestException('Invalid Organization Id');
      }
      whereCondition.organization.id = organizationId;
    }
    const tables = await manager.find(InternalTable, {
      where: { organizationId },
    });
    return tables.length;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId =
      typeof request.headers['tj-workspace-id'] === 'object'
        ? request.headers['tj-workspace-id'][0]
        : request.headers['tj-workspace-id'];
    const tablesCount = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.TABLE_COUNT, organizationId);
    if (tablesCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }

    return dbTransactionWrap(async (manager) => {
      if ((await this.fetchTotalTablesCount(manager, organizationId)) >= tablesCount) {
        throw new HttpException('You have reached your maximum limit for apps.', 451);
      }
      return true;
    });
  }
}
