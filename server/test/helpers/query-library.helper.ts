import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { getDefaultDataSource } from './setup';
export async function createLibraryQuery(
  organizationId: string,
  overrides: Partial<LibraryQuery> & Partial<Pick<LibraryQueryDraft, 'kind' | 'dataSourceId' | 'options'>> = {}
): Promise<LibraryQuery & { draftId: string }> {
  const manager = getDefaultDataSource().manager;
  const { kind = 'restapi', dataSourceId = null, options = {}, ...identity } = overrides;
  const query = await manager.save(
    LibraryQuery,
    manager.create(LibraryQuery, {
      organizationId,
      name: 'getCustomer',
      folderId: null,
      ...identity,
    })
  );
  await manager.save(LibraryQueryState, { libraryQueryId: query.id });
  const draft = await manager.save(LibraryQueryDraft, {
    libraryQueryId: query.id,
    name: 'v1',
    kind,
    dataSourceId,
    options,
  });
  return Object.assign(query, { draftId: draft.id });
}
export function createLibraryQueryFolder(organizationId: string, name = 'Library folder'): Promise<LibraryQueryFolder> {
  return getDefaultDataSource().manager.save(LibraryQueryFolder, { organizationId, name });
}
