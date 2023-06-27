import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchBox } from '@/_components/SearchBox';
import Skeleton from 'react-loading-skeleton';
import EmptyQueriesIllustration from '@assets/images/icons/no-queries-added.svg';
import { QueryCard } from './QueryCard';
import Fuse from 'fuse.js';
import cx from 'classnames';
import { Tooltip } from 'react-bootstrap';
import { useDataQueriesStore, useDataQueries } from '@/_stores/dataQueriesStore';
import ToggleQueryEditorIcon from '../QueryManager/Icons/ToggleQueryEditorIcon';
import FilterandSortPopup from './FilterandSortPopup';
import Minimize from '../../_ui/Icon/solidIcons/Minimize';
import Search from '../../_ui/Icon/solidIcons/Search';
import Filter from '../../_ui/Icon/bulkIcons/Filter';
import { isEmpty } from 'lodash';

export const QueryDataPane = ({
  setSaveConfirmation,
  setCancelData,
  draftQuery,
  handleAddNewQuery,
  setDraftQuery,
  darkMode,
  fetchDataQueries,
  editorRef,
  isVersionReleased,
  appId,
  toggleQueryEditor,
}) => {
  const { t } = useTranslation();
  const { loadingDataQueries } = useDataQueriesStore();
  const dataQueries = useDataQueries();
  const [filteredQueries, setFilteredQueries] = useState(dataQueries);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const searchBoxRef = useRef(null);
  const [dataSourcesForFilters, setDataSourcesForFilters] = useState([]);

  useEffect(() => {
    console.log(dataSourcesForFilters);
    if (isEmpty(dataSourcesForFilters)) {
      setFilteredQueries(dataQueries);
    } else {
      console.log('dataSourcesForFilters >>', dataSourcesForFilters);
      setFilteredQueries(dataQueries.filter((query) => dataSourcesForFilters.includes(query.kind)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dataQueries), dataSourcesForFilters]);

  const handleFilterDatasourcesChange = (kind) => {
    setDataSourcesForFilters((dataSourcesForFilters) => {
      if (dataSourcesForFilters.includes(kind)) {
        return dataSourcesForFilters.filter((source) => source !== kind);
      } else {
        return [...dataSourcesForFilters, kind];
      }
    });
  };

  const filterQueries = useCallback(
    (value) => {
      if (value) {
        const fuse = new Fuse(dataQueries, { keys: ['name'] });
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
        setFilteredQueries(dataQueries);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(dataQueries)]
  );

  useEffect(() => {
    showSearchBox && searchBoxRef.current.focus();
  }, [showSearchBox]);

  return (
    <div className="data-pane">
      <div className={`queries-container ${darkMode && 'theme-dark'}`}>
        <div className="queries-header row d-flex align-items-center justify-content-between">
          <button
            data-cy={`button-add-new-queries`}
            className={cx(`col-auto d-flex align-items-center py-1 rounded default-secondary-button`, {
              disabled: isVersionReleased,
              'theme-dark': darkMode,
            })}
            onClick={handleAddNewQuery}
            data-tooltip-id="tooltip-for-add-query"
            data-tooltip-content="Add new query"
          >
            <span className={` d-flex query-manager-btn-svg-wrapper align-items-center query-icon-wrapper`}>
              <svg width="auto" height="auto" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 15.25C7.71667 15.25 7.47917 15.1542 7.2875 14.9625C7.09583 14.7708 7 14.5333 7 14.25V9H1.75C1.46667 9 1.22917 8.90417 1.0375 8.7125C0.845833 8.52083 0.75 8.28333 0.75 8C0.75 7.71667 0.845833 7.47917 1.0375 7.2875C1.22917 7.09583 1.46667 7 1.75 7H7V1.75C7 1.46667 7.09583 1.22917 7.2875 1.0375C7.47917 0.845833 7.71667 0.75 8 0.75C8.28333 0.75 8.52083 0.845833 8.7125 1.0375C8.90417 1.22917 9 1.46667 9 1.75V7H14.25C14.5333 7 14.7708 7.09583 14.9625 7.2875C15.1542 7.47917 15.25 7.71667 15.25 8C15.25 8.28333 15.1542 8.52083 14.9625 8.7125C14.7708 8.90417 14.5333 9 14.25 9H9V14.25C9 14.5333 8.90417 14.7708 8.7125 14.9625C8.52083 15.1542 8.28333 15.25 8 15.25Z"
                  fill="#3E63DD"
                />
              </svg>
            </span>
            <span className="query-manager-btn-name">Add</span>
          </button>
          <div className="col-auto d-flex">
            <FilterandSortPopup
              onFilterDatasourcesChange={handleFilterDatasourcesChange}
              selectedDataSources={dataSourcesForFilters}
              darkMode={darkMode}
            />
            <button
              onClick={() => setShowSearchBox((showSearchBox) => !showSearchBox)}
              className="bg-transparent border-0"
              data-tooltip-id="tooltip-for-quick-search-query"
              data-tooltip-content="Open quick search"
            >
              <Search width="12" height="12" fill="var(--slate12)" />
            </button>
            <Tooltip id="tooltip-for-search-query" className="tooltip" />
            <button
              onClick={toggleQueryEditor}
              className="bg-transparent border-0"
              data-tooltip-id="tooltip-for-hide-query-editor"
              data-tooltip-content="Hide query editor"
            >
              <Minimize width="14" height="14" viewBox="0 0 25 14" stroke="var(--slate12)" />
            </button>
            <Tooltip id="tooltip-for-hide-query-editor" className="tooltip" />
          </div>
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
                onSubmit={filterQueries}
                placeholder={t('globals.search', 'Search')}
                onClearCallback={() => setShowSearchBox(false)}
                customClass="query-manager-search-box-wrapper"
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
              {draftQuery !== null ? (
                <QueryCard
                  key={draftQuery.id}
                  dataQuery={draftQuery}
                  setSaveConfirmation={setSaveConfirmation}
                  setCancelData={setCancelData}
                  setDraftQuery={setDraftQuery}
                  fetchDataQueries={fetchDataQueries}
                  darkMode={darkMode}
                  editorRef={editorRef}
                  isVersionReleased={isVersionReleased}
                />
              ) : (
                ''
              )}
              {filteredQueries.map((query) => (
                <QueryCard
                  key={query.id}
                  dataQuery={query}
                  setSaveConfirmation={setSaveConfirmation}
                  setCancelData={setCancelData}
                  setDraftQuery={setDraftQuery}
                  fetchDataQueries={fetchDataQueries}
                  darkMode={darkMode}
                  editorRef={editorRef}
                  isVersionReleased={isVersionReleased}
                  appId={appId}
                />
              ))}
            </div>
            {filteredQueries.length === 0 && draftQuery === null && (
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
