import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@entities/user.entity';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { DataSource } from '@entities/data_source.entity';
import { TransactionLogger } from '@modules/logging/service';

@Injectable()
export class ValidateQuerySourceGuard implements CanActivate {
  constructor(
    private readonly dataSourceRepository: DataSourcesRepository,
    private readonly transactionLogger: TransactionLogger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    try {
      const request = context.switchToHttp().getRequest();
      const { id, dataSourceId } = request.params;
      const user: User = request.user;

      // id or dataSourceId is mandatory
      if (!(id || dataSourceId)) {
        throw new BadRequestException();
      }

      // id and user are mandatory
      if (!user) {
        throw new ForbiddenException();
      }

      let dataSource: DataSource;

      // Support dynamic data source override via request body (fx mode)
      const bodyDataSourceId = request.body?.data_source_id;

      if (bodyDataSourceId) {
        // When a dynamic data source ID is provided, resolve by that ID
        // Security: validates the DS belongs to the same organization
        dataSource = await this.dataSourceRepository.findById(bodyDataSourceId, user.organizationId);

        // For preview endpoints, we still need the dataQueries relation from the original source
        // so that the controller can access the query entity via dataSource.dataQueries[0]
        if (id && dataSource) {
          const originalSource = await this.dataSourceRepository.findByQuery(id, user.organizationId, dataSourceId);
          if (originalSource?.dataQueries) {
            dataSource.dataQueries = originalSource.dataQueries;
          }
        }
      } else if (id) {
        dataSource = await this.dataSourceRepository.findByQuery(id, user.organizationId, dataSourceId);
      } else {
        dataSource = await this.dataSourceRepository.findById(dataSourceId, user.organizationId);
      }

      // If app is not found, throw NotFoundException
      if (!dataSource) {
        throw new NotFoundException();
      }

      // Attach the found app to the request
      request.tj_data_source = dataSource;
      request.tj_resource_id = dataSource.id;

      // Return true to allow the request to proceed
      return true;
    } finally {
      this.transactionLogger.log(
        `ValidateQuerySourceGuard completed at ${new Date().toISOString()} after ${Date.now() - startTime}ms`
      );
    }
  }
}
