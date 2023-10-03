import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { Repository } from 'typeorm';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD, LICENSE_LIMIT } from 'src/helpers/license.helper';

@Injectable()
export class TableCountGuard implements CanActivate {
  constructor(
    private licenseService: LicenseService,
    @InjectRepository(InternalTable)
    private tablesRepository: Repository<InternalTable>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tablesCount = await this.licenseService.getLicenseTerms(LICENSE_FIELD.TABLE_COUNT);
    if (tablesCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }
    const existingTablesCount = await this.tablesRepository.count();
    if (existingTablesCount >= tablesCount) {
      throw new HttpException('You have reached your maximum limit for tables.', 451);
    }
    return true;
  }
}
