// Groups the app-builder's connected data sources by their data-source folder for the query-panel
// pickers (DataSourceSelect + DataSourcePicker). Folders (with their contained sources) come first,
// stray (unfoldered) sources follow as a flat list — folders replace the old group-by-kind view.
//
// `dataSourceFolders` is the getForApp `data_source_folders` payload: [{ id, name, data_sources }]
// where `data_sources` is an array of data-source ids (already permission-filtered, empty folders
// dropped server-side). We resolve those ids against the sources the picker actually has.
//
// Search: a folder is kept when its name matches OR it contains a matching source. A folder that
// matches by name shows all its sources; one that matches only by contents shows just the matching
// ones. Stray sources are filtered by the same predicate. Ordering of folders and sources follows
// the server/store order.

const matchesTerm = (source, term) =>
  !term || source?.name?.toLowerCase().includes(term) || (source?.kind || '').toLowerCase().includes(term);

export function buildDataSourceFolderGroups(sources, dataSourceFolders, searchTerm) {
  const term = (searchTerm || '').toLowerCase().trim();
  const byId = new Map((sources || []).map((source) => [source.id, source]));
  const folderedIds = new Set();

  const folders = [];
  (dataSourceFolders || []).forEach((folder) => {
    const folderSources = (folder.data_sources || []).map((id) => byId.get(id)).filter(Boolean);
    // A data source belongs to at most one folder; mark it foldered even if it doesn't match the
    // search, so it never also appears in the stray list.
    folderSources.forEach((source) => folderedIds.add(source.id));
    if (folderSources.length === 0) return;

    const folderNameMatches = !term || (folder.name || '').toLowerCase().includes(term);
    const visibleSources =
      term && !folderNameMatches ? folderSources.filter((s) => matchesTerm(s, term)) : folderSources;
    if (term && visibleSources.length === 0) return;

    folders.push({ folder, sources: visibleSources });
  });

  const stray = (sources || []).filter((source) => !folderedIds.has(source.id) && matchesTerm(source, term));

  return { folders, stray };
}
