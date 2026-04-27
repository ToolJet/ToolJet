import React, { useState, useEffect, useMemo } from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId, decodeEntities } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { SearchBox as SearchBox2 } from '@/_components/SearchBox';
import DataSourceIcon from './DataSourceIcon';
import { isEmpty } from 'lodash';
import { Tooltip } from 'react-tooltip';
import { Virtuoso } from 'react-virtuoso';
import { canCreateDataSource } from '@/_helpers';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '../queryManager.theme.scss';
import useStore from '@/AppBuilder/_stores/store';
import { staticDataSources } from '../constants';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';

function DataSourcePicker({ darkMode }) {
  const dataSources = useStore((state) => state.dataSources);
  const globalDataSources = useStore((state) => state.globalDataSources);
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const createFolder = useStore((state) => state.queryFolders?.createFolder);
  const currentVersionId = useStore((state) => state.currentVersionId);
  const allUserDefinedSources = [...dataSources, ...globalDataSources].filter(
    (ds) => ds.type !== DATA_SOURCE_TYPE.STATIC && !ds.is_dummy
  );
  const [searchTerm, setSearchTerm] = useState();
  const [filteredUserDefinedDataSources, setFilteredUserDefinedDataSources] = useState(allUserDefinedSources);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const navigate = useNavigate();
  const createDataQuery = useStore((state) => state.dataQuery.createDataQuery);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);

  const staticDataSourcesFullObject = useStore((state) => state.globalDataSources)?.filter(
    (gds) => gds.type === DATA_SOURCE_TYPE.STATIC
  );
  const updatedStaticDataSources = staticDataSources
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
    createDataQuery(source);
    setPreviewData(null);
  };

  useEffect(() => {
    if (searchTerm) {
      const formattedSearchTerm = searchTerm.toLowerCase();
      const filteredResults = allUserDefinedSources.filter(
        ({ name, kind }) =>
          name.toLowerCase().includes(formattedSearchTerm) || kind.toLowerCase().includes(formattedSearchTerm)
      );
      setFilteredUserDefinedDataSources(filteredResults);
    } else {
      setFilteredUserDefinedDataSources(allUserDefinedSources);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, globalDataSources, dataSources]);

  const handleAddClick = () => {
    const workspaceId = getWorkspaceId();
    navigate(`/${workspaceId}/data-sources`);
  };

  const handleNewFolder = () => {
    createFolder('New folder', currentVersionId);
  };

  const toggleGroup = (kind) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  };

  const flatItems = useMemo(() => {
    const groupedSources = filteredUserDefinedDataSources.reduce((acc, source) => {
      if (!acc[source.kind]) acc[source.kind] = { sources: [], representative: source };
      acc[source.kind].sources.push(source);
      return acc;
    }, {});

    const items = [];
    Object.entries(groupedSources).forEach(([kind, { sources, representative }]) => {
      const isCollapsed = collapsedGroups.has(kind);
      items.push({ type: 'group-header', kind, representative, isCollapsed });
      if (!isCollapsed) {
        sources.forEach((source, idx) => {
          items.push({ type: 'group-item', source, isLastInGroup: idx === sources.length - 1 });
        });
      }
    });
    return items;
  }, [filteredUserDefinedDataSources, collapsedGroups]);

  const renderItem = (item) => {
    if (item.type === 'group-header') {
      return (
        <div style={{ borderBottom: item.isCollapsed ? '1px solid var(--border-weak)' : 'none' }}>
          <button
            className="d-flex align-items-center justify-content-between w-100 datasource-picker-group-btn"
            onClick={() => toggleGroup(item.kind)}
            data-cy={`ds-group-${item.kind}`}
          >
            <div className="d-flex align-items-center datasource-picker-group-label">
              <DataSourceIcon source={item.representative} height={16} />
              <span className="datasource-picker-group-name">
                {item.kind.charAt(0).toUpperCase() + item.kind.slice(1)}
              </span>
            </div>
            <SolidIcon name={item.isCollapsed ? 'TriangleDownCenter' : 'TriangleUpCenter'} width="16" height="16" />
          </button>
        </div>
      );
    }

    return (
      <div
        style={{
          padding: item.isLastInGroup ? '0 8px 8px' : '0 8px 0',
          borderBottom: item.isLastInGroup ? '1px solid var(--border-weak)' : 'none',
        }}
      >
        <button
          className="d-flex align-items-center w-100 query-datasource-quick-action"
          onClick={() => handleChangeDataSource(item.source)}
          data-tooltip-id="tooltip-for-query-panel-ds-picker-btn"
          data-tooltip-content={decodeEntities(item.source.name)}
          data-cy={`${String(item.source.name).toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
        >
          <span className="ds-source-label">{decodeEntities(item.source.name)}</span>
        </button>
      </div>
    );
  };

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
            itemKey={(_, item) => (item.type === 'group-item' ? item.source.id : `${item.type}-${item.kind}`)}
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
