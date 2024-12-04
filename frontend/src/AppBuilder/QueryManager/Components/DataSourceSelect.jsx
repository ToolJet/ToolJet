import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { groupBy, isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';
import DataSourceIcon from './DataSourceIcon';
import { getWorkspaceId, decodeEntities } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useDataSources, useGlobalDataSources, useSampleDataSource } from '@/_stores/dataSourcesStore';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { staticDataSources as staticDatasources } from '../constants';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';
import Search from '@/_ui/Icon/solidIcons/Search';
import { Tooltip } from 'react-tooltip';
import { DataBaseSources, ApiSources, CloudStorageSources } from '@/AppBuilder/DataSourceManager/SourceComponents';
import { canCreateDataSource } from '@/_helpers';
import './../queryManager.theme.scss';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import useStore from '@/AppBuilder/_stores/store';
function DataSourceSelect({ isDisabled, selectRef, closePopup, workflowDataSources, onNewNode, defaultDataSources }) {
  const dataSources = useStore((state) => state.dataSources);
  const globalDataSources = useStore((state) => state.globalDataSources);
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const [userDefinedSources, setUserDefinedSources] = useState(
    [...dataSources, ...globalDataSources, !!sampleDataSource && sampleDataSource].filter(Boolean)
  );
  const [dataSourcesKinds, setDataSourcesKinds] = useState([]);
  const [userDefinedSourcesOpts, setUserDefinedSourcesOpts] = useState([]);
  const createDataQuery = useStore((state) => state.dataQuery.createDataQuery);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);
  const handleChangeDataSource = (source) => {
    createDataQuery(source);
    setPreviewData(null);
    closePopup();
  };

  const workflowsEnabled = window.public_config?.ENABLE_WORKFLOWS_FEATURE == 'true';
  const staticDataSources = workflowsEnabled
    ? staticDatasources
    : staticDatasources.filter((ds) => ds?.kind !== 'workflows');

  useEffect(() => {
    const shouldAddSampleDataSource = !!sampleDataSource;
    const allDataSources = [...dataSources, ...globalDataSources, shouldAddSampleDataSource && sampleDataSource].filter(
      Boolean
    );
    setUserDefinedSources(allDataSources);
    const dataSourceKindsList = [...DataBaseSources, ...ApiSources, ...CloudStorageSources];
    allDataSources.forEach(({ plugin }) => {
      //plugin names are fetched from list data source api call only
      if (isEmpty(plugin)) {
        return;
      }
      dataSourceKindsList.push({ name: plugin.name, kind: plugin.pluginId });
    });
    setDataSourcesKinds(dataSourceKindsList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources]);

  const availableDataSources = workflowDataSources ? workflowDataSources : userDefinedSources;

  useEffect(() => {
    const sortedUserDefinedSources = availableDataSources.sort((sourceA, sourceB) => {
      // Custom sorting function
      const typeA = sourceA?.type;
      const typeB = sourceB?.type;
      if (typeA === 'sample' && typeB !== 'sample') {
        return -1; // typeA is 'sample', so it comes before typeB
      } else if (typeB === 'sample' && typeA !== 'sample') {
        return 1; // typeB is 'sample', so it comes after typeA
      } else {
        // Otherwise, maintain the original order
        return 0;
      }
    });
    setUserDefinedSourcesOpts(
      Object.entries(groupBy(sortedUserDefinedSources, 'type')).flatMap(([type, sourcesWithType], index) =>
        Object.entries(groupBy(sourcesWithType, 'kind')).map(([kind, sources], innerIndex) => ({
          label: (
            <div key={`${kind}-${type}`}>
              {((innerIndex === 0 && type !== DATA_SOURCE_TYPE.SAMPLE) || type === DATA_SOURCE_TYPE.SAMPLE) && (
                <div className="color-slate9 mb-2 pb-1" style={{ fontWeight: 500, marginTop: '-8px' }}>
                  {type !== DATA_SOURCE_TYPE.SAMPLE ? 'Data Sources' : 'Sample data sources'}
                </div>
              )}
              <DataSourceIcon source={sources?.[0]} height={16} />
              <span className="ms-1 small" style={{ fontSize: '13px' }}>
                {dataSourcesKinds.find((dsk) => dsk.kind === kind)?.name || kind}
              </span>
            </div>
          ),
          options: sources.map((source) => ({
            label: (
              <div
                key={source.id}
                className="py-2 px-2 rounded option-nested-datasource-selector small text-truncate"
                style={{ fontSize: '13px' }}
                data-tooltip-id="tooltip-for-add-query-dd-option"
                data-tooltip-content={decodeEntities(source.name)}
                data-cy={`ds-${source.name.toLowerCase()}`}
              >
                {decodeEntities(source.name)}
                <Tooltip id="tooltip-for-add-query-dd-option" className="tooltip query-manager-ds-select-tooltip" />
              </div>
            ),
            value: source.id,
            isNested: true,
            source,
          })),
        }))
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDefinedSources]);

  const DataSourceOptions = [
    {
      label: (
        <span data-cy="ds-section-header-default" className="color-slate9" style={{ fontWeight: 500 }}>
          Defaults
        </span>
      ),
      isDisabled: true,
      options: [
        ...staticDataSources.map((source) => ({
          label: (
            <div>
              <DataSourceIcon source={source} height={16} />{' '}
              <span data-cy={`ds-${source.name.toLowerCase()}`} className="ms-1 small" style={{ fontSize: '13px' }}>
                {source.name}
              </span>
            </div>
          ),
          value: source.id,
          source,
        })),
      ],
    },
    ...userDefinedSourcesOpts,
  ];

  const dataSourcesAvailable = [
    {
      label: (
        <div>
          <span className="color-slate9" style={{ fontWeight: 500 }}>
            Defaults
          </span>
        </div>
      ),
      isDisabled: true,
      options: defaultDataSources?.map((source) => ({
        label: (
          <div>
            <DataSourceIcon source={source} height={16} /> <span className="ms-1 small">{source.kind}</span>
          </div>
        ),
        value: source.name,
        source,
      })),
    },
    ...userDefinedSourcesOpts,
  ];

  const dataSourceList = workflowDataSources && workflowDataSources ? dataSourcesAvailable : DataSourceOptions;

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closePopup();
    }
  };

  return (
    <div>
      <Select
        onChange={({ source } = {}) =>
          source?.id !== 'if' && workflowDataSources
            ? onNewNode(source.kind, source.id, source.plugin_id, source)
            : source && source?.id === 'if'
            ? onNewNode('if')
            : handleChangeDataSource(source)
        }
        classNames={{
          menu: () => 'tj-scrollbar',
        }}
        ref={selectRef}
        controlShouldRenderValue={false}
        menuPlacement="auto"
        components={{
          MenuList: MenuList,
          GroupHeading: HideGroupHeading,
          IndicatorSeparator: () => null,
          DropdownIndicator,
        }}
        styles={{
          control: (style) => ({
            ...style,
            width: '240px',
            background: 'var(--base)',
            color: 'var(--slate9)',
            borderWidth: '0',
            borderBottom: '1px solid var(--slate7)',
            marginBottom: '1px',
            boxShadow: 'none',
            borderRadius: '4px 4px 0 0',
            ':hover': {
              borderColor: 'var(--slate7)',
            },
            flexDirection: 'row-reverse',
          }),
          menu: (style) => ({
            ...style,
            position: 'static',
            backgroundColor: 'var(--base)',
            color: 'var(--slate12)',
            boxShadow: 'none',
            border: '0',
            marginTop: 0,
            marginBottom: 0,
            width: '240px',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
          }),
          input: (style) => ({
            ...style,
            color: 'var(--slate12)',
            'caret-color': 'var(--slate9)',
            ':placeholder': { color: 'var(--slate9)' },
          }),
          groupHeading: (style) => ({
            ...style,
            fontSize: '100%',
            textTransform: '',
            color: 'inherit',
            fontWeight: '400',
          }),
          option: (style, { data: { isNested }, isFocused, isDisabled }) => ({
            ...style,
            cursor: 'pointer',
            backgroundColor: isFocused && !isNested ? 'var(--slate4)' : 'transparent',
            ...(isNested
              ? { padding: '0 8px', marginLeft: '19px', borderLeft: '1px solid var(--slate5)', width: 'auto' }
              : {}),
            ...(!isNested && { borderRadius: '4px' }),
            ':hover': {
              backgroundColor: isNested ? 'transparent' : 'var(--slate4)',
              '.option-nested-datasource-selector': { backgroundColor: 'var(--slate4)' },
            },
            ...(isFocused &&
              isNested && {
                '.option-nested-datasource-selector': { backgroundColor: 'var(--slate4)' },
              }),
          }),
          container: (styles) => ({
            ...styles,
            borderRadius: '6px',
            border: '1px solid var(--slate3)',
            boxShadow: '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.10)',
          }),
          valueContainer: (styles) => ({
            ...styles,
            paddingLeft: 0,
          }),
        }}
        placeholder="Search"
        options={dataSourceList}
        isDisabled={isDisabled}
        menuIsOpen
        maxMenuHeight={400}
        minMenuHeight={300}
        onKeyDown={handleKeyDown}
        onInputChange={() => {
          const queryDsSelectMenu = document.getElementById('query-ds-select-menu');
          if (queryDsSelectMenu && !queryDsSelectMenu?.style?.height) {
            queryDsSelectMenu.style.height = queryDsSelectMenu.offsetHeight + 'px';
          }
        }}
        filterOption={(data, search) => {
          if (data?.data?.source) {
            //Disabled below eslint check since already checking in above line)
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { name, kind } = data?.data?.source;
            const searchTerm = search.toLowerCase();
            return name.toLowerCase().includes(searchTerm) || kind.toLowerCase().includes(searchTerm);
          }
          return true;
        }}
      />
    </div>
  );
}

