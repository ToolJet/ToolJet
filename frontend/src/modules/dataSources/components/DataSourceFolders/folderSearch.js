// Decides which data-source folders the sidebar shows, and what each one contains, for a given
// search term. Same semantics as the query panel's folder grouping
// (AppBuilder/QueryManager/Components/dataSourceFolderGrouping.js), kept in step deliberately:
//
//   - no search term  → every folder, empty ones included, with all of its data sources;
//   - search term     → a folder survives when its own name matches OR it holds a matching data
//                       source. A name-matched folder shows all of its data sources; one that
//                       survives only on its contents shows just the matching ones. Folders left
//                       with nothing to show are dropped rather than rendered empty.
//
// `visibleDataSources` is the already search-filtered list; `dataSources` is the unfiltered one,
// needed to fill a folder that matched by name. Folders and their contents are alphabetical.
export function buildVisibleFolders({ folders, dataSources, visibleDataSources, searchValue }) {
  const term = (searchValue ?? '').toLowerCase().trim();
  const allById = new Map((dataSources ?? []).map((dataSource) => [dataSource.id, dataSource]));
  const matchingById = new Map((visibleDataSources ?? []).map((dataSource) => [dataSource.id, dataSource]));

  return (folders ?? [])
    .map((folder) => {
      const folderNameMatches = !!term && (folder.name ?? '').toLowerCase().includes(term);
      const lookup = folderNameMatches ? allById : matchingById;
      const contents = (folder.folder_data_sources ?? [])
        .map((membership) => lookup.get(membership.data_source_id))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      return { folder, contents, folderNameMatches };
    })
    .filter(({ contents, folderNameMatches }) => !term || folderNameMatches || contents.length > 0)
    .sort((a, b) => a.folder.name.localeCompare(b.folder.name));
}
