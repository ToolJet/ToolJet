import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { getDefaultDataSource } from './setup';
export async function createLibraryQuery(
  organizationId: string,
  overrides: Partial<LibraryQuery> = {}
): Promise<LibraryQuery> {
  const manager = getDefaultDataSource().manager;
  const query = await manager.save(
    LibraryQuery,
    manager.create(LibraryQuery, {
      organizationId,
      name: 'getCustomer',
      kind: 'restapi',
      dataSourceId: null,
      options: {},
      folderId: null,
      ...overrides,
    })
  );
  await manager.save(LibraryQueryState, { libraryQueryId: query.id, hasDraft: true });
  return query;
}
export function createLibraryQueryFolder(organizationId: string, name = 'Library folder'): Promise<LibraryQueryFolder> {
  return getDefaultDataSource().manager.save(LibraryQueryFolder, { organizationId, name });
}
