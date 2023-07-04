import { Injectable } from '@nestjs/common';
import { DeleteResult, EntityManager } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';

@Injectable()
export class AppEnvironmentService {
  async get(organizationId: string, id?: string, manager?: EntityManager): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!id) {
        return await manager.findOneOrFail(AppEnvironment, { where: { organizationId, isDefault: true } });
      }
      return await manager.findOneOrFail(AppEnvironment, { where: { id, organizationId } });
    }, manager);
  }

  async getOptions(dataSourceId: string, organizationId: string, environmentId?: string): Promise<DataSourceOptions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      if (!environmentId) {
        envId = (await this.get(organizationId, null, manager)).id;
      }
      return await manager.findOneOrFail(DataSourceOptions, { where: { environmentId: envId, dataSourceId } });
    });
  }

  async create(
    organizationId: string,
    name: string,
    isDefault = false,
    manager?: EntityManager
  ): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        AppEnvironment,
        manager.create(AppEnvironment, {
          name,
          organizationId,
          isDefault,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }, manager);
  }

  async getAll(organizationId: string, manager?: EntityManager): Promise<AppEnvironment[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.find(AppEnvironment, { where: { organizationId } });
    }, manager);
  }

  async updateOptions(options: object, environmentId: string, dataSourceId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        DataSourceOptions,
        {
          environmentId,
          dataSourceId,
        },
        { options, updatedAt: new Date() }
      );
    }, manager);
  }

  async createDefaultEnvironments(organizationId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await Promise.all(
        defaultAppEnvironments.map(async (en) => {
          const env = manager.create(AppEnvironment, {
            organizationId: organizationId,
            name: en.name,
            isDefault: en.isDefault,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(env);
        })
      );
    }, manager);
  }

  async createDataSourceInAllEnvironments(organizationId: string, dataSourceId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const allEnvs = await this.getAll(organizationId, manager);
      const allEnvOptions = allEnvs.map((env) =>
        manager.create(DataSourceOptions, {
          environmentId: env.id,
          dataSourceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      await manager.save(DataSourceOptions, allEnvOptions);
    }, manager);
  }

  async createOrgConstantsInAllEnvironments(organizationId: string, orgConstantId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const allEnvs = await this.getAll(organizationId, manager);

      const allEnvConstants = allEnvs.map((env) =>
        manager.create(OrgEnvironmentConstantValue, {
          organizationConstantId: orgConstantId,
          environmentId: env.id,
          value: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      await manager.save(OrgEnvironmentConstantValue, allEnvConstants);
    }, manager);
  }

  async updateOrgEnvironmentConstant(
    constantValue: string,
    environmentId: string,
    orgConstantId: string,
    manager?: EntityManager
  ) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        OrgEnvironmentConstantValue,
        {
          environmentId,
          organizationConstantId: orgConstantId,
        },
        { value: constantValue, updatedAt: new Date() }
      );
    }, manager);
  }

  async getOrgEnvironmentConstant(
    constantName: string,
    organizationId: string,
    environmentId: string,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      if (!environmentId) {
        envId = (await this.get(organizationId, null, manager)).id;
      }

      const constantId = (await manager.findOne(OrganizationConstant, { where: { constantName, organizationId } })).id;

      return await manager.findOneOrFail(OrgEnvironmentConstantValue, {
        where: { organizationConstantId: constantId, environmentId: envId },
      });
    }, manager);
  }

  async deleteOrgEnvironmentConstant(
    constantId: string,
    organizationId: string,
    environmentId: string
  ): Promise<DeleteResult> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constantToDelete = await manager.findOne(OrganizationConstant, {
        where: { id: constantId, organizationId },
        relations: ['orgEnvironmentConstantValues'],
      });

      if (!constantToDelete) {
        throw new Error('Constant not found');
      }

      if (constantToDelete.orgEnvironmentConstantValues.length === 1) {
        return await manager.delete(OrganizationConstant, { id: constantId });
      } else {
        const environmentValueToDelete = constantToDelete.orgEnvironmentConstantValues.find(
          (value) => value.environmentId === environmentId
        );

        if (!environmentValueToDelete) {
          throw new Error('Environment value not found');
        }

        return await manager.update(
          OrgEnvironmentConstantValue,
          { id: environmentValueToDelete.id },
          { value: '', updatedAt: new Date() }
        );
      }
    });
  }
}
