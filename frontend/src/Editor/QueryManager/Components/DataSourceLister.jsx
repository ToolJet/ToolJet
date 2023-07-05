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
            <DataSourceIcon source={sources?.[0]} /> {kind}
          </div>
        ),
        options: sources.map((source) => ({
          label: <div>{source.name}</div>,
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
          <DataSourceIcon source={source} /> {source.name}
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
        menuPlacement="auto"
        components={{ MenuList: MenuList }}
        styles={{
          control: (style) => ({ ...style, width: '400px', ...(darkMode ? { background: '#22272E' } : {}) }),
          menuList: (style) => ({ ...style, ...(darkMode ? { background: '#22272E' } : {}) }),
          menu: (style) => ({ ...style, ...(darkMode ? { backgroundColor: '#1f2936', color: '#f4f6fa' } : {}) }),
          input: (style) => ({ ...style, ...(darkMode ? { color: '#ffffff' } : {}) }),
          groupHeading: (style) => ({
            ...style,
            fontSize: '100%',
            textTransform: '',
            color: 'inherit',
            fontWeight: '400',
            ...(darkMode ? { background: '#22272E' } : {}),
          }),
          option: (style, { data: { isNested } }) => ({
            ...style,
            cursor: 'pointer',
            ...(darkMode ? { background: '#22272E' } : {}),
            ...(isNested
              ? { paddingLeft: '20px', marginLeft: '40px', borderLeft: '1px solid #ccc', width: 'auto' }
              : {}),
          }),
        }}
        placeholder="Where do you want to connect to"
        options={DataSourceOptions}
        isDisabled={isDisabled}
        // menuIsOpen
        menuPortalTarget={document.body}
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
        <div className="p-2 mt-2 border-top">
          <ButtonSolid variant="secondary" size="md" className="w-100" onClick={handleAddClick}>
            + Add new datasource
          </ButtonSolid>
        </div>
      )}
    </>
  );
};

export default DataSourceLister;
