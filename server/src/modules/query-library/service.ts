import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Response } from 'express';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { RunLibraryDraftDto } from './dto/execution';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { LibraryCatalog, toLibraryUsage } from '@modules/data-queries/library/library-query.util';
import { QueryLibraryRepository } from './repository';
import { CreateLibraryQueryDto, LibraryQueryListItem, UpdateLibraryQueryDto } from './dto';
import { LibraryDraftService } from './draft.service';
@Injectable()
export class QueryLibraryService {
  constructor(
    protected readonly repository: QueryLibraryRepository,
    protected readonly dataSourcesRepository: DataSourcesRepository,
    protected readonly abilityService: AbilityService,
    protected readonly queryRuntime: DataQueriesUtilService,
    protected readonly drafts: LibraryDraftService
  ) {}
  async listStaticDataSources(user: User): Promise<DataSource[]> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async resolveRunTarget(
    user: User,
    query: LibraryQuery,
    dto: RunLibraryDraftDto
  ): Promise<{
    target: Pick<LibraryQueryDraft, 'kind' | 'dataSourceId' | 'options'>;
    dataSource: DataSource | null;
  }> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async run(
    user: User,
    query: LibraryQuery,
    environmentId: string,
    dto: RunLibraryDraftDto,
    response: Response
  ): Promise<object> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async getCatalog(organizationId: string): Promise<LibraryCatalog> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async getUsage(organizationId: string): Promise<ReturnType<typeof toLibraryUsage>> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  list(user: User): Promise<LibraryQueryListItem[]> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async authorizeDataSource(user: User, sourceId: string | null, manager?: EntityManager): Promise<DataSource | null> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async create(
    user: User,
    dto: CreateLibraryQueryDto,
    manager?: EntityManager
  ): Promise<
    LibraryQuery & {
      draftId: string;
    }
  > {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async update(user: User, query: LibraryQuery, dto: UpdateLibraryQueryDto): Promise<LibraryQuery> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async delete(user: User, query: LibraryQuery): Promise<void> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  listFolders(user: User): Promise<LibraryQueryFolder[]> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  createFolder(user: User, name: string): Promise<LibraryQueryFolder> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  renameFolder(user: User, folderId: string, name: string): Promise<LibraryQueryFolder> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async deleteFolder(user: User, folderId: string): Promise<void> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  // Non-throwing check for flows that skip library work instead of failing (app import/export).
  async isEnabled(organizationId: string): Promise<boolean> {
    return false;
  }
  async assertEnabled(organizationId: string): Promise<void> {
    throw new NotImplementedException('Query Library is unavailable');
  }
}
