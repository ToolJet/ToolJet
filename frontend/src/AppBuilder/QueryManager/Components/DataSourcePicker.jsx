import React, { useEffect, useState, useMemo } from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId, decodeEntities } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { SearchBox as SearchBox2 } from '@/_components/SearchBox';
import DataSourceIcon from './DataSourceIcon';
import { Library } from '../QueryEditors/Library';
import { globalDatasourceService } from '@/_services';
import { isEmpty } from 'lodash';
import { Tooltip } from 'react-tooltip';
import { Virtuoso } from 'react-virtuoso';
import { canCreateDataSource } from '@/_helpers';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import '../queryManager.theme.scss';
import useStore from '@/AppBuilder/_stores/store';
import { isQueryLibraryMode } from '@/AppBuilder/_stores/slices/queryLibrarySlice';
import { staticDataSources, LIBRARY_UNSUPPORTED_KINDS } from '../constants';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { isQueryLibraryEnabled } from '@/AppBuilder/QueryLibrary/queryLibraryApp';
import { buildDataSourceFolderGroups } from './dataSourceFolderGrouping';
import { create } from 'zustand';

// The Query library choice is staged here until a query and version are picked; the query panel's Plus menu
// stages into the same place (stageLibrarySource), so both entry points share one selection flow.
const useStagedLibrarySource = create(() => ({ source: null }));
export const stageLibrarySource = (source) => useStagedLibrarySource.setState({ source });

