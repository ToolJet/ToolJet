import React, { useState, useEffect } from 'react';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import Information from '@/_ui/Icon/solidIcons/Information';
import Search from '@/_ui/Icon/solidIcons/Search';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { SearchBox as SearchBox2 } from '@/_components/SearchBox';
import DataSourceIcon from './DataSourceIcon';
import { isEmpty } from 'lodash';
import { Col, Container, Row } from 'react-bootstrap';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';
import { Tooltip } from 'react-tooltip';

function DataSourcePicker({ dataSources, staticDataSources, darkMode, globalDataSources }) {
  const allUserDefinedSources = [...dataSources, ...globalDataSources];
  const [searchTerm, setSearchTerm] = useState();
  const [filteredUserDefinedDataSources, setFilteredUserDefinedDataSources] = useState(allUserDefinedSources);
  const navigate = useNavigate();
  const { createDataQuery } = useDataQueriesActions();
  const { setPreviewData } = useQueryPanelActions();

  const handleChangeDataSource = (source) => {
    createDataQuery(source);
    setPreviewData(null);
  };

  useEffect(() => {
    if (searchTerm) {
      const formattedSearchTerm = searchTerm.toLowerCase();
      const filteredResults = allUserDefinedSources.filter(
        ({ name, kind }) =>
          name.toLowerCase().includes(formattedSearchTerm) || kind.toLowerCase().includes(formattedSearchTerm)
      );
      setFilteredUserDefinedDataSources(filteredResults);
    } else {
      setFilteredUserDefinedDataSources(allUserDefinedSources);
    }
  }, [searchTerm, globalDataSources, dataSources]);

  const handleAddClick = () => {
    const workspaceId = getWorkspaceId();
    navigate(`/${workspaceId}/global-datasources`);
  };

  return (
    <>
      <h4 className="w-100 text-center" data-cy={'label-select-datasource'} style={{ fontWeight: 500 }}>
        Connect to a data source
      </h4>
      <p className="mb-3" style={{ textAlign: 'center' }}>
        Select a data source to start creating a new query. To know more about queries in ToolJet, you can read our
        &nbsp;
        <a target="_blank" href="https://docs.tooljet.com/docs/app-builder/query-panel" rel="noreferrer">
          documentation
        </a>
      </p>
      <div>
        <label className="form-label" data-cy={`landing-page-label-default`}>
          Default
        </label>
        <div className="query-datasource-card-container d-flex justify-content-between mb-3 mt-2">
          {staticDataSources.map((source) => {
            return (
              <ButtonSolid
                key={`${source.id}-${source.kind}`}
                variant="tertiary"
                size="sm"
                onClick={() => {
                  handleChangeDataSource(source);
                }}
                className="text-truncate"
                data-cy={`${source.kind.toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
              >
                <DataSourceIcon source={source} height={14} /> {source.shortName}
              </ButtonSolid>
            );
          })}
        </div>
        <div className="d-flex d-flex justify-content-between">
          <label className="form-label py-1" style={{ width: 'auto' }} data-cy={`label-avilable-ds`}>
            {`Available data sources ${!isEmpty(allUserDefinedSources) ? '(' + allUserDefinedSources.length + ')' : 0}`}
          </label>
          <ButtonSolid
            size="sm"
            variant="ghostBlue"
            onClick={handleAddClick}
            data-cy={`landing-page-add-new-ds-button`}
          >
            <Plus style={{ height: '16px' }} fill="var(--indigo9)" />
            Add new
          </ButtonSolid>
        </div>
        {isEmpty(allUserDefinedSources) ? (
          <EmptyDataSourceBanner />
        ) : (
          <Container className="p-0">
            {allUserDefinedSources.length > 4 && (
              <SearchBox
                onSearch={setSearchTerm}
                darkMode={darkMode}
                searchTerm={searchTerm}
                dataCy={`gds-querymanager`}
              />
            )}
            <Row className="mt-2">
              {filteredUserDefinedDataSources.map((source) => (
                <Col sm="6" key={source.id} className="ps-1">
                  <ButtonSolid
                    key={`${source.id}-${source.kind}`}
                    variant="ghostBlack"
                    size="sm"
                    className="font-weight-400 py-3 mb-1 w-100 justify-content-start"
                    onClick={() => {
                      handleChangeDataSource(source);
                    }}
                    data-tooltip-id="tooltip-for-query-panel-ds-picker-btn"
                    data-tooltip-content={source.name}
                    data-cy={`${String(source.name).toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
                  >
                    <DataSourceIcon source={source} height={14} styles={{ minWidth: 14 }} />
                    <span className="text-truncate">{source.name}</span>
                    <Tooltip id="tooltip-for-query-panel-ds-picker-btn" className="tooltip" />
                  </ButtonSolid>
                </Col>
              ))}
            </Row>
          </Container>
        )}
      </div>
    </>
  );
}

const EmptyDataSourceBanner = () => (
  <div className="bg-slate3 p-3 d-flex align-items-center lh-lg mt-2" style={{ borderRadius: '6px' }}>
    <div className="me-2">
      <Information fill="var(--slate9)" />
    </div>
    <div>No global data sources have been added yet.</div>
  </div>
);

const SearchBox = ({ onSearch, darkMode, searchTerm, dataCy }) => {
  const { t } = useTranslation();
  return (
    <Row>
      <Col className="mt-2 mb-2">
        <SearchBox2
          width="100%"
          type="text"
          className={`form-control ${darkMode && 'dark-theme-placeholder'}`}
          placeholder={t('globals.search', 'Search') + '...'}
          value={searchTerm}
          callBack={(e) => onSearch(e.target.value)}
          onClearCallback={() => onSearch('')}
          dataCy={dataCy}
        />
        {/* <span
          className="position-absolute"
          style={{ top: '50%', transform: 'translate(0%, -50%)', paddingLeft: '10px' }}
        >
          <Search style={{ width: '16px' }} />
        </span> */}
      </Col>
    </Row>
  );
};

export default DataSourcePicker;
