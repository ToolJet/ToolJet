import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { InternalTable } from 'src/entities/internal_table.entity';
import { EntityManager } from 'typeorm';
import { LicenseTermsService } from '../interfaces/IService';
import { LICENSE_FIELD, LICENSE_LIMIT } from '../constants';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class TableCountGuard implements CanActivate {
  constructor(protected licenseTermsService: LicenseTermsService) {}
  async fetchTotalTablesCount(manager: EntityManager, organizationId: string): Promise<number> {
    const tables = await manager.find(InternalTable, {
      where: { organizationId },
    });
    return tables.length;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tablesCount = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.TABLE_COUNT,
      request?.user?.organizationId
    );
    if (tablesCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }

    return dbTransactionWrap(async (manager) => {
      if ((await this.fetchTotalTablesCount(manager, request?.user?.organizationId)) >= tablesCount) {
        throw new HttpException('You have reached your maximum limit for apps.', 451);
      }
      return true;
    });
  }
}
