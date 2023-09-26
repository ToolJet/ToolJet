import React, { useEffect, useRef, useState } from 'react';
import { OverlayTrigger, Popover, Form } from 'react-bootstrap';
import cx from 'classnames';
import { Button } from '@/_ui/LeftSidebar';
import { useDataSources, useGlobalDataSources } from '@/_stores/dataSourcesStore';
import Filter from '@/_ui/Icon/solidIcons/Filter';
import Arrowleft from '@/_ui/Icon/bulkIcons/Arrowleft';
import { useDataQueriesActions, useDataQueriesStore } from '@/_stores/dataQueriesStore';
import Tick from '@/_ui/Icon/solidIcons/Tick';
import useShowPopover from '@/_hooks/useShowPopover';
import DataSourceIcon from '../QueryManager/Components/DataSourceIcon';
import { staticDataSources } from '../QueryManager/constants';
import { Tooltip } from 'react-tooltip';
import { PillButton } from '../QueryManager/QueryEditors/Runjs/ParameterDetails';

const FilterandSortPopup = ({ darkMode, selectedDataSources, onFilterDatasourcesChange, clearSelectedDataSources }) => {
  const [showMenu, setShowMenu] = useShowPopover(false, '#query-sort-filter-popover', '#query-sort-filter-popover-btn');
  const closeMenu = () => setShowMenu(false);
  const [action, setAction] = useState();
  const [search, setSearch] = useState('');
  const { sortDataQueries } = useDataQueriesActions();
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const [sources, setSources] = useState();

  const searchBoxRef = useRef(null);

  const { sortBy, sortOrder, dataQueries } = useDataQueriesStore();

  useState(() => {
    if (action === 'filter-by-datasource' && searchBoxRef.current) {
      searchBoxRef.current.focus();
    }
  }, [action]);

  useEffect(() => {
    if (showMenu) {
      const seen = new Set();
      const createdSources = dataQueries.map((query) => {
        const globalDS = [...dataSources, ...globalDataSources].find((source) => source.id === query.data_source_id);
        if (globalDS) {
          return globalDS;
        }
        return {
          ...staticDataSources.find((source) => source.kind === query.kind),
          id: null,
        };
      });
      setSearch('');
      setSources(
        createdSources
          .filter((source) => {
            const key = source.kind + '-' + source.id;
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          })
          .sort((a, b) => {
            const aChecked = selectedDataSources.some((item) => item.id === a.id && item.kind === a.kind);
            const bChecked = selectedDataSources.some((item) => item.id === b.id && item.kind === b.kind);
            if (aChecked && !bChecked) {
              return -1;
            }
            if (!aChecked && bChecked) {
              return 1;
            }
            return 0;
          })
      );
    } else {
      setAction();
    }
  }, [dataQueries, dataSources, globalDataSources, showMenu]);

  const handlePageCallback = (action) => {
    setAction(action);
  };

  const handleSort = (sortBy, sortOrder) => {
    sortDataQueries(sortBy, sortOrder);
    closeMenu();
  };

  const renderPopupComponent = (action) => {
    switch (action) {
      case 'filter-by-datasource':
        return (
          <DataSourceSelector
            search={search}
            setSearch={setSearch}
            sources={sources}
            onFilterDatasourcesChange={onFilterDatasourcesChange}
            onBackBtnClick={() => setAction()}
            selectedDataSources={selectedDataSources}
          />
        );

      default:
        return (
          <div
            className="card-body p-0 tj-scrollbar query-editor-sort-filter-popup"
            style={{ height: '315px', overflowY: 'auto' }}
          >
            <div className="color-slate9 px-3 pb-2 w-100">
              <small data-cy="label-filter-by">Filter By</small>
            </div>
            <div className={`tj-list-btn mx-1 ${selectedDataSources.length ? 'd-flex' : ''}`}>
              <MenuButton
                id="filter-by-datasource"
                text="Data Source"
                callback={handlePageCallback}
                disabled={dataQueries.length === 0}
                noMargin
              />
              {selectedDataSources.length ? (
                <PillButton
                  name={selectedDataSources.length}
                  onRemove={clearSelectedDataSources}
                  onClick={() => handlePageCallback('filter-by-datasource')}
                  className="m-1 bg-slate6"
                  size="sm"
                />
              ) : (
                ''
              )}
            </div>
            <div class="border-bottom mt-1"></div>
            <div className="color-slate9 px-3 pb-2 pt-1 w-100">
              <small data-cy="label-sort-by">Sort By</small>
            </div>
            <MenuButton
              id="name"
              order="asc"
              text="Name: A-Z"
              callback={handleSort}
              active={sortBy === 'name' && sortOrder === 'asc'}
            />
            <MenuButton
              id="name"
              order="desc"
              text="Name: Z-A"
              callback={handleSort}
              active={sortBy === 'name' && sortOrder === 'desc'}
            />
            <MenuButton
              id="kind"
              order="asc"
              text="Type: A-Z"
              callback={handleSort}
              active={sortBy === 'kind' && sortOrder === 'asc'}
            />
            <MenuButton
              id="kind"
              order="desc"
              text="Type: Z-A"
              callback={handleSort}
              active={sortBy === 'kind' && sortOrder === 'desc'}
            />
            <MenuButton
              id="updated_at"
              order="asc"
              text="Last modified: oldest first"
              callback={handleSort}
              active={sortBy === 'updated_at' && sortOrder === 'asc'}
            />
            <MenuButton
              id="updated_at"
              order="desc"
              text="Last modified: newest first"
              callback={handleSort}
              active={sortBy === 'updated_at' && sortOrder === 'desc'}
            />
          </div>
        );
    }
  };

  return (
    <OverlayTrigger
      placement="right-end"
      // rootClose={true}
      show={showMenu}
      overlay={
        <Popover
          key={'page.i'}
          id="query-sort-filter-popover"
          className={`query-manager-sort-filter-popup ${darkMode && 'popover-dark-themed dark-theme tj-dark-mode'}`}
        >
          <Popover.Body key={'1'} bsPrefix="popover-body" className="pt-1 p-0">
            {renderPopupComponent(action)}
          </Popover.Body>
        </Popover>
      }
    >
      <span>
        <button
          id="query-sort-filter-popover-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((showMenu) => !showMenu);
          }}
          className={cx('position-relative  btn-query-panel-header', {
            active: showMenu,
          })}
          style={{ ...(showMenu && { background: 'var(--slate5)' }) }}
          data-tooltip-id="tooltip-for-open-filter"
          data-tooltip-content="Show sort/filter"
          data-cy={`query-filter-button`}
        >
          <Filter width="13" height="13" fill="var(--slate12)" />
          {selectedDataSources.length > 0 && <div className="notification-dot"></div>}
        </button>
        <Tooltip id="tooltip-for-open-filter" className="tooltip" />
      </span>
    </OverlayTrigger>
  );
};

