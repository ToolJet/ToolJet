import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQueryFolderMapping, ChildType } from '@entities/data_query_folder_mapping.entity';

@Injectable()
export class DataQueryFolderRepository extends Repository<DataQueryFolder> {
  constructor(private readonly dataSource: DataSource) {
    super(DataQueryFolder, dataSource.createEntityManager());
  }

  async findFoldersByAppVersion(appVersionId: string, manager?: EntityManager): Promise<DataQueryFolder[]> {
    const repo = manager ? manager.getRepository(DataQueryFolder) : this;
    return repo.find({ where: { appVersionId } });
  }

  async findFolderById(id: string): Promise<DataQueryFolder | null> {
    return this.findOne({ where: { id } });
  }
}

@Injectable()
export class DataQueryFolderMappingRepository extends Repository<DataQueryFolderMapping> {
  constructor(private readonly dataSource: DataSource) {
    super(DataQueryFolderMapping, dataSource.createEntityManager());
  }

  async findMappingsByParent(parentId: string | null, manager?: EntityManager): Promise<DataQueryFolderMapping[]> {
    const repo = manager ? manager.getRepository(DataQueryFolderMapping) : this;
    return repo.find({
      where: { parentId },
      order: { index: 'ASC', updatedAt: 'DESC' },
    });
  }

  async findMappingByChild(
    childId: string,
    childType: ChildType,
    manager?: EntityManager
  ): Promise<DataQueryFolderMapping | null> {
    const repo = manager ? manager.getRepository(DataQueryFolderMapping) : this;
    return repo.findOne({ where: { childId, childType } });
  }

  async findChildrenOfFolder(parentId: string, manager?: EntityManager): Promise<DataQueryFolderMapping[]> {
    const repo = manager ? manager.getRepository(DataQueryFolderMapping) : this;
    return repo.find({
      where: { parentId },
      order: { index: 'ASC', updatedAt: 'DESC' },
    });
  }

  async moveMappingsToRoot(parentId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(DataQueryFolderMapping) : this;
    await repo.update({ parentId }, { parentId: null });
  }

  async deleteMappingsByFolder(parentId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(DataQueryFolderMapping) : this;
    await repo.delete({ parentId });
  }

  async deleteMappingByChild(childId: string, childType: ChildType, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(DataQueryFolderMapping) : this;
    await repo.delete({ childId, childType });
  }

  async getMaxIndexAtRoot(manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(DataQueryFolderMapping) : this;
    const result = await repo
      .createQueryBuilder('mapping')
      .select('MAX(mapping.index)', 'max')
      .where('mapping.parentId IS NULL')
      .getRawOne();
    return result?.max ?? -1;
  }
}
