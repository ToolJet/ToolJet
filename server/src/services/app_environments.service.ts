import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options';

@Injectable()
export class AppEnvironmentService {
  constructor(
    @InjectRepository(AppEnvironment)
    private appEnvironmentRepository: Repository<AppEnvironment>
  ) {}

  async get(versionId: string, id?: string, manager?: EntityManager): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!id) {
        return await manager.findOneOrFail(AppEnvironment, { where: { versionId, isDefault: true } });
      }
      return await manager.findOneOrFail(AppEnvironment, { where: { id, versionId } });
    }, manager);
  }

  async getAll(versionId: string, manager: EntityManager): Promise<AppEnvironment[]> {
    return await manager.find(AppEnvironment, { where: { versionId } });
  }

  async updateOptions(options: object, id: string, dataSourceId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        DataSourceOptions,
        {
          environmentId: id,
          dataSourceId,
        },
        { options }
      );
    }, manager);
  }
}