function DataSourcePicker({ darkMode }) {
  const dataSources = useStore((state) => state.dataSources);
  const globalDataSources = useStore((state) => state.globalDataSources);
  const dataSourceFolders = useStore((state) => state.dataSourceFolders);
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const createFolder = useStore((state) => state.queryFolders?.createFolder);
  const currentVersionId = useStore((state) => state.currentVersionId);
  const isQueryLibrary = useStore((state) => isQueryLibraryMode(state));

  const allUserDefinedSources = useMemo(
    () => [...dataSources, ...globalDataSources].filter((ds) => ds.type !== DATA_SOURCE_TYPE.STATIC && !ds.is_dummy),
    [dataSources, globalDataSources]
  );
  const librarySource = useStagedLibrarySource((state) => state.source);
  const setLibrarySource = stageLibrarySource;
  const [libraryOptions, setLibraryOptions] = useState({});
  const [resolvedLibrarySource, setResolvedLibrarySource] = useState(null);
  const [librarySourceError, setLibrarySourceError] = useState(null);
  const [creatingLibraryQuery, setCreatingLibraryQuery] = useState(false);
  const [searchTerm, setSearchTerm] = useState();
  // Data-source folders start collapsed; a folder is shown expanded while searching so matches surface.
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const navigate = useNavigate();
  const createDataQuery = useStore((state) => state.dataQuery.createDataQuery);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);

  const queryLibraryAccess = useStore((state) => state.license.featureAccess);
  const staticDataSourcesFullObject = useStore((state) => state.globalDataSources)?.filter(
    (gds) => gds.type === DATA_SOURCE_TYPE.STATIC
  );
  const updatedStaticDataSources = staticDataSources
    .filter((source) => source.kind !== 'library' || isQueryLibraryEnabled(queryLibraryAccess))
    .filter((source) => !isQueryLibrary || !LIBRARY_UNSUPPORTED_KINDS.includes(source.kind))
    .filter((source) => {
      if (source.kind === 'workflows') {
        return staticDataSourcesFullObject?.some((gds) => gds.kind === 'workflows');
      }
      return true;
    })
    .map((source) => {
      const matchingObject = staticDataSourcesFullObject?.find((gds) => gds.kind === source.kind);
      return {
        ...source,
        id: matchingObject?.id || source.id,
      };
    });

  const handleChangeDataSource = (source) => {
    if (source.kind === 'library') {
      setLibraryOptions({});
      setResolvedLibrarySource(null);
      setLibrarySourceError(null);
      setLibrarySource(source);
      return;
    }
    createDataQuery(source);
    setPreviewData(null);
  };

  const resolveLibrarySource = async () => {
    const state = useStore.getState();
    const { data_sources: sources } = await globalDatasourceService.getForApp(
      state.appStore.modules.canvas.app.organizationId ?? getWorkspaceId(),
      state.currentVersionId,
      state.selectedEnvironment?.id
    );
    const source = sources.find((item) => item.kind === 'library' && item.id && item.id !== 'null');
    if (!source) throw new Error('The Query Library data source is unavailable. Reopen the picker to try again.');
    return { ...librarySource, ...source };
  };

  // A staged choice belongs to this picker; drop it once the picker goes away (a query got selected).
  useEffect(() => () => setLibrarySource(null), []);

  useEffect(() => {
    if (!librarySource) return;
    let active = true;
    resolveLibrarySource()
      .then((source) => active && setResolvedLibrarySource(source))
      .catch(
        () =>
          active &&
          setLibrarySourceError('The Query Library data source is unavailable. Reopen the picker to try again.')
      );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [librarySource]);

  const handleAddClick = () => {
    const workspaceId = getWorkspaceId();
    navigate(`/${workspaceId}/data-sources`);
  };

  const handleNewFolder = () => {
    createFolder('New folder', currentVersionId);
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const flatItems = useMemo(() => {
    // Connected data sources grouped by their data-source folder (folders first, collapsed by
    // default; expanded while searching), then stray (unfoldered) sources as a flat list.
    const { folders, stray } = buildDataSourceFolderGroups(allUserDefinedSources, dataSourceFolders, searchTerm);
    const isSearching = !!(searchTerm && searchTerm.trim());

    const items = [];
    folders.forEach(({ folder, sources }) => {
      const isExpanded = expandedFolders.has(folder.id) || isSearching;
      items.push({ type: 'folder-header', folder, isExpanded });
      if (isExpanded) {
        sources.forEach((source, idx) =>
          items.push({ type: 'folder-item', source, isLastInGroup: idx === sources.length - 1 })
        );
      }
    });
    stray.forEach((source) => items.push({ type: 'stray-item', source }));
    return items;
  }, [allUserDefinedSources, dataSourceFolders, searchTerm, expandedFolders]);

  const renderItem = (item) => {
    if (item.type === 'folder-header') {
      return (
        <div style={{ padding: '0 8px' }}>
          <button
            className="d-flex align-items-center w-100 query-datasource-quick-action"
            onClick={() => toggleFolder(item.folder.id)}
            data-cy={`ds-folder-${String(item.folder.name).toLowerCase().replace(/\s+/g, '-')}`}
          >
            <DynamicIcon
              name={item.isExpanded ? 'folder-open' : 'folder-dot'}
              size={16}
              style={{ flexShrink: 0, color: 'var(--icon-default, #6a727c)' }}
            />
            <span className="ds-source-label" title={decodeEntities(item.folder.name)}>
              {decodeEntities(item.folder.name)}
            </span>
          </button>
        </div>
      );
    }

    const isFolderItem = item.type === 'folder-item';
    return (
      <div style={{ padding: isFolderItem ? '0 8px 0 20px' : '0 8px 0' }}>
        <button
          className="d-flex align-items-center w-100 query-datasource-quick-action"
          onClick={() => handleChangeDataSource(item.source)}
          data-tooltip-id="tooltip-for-query-panel-ds-picker-btn"
          data-tooltip-content={decodeEntities(item.source.name)}
          data-cy={`${String(item.source.name).toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
        >
          <DataSourceIcon source={item.source} height={16} />
          <span className="ds-source-label">{decodeEntities(item.source.name)}</span>
        </button>
      </div>
    );
  };

  if (librarySource) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-3" data-cy="library-consumer-picker">
        <Library options={libraryOptions} optionsChanged={setLibraryOptions} darkMode={darkMode} />
        {librarySourceError && <div role="alert">{librarySourceError}</div>}
        <div className="tw-flex tw-justify-end tw-gap-2">
          <ButtonSolid variant="tertiary" disabled={creatingLibraryQuery} onClick={() => setLibrarySource(null)}>
            Cancel
          </ButtonSolid>
          <ButtonSolid
            disabled={
              !resolvedLibrarySource ||
              !libraryOptions.libraryQueryId ||
              !libraryOptions.libraryQueryVersionId ||
              creatingLibraryQuery
            }
            onClick={async () => {
              setCreatingLibraryQuery(true);
              try {
                const source = await resolveLibrarySource();
                await createDataQuery(source, false, libraryOptions);
                setPreviewData(null);
                setLibrarySource(null);
              } catch (error) {
                setResolvedLibrarySource(null);
                setLibrarySourceError(error.message || 'Unable to create the Query Library query.');
              } finally {
                setCreatingLibraryQuery(false);
              }
            }}
            data-cy="create-library-consumer"
          >
            Create query
          </ButtonSolid>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex flex-column align-items-center text-center mb-3 datasource-picker-header">
        <h4 className="datasource-picker-title" data-cy={'label-select-datasource'}>
          Start building queries
        </h4>
        <p className="datasource-picker-subtitle">
          Bring your apps to life by connecting data sources and workflows. Or explore with sample data to get started
        </p>
      </div>

      {/* Quick actions grid */}
      <div className="d-flex flex-wrap mb-3 datasource-picker-quick-actions">
        {updatedStaticDataSources.map((source) => (
          <button
            key={`${source.id}-${source.kind}`}
            className="d-flex align-items-center query-datasource-quick-action"
            onClick={() => handleChangeDataSource(source)}
            data-cy={`${source.kind.toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
          >
            <DataSourceIcon source={source} height={16} />
            <span className="ds-source-label">{source.shortName}</span>
          </button>
        ))}
        {!!sampleDataSource && (
          <button
            key={`${sampleDataSource.id}-${sampleDataSource.kind}`}
            className="d-flex align-items-center query-datasource-quick-action"
            onClick={() => handleChangeDataSource(sampleDataSource)}
            data-cy={`${sampleDataSource.kind.toLowerCase().replace(/\s+/g, '-')}-sample-db-add-query-card`}
          >
            <DataSourceIcon source={sampleDataSource} height={16} />
            <span className="ds-source-label">Sample database</span>
          </button>
        )}
        {typeof createFolder === 'function' && (
          <button
            className="d-flex align-items-center query-datasource-quick-action"
            onClick={handleNewFolder}
            data-cy="new-folder-add-query-card"
          >
            <SolidIcon name="folder" width="16" height="16" />
            <span className="ds-source-label">New folder</span>
          </button>
        )}
      </div>

      {/* Section divider */}
      <div className="d-flex align-items-center mb-2 datasource-picker-divider">
        <hr className="datasource-picker-divider-hr" />
        <span className="datasource-picker-section-label">
          {`Available data sources${!isEmpty(allUserDefinedSources) ? ` (${allUserDefinedSources.length})` : ''}`}
        </span>
        <hr className="datasource-picker-divider-hr" />
      </div>

      {/* Search + Add */}
      <div className="d-flex mb-2 datasource-picker-search-row">
        <div className="datasource-picker-search-wrap">
          <SearchBox2
            width="100%"
            placeholder="Search for datasources"
            customClass={darkMode ? 'dark-theme-placeholder' : ''}
            callBack={(e) => setSearchTerm(e.target.value)}
            onClearCallback={() => setSearchTerm('')}
            clearTextOnBlur={false}
            dataCy="gds-querymanager"
          />
        </div>
        {canCreateDataSource() && (
          <ButtonSolid
            size="sm"
            variant="tertiary"
            className="query-add-datasource-btn"
            onClick={handleAddClick}
            data-cy="landing-page-add-new-ds-button"
          >
            <SolidIcon name="plus" width="16" height="16" fill="var(--indigo9)" />
            Add
          </ButtonSolid>
        )}
      </div>

      {/* Grouped datasource accordions */}
      {isEmpty(allUserDefinedSources) ? (
        <EmptyDataSourceBanner />
      ) : (
        <>
          <Tooltip id="tooltip-for-query-panel-ds-picker-btn" className="tooltip" />
          <Virtuoso
            style={{ height: 'calc(100vh - 420px)', minHeight: 200 }}
            data={flatItems}
            itemKey={(_, item) =>
              item.type === 'folder-header' ? `folder-header-${item.folder.id}` : `${item.type}-${item.source.id}`
            }
            itemContent={(_, item) => renderItem(item)}
          />
        </>
      )}
    </>
  );
}

const EmptyDataSourceBanner = () => (
  <div className="bg-slate3 p-3 d-flex align-items-center lh-lg mt-2 datasource-picker-empty-banner">
    <div className="me-2">
      <Information fill="var(--slate9)" />
    </div>
    <div>No Data sources have been added yet.</div>
  </div>
);

export default DataSourcePicker;
