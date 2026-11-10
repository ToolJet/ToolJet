import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LibraryDraftService } from './draft.service';
import { User } from '@entities/user.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { QueryLibraryService } from './service';
import { SaveLibraryDraftDto, CreateLibraryDraftDto, UpdateLibraryDraftDto } from './dto/lifecycle';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { AuditLoggerService } from '@modules/audit-logs/service';
import {
  LibraryQueryVersionsView,
  LibraryDraftView,
  LibraryVersionView,
} from '@modules/data-queries/library/library-lifecycle.util';
@Injectable()
export class LibraryLifecycleService {
  constructor(
    protected readonly queryLibraryService: QueryLibraryService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly drafts: LibraryDraftService,
    protected readonly auditLogger: AuditLoggerService
  ) {}
  async getState(manager: EntityManager, libraryQueryId: string): Promise<LibraryQueryState> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async listVersions(query: LibraryQuery): Promise<LibraryQueryVersionsView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async getDraft(query: LibraryQuery, draftId: string): Promise<LibraryDraftView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async saveDraft(
    user: User,
    query: LibraryQuery,
    draftId: string,
    dto: SaveLibraryDraftDto,
    manager?: EntityManager
  ): Promise<LibraryVersionView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async createDraft(user: User, query: LibraryQuery, dto: CreateLibraryDraftDto): Promise<LibraryDraftView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async updateDraft(
    user: User,
    query: LibraryQuery,
    draftId: string,
    dto: UpdateLibraryDraftDto
  ): Promise<LibraryDraftView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async changeDraftDataSource(
    user: User,
    query: LibraryQuery,
    draftId: string,
    dataSourceId: string
  ): Promise<LibraryDraftView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async deleteDraft(user: User, query: LibraryQuery, draftId: string): Promise<void> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async promote(user: User, query: LibraryQuery, libraryVersionId: string): Promise<LibraryVersionView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async release(user: User, query: LibraryQuery, libraryVersionId: string): Promise<LibraryVersionView> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async deleteVersion(user: User, query: LibraryQuery, libraryVersionId: string): Promise<void> {
    throw new NotImplementedException('Query Library is unavailable');
  }
}
