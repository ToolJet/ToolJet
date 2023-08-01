import React, { useState, useEffect } from 'react';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import Information from '@/_ui/Icon/solidIcons/Information';
import Search from '@/_ui/Icon/solidIcons/Search';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import DataSourceIcon from './DataSourceIcon';
import { isEmpty } from 'lodash';
import { Col, Container, Row } from 'react-bootstrap';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';

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
        Connect to a datasource
      </h4>
      <p className="mb-3" style={{ textAlign: 'center' }}>
        Select a datasource to start creating a new query. To know more about queries in ToolJet, you can read our
        &nbsp;
        <a target="_blank" href="https://docs.tooljet.com/docs/app-builder/query-panel" rel="noreferrer">
          documentation
        </a>
      </p>
      <div>
        <label className="form-label">Default</label>
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
              >
                <DataSourceIcon source={source} height={14} /> {source.shortName}
              </ButtonSolid>
            );
          })}
        </div>
        <div className="d-flex d-flex justify-content-between">
          <label className="form-label py-1" style={{ width: 'auto' }}>
            {`Available Datasources ${!isEmpty(allUserDefinedSources) ? '(' + allUserDefinedSources.length + ')' : 0}`}
          </label>
          <ButtonSolid size="sm" variant="ghostBlue" onClick={handleAddClick}>
            <Plus style={{ height: '16px' }} fill="var(--indigo9)" />
            Add new
          </ButtonSolid>
        </div>
        {isEmpty(allUserDefinedSources) ? (
          <EmptyDataSourceBanner />
        ) : (
          <Container className="p-0">
            {allUserDefinedSources.length > 4 && (
              <SearchBox onSearch={setSearchTerm} darkMode={darkMode} searchTerm={searchTerm} />
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
                  >
                    <DataSourceIcon source={source} height={14} styles={{ minWidth: 14 }} />
                    <span className="text-truncate">{source.name}</span>
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
    <div>
      No global datasources have been added yet. <br />
      Add new datasources to connect to your app! 🚀
    </div>
  </div>
);

const SearchBox = ({ onSearch, darkMode, searchTerm }) => {
  const { t } = useTranslation();
  return (
    <Row>
      <Col className="mt-2 mb-2 position-relative">
        <input
          type="text"
          className={`form-control ${darkMode && 'dark-theme-placeholder'} ps-4`}
          placeholder={t('globals.search', 'Search') + '...'}
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          data-cy="widget-search-box"
        />
        <span
          className="position-absolute"
          style={{ top: '50%', transform: 'translate(0%, -50%)', paddingLeft: '10px' }}
        >
          <Search style={{ width: '16px' }} />
        </span>
      </Col>
    </Row>
  );
};

export default DataSourcePicker;
