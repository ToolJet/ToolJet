import React, { useEffect, useRef, useState } from 'react';
import { OverlayTrigger, Popover, Form, Badge } from 'react-bootstrap';
import cx from 'classnames';
import { Button } from '@/_ui/LeftSidebar';
import { useGlobalDataSources } from '@/_stores/dataSourcesStore';
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
  const globalDataSources = useGlobalDataSources();
  const [sources, setSources] = useState([...staticDataSources, ...globalDataSources]);

  const searchBoxRef = useRef(null);

  const { sortBy, sortOrder } = useDataQueriesStore();

  useState(() => {
    if (action === 'filter-by-datasource' && searchBoxRef.current) {
      searchBoxRef.current.focus();
    }
  }, [action]);

  useEffect(() => {
    if (showMenu) {
      const seen = new Set();
      setSearch('');
      setSources(
        [...staticDataSources, ...globalDataSources]
          .filter((source) => {
            if (seen.has(source.kind)) {
              return false;
            }
            seen.add(source.kind);
            return true;
          })
          .sort((a, b) => {
            const aChecked = selectedDataSources.includes(a.kind);
            const bChecked = selectedDataSources.includes(b.kind);
            if (aChecked === bChecked) {
              return a.name.localeCompare(b.name);
            }
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
  }, [showMenu]);

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
          <div className="card-body p-0 tj-scrollbar" style={{ maxHeight: '275px', overflowY: 'auto' }}>
            <div className="color-slate9 px-3 pb-2 w-100">
              <small>Filter By</small>
            </div>
            <div className="d-flex">
              <MenuButton id="filter-by-datasource" text="Data Source" callback={handlePageCallback} />
              {selectedDataSources.length ? (
                <PillButton
                  name={selectedDataSources.length}
                  onRemove={clearSelectedDataSources}
                  className="m-1"
                  btnClassName1="py-0 px-2"
                  btnClassName2="p-0 pe-1"
                />
              ) : (
                ''
              )}
            </div>
            <div class="border-bottom"></div>
            <div className="color-slate9 px-3 pb-2 pt-1 w-100">
              <small>Sort By</small>
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
          className={cx('position-relative  btn-query-panel-header', { active: showMenu })}
          style={{ ...(showMenu && { background: 'var(--slate5)' }) }}
          data-tooltip-id="tooltip-for-open-filter"
          data-tooltip-content="Show sort/filter"
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
      <div className="border-bottom d-flex px-2 mb-2">
        <div className="d-flex align-items-center mb-1">
          <button className="border-0 bg-transparent rounded-0 p-0" onClick={onBackBtnClick}>
            <Arrowleft fill="#3E63DD" tailOpacity={1} />
          </button>
        </div>
        <div>
          <input
            className="bg-transparent border-0 form-control form-control-sm"
            placeholder="Select datasource"
            onChange={(e) => setSearch(e.target.value)}
            ref={searchBoxRef}
            value={search}
          />
        </div>
      </div>
      <div className="tj-scrollbar" style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {sources.map((source) => (
          <label
            className={cx('px-2 py-2 tj-list-btn d-block', {
              active: selectedDataSources.includes(source.kind),
            })}
            key={source.kind}
            role="button"
            for={`default-${source.kind}`}
          >
            <Form.Check // prettier-ignore
              type={'checkbox'}
              id={`default-${source.kind}`}
              onChange={(e) => onFilterDatasourcesChange(source.kind, e.target.value)}
              className="m-0"
              checked={selectedDataSources.includes(source.kind)}
              label={
                <>
                  <DataSourceIcon source={source} height={12} />
                  &nbsp;<span className="ms-1">{source.kind}</span>
                </>
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
};

const MenuButton = ({ id, order, text, iconSrc, disabled = false, callback = () => null, active }) => {
  const handleOnClick = (e) => {
    e.stopPropagation();
    callback(id, order);
  };

  return (
    <div className={`field p-2  tj-list-option ${active ? ` active` : ''}`}>
      <Button.UnstyledButton onClick={handleOnClick} disabled={disabled} classNames="d-flex justify-content-between">
        <Button.Content title={text} iconSrc={iconSrc} direction="left" />
        {active && <Tick width="20" height="20" viewBox="0 0 22 22" fill="var(--indigo9)" />}
      </Button.UnstyledButton>
    </div>
  );
};

export default FilterandSortPopup;
