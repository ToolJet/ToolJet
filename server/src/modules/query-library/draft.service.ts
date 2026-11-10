import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
export type LibrarySnapshot = Pick<LibraryQueryDraft, 'kind' | 'dataSourceId' | 'options'>;
@Injectable()
export class LibraryDraftService {
  async createInitialDraft(
    queryId: string,
    snapshot: LibrarySnapshot,
    manager: EntityManager
  ): Promise<LibraryQueryDraft> {
    throw new NotImplementedException('Query Library is unavailable');
  }
  async getDraft(queryId: string, draftId: string, manager: EntityManager): Promise<LibraryQueryDraft> {
    throw new NotImplementedException('Query Library is unavailable');
  }
}
