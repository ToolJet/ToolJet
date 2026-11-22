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
import { DefaultDataSourceKinds } from '@modules/data-sources/constants';
import { DefaultDataSourceKind } from '@modules/data-sources/types';
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

      if (id) {
        dataSource = await this.dataSourceRepository.findByQuery(id, user.organizationId, dataSourceId);
      } else if (DefaultDataSourceKinds.includes(dataSourceId as DefaultDataSourceKind)) {
        // The built-in sources (runjs, runpy, restapi, tooljetdb, workflows) are addressed
        // by their kind in the route, not by the uuid of the data source row.
        dataSource = await this.dataSourceRepository.findStaticDataSourceByKind(
          user.organizationId,
          dataSourceId as DefaultDataSourceKind
        );
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
