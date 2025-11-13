import { EntityRepository, Repository, EntityManager } from 'typeorm';
import { AppVersionResourceMapping, ResourceMappingType } from '@entities/app_version_resource_mapping.entity';

@EntityRepository(AppVersionResourceMapping)
export class AppVersionResourceMappingRepository extends Repository<AppVersionResourceMapping> {
  /**
   * Get all resource mappings for a specific app version
   */
  async getResourceMappingsByVersionId(appVersionId: string): Promise<AppVersionResourceMapping[]> {
    return await this.find({
      where: { appVersionId },
    });
  }

  /**
   * Get resource mapping by app version and resource type
   */
  async getResourceMappingByType(
    appVersionId: string,
    resourceType: ResourceMappingType
  ): Promise<AppVersionResourceMapping | null> {
    return await this.findOne({
      where: { appVersionId, resourceType },
    });
  }

  /**
   * Get all resource mappings for an app
   */
  async getResourceMappingsByAppId(appId: string): Promise<AppVersionResourceMapping[]> {
    return await this.find({
      where: { appId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Upsert resource mapping
   */
  async upsertResourceMapping(
    manager: EntityManager,
    appId: string,
    appVersionId: string,
    resourceType: ResourceMappingType,
    resourceMappings: Record<string, string>
  ): Promise<AppVersionResourceMapping> {
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
  }

  /**
   * Get consolidated mappings for an app version
   */
  async getConsolidatedMappings(appVersionId: string): Promise<Record<string, Record<string, string>>> {
    const mappings = await this.getResourceMappingsByVersionId(appVersionId);

    const consolidated: Record<string, Record<string, string>> = {};

    for (const mapping of mappings) {
      consolidated[mapping.resourceType] = mapping.resourceMappings;
    }

    return consolidated;
  }
}
