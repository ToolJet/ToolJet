import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { cloneDeep } from 'lodash';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';

export type LibrarySnapshot = Pick<LibraryQueryDraft, 'kind' | 'dataSourceId' | 'options'>;

@Injectable()
export class LibraryDraftService {
  async createInitialDraft(
    queryId: string,
    snapshot: LibrarySnapshot,
    manager: EntityManager
  ): Promise<LibraryQueryDraft> {
    const query = await manager.findOne(LibraryQuery, {
      where: { id: queryId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!query) throw new NotFoundException('Library query not found');
    if (
      (await manager.existsBy(LibraryQueryDraft, { libraryQueryId: queryId })) ||
      (await manager.existsBy(LibraryQueryVersion, { libraryQueryId: queryId }))
    ) {
      throw new ConflictException('Library query already has a draft or saved version');
    }
    return manager.save(
      LibraryQueryDraft,
      manager.create(LibraryQueryDraft, {
        libraryQueryId: queryId,
        name: 'v1',
        description: null,
        createdFromVersionId: null,
        kind: snapshot.kind,
        dataSourceId: snapshot.dataSourceId,
        options: cloneDeep(snapshot.options),
      })
    );
  }

  async getDraft(queryId: string, draftId: string, manager: EntityManager): Promise<LibraryQueryDraft> {
    const draft = await manager.findOne(LibraryQueryDraft, { where: { id: draftId, libraryQueryId: queryId } });
    if (!draft) throw new NotFoundException('Library query draft not found');
    return draft;
  }
}
