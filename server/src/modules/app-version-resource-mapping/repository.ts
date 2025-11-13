import { Repository, EntityManager, DataSource } from 'typeorm';
import { AppVersionResourceMapping, ResourceMappingType } from '@entities/app_version_resource_mapping.entity';
import { Injectable } from '@nestjs/common';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class AppVersionResourceMappingRepository extends Repository<AppVersionResourceMapping> {
  constructor(private dataSource: DataSource) {
    super(AppVersionResourceMapping, dataSource.createEntityManager());
  }

  /**
   * Get all resource mappings for a specific app version
   */
  async getResourceMappingsByVersionId(
    appVersionId: string,
    manager?: EntityManager
  ): Promise<AppVersionResourceMapping[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(AppVersionResourceMapping, {
        where: { appVersionId },
      });
    }, manager || this.manager);
  }

  /**
   * Get resource mapping by app version and resource type
   */
  async getResourceMappingByType(
    appVersionId: string,
    resourceType: ResourceMappingType,
    manager?: EntityManager
  ): Promise<AppVersionResourceMapping | null> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(AppVersionResourceMapping, {
        where: { appVersionId, resourceType },
      });
    }, manager || this.manager);
  }

  /**
   * Get all resource mappings for an app
   */
  async getResourceMappingsByAppId(appId: string, manager?: EntityManager): Promise<AppVersionResourceMapping[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(AppVersionResourceMapping, {
        where: { appId },
        order: { createdAt: 'DESC' },
      });
    }, manager || this.manager);
  }

  /**
   * Upsert resource mapping
   */
  async upsertResourceMapping(
    appId: string,
    appVersionId: string,
    resourceType: ResourceMappingType,
    resourceMappings: Record<string, string>,
    manager?: EntityManager
  ): Promise<AppVersionResourceMapping> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existing = await manager.findOne(AppVersionResourceMapping, {
        where: { appVersionId, resourceType },
      });

      if (existing) {
        existing.resourceMappings = resourceMappings;
        existing.updatedAt = new Date();
        return await manager.save(AppVersionResourceMapping, existing);
      } else {
        const newMapping = manager.create(AppVersionResourceMapping, {
          appId,
          appVersionId,
          resourceType,
          resourceMappings,
        });
        return await manager.save(AppVersionResourceMapping, newMapping);
      }
    }, manager || this.manager);
  }

  /**
   * Get consolidated mappings for an app version
   */
  async getConsolidatedMappings(
    appVersionId: string,
    manager?: EntityManager
  ): Promise<Record<string, Record<string, string>>> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const mappings = await manager.find(AppVersionResourceMapping, {
        where: { appVersionId },
      });

      const consolidated: Record<string, Record<string, string>> = {};

      for (const mapping of mappings) {
        consolidated[mapping.resourceType] = mapping.resourceMappings;
      }

      return consolidated;
    }, manager || this.manager);
  }
}
