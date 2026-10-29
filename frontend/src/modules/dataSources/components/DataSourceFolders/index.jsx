import React, { useContext, useMemo } from 'react';
import { GlobalDataSourcesContext } from '../../pages/GlobalDataSourcesPage';
import { DataSourceFolder } from './DataSourceFolder';
import { buildVisibleFolders } from './folderSearch';
import './dataSourceFolders.scss';

// Renders the data-source folder rows above the stray data-source list. Pure presentation of the
// folder state held in GlobalDataSourcesContext — create/rename/delete modals live in the parent
// (List) alongside the "+" header button, and reach back via the onRename/onDelete callbacks.
export const DataSourceFolders = ({
  dataSources,
  visibleDataSources,
  searchValue,
  onDeleteDataSource,
  onMoveDataSource,
  updateSelectedDatasource,
  onRenameFolder,
  onDeleteFolder,
  darkMode,
}) => {
  const { folders, expandedFolderIds, toggleFolderExpanded, canUpdateDataSourceFolder, canDeleteDataSourceFolder } =
    useContext(GlobalDataSourcesContext);

  // Delete rides a workspace-wide flag, but a granular "Edit folder" grant can be scoped to
  // individual folders — so rename is asked per folder, at the point of render.
  const canDelete = canDeleteDataSourceFolder();

  const searchActive = (searchValue ?? '').trim().length > 0;

  // Resolve each folder's membership rows to the actual data-source objects (so a folder shows the
  // same icon/name/git-sync affordances as a stray row), and drop the folders a search has emptied.
  const foldersWithContents = useMemo(
    () => buildVisibleFolders({ folders, dataSources, visibleDataSources, searchValue }),
    [folders, dataSources, visibleDataSources, searchValue]
  );

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
            canRename={canUpdateDataSourceFolder(folder)}
            canDelete={canDelete}
            darkMode={darkMode}
          />
        );
      })}
    </div>
  );
};
