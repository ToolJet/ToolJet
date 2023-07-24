import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import { SearchBox } from '@/_components/SearchBox';
import Minimize from '@/_ui/Icon/solidIcons/Minimize';
import Search from '@/_ui/Icon/solidIcons/Search';
import Skeleton from 'react-loading-skeleton';
import EmptyQueriesIllustration from '@assets/images/icons/no-queries-added.svg';
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
    let filteredDataQueries = [...dataQueries];
    if (!isEmpty(dataSourcesForFilters)) {
      filteredDataQueries = [...dataQueries.filter((query) => dataSourcesForFilters.includes(query.kind))];
    }
    filterQueries(searchTermForFilters, filteredDataQueries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dataQueries), dataSourcesForFilters, searchTermForFilters]);

  const handleFilterDatasourcesChange = (kind) => {
    setDataSourcesForFilters((dataSourcesForFilters) => {
      if (dataSourcesForFilters.includes(kind)) {
        return dataSourcesForFilters.filter((source) => source !== kind);
      } else {
        return [...dataSourcesForFilters, kind];
      }
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
      <div className={`queries-container ${darkMode && 'theme-dark'}`}>
        <div className="queries-header row d-flex align-items-center justify-content-between">
          <div className="col-auto d-flex">
            <button
              onClick={toggleQueryEditor}
              className="btn-query-panel-header"
              data-tooltip-id="tooltip-for-query-panel-header-btn"
              data-tooltip-content="Hide query editor"
            >
              <Minimize width="14" height="14" viewBox="0 0 18 20" stroke="var(--slate12)" />
            </button>
            <button
              onClick={() => setShowSearchBox((showSearchBox) => !showSearchBox)}
              className={cx('btn-query-panel-header mx-1', {
                active: showSearchBox,
              })}
              data-tooltip-id="tooltip-for-query-panel-header-btn"
              data-tooltip-content="Open quick search"
            >
              <Search width="14" height="14" fill="var(--slate12)" />
            </button>
            <FilterandSortPopup
              onFilterDatasourcesChange={handleFilterDatasourcesChange}
              selectedDataSources={dataSourcesForFilters}
              darkMode={darkMode}
            />
            <Tooltip id="tooltip-for-query-panel-header-btn" className="tooltip" />
          </div>
          <AddDataSourceButton darkMode={darkMode} />
        </div>
        <div
          className={cx('queries-header row d-flex align-items-center justify-content-between', {
            'd-none': !showSearchBox,
          })}
        >
          <div className="col-auto w-100">
            <div className={`queries-search ${darkMode && 'theme-dark'}`}>
              <SearchBox
                ref={searchBoxRef}
                dataCy={`query-manager`}
                width="100%"
                onSubmit={(val) => setSearchTermForFilters(val)}
                placeholder={t('globals.search', 'Search')}
                onClearCallback={() => setShowSearchBox(false)}
                customClass="query-manager-search-box-wrapper"
                showClearButton
              />
            </div>
          </div>
        </div>

        {loadingDataQueries ? (
          <div className="p-2">
            <Skeleton height={'36px'} className="skeleton mb-2" />
            <Skeleton height={'36px'} className="skeleton" />
          </div>
        ) : (
          <div className="query-list">
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
                <EmptyQueriesIllustration />
                <span data-cy="no-query-message" className="mute-text pt-3">
                  {dataQueries.length === 0 ? 'No queries added' : 'No queries found'}
                </span>
                <br />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AddDataSourceButton = ({ darkMode }) => {
  const [showMenu, setShowMenu] = useShowPopover(false, '#query-add-ds-popover', '#query-add-ds-popover-btn');
  const selectRef = useRef();

  useEffect(() => {
    if (showMenu) {
      selectRef.current.focus();
    }
  }, [showMenu]);

  return (
    <OverlayTrigger
      show={showMenu}
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
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((show) => !show);
          }}
          className="px-1 pe-2 gap-0"
        >
          <Plus style={{ height: '16px' }} />
          Add
        </ButtonSolid>
      </span>
    </OverlayTrigger>
  );
};
