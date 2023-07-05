import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { groupBy } from 'lodash';
import { useNavigate } from 'react-router-dom';
import DataSourceIcon from './DataSourceIcon';
import { authenticationService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

function DataSourceLister({
  dataSources,
  staticDataSources,
  globalDataSources,
  changeDataSource,
  handleBackButton,
  darkMode,
  isDisabled,
}) {
  const [allSources, setAllSources] = useState([...dataSources, ...staticDataSources]);
  const [globalDataSourcesOpts, setGlobalDataSourcesOpts] = useState([]);
  const handleChangeDataSource = (source) => {
    changeDataSource(source);
    handleBackButton();
  };

  useEffect(() => {
    setAllSources([...dataSources, ...staticDataSources]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources]);

  useEffect(() => {
    setGlobalDataSourcesOpts(
      Object.entries(groupBy(globalDataSources, 'kind')).map(([kind, sources]) => ({
        label: (
          <div>
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
    },
    ...allSources.map((source) => ({
      label: (
        <div>
          <DataSourceIcon source={source} height={16} /> <span className="ms-1 small">{source.name}</span>
        </div>
      ),
      value: source.id,
      source,
    })),
    {
      label: (
        <span className="color-slate9" style={{ fontWeight: 500 }}>
          Global datasources
        </span>
      ),
      isDisabled: true,
    },
    ...globalDataSourcesOpts,
  ];

  return (
    <div className="query-datasource-card-container">
      <Select
        onChange={({ source } = {}) => handleChangeDataSource(source)}
        classNames={{
          menu: () => 'tj-scrollbar',
        }}
        menuPlacement="auto"
        components={{ MenuList: MenuList }}
        styles={{
          control: (style) => ({
            ...style,
            width: '400px',
            background: 'var(--base)',
            color: 'var(--slate9)',
            border: '1px solid var(--slate7)',
          }),
          menuList: (style) => ({ ...style, ...(darkMode ? { background: '#22272E' } : {}) }),
          menu: (style) => ({
            ...style,
            backgroundColor: 'var(--base)',
            color: 'var(--slate12)',
            boxShadow: 'none',
            border: '1px solid var(--slate3)',
            marginTop: 0,
            marginBottom: 0,
          }),
          input: (style) => ({ ...style, ...(darkMode ? { color: '#ffffff' } : {}) }),
          groupHeading: (style) => ({
            ...style,
            fontSize: '100%',
            textTransform: '',
            color: 'inherit',
            fontWeight: '400',
            ...(darkMode ? { background: '#22272E' } : {}),
          }),
          option: (style, { data: { isNested, ...data }, isFocused, isDisabled }) => ({
            ...style,
            cursor: 'pointer',
            backgroundColor:
              isNested || isDisabled ? 'transparent' : isFocused ? 'var(--slate5)' : style.backgroundColor,
            ...(isNested
              ? { padding: '0 8px', marginLeft: '40px', borderLeft: '1px solid var(--slate5)', width: 'auto' }
              : {}),
            ':hover': {
              backgroundColor: isNested || isDisabled ? 'transparent' : 'var(--slate4)',
              '.option-nested-datasource-selector': { backgroundColor: 'var(--slate4)' },
            },
          }),
        }}
        placeholder="Where do you want to connect to"
        options={DataSourceOptions}
        isDisabled={isDisabled}
        menuIsOpen
        menuPortalTarget={document.querySelector('.main-wrapper')}
        maxMenuHeight={375}
      />
    </div>
  );
}

const MenuList = ({ children, cx, getStyles, innerRef, ...props }) => {
  const navigate = useNavigate();
  console.log('props', props, getStyles('menuList', props));
  const menuListStyles = getStyles('menuList', props);

  const { admin } = authenticationService.currentSessionValue;
  const workspaceId = getWorkspaceId();

  if (admin) {
    //offseting for height of button since react-select calculates only the size of options list
    menuListStyles.maxHeight = menuListStyles.maxHeight - 48;
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

export default DataSourceLister;
