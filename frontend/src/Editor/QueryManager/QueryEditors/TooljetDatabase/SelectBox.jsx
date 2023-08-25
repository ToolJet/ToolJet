import React, { useState, useEffect, isValidElement } from 'react';
import Select, { components } from 'react-select';
import { groupBy, isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';
import DataSourceIcon from '../../Components/DataSourceIcon';
import { authenticationService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useDataSources, useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { staticDataSources } from '../../constants';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';
import Search from '@/_ui/Icon/solidIcons/Search';
import { Tooltip } from 'react-tooltip';
import { DataBaseSources, ApiSources, CloudStorageSources } from '@/Editor/DataSourceManager/SourceComponents';
import { Form } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function DataSourceSelect({
  darkMode,
  isDisabled,
  selectRef,
  closePopup,
  options,
  isMulti,
  onSelect,
  onAdd,
  addBtnLabel,
  selected,
}) {
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const [userDefinedSources, setUserDefinedSources] = useState([...dataSources, ...globalDataSources]);
  const [dataSourcesKinds, setDataSourcesKinds] = useState([]);
  const [userDefinedSourcesOpts, setUserDefinedSourcesOpts] = useState([]);
  const { createDataQuery } = useDataQueriesActions();
  const { setPreviewData } = useQueryPanelActions();
  const hasIcons = options.some((option) => option.icon);
  const handleChangeDataSource = (source) => {
    onSelect && onSelect(source);
    closePopup && !isMulti && closePopup();
    // createDataQuery(source);
    // setPreviewData(null);
    // closePopup();
  };

  console.log(dataSourcesKinds);

  useEffect(() => {
    const allDataSources = [...dataSources, ...globalDataSources];
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

  useEffect(() => {
    setUserDefinedSourcesOpts(
      Object.entries(groupBy(userDefinedSources, 'kind')).map(([kind, sources], index) => ({
        label: (
          <div>
            {index === 0 && (
              <div className="color-slate9 mb-2 pb-1" style={{ fontWeight: 500, marginTop: '-8px' }}>
                Global datasources
              </div>
            )}
            <DataSourceIcon source={sources?.[0]} height={16} />
            <span className="ms-1 small">{dataSourcesKinds.find((dsk) => dsk.kind === kind)?.name || kind}</span>
          </div>
        ),
        options: sources.map((source) => ({
          label: (
            <div
              className="py-2 px-2 rounded option-nested-datasource-selector small text-truncate"
              data-tooltip-id="tooltip-for-add-query-dd-option"
              data-tooltip-content={source.name}
            >
              {source.name}
              <Tooltip id="tooltip-for-add-query-dd-option" className="tooltip query-manager-ds-select-tooltip" />
            </div>
          ),
          value: source.id,
          isNested: true,
          source,
        })),
      }))
    );
  }, [userDefinedSources]);

  return (
    <div>
      <Select
        onChange={(option) => handleChangeDataSource(option)}
        classNames={{
          menu: () => 'tj-scrollbar',
        }}
        ref={selectRef}
        controlShouldRenderValue={false}
        menuPlacement="auto"
        menuIsOpen
        hideSelectedOptions={false}
        components={{
          // ...(isMulti && {
          Option: ({ children, ...props }) => {
            return (
              <components.Option {...props}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    width: '100%',
                  }}
                  className="dd-select-option"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      // width: '20px',
                    }}
                  >
                    {isMulti && (
                      <Form.Check // prettier-ignore
                        type={'checkbox'}
                        id={props.value}
                        className="me-1"
                        checked={props.isSelected}
                        // label={`default ${type}`}
                      />
                    )}
                  </div>
                  {props?.data?.icon &&
                    (isValidElement(props.data.icon) ? (
                      props.data.icon
                    ) : (
                      <SolidIcon name={props.data.icon} style={{ height: 16, width: 16 }} />
                    ))}
                  {children}
                </div>
              </components.Option>
            );
          },
          // }),
          MenuList: (props) => <MenuList {...props} onAdd={onAdd} addBtnLabel={addBtnLabel} />,
          IndicatorSeparator: () => null,
          DropdownIndicator,
          GroupHeading: CustomGroupHeading,
        }}
        styles={{
          control: (style) => ({
            ...style,
            // width: '240px',
            background: 'var(--base)',
            color: 'var(--slate9)',
            borderWidth: '0',
            // borderBottom: '1px solid var(--slate7)',
            // marginBottom: '1px',
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
          // indicatorSeparator: () => ({ display: 'none' }),
          input: (style) => ({
            ...style,
            color: 'var(--slate12)',
            'caret-color': 'var(--slate9)',
            border: 0,
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
            color: 'inherit',
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
          group: (style) => ({
            ...style,
            '.dd-select-option': { marginLeft: '19px' },
          }),
          container: (styles) => ({
            ...styles,
            borderRadius: '6px',
            // border: '1px solid var(--slate3)',
            // boxShadow: '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.10)',
          }),
          valueContainer: (styles) => ({
            ...styles,
            paddingLeft: 0,
          }),
        }}
        placeholder="Search"
        options={options}
        isDisabled={isDisabled}
        isClearable={false}
        // menuIsOpen
        isMulti={isMulti}
        maxMenuHeight={400}
        minMenuHeight={300}
        value={selected}
        // onKeyDown={handleKeyDown}
        onInputChange={() => {
          const queryDsSelectMenu = document.getElementById('query-ds-select-menu');
          if (queryDsSelectMenu && !queryDsSelectMenu?.style?.height) {
            queryDsSelectMenu.style.height = queryDsSelectMenu.offsetHeight + 'px';
          }
        }}
        // filterOption={(data, search) => {
        //   if (data?.data?.source) {
        //     //Disabled below eslint check since already checking in above line)
        //     // eslint-disable-next-line no-unsafe-optional-chaining
        //     const { name, kind } = data?.data?.source;
        //     const searchTerm = search.toLowerCase();
        //     return name.toLowerCase().includes(searchTerm) || kind.toLowerCase().includes(searchTerm);
        //   }
        //   return true;
        // }}
      />
    </div>
  );
}

const MenuList = ({ children, getStyles, innerRef, onAdd, addBtnLabel, ...props }) => {
  const navigate = useNavigate();
  const menuListStyles = getStyles('menuList', props);

  const { admin } = authenticationService.currentSessionValue;
  const workspaceId = getWorkspaceId();

  if (admin) {
    //offseting for height of button since react-select calculates only the size of options list
    menuListStyles.maxHeight = 400 - 48;
  }

  menuListStyles.padding = '4px';

  const handleAddClick = () => navigate(`/${workspaceId}/global-datasources`);

  return (
    <>
      <div ref={innerRef} style={menuListStyles} id="query-ds-select-menu">
        {children}
      </div>
      {onAdd && (
        <div className="p-2 mt-2 border-slate3-top">
          <ButtonSolid variant="secondary" size="md" className="w-100" onClick={onAdd}>
            + {addBtnLabel || 'Add new'}
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

const CustomGroupHeading = (props) => {
  const node = document.querySelector(`#${props.id}`)?.parentElement?.nextElementSibling;
  const classes = node?.classList;
  const hidden = classes?.contains('d-none');
  const handleHeaderClick = (id) => {
    if (hidden) {
      node.classList.remove('d-none');
    } else {
      node.classList.add('d-none');
    }
  };

  return (
    <div
      className="group-heading-wrapper d-flex justify-content-between"
      onClick={() => handleHeaderClick(props.id)}
      style={{ cursor: 'pointer' }}
    >
      <components.GroupHeading {...props} /> <SolidIcon name={hidden ? 'cheveronup' : 'cheverondown'} height={20} />
    </div>
  );
};

export default DataSourceSelect;
