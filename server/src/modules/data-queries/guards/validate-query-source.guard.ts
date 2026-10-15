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
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { VersionSnapshotStore } from '@modules/versions/diff/snapshot-store';

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
        // Rendering an AI-turn snapshot can run a query the turn deleted: take its data source
        // from the snapshot, which must belong to the app the earlier guard resolved.
        const snapshotId = request.body?.snapshotId;
        if (!dataSource && snapshotId && request.tj_app?.id) {
          const row = await dbTransactionWrap(async (manager: EntityManager) => {
            const stored = await new VersionSnapshotStore().load(manager, request.tj_app.id, snapshotId);
            return stored.rows.queries.find((query) => query.id === id);
          }).catch(() => null);
          if (row?.dataSourceId)
            dataSource = await this.dataSourceRepository.findById(row.dataSourceId, user.organizationId);
        }
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
