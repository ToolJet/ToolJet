import React, { useContext, useMemo } from 'react';
import { GlobalDataSourcesContext } from '../../pages/GlobalDataSourcesPage';
import { DataSourceFolder } from './DataSourceFolder';
import './dataSourceFolders.scss';

// Renders the data-source folder rows above the stray data-source list. Pure presentation of the
// folder state held in GlobalDataSourcesContext — create/rename/delete modals live in the parent
// (List) alongside the "+" header button, and reach back via the onRename/onDelete callbacks.
export const DataSourceFolders = ({
  visibleDataSources,
  searchActive,
  onDeleteDataSource,
  onMoveDataSource,
  updateSelectedDatasource,
  onRenameFolder,
  onDeleteFolder,
  darkMode,
}) => {
  const { folders, expandedFolderIds, toggleFolderExpanded, canUpdateDataSourceFolder, canDeleteDataSourceFolder } =
    useContext(GlobalDataSourcesContext);

  const canRename = canUpdateDataSourceFolder();
  const canDelete = canDeleteDataSourceFolder();

  // Resolve each folder's membership rows to the actual (search-visible) data-source objects, so a
  // folder shows the same icon/name/git-sync affordances as a stray row.
  const dataSourceById = useMemo(() => {
    const map = new Map();
    (visibleDataSources ?? []).forEach((ds) => map.set(ds.id, ds));
    return map;
  }, [visibleDataSources]);

  const foldersWithContents = useMemo(() => {
    return (folders ?? [])
      .map((folder) => {
        const contents = (folder.folder_data_sources ?? [])
          .map((membership) => dataSourceById.get(membership.data_source_id))
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name));
        return { folder, contents };
      })
      .sort((a, b) => a.folder.name.localeCompare(b.folder.name));
  }, [folders, dataSourceById]);

  if (foldersWithContents.length === 0) return null;

  return (
    <div className="datasource-folders-list">
      {foldersWithContents.map(({ folder, contents }) => {
        // Auto-expand while searching so matching contents surface without a manual click.
        const isExpanded = expandedFolderIds.includes(folder.id) || (searchActive && contents.length > 0);
        return (
          <DataSourceFolder
            key={folder.id}
            folder={folder}
            contents={contents}
            isExpanded={isExpanded}
            onToggle={() => toggleFolderExpanded(folder.id)}
            onRename={onRenameFolder}
            onDelete={onDeleteFolder}
            onDeleteDataSource={onDeleteDataSource}
            onMoveDataSource={onMoveDataSource}
            updateSelectedDatasource={updateSelectedDatasource}
            canRename={canRename}
            canDelete={canDelete}
            darkMode={darkMode}
          />
        );
      })}
    </div>
  );
};
