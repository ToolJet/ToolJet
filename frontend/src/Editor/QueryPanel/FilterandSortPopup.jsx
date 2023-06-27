import React, { useEffect, useRef, useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { Checkbox } from '@/_ui/CheckBox';
import { Button } from '@/_ui/LeftSidebar';
import { useDataSources, useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { SearchBox } from '@/_components/SearchBox';
import Filter from '../../_ui/Icon/bulkIcons/Filter';
import Arrowleft from '../../_ui/Icon/bulkIcons/Arrowleft';
import Search from '../../_ui/Icon/solidIcons/Search';
import { staticDataSources } from '../QueryManager/constants';
import DataSourceIcon from '../QueryManager/Components/DataSourceIcon';
import { useDataQueriesActions, useDataQueriesStore } from '@/_stores/dataQueriesStore';
import SortArrowUp from '../../_ui/Icon/bulkIcons/SortArrowUp';
import SortArrowDown from '../../_ui/Icon/bulkIcons/SortArrowDown';

const FilterandSortPopup = ({ page, darkMode, isHome, selectedDataSources, onFilterDatasourcesChange }) => {
  const [showMenu, setShowMenu] = useState(false);
  const closeMenu = () => setShowMenu(false);
  const [action, setAction] = useState();
  const [search, setSearch] = useState('');
  const { sortDataQueries } = useDataQueriesActions();

  const searchBoxRef = useRef(null);

  const { sortBy, sortOrder } = useDataQueriesStore();
  const globalDataSources = useGlobalDataSources();

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && event.target.closest('#page-handler-menu') === null) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ page, showMenu })]);

  React.useState(() => {
    console.log('searchBoxRef.current ->', searchBoxRef.current);
    if (action === 'filter-by-datasource' && searchBoxRef.current) {
      searchBoxRef.current.focus();
    }
  }, [action]);

  const handlePageCallback = (action) => {
    setAction(action);
  };

  const handleSort = (sortBy) => {
    sortDataQueries(sortBy);
    closeMenu();
  };

  const renderPopupComponent = (action) => {
    switch (action) {
      case 'filter-by-datasource':
        return (
          <DataSourceSelector
            search={search}
            setSearch={setSearch}
            sources={[...staticDataSources, ...globalDataSources]}
            onFilterDatasourcesChange={onFilterDatasourcesChange}
            onBackBtnClick={() => setAction()}
            selectedDataSources={selectedDataSources}
          />
        );

      default:
        return (
          <div className="card-body">
            <div className="text-muted px-3 pb-2 w-100">
              <small className="text-muted">Filter By</small>
            </div>
            <MenuButton
              id="filter-by-datasource"
              text="Data Source"
              closeMenu={closeMenu}
              callback={handlePageCallback}
              disabled={isHome}
            />
            <div class="border-bottom"></div>
            <div className="text-muted px-3 pb-2 pt-1 w-100">
              <small className="text-muted">Sort By</small>
            </div>
            <MenuButton
              id="name"
              text="A-Z"
              closeMenu={closeMenu}
              callback={handleSort}
              disabled={isHome}
              customClass={sortBy === 'name' ? 'text-info' : ''}
              sortOrder={sortBy === 'name' && sortOrder}
            />
            <MenuButton
              id="kind"
              text="Type"
              closeMenu={closeMenu}
              callback={handleSort}
              disabled={isHome}
              customClass={sortBy === 'kind' ? 'text-info' : ''}
              sortOrder={sortBy === 'kind' && sortOrder}
            />
            <MenuButton
              id="updated_at"
              text="Last modified"
              closeMenu={closeMenu}
              callback={handleSort}
              disabled={isHome}
              customClass={sortBy === 'updated_at' ? 'text-info' : ''}
              sortOrder={sortBy === 'updated_at' && sortOrder}
            />
          </div>
        );
    }
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={true}
      show={showMenu}
      overlay={
        <Popover
          key={'page.i'}
          id="page-handler-menu"
          className={`query-manager-sort-filter-popup ${darkMode && 'popover-dark-themed'}`}
        >
          <Popover.Body key={'1'} bsPrefix="popover-body" className="pt-2 p-0">
            {renderPopupComponent(action)}
          </Popover.Body>
        </Popover>
      }
    >
      <span>
        <button
          onClick={() => setShowMenu(true)}
          className={cx('border-0 position-relative', { 'bg-light': showMenu, 'bg-transparent': !showMenu })}
          data-tooltip-id="tooltip-for-open-filter"
          data-tooltip-content="Show sort/filter"
        >
          <Filter width="13" height="13" fill="#343a40" />
          {selectedDataSources.length > 0 && <div className="notification-dot"></div>}
        </button>
      </span>
    </OverlayTrigger>
  );
};

const DataSourceSelector = ({
  sources,
  search,
  setSearch,
  onFilterDatasourcesChange,
  onBackBtnClick,
  selectedDataSources,
}) => {
  const searchBoxRef = useRef(null);

  useEffect(() => {
    searchBoxRef.current.focus();
  }, []);

  return (
    <div className="card-body">
      <div className="border-bottom d-flex px-2 mb-2">
        <div className="d-flex align-items-center">
          <button
            className="border-primary border-0 border-end border-2 bg-transparent rounded-0 p-0"
            onClick={onBackBtnClick}
          >
            <Arrowleft fill="#3E63DD" tailOpacity={1} />
          </button>
        </div>
        <div>
          <input
            className="bg-transparent border-0 form-control"
            placeholder="Select datasource"
            onChange={(e) => setSearch(e.target.value)}
            ref={searchBoxRef}
          />
        </div>
      </div>
      <div className="" style={{ maxHeight: '250px', overflowY: 'scroll' }}>
        {sources
          .filter((source) => {
            if (!search || !source?.name) {
              return true;
            }
            return source.name.toLowerCase().includes(search.toLowerCase());
          })
          .map((source) => (
            <div className="px-2 py-2" key={source.kind}>
              <Checkbox
                label={
                  <>
                    <DataSourceIcon source={source} /> {source.name}
                  </>
                }
                onChange={(e) => onFilterDatasourcesChange(source.kind, e.target.value)}
                isChecked={selectedDataSources.includes(source.kind)}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

const MenuButton = ({
  id,
  text,
  iconSrc,
  customClass = '',
  closeMenu,
  disabled = false,
  callback = () => null,
  sortOrder,
}) => {
  const handleOnClick = (e) => {
    e.stopPropagation();
    callback(id);
  };

  return (
    <div className={`field px-2 ${customClass ? ` ${customClass}` : ''}`}>
      <Button.UnstyledButton
        onClick={handleOnClick}
        styles={{ height: '28px' }}
        disabled={disabled}
        classNames="d-flex justify-content-between"
      >
        <Button.Content title={text} iconSrc={iconSrc} direction="left" />
        {sortOrder &&
          (sortOrder === 'asc' ? (
            <SortArrowUp width="15" height="15" viewBox="0 0 22 22" fill="#4299e1" />
          ) : (
            <SortArrowDown width="15" height="15" viewBox="0 0 22 22" fill="#4299e1" />
          ))}
      </Button.UnstyledButton>
    </div>
  );
};

export default FilterandSortPopup;
