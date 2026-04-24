import React, { useState, useEffect, useRef, useMemo } from 'react';
import { groupBy, isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';
import DataSourceIcon from './DataSourceIcon';
import { getWorkspaceId, decodeEntities } from '@/_helpers/utils';
import { defaultSources, workflowDefaultSources } from '../constants';
import Search from '@/_ui/Icon/solidIcons/Search';
import { Tooltip } from 'react-tooltip';
import { Virtuoso } from 'react-virtuoso';
import { DataBaseSources, ApiSources, CloudStorageSources } from '@/modules/common/components/DataSourceComponents';
import { canCreateDataSource } from '@/_helpers';
import './../queryManager.theme.scss';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import useStore from '@/AppBuilder/_stores/store';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import { ToolTip } from '@/_components';

const ITEM_HEIGHTS = {
  'defaults-header': 40,
  'defaults-new-folder': 32,
  'defaults-item': 32,
  'group-header': 40,
  'group-item': 32,
  'sample-header': 40,
  'sample-item': 32,
  'group-end': 8,
};

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
    const dataSourceKindsList = [...DataBaseSources, ...ApiSources, ...CloudStorageSources];
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

  const flatItems = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // Defaults section
    const staticSources = dataSources?.filter((gds) => gds.type === DATA_SOURCE_TYPE.STATIC) || [];
    const defaultsList = workflowDataSources ? defaultDataSources || [] : staticSources;
    const filteredDefaults = searchTerm
      ? defaultsList.filter((ds) => {
          const displayName = workflowDataSources
            ? workflowDefaultSources[ds.name.replace(/default/g, '')]?.name || ds.name
            : defaultSources[ds.name.replace(/default/g, '')]?.name || ds.name;
          return displayName.toLowerCase().includes(term) || (ds.kind || '').toLowerCase().includes(term);
        })
      : defaultsList;
    const showNewFolder = allowNewFolder && !workflowDataSources && !!createFolder;
    const showDefaultsSection = showNewFolder || filteredDefaults.length > 0;

    // User-defined sources
    const availableDataSources = workflowDataSources ? workflowDataSources : userDefinedSources;
    const filteredUserDefined = availableDataSources
      .filter((ds) => ds.type !== DATA_SOURCE_TYPE.STATIC)
      .filter((ds) => {
        if (!searchTerm) return true;
        return ds.name.toLowerCase().includes(term) || (ds.kind || '').toLowerCase().includes(term);
      })
      .sort((a, b) => {
        if (a.type === 'sample' && b.type !== 'sample') return -1;
        if (b.type === 'sample' && a.type !== 'sample') return 1;
        return 0;
      });
    const groupedUserDefined = Object.entries(groupBy(filteredUserDefined, 'kind'));

    // Sample data sources (workflow mode, prop)
    const filteredSampleDS = sampleDataSources.filter((ds) => {
      if (!searchTerm) return true;
      return ds.name.toLowerCase().includes(term) || (ds.kind || '').toLowerCase().includes(term);
    });
    const groupedSampleDS = Object.entries(groupBy(filteredSampleDS, 'kind'));

    const items = [];

    if (showDefaultsSection) {
      items.push({ type: 'defaults-header', showNewFolder });
      if (!defaultsCollapsed) {
        if (showNewFolder) items.push({ type: 'defaults-new-folder' });
        filteredDefaults.forEach((source) => {
          const displayName = workflowDataSources
            ? workflowDefaultSources[source.name.replace(/default/g, '')]?.name || source.name
            : defaultSources[source.name.replace(/default/g, '')]?.name || source.name;
          items.push({ type: 'defaults-item', source, displayName });
        });
        items.push({ type: 'group-end', key: 'defaults-end' });
      }
    }

    groupedUserDefined.forEach(([kind, sources]) => {
      const kindName =
        dataSourcesKinds.find((dsk) => dsk.kind === kind)?.name || kind.charAt(0).toUpperCase() + kind.slice(1);
      const isCollapsed = collapsedKinds.has(kind);
      items.push({ type: 'group-header', kind, kindName, representative: sources[0], isCollapsed });
      if (!isCollapsed) {
        sources.forEach((source) => items.push({ type: 'group-item', source, kind }));
        items.push({ type: 'group-end', key: `${kind}-end` });
      }
    });

    groupedSampleDS.forEach(([kind, sources]) => {
      const kindName =
        dataSourcesKinds.find((dsk) => dsk.kind === kind)?.name || kind.charAt(0).toUpperCase() + kind.slice(1);
      const sampleKind = `sample-${kind}`;
      const isCollapsed = collapsedKinds.has(sampleKind);
      items.push({ type: 'sample-header', kind, sampleKind, kindName, representative: sources[0], isCollapsed });
      if (!isCollapsed) {
        sources.forEach((source) => items.push({ type: 'sample-item', source }));
        items.push({ type: 'group-end', key: `${sampleKind}-end` });
      }
    });

    return items;
  }, [
    searchTerm,
    userDefinedSources,
    sampleDataSources,
    dataSources,
    defaultDataSources,
    workflowDataSources,
    collapsedKinds,
    dataSourcesKinds,
    defaultsCollapsed,
    allowNewFolder,
    createFolder,
  ]);

  const listHeight = useMemo(
    () =>
      Math.min(
        flatItems.reduce((sum, item) => sum + (ITEM_HEIGHTS[item.type] || 32), 0),
        448
      ),
    [flatItems]
  );

  const renderItem = (item) => {
    switch (item.type) {
      case 'defaults-header':
        return (
          <button
            style={{
              ...accordionHeaderStyle,
              borderBottom: defaultsCollapsed ? '1px solid var(--border-weak, #e4e7eb)' : 'none',
            }}
            onClick={() => setDefaultsCollapsed((v) => !v)}
          >
            <span style={{ fontWeight: 500, fontSize: '12px', color: 'var(--text-default, #1b1f24)' }}>Defaults</span>
            <SolidIcon name={defaultsCollapsed ? 'TriangleUpCenter' : 'TriangleDownCenter'} width="16" height="16" />
          </button>
        );

      case 'defaults-new-folder':
        return (
          <div style={{ padding: '0 8px' }}>
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
                  style={{ flexShrink: 0, color: queryFoldersLicensed ? 'var(--icon-default, #6a727c)' : '#9E9EA8' }}
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
          </div>
        );

      case 'defaults-item':
        return (
          <div style={{ padding: '0 8px' }}>
            <button
              key={item.source.id || item.source.name}
              style={itemStyle}
              className="ds-select-item"
              onClick={() => handleSourceClick(item.source)}
              data-cy={`ds-${(item.source.name || '').toLowerCase()}`}
            >
              <DataSourceIcon source={item.source} height={16} />
              <span style={itemTextStyle}>{item.displayName}</span>
            </button>
          </div>
        );

      case 'group-header':
        return (
          <button
            style={{
              ...accordionHeaderStyle,
              borderBottom: item.isCollapsed ? '1px solid var(--border-weak, #e4e7eb)' : 'none',
            }}
            onClick={() => toggleKind(item.kind)}
            data-cy={`ds-group-${item.kind}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DataSourceIcon source={item.representative} height={16} />
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '12px',
                  color: 'var(--text-default, #1b1f24)',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.kindName}
              </span>
            </div>
            <SolidIcon name={item.isCollapsed ? 'TriangleUpCenter' : 'TriangleDownCenter'} width="16" height="16" />
          </button>
        );

      case 'group-item':
        return (
          <div style={{ padding: '0 8px' }}>
            <button
              style={itemStyle}
              className="ds-select-item"
              onClick={() => handleSourceClick(item.source)}
              data-tooltip-id="tooltip-for-add-query-dd-option"
              data-tooltip-content={decodeEntities(item.source.name)}
              data-cy={`ds-${String(item.source.name).toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span style={itemTextStyle}>{decodeEntities(item.source.name)}</span>
            </button>
          </div>
        );

      case 'sample-header':
        return (
          <button
            style={{
              ...accordionHeaderStyle,
              borderBottom: item.isCollapsed ? '1px solid var(--border-weak, #e4e7eb)' : 'none',
            }}
            onClick={() => toggleKind(item.sampleKind)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DataSourceIcon source={item.representative} height={16} />
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '12px',
                  color: 'var(--text-default, #1b1f24)',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.kindName}
              </span>
            </div>
            <SolidIcon name={item.isCollapsed ? 'TriangleUpCenter' : 'TriangleDownCenter'} width="16" height="16" />
          </button>
        );

      case 'sample-item':
        return (
          <div style={{ padding: '0 8px' }}>
            <button
              style={itemStyle}
              className="ds-select-item"
              onClick={() => handleSourceClick(item.source)}
              data-cy={`ds-${String(item.source.name).toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span style={itemTextStyle}>{decodeEntities(item.source.name)}</span>
            </button>
          </div>
        );

      case 'group-end':
        return <div style={{ height: '8px', borderBottom: '1px solid var(--border-weak, #e4e7eb)' }} />;

      default:
        return null;
    }
  };

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

      {/* Virtualized list */}
      <Tooltip id="tooltip-for-add-query-dd-option" className="tooltip query-manager-ds-select-tooltip" />
      <Virtuoso
        className="tj-scrollbar"
        style={{ height: listHeight }}
        data={flatItems}
        itemKey={(_, item) =>
          item.type === 'group-item' || item.type === 'sample-item'
            ? item.source.id
            : item.type === 'group-end'
            ? item.key
            : `${item.type}-${item.kind ?? 'defaults'}`
        }
        itemContent={(_, item) => renderItem(item)}
      />

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
