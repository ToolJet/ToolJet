import React, { useState, useEffect } from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId, decodeEntities } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { SearchBox as SearchBox2 } from '@/_components/SearchBox';
import DataSourceIcon from './DataSourceIcon';
import { isEmpty } from 'lodash';
import { Tooltip } from 'react-tooltip';
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
    (ds) => ds.type !== DATA_SOURCE_TYPE.STATIC
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

  // Group user-defined data sources by kind
  const groupedSources = filteredUserDefinedDataSources.reduce((acc, source) => {
    if (!acc[source.kind]) acc[source.kind] = { sources: [], representative: source };
    acc[source.kind].sources.push(source);
    return acc;
  }, {});

  return (
    <>
      <div className="d-flex flex-column align-items-center text-center mb-3" style={{ gap: '4px' }}>
        <h4 style={{ fontWeight: 500, marginBottom: 0 }} data-cy={'label-select-datasource'}>
          Start building queries
        </h4>
        <p className="mb-0" style={{ color: 'var(--text-placeholder)', fontSize: '12px', maxWidth: '400px' }}>
          Bring your apps to life by connecting data sources and workflows. Or explore with sample data to get started
        </p>
      </div>

      {/* Quick actions grid */}
      <div className="d-flex flex-wrap mb-3" style={{ gap: '8px' }}>
        {updatedStaticDataSources.map((source) => (
          <button
            key={`${source.id}-${source.kind}`}
            className="d-flex align-items-center query-datasource-quick-action"
            style={{
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              width: 'calc(50% - 4px)',
            }}
            onClick={() => handleChangeDataSource(source)}
            data-cy={`${source.kind.toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
          >
            <DataSourceIcon source={source} height={16} />
            <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{source.shortName}</span>
          </button>
        ))}
        {!!sampleDataSource && (
          <button
            key={`${sampleDataSource.id}-${sampleDataSource.kind}`}
            className="d-flex align-items-center query-datasource-quick-action"
            style={{
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              width: 'calc(50% - 4px)',
            }}
            onClick={() => handleChangeDataSource(sampleDataSource)}
            data-cy={`${sampleDataSource.kind.toLowerCase().replace(/\s+/g, '-')}-sample-db-add-query-card`}
          >
            <DataSourceIcon source={sampleDataSource} height={16} />
            <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Sample database</span>
          </button>
        )}
        <button
          className="d-flex align-items-center query-datasource-quick-action"
          style={{
            gap: '6px',
            padding: '6px 8px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            width: 'calc(50% - 4px)',
          }}
          onClick={handleNewFolder}
          data-cy="new-folder-add-query-card"
        >
          <SolidIcon name="folder" width="16" height="16" />
          <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>New folder</span>
        </button>
      </div>

      {/* Section divider */}
      <div className="d-flex align-items-center mb-2" style={{ gap: '6px' }}>
        <hr style={{ flex: 1, margin: 0, borderColor: 'var(--border-weak)' }} />
        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-placeholder)', whiteSpace: 'nowrap' }}>
          {`Available data sources${!isEmpty(allUserDefinedSources) ? ` (${allUserDefinedSources.length})` : ''}`}
        </span>
        <hr style={{ flex: 1, margin: 0, borderColor: 'var(--border-weak)' }} />
      </div>

      {/* Search + Add */}
      <div className="d-flex mb-2" style={{ gap: '8px' }}>
        <div style={{ flex: 1 }}>
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
        <div className="d-flex flex-column">
          {Object.entries(groupedSources).map(([kind, { sources, representative }]) => {
            const isCollapsed = collapsedGroups.has(kind);
            return (
              <div key={kind} style={{ borderBottom: '1px solid var(--border-weak)' }}>
                <button
                  className="d-flex align-items-center justify-content-between w-100"
                  style={{
                    height: '40px',
                    padding: '6px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleGroup(kind)}
                  data-cy={`ds-group-${kind}`}
                >
                  <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                    <DataSourceIcon source={representative} height={16} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {kind.charAt(0).toUpperCase() + kind.slice(1)}
                    </span>
                  </div>
                  <SolidIcon name={isCollapsed ? 'TriangleDownCenter' : 'TriangleUpCenter'} width="16" height="16" />
                </button>
                {!isCollapsed && (
                  <div style={{ padding: '0 8px 8px' }}>
                    {sources.map((source) => (
                      <button
                        key={source.id}
                        className="d-flex align-items-center w-100 query-datasource-quick-action"
                        style={{
                          gap: '6px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleChangeDataSource(source)}
                        data-tooltip-id="tooltip-for-query-panel-ds-picker-btn"
                        data-tooltip-content={decodeEntities(source.name)}
                        data-cy={`${String(source.name).toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
                      >
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {decodeEntities(source.name)}
                        </span>
                        <Tooltip id="tooltip-for-query-panel-ds-picker-btn" className="tooltip" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

const EmptyDataSourceBanner = () => (
  <div className="bg-slate3 p-3 d-flex align-items-center lh-lg mt-2" style={{ borderRadius: '6px' }}>
    <div className="me-2">
      <Information fill="var(--slate9)" />
    </div>
    <div>No Data sources have been added yet.</div>
  </div>
);

export default DataSourcePicker;
