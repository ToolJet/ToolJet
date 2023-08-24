import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import { SearchBox } from '@/_components/SearchBox';
import Minimize from '@/_ui/Icon/solidIcons/Minimize';
import Search from '@/_ui/Icon/solidIcons/Search';
import Skeleton from 'react-loading-skeleton';
import { QueryCard } from './QueryCard';
import Fuse from 'fuse.js';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { useDataQueriesStore, useDataQueries } from '@/_stores/dataQueriesStore';
import FilterandSortPopup from './FilterandSortPopup';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import useShowPopover from '@/_hooks/useShowPopover';
import DataSourceSelect from '../QueryManager/Components/DataSourceSelect';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import FolderEmpty from '@/_ui/Icon/solidIcons/FolderEmpty';

export const QueryDataPane = ({ darkMode, fetchDataQueries, editorRef, appId, toggleQueryEditor }) => {
  const { t } = useTranslation();
  const { loadingDataQueries } = useDataQueriesStore();
  const dataQueries = useDataQueries();
  const [filteredQueries, setFilteredQueries] = useState(dataQueries);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const searchBoxRef = useRef(null);
  const [dataSourcesForFilters, setDataSourcesForFilters] = useState([]);
  const [searchTermForFilters, setSearchTermForFilters] = useState();

  useEffect(() => {
    // Create a copy of the dataQueries array to perform filtering without modifying the original data.
    let filteredDataQueries = [...dataQueries];

    // Filter the dataQueries based on the selected data sources (dataSourcesForFilters).
    if (!isEmpty(dataSourcesForFilters)) {
      const excludedDataSources = ['runjs', 'runpy'];
      filteredDataQueries = dataQueries.filter((query) => {
        const queryDSId = excludedDataSources.includes(query.data_source_id) ? null : query.data_source_id;
        return dataSourcesForFilters.some((source) => source.id == queryDSId && source.kind === query.kind);
      });
    }

    // Apply additional filtering based on the search term (searchTermForFilters).
    filterQueries(searchTermForFilters, filteredDataQueries);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dataQueries), dataSourcesForFilters, searchTermForFilters]);

  const handleFilterDatasourcesChange = (source) => {
    const { id, kind } = source;
    setDataSourcesForFilters((dataSourcesForFilters) => {
      const exists = dataSourcesForFilters.some((item) => item.id === id && item.kind === kind);
      return exists
        ? dataSourcesForFilters.filter((item) => item.id !== id || item.kind !== kind)
        : [...dataSourcesForFilters, source];
    });
  };

  const filterQueries = (value, queries) => {
    if (value) {
      const fuse = new Fuse(queries, { keys: ['name'] });
      const results = fuse.search(value);
      let filterDataQueries = [];
      results.every((result) => {
        if (result.item.name === value) {
          filterDataQueries = [];
          filterDataQueries.push(result.item);
          return false;
        }
        filterDataQueries.push(result.item);
        return true;
      });
      setFilteredQueries(filterDataQueries);
    } else {
      setFilteredQueries(queries);
    }
  };

  useEffect(() => {
    showSearchBox && searchBoxRef.current.focus();
  }, [showSearchBox]);

  return (
    <div className="data-pane">
      <div className={`queries-container ${darkMode && 'theme-dark'} d-flex flex-column h-100`}>
        <div className="queries-header row d-flex align-items-center justify-content-between">
          <div className="col-auto d-flex">
            <button
              onClick={toggleQueryEditor}
              className="btn-query-panel-header"
              data-tooltip-id="tooltip-for-query-panel-header-btn"
              data-tooltip-content="Hide query panel"
            >
              <Minimize width="14" height="14" viewBox="0 0 18 20" stroke="var(--slate12)" />
            </button>
            <button
              onClick={() => {
                showSearchBox && setSearchTermForFilters('');
                setShowSearchBox((showSearchBox) => !showSearchBox);
              }}
              className={cx('btn-query-panel-header mx-1', {
                active: showSearchBox,
              })}
              data-tooltip-id="tooltip-for-query-panel-header-btn"
              data-tooltip-content="Open quick search"
              data-cy="query-search-button"
            >
              <Search width="14" height="14" fill="var(--slate12)" />
            </button>
            <FilterandSortPopup
              onFilterDatasourcesChange={handleFilterDatasourcesChange}
              selectedDataSources={dataSourcesForFilters}
              clearSelectedDataSources={() => setDataSourcesForFilters([])}
              darkMode={darkMode}
            />
            <Tooltip id="tooltip-for-query-panel-header-btn" className="tooltip" />
          </div>
          <AddDataSourceButton darkMode={darkMode} disabled={isEmpty(dataQueries)} />
        </div>
        <div
          className={cx('queries-header row d-flex align-items-center justify-content-between', {
            'd-none': !showSearchBox,
          })}
        >
          <div className="col-auto w-100">
            <div className={`queries-search d-flex ${darkMode && 'theme-dark'}`}>
              <SearchBox
                ref={searchBoxRef}
                dataCy={`query-manager`}
                width="100%"
                initialValue={searchTermForFilters}
                callBack={(val) => {
                  setSearchTermForFilters(val.target.value);
                }}
                onClearCallback={() => setSearchTermForFilters('')}
                placeholder={t('globals.search', 'Search')}
                customClass="query-manager-search-box-wrapper flex-grow-1"
                showClearButton
              />
              <ButtonSolid
                size="sm"
                variant="ghostBlue"
                className="ms-1"
                onClick={() => {
                  setSearchTermForFilters('');
                  setShowSearchBox(false);
                }}
                data-cy={`query-search-close-button`}
              >
                Close
              </ButtonSolid>
            </div>
          </div>
        </div>

        {loadingDataQueries ? (
          <div className="p-2">
            <Skeleton height={'36px'} className="skeleton mb-2" />
            <Skeleton height={'36px'} className="skeleton" />
          </div>
        ) : (
          <div
            className={`query-list tj-scrollbar overflow-auto ${
              filteredQueries.length === 0 ? 'flex-grow-1 align-items-center justify-content-center' : ''
            }`}
          >
            <div>
              {filteredQueries.map((query) => (
                <QueryCard
                  key={query.id}
                  dataQuery={query}
                  fetchDataQueries={fetchDataQueries}
                  darkMode={darkMode}
                  editorRef={editorRef}
                  appId={appId}
                />
              ))}
            </div>
            {filteredQueries.length === 0 && (
              <div className=" d-flex  flex-column align-items-center justify-content-start">
                {filteredQueries.length === 0 ? <EmptyDataSource /> : ''}
                <br />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyDataSource = () => (
  <div>
    <div className="text-center">
      <span
        className="rounded mb-3 bg-slate3 d-flex justify-content-center align-items-center"
        style={{ width: '32px', height: '32px' }}
      >
        <FolderEmpty style={{ height: '16px' }} />
      </span>
    </div>
    <span>No queries have been added. </span>
  </div>
);

const AddDataSourceButton = ({ darkMode, disabled }) => {
  const [showMenu, setShowMenu] = useShowPopover(false, '#query-add-ds-popover', '#query-add-ds-popover-btn');
  const selectRef = useRef();

  useEffect(() => {
    if (showMenu) {
      selectRef.current.focus();
    }
  }, [showMenu]);

  return (
    <OverlayTrigger
      show={showMenu && !disabled}
      placement="right-end"
      arrowOffsetTop={90}
      arrowOffsetLeft={90}
      overlay={
        <Popover
          key={'page.i'}
          id="query-add-ds-popover"
          className={`${darkMode && 'popover-dark-themed dark-theme tj-dark-mode'}`}
          style={{ width: '244px', maxWidth: '246px' }}
        >
          <DataSourceSelect selectRef={selectRef} closePopup={() => setShowMenu(false)} />
        </Popover>
      }
    >
      <span className="col-auto" id="query-add-ds-popover-btn">
        <ButtonSolid
          size="sm"
          variant="tertiary"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) {
              return;
            }
            setShowMenu((show) => !show);
          }}
          className="px-1 pe-3 ps-2 gap-0"
          data-cy={`show-ds-popover-button`}
        >
          <Plus style={{ height: '16px' }} />
          Add
        </ButtonSolid>
      </span>
    </OverlayTrigger>
  );
};
