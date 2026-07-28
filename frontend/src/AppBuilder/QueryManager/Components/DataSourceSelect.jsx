import React, { useState, useEffect, useRef } from 'react';
import { groupBy, isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';
import DataSourceIcon from './DataSourceIcon';
import { getWorkspaceId, decodeEntities } from '@/_helpers/utils';
import { defaultSources, workflowDefaultSources } from '../constants';
import Search from '@/_ui/Icon/solidIcons/Search';
import { Tooltip } from 'react-tooltip';
import {
  DataBaseSources,
  ApiSources,
  CloudStorageSources,
  AiSources,
} from '@/modules/common/components/DataSourceComponents';
import { canCreateDataSource } from '@/_helpers';
import './../queryManager.theme.scss';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import useStore from '@/AppBuilder/_stores/store';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import { ToolTip } from '@/_components';

function DataSourceSelect({
  isDisabled,
  selectRef,
  closePopup,
  workflowDataSources,
  onNewNode,
  staticDataSources: defaultDataSources,
  onQueryCreate,
  skipClosePopup = false,
  sampleDataSources = [],
  allowNewFolder = false,
  onQueryStart,
  queryFoldersLicensed = true,
  folderId,
}) {
  const dataSources = useStore((state) => state.globalDataSources);
  const globalDataSources = useStore((state) => state.globalDataSources)?.filter(
    (gds) => gds.type === DATA_SOURCE_TYPE.GLOBAL
  );
  const defaultStaticDataSources = useStore((state) => state.globalDataSources)?.filter(
    (gds) => gds.type === DATA_SOURCE_TYPE.STATIC
  );
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const createFolder = useStore((state) => state.queryFolders?.createFolder);
  const currentVersionId = useStore((state) => state.currentVersionId);

  const [userDefinedSources, setUserDefinedSources] = useState(
    [...dataSources, ...globalDataSources, !!sampleDataSource && sampleDataSource].filter(Boolean)
  );
  const [dataSourcesKinds, setDataSourcesKinds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [defaultsCollapsed, setDefaultsCollapsed] = useState(false);
  const [collapsedKinds, setCollapsedKinds] = useState(new Set());

  const inputRef = useRef(null);
  const navigate = useNavigate();
  const createDataQuery = useStore((state) => state.dataQuery.createDataQuery);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);

  // Expose focus() via selectRef so callers can focus the search input
  useEffect(() => {
    if (selectRef) {
      selectRef.current = { focus: () => inputRef.current?.focus() };
    }
  }, [selectRef]);

  const handleChangeDataSource = (source) => {
    const extraProps = { callbackFunction: onQueryCreate };
    if (folderId) extraProps.folderId = folderId;
    createDataQuery(source, false, {}, 'canvas', null, extraProps);
    onQueryStart?.(useStore.getState().dataQuery.creatingQueryInProcessId);
    setPreviewData(null);
    if (!skipClosePopup) closePopup();
  };

  const handleSourceClick = (source) => {
    if (source?.id !== 'if' && source?.id !== 'agent' && workflowDataSources) {
      onNewNode(source.kind, source.id, source.plugin_id, source);
    } else if (source && (source?.id === 'if' || source?.id === 'response' || source?.id === 'agent')) {
      onNewNode(source.id);
    } else {
      handleChangeDataSource(source);
      return; // handleChangeDataSource already calls closePopup
    }
    if (!skipClosePopup) closePopup();
  };

  useEffect(() => {
    const shouldAddSampleDataSource = !!sampleDataSource;
    const allDataSources = [...dataSources, ...globalDataSources, shouldAddSampleDataSource && sampleDataSource].filter(
      Boolean
    );
    setUserDefinedSources(allDataSources);
    const dataSourceKindsList = [...DataBaseSources, ...ApiSources, ...CloudStorageSources, ...AiSources];
    allDataSources.forEach(({ plugin }) => {
      if (isEmpty(plugin)) return;
      dataSourceKindsList.push({ name: plugin.name, kind: plugin.pluginId });
    });
    setDataSourcesKinds(dataSourceKindsList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources]);

  function cleanWord(word) {
    return word.replace(/default/g, '');
  }

  const handleAddClick = () => navigate(`/${getWorkspaceId()}/data-sources`);

  const handleNewFolder = () => {
    createFolder?.('New folder', currentVersionId);
    if (!skipClosePopup) closePopup();
  };

  const toggleKind = (kind) => {
    setCollapsedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closePopup();
  };

  // Determine defaults list
  const defaultsList = workflowDataSources ? defaultDataSources || [] : defaultStaticDataSources || [];

  // Filter defaults by search
  const filteredDefaults = searchTerm
    ? defaultsList.filter((ds) => {
        const term = searchTerm.toLowerCase();
        const displayName = workflowDataSources
          ? workflowDefaultSources[cleanWord(ds.name)]?.name || ds.name
          : defaultSources[cleanWord(ds.name)]?.name || ds.name;
        return displayName.toLowerCase().includes(term) || (ds.kind || '').toLowerCase().includes(term);
      })
    : defaultsList;

  // Build user-defined grouped sources
  const availableDataSources = workflowDataSources ? workflowDataSources : userDefinedSources;
  const filteredUserDefined = availableDataSources
    .filter((ds) => ds.type !== DATA_SOURCE_TYPE.STATIC)
    .filter((ds) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return ds.name.toLowerCase().includes(term) || (ds.kind || '').toLowerCase().includes(term);
    })
    .sort((a, b) => {
      if (a.type === 'sample' && b.type !== 'sample') return -1;
      if (b.type === 'sample' && a.type !== 'sample') return 1;
      return 0;
    });

  const groupedUserDefined = Object.entries(groupBy(filteredUserDefined, 'kind'));

  // Sample data sources (workflow mode only — provided as prop)
  const filteredSampleDS = sampleDataSources.filter((ds) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return ds.name.toLowerCase().includes(term) || (ds.kind || '').toLowerCase().includes(term);
  });
  const groupedSampleDS = Object.entries(groupBy(filteredSampleDS, 'kind'));

  const showNewFolder = allowNewFolder && !workflowDataSources && !!createFolder;
  const showDefaultsSection = showNewFolder ? true : filteredDefaults.length > 0;

  return (
    <div
      style={{
        width: '268px',
        border: '1px solid var(--border-weak, #e4e7eb)',
        borderRadius: '10px',
        boxShadow: '0px 0px 1px 0px rgba(48,50,51,0.05), 0px 4px 8px 0px rgba(48,50,51,0.1)',
        background: 'var(--base, #fff)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search */}
      <div style={{ padding: '4px 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '7px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px' }}>
            <Search width="13.33" viewBox="0 0 20 20" fill="var(--icon-default)" />
          </div>
          <input
            ref={inputRef}
            className="ds-select-search-input"
            type="text"
            placeholder="Search for data source"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isDisabled}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '12px',
              color: 'var(--text-default, #1b1f24)',
              lineHeight: '18px',
            }}
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-weak, #e4e7eb)', flexShrink: 0 }} />

      {/* Scrollable list */}
      <div style={{ maxHeight: '448px', overflowY: 'auto', flex: 1 }} className="tj-scrollbar">
        {/* Defaults accordion */}
        {showDefaultsSection && (
          <div style={{ borderBottom: '1px solid var(--border-weak, #e4e7eb)' }}>
            <button style={accordionHeaderStyle} onClick={() => setDefaultsCollapsed((v) => !v)}>
              <span style={{ fontWeight: 500, fontSize: '12px', color: 'var(--text-default, #1b1f24)' }}>Defaults</span>
              <SolidIcon name={defaultsCollapsed ? 'TriangleUpCenter' : 'TriangleDownCenter'} width="16" height="16" />
            </button>
            {!defaultsCollapsed && (
              <div style={{ padding: '0 8px 8px' }}>
                {showNewFolder && (
                  <ToolTip
                    message="Keep queries organized in folders. Available on paid plans."
                    placement="right"
                    show={!queryFoldersLicensed}
                  >
                    <button
                      style={{ ...itemStyle, cursor: queryFoldersLicensed ? 'pointer' : 'default' }}
                      className="ds-select-item"
                      onClick={queryFoldersLicensed ? handleNewFolder : undefined}
                      data-cy="new-folder-ds-select"
                    >
                      <DynamicIcon
                        name="folder-plus"
                        size={16}
                        style={{
                          flexShrink: 0,
                          color: queryFoldersLicensed ? 'var(--icon-default, #6a727c)' : '#9E9EA8',
                        }}
                      />
                      <span
                        style={{
                          ...itemTextStyle,
                          flex: 1,
                          color: queryFoldersLicensed ? 'var(--text-default, #1b1f24)' : '#9E9EA8',
                        }}
                      >
                        New folder
                      </span>
                      {!queryFoldersLicensed && <SolidIcon width={16} name="enterprisecrown" className="mx-1" />}
                    </button>
                  </ToolTip>
                )}
                {filteredDefaults.map((source) => {
                  const displayName = workflowDataSources
                    ? workflowDefaultSources[cleanWord(source.name)]?.name || source.name
                    : defaultSources[cleanWord(source.name)]?.name || source.name;
                  return (
                    <button
                      key={source.id || source.name}
                      style={itemStyle}
                      className="ds-select-item"
                      onClick={() => handleSourceClick(source)}
                      data-cy={`ds-${(source.name || '').toLowerCase()}`}
                    >
                      <DataSourceIcon source={source} height={16} />
                      <span style={itemTextStyle}>{displayName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* User-defined sources grouped by kind */}
        {groupedUserDefined.map(([kind, sources]) => {
          const representative = sources[0];
          const kindName =
            dataSourcesKinds.find((dsk) => dsk.kind === kind)?.name || kind.charAt(0).toUpperCase() + kind.slice(1);
          const isCollapsed = collapsedKinds.has(kind);
          return (
            <div key={kind} style={{ borderBottom: '1px solid var(--border-weak, #e4e7eb)' }}>
              <button style={accordionHeaderStyle} onClick={() => toggleKind(kind)} data-cy={`ds-group-${kind}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DataSourceIcon source={representative} height={16} />
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: '12px',
                      color: 'var(--text-default, #1b1f24)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {kindName}
                  </span>
                </div>
                <SolidIcon name={isCollapsed ? 'TriangleUpCenter' : 'TriangleDownCenter'} width="16" height="16" />
              </button>
              {!isCollapsed && (
                <div style={{ padding: '0 8px 8px' }}>
                  {sources.map((source) => (
                    <button
                      key={source.id}
                      style={itemStyle}
                      className="ds-select-item"
                      onClick={() => handleSourceClick(source)}
                      data-tooltip-id="tooltip-for-add-query-dd-option"
                      data-tooltip-content={decodeEntities(source.name)}
                      data-cy={`ds-${String(source.name).toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span style={itemTextStyle}>{decodeEntities(source.name)}</span>
                      <Tooltip
                        id="tooltip-for-add-query-dd-option"
                        className="tooltip query-manager-ds-select-tooltip"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Sample data sources (workflow mode, from prop) */}
        {groupedSampleDS.map(([kind, sources]) => {
          const representative = sources[0];
          const kindName =
            dataSourcesKinds.find((dsk) => dsk.kind === kind)?.name || kind.charAt(0).toUpperCase() + kind.slice(1);
          const isCollapsed = collapsedKinds.has(`sample-${kind}`);
          return (
            <div key={`sample-${kind}`} style={{ borderBottom: '1px solid var(--border-weak, #e4e7eb)' }}>
              <button style={accordionHeaderStyle} onClick={() => toggleKind(`sample-${kind}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DataSourceIcon source={representative} height={16} />
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: '12px',
                      color: 'var(--text-default, #1b1f24)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {kindName}
                  </span>
                </div>
                <SolidIcon name={isCollapsed ? 'TriangleUpCenter' : 'TriangleDownCenter'} width="16" height="16" />
              </button>
              {!isCollapsed && (
                <div style={{ padding: '0 8px 8px' }}>
                  {sources.map((source) => (
                    <button
                      key={source.id}
                      style={itemStyle}
                      className="ds-select-item"
                      onClick={() => handleSourceClick(source)}
                      data-cy={`ds-${String(source.name).toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span style={itemTextStyle}>{decodeEntities(source.name)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new data source — last accordion's borderBottom already separates this */}
      {canCreateDataSource() && (
        <div style={{ padding: '8px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '7px 12px',
              border: 'none',
              borderRadius: '6px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-default, #1b1f24)',
              fontFamily: 'inherit',
            }}
            className="ds-add-source-btn"
            onClick={handleAddClick}
            data-cy="landing-page-add-new-ds-button"
          >
            <SolidIcon name="plus" width="16" height="16" />
            Add new data source
          </button>
        </div>
      )}
    </div>
  );
}

const accordionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  height: '40px',
  padding: '6px 16px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  padding: '6px 8px',
  border: 'none',
  background: 'transparent',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
};

const itemTextStyle = {
  fontSize: '12px',
  color: 'var(--text-default, #1b1f24)',
  lineHeight: '18px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export default DataSourceSelect;
