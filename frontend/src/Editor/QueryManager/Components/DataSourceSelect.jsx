import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { groupBy } from 'lodash';
import { useNavigate } from 'react-router-dom';
import DataSourceIcon from './DataSourceIcon';
import { authenticationService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useDataSources, useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { staticDataSources } from '../constants';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';
import Search from '@/_ui/Icon/solidIcons/Search';

function DataSourceSelect({ darkMode, isDisabled, selectRef, closePopup }) {
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const [allSources, setAllSources] = useState([...dataSources, ...staticDataSources]);
  const [globalDataSourcesOpts, setGlobalDataSourcesOpts] = useState([]);
  const { createDataQuery } = useDataQueriesActions();
  const { setPreviewData } = useQueryPanelActions();
  const handleChangeDataSource = (source) => {
    createDataQuery(source);
    setPreviewData(null);
    closePopup();
  };

  useEffect(() => {
    setAllSources([...dataSources, ...staticDataSources]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources]);

  useEffect(() => {
    setGlobalDataSourcesOpts(
      Object.entries(groupBy(globalDataSources, 'kind')).map(([kind, sources], index) => ({
        label: (
          <div>
            {index === 0 && (
              <div className="color-slate9 mb-2 pb-1" style={{ fontWeight: 500, marginTop: '-8px' }}>
                Global datasources
              </div>
            )}
            <DataSourceIcon source={sources?.[0]} height={16} /> <span className="ms-1 small">{kind}</span>
          </div>
        ),
        options: sources.map((source) => ({
          label: <div className="py-2 px-2 rounded option-nested-datasource-selector small">{source.name}</div>,
          value: source.id,
          isNested: true,
          source,
        })),
      }))
    );
  }, [globalDataSources]);

  const DataSourceOptions = [
    {
      label: (
        <span className="color-slate9" style={{ fontWeight: 500 }}>
          Defaults
        </span>
      ),
      isDisabled: true,
      options: [
        ...allSources.map((source) => ({
          label: (
            <div>
              <DataSourceIcon source={source} height={16} /> <span className="ms-1 small">{source.name}</span>
            </div>
          ),
          value: source.id,
          source,
        })),
      ],
    },
    // {
    //   label: (
    //     <span className="color-slate9" style={{ fontWeight: 500 }}>
    //       Global datasources
    //     </span>
    //   ),
    //   isDisabled: true,
    // },
    ...globalDataSourcesOpts,
  ];

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closePopup();
    }
  };

  return (
    <div>
      <Select
        onChange={({ source } = {}) => handleChangeDataSource(source)}
        classNames={{
          menu: () => 'tj-scrollbar',
        }}
        ref={selectRef}
        controlShouldRenderValue={false}
        menuPlacement="auto"
        components={{
          MenuList: MenuList,
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
          input: (style) => ({ ...style, ...(darkMode ? { color: '#ffffff' } : {}) }),
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
            backgroundColor: isDisabled ? 'transparent' : isFocused ? 'var(--slate5)' : style.backgroundColor,
            ...(isNested
              ? { padding: '0 8px', marginLeft: '40px', borderLeft: '1px solid var(--slate5)', width: 'auto' }
              : {}),
            ':hover': {
              backgroundColor: isNested || isDisabled ? 'transparent' : 'var(--slate4)',
              '.option-nested-datasource-selector': { backgroundColor: 'var(--slate4)' },
            },
          }),
          container: (styles) => ({
            ...styles,
            borderRadius: '6px',
            border: '1px solid var(--slate-03, #F1F3F5)',
            background: 'var(--slate-01, #FBFCFD)',
            boxShadow: '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.10)',
          }),
          valueContainer: (styles) => ({
            ...styles,
            paddingLeft: 0,
          }),
        }}
        placeholder="Search"
        options={DataSourceOptions}
        isDisabled={isDisabled}
        menuIsOpen
        // menuPortalTarget={document.querySelector('.main-wrapper')}
        maxMenuHeight={400}
        minMenuHeight={300}
        onKeyDown={handleKeyDown}
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

const MenuList = ({ children, getStyles, innerRef, ...props }) => {
  const navigate = useNavigate();
  console.log('props', props, getStyles('menuList', props));
  const menuListStyles = getStyles('menuList', props);

  const { admin } = authenticationService.currentSessionValue;
  const workspaceId = getWorkspaceId();

  if (admin) {
    //offseting for height of button since react-select calculates only the size of options list
    menuListStyles.height = menuListStyles.maxHeight - 48;
  }

  const handleAddClick = () => navigate(`/${workspaceId}/global-datasources`);

  return (
    <>
      <div ref={innerRef} style={menuListStyles}>
        {children}
      </div>
      {admin && (
        <div className="p-2 mt-2 border-slate3-top">
          <ButtonSolid variant="secondary" size="md" className="w-100" onClick={handleAddClick}>
            + Add new datasource
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