const HideGroupHeading = (props) => {
  return (
    <div
      className="collapse-group-heading"
      onClick={() => {
        document.querySelector(`#${props.id}`).parentElement.parentElement.classList.toggle('collapsed-group');
      }}
    >
      <components.GroupHeading {...props} />
    </div>
  );
};

const MenuList = ({ children, getStyles, innerRef, ...props }) => {
  const navigate = useNavigate();
  const menuListStyles = getStyles('menuList', props);

  const workspaceId = getWorkspaceId();

  if (canCreateDataSource()) {
    //offseting for height of button since react-select calculates only the size of options list
    menuListStyles.maxHeight = 400 - 48;
  }

  menuListStyles.padding = '4px';

  const handleAddClick = () => navigate(`/${workspaceId}/data-sources`);

  return (
    <>
      <div ref={innerRef} style={menuListStyles} id="query-ds-select-menu">
        {children}
      </div>
      {canCreateDataSource() && (
        <div className="p-2 mt-2 border-slate3-top">
          <ButtonSolid variant="secondary" size="md" className="w-100" onClick={handleAddClick}>
            + Add new Data source
          </ButtonSolid>
        </div>
      )}
    </>
  );
};

const DropdownIndicator = (props) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <Search style={{ width: '16px' }} />
      </components.DropdownIndicator>
    )
  );
};

export default DataSourceSelect;