const DataSourceSelector = ({
  sources: _sources,
  search,
  setSearch,
  onFilterDatasourcesChange,
  onBackBtnClick,
  selectedDataSources,
}) => {
  const searchBoxRef = useRef(null);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    searchBoxRef.current.focus();
  }, []);

  useEffect(() => {
    setSources(
      _sources.filter((source) => {
        if (!search || !source?.name) {
          return true;
        }
        return source.name.toLowerCase().includes(search.toLowerCase());
      })
    );
  }, [_sources, search]);

  return (
    <div className="card-body p-0 mt-1">
      <div className="border-bottom d-flex px-2">
        <div className="d-flex align-items-center mb-1">
          <button className="border-0 bg-transparent rounded-0 p-0" onClick={onBackBtnClick}>
            <Arrowleft fill="#3E63DD" tailOpacity={1} />
          </button>
        </div>
        <div>
          <input
            className="bg-transparent border-0 form-control form-control-sm"
            placeholder="Select data source"
            onChange={(e) => setSearch(e.target.value)}
            ref={searchBoxRef}
            value={search}
            data-cy="input-query-ds-filter"
          />
        </div>
      </div>
      <div className="tj-scrollbar py-2" style={{ height: '281px', overflowY: 'auto' }}>
        {sources.map((source) => (
          <label
            className={cx('px-2 py-2 tj-list-btn d-block mx-1')}
            key={source.id || source.kind}
            role="button"
            for={`default-${source.id || source.kind}`}
          >
            <Form.Check // prettier-ignore
              type={'checkbox'}
              id={`default-${source.id || source.kind}`}
              onChange={(e) => onFilterDatasourcesChange(source, e.target.value)}
              className="m-0"
              checked={selectedDataSources.some((item) => item.id === source.id && item.kind === source.kind)}
              label={
                <div className="d-flex align-items-center">
                  <DataSourceIcon source={source} height={12} styles={{ minWidth: 12 }} />
                  &nbsp;
                  <span className="ms-1 text-truncate" data-cy={`ds-filter-${source.name.toLowerCase()}`}>
                    {source.name}
                  </span>
                </div>
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
};

const MenuButton = ({
  id,
  order,
  text,
  iconSrc,
  disabled = false,
  callback = () => null,
  active,
  noMargin = false,
}) => {
  const handleOnClick = (e) => {
    e.stopPropagation();
    callback(id, order);
  };

  return (
    <div className={`field p-2 ${noMargin ? '' : 'mx-1'} tj-list-btn`}>
      <Button.UnstyledButton onClick={handleOnClick} disabled={disabled} classNames="d-flex justify-content-between">
        <Button.Content title={text} iconSrc={iconSrc} direction="left" />
        {active && <Tick width="20" height="20" viewBox="0 0 22 22" fill="var(--indigo9)" />}
      </Button.UnstyledButton>
    </div>
  );
};

export default FilterandSortPopup;
