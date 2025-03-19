import React, { useState, useEffect } from 'react';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import Information from '@/_ui/Icon/solidIcons/Information';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId, decodeEntities } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { SearchBox as SearchBox2 } from '@/_components/SearchBox';
import DataSourceIcon from './DataSourceIcon';
import { isEmpty } from 'lodash';
import { Col, Container, Row } from 'react-bootstrap';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';
import { Tooltip } from 'react-tooltip';
import { canCreateDataSource } from '@/_helpers';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '../queryManager.theme.scss';
import useStore from '@/AppBuilder/_stores/store';
import { staticDataSources } from '../constants';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';

function DataSourcePicker({ darkMode }) {
  const dataSources = useStore((state) => state.dataSources);
  const globalDataSources = useStore((state) => state.globalDataSources);
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const allUserDefinedSources = [...dataSources, ...globalDataSources].filter(
    (ds) => ds.type !== DATA_SOURCE_TYPE.STATIC
  );
  const [searchTerm, setSearchTerm] = useState();
  const [filteredUserDefinedDataSources, setFilteredUserDefinedDataSources] = useState(allUserDefinedSources);
  const navigate = useNavigate();
  const createDataQuery = useStore((state) => state.dataQuery.createDataQuery);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);

  const staticDataSourcesFullObject = useStore((state) => state.globalDataSources)?.filter(
    (gds) => gds.type === DATA_SOURCE_TYPE.STATIC
  );
  //StaicDataSources DIDNT HAVE ID
  const updatedStaticDataSources = staticDataSources.map((source) => {
    // Find a matching object from staticDataSourcesFullObject based on the 'kind' field
    const matchingObject = staticDataSourcesFullObject?.find((gds) => gds.kind === source.kind);

    // Replace the 'id' with the one from the matching object, or keep the existing one if no match
    return {
      ...source,
      id: matchingObject?.id || source.id,
    };
  });

  const docLink = 'sampledb.com';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, globalDataSources, dataSources]);

  const handleAddClick = () => {
    const workspaceId = getWorkspaceId();
    navigate(`/${workspaceId}/data-sources`);
  };

  const workflowsEnabled = window.public_config?.ENABLE_WORKFLOWS_FEATURE == 'true';

  return (
    <>
      <h4 className="w-100 text-center" data-cy={'label-select-datasource'} style={{ fontWeight: 500 }}>
        Connect to a Data source
      </h4>
      <p className="mb-3" style={{ textAlign: 'center' }}>
        Select a Data source to start creating a new query. To know more about queries in ToolJet, you can read our
        &nbsp;
        <a
          data-cy="querymanager-doc-link"
          target="_blank"
          href="https://docs.tooljet.com/docs/app-builder/query-panel"
          rel="noreferrer"
        >
          documentation
        </a>
      </p>
      <div>
        <label className="form-label" data-cy={`landing-page-label-default`}>
          Default
        </label>
        <div className="query-datasource-card-container d-flex justify-content-between mb-3 mt-2">
          {updatedStaticDataSources.map((source) => {
            if (!workflowsEnabled && source.kind === 'workflows') return null;

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
        {!!sampleDataSource && (
          <div>
            <label className="form-label sample-db-data-query-picker-form-label" data-cy={`landing-page-label-default`}>
              Sample data sources
            </label>

            <div className="query-datasource-card-container d-flex justify-content-between mb-3 mt-2">
              <ButtonSolid
                key={`${sampleDataSource.id}-${sampleDataSource.kind}`}
                variant="tertiary"
                size="sm"
                onClick={() => {
                  handleChangeDataSource(sampleDataSource);
                }}
                className="text-truncate"
                data-cy={`${sampleDataSource.kind.toLowerCase().replace(/\s+/g, '-')}-sample-db-add-query-card`}
              >
                <DataSourceIcon source={sampleDataSource} height={14} />{' '}
                {sampleDataSource.kind == 'postgresql' ? 'PostgreSQL' : 'ToolJetDB'}
              </ButtonSolid>
            </div>

            {/* Info icon */}
            <div className="open-doc-link-container">
              <div className="col-md-1 info-btn">
                <SolidIcon name="informationcircle" fill="#3E63DD" />
              </div>
              <div className="col-md-11">
                <div className="message" data-cy="warning-text">
                  <p>
                    This is a shared resource and may show varying data due to real-time updates. It&apos;s reset daily
                    for some consistency, but please note it&apos;s designed for user exploration, not production
                    use.&nbsp;
                    <a onClick={handleAddClick} target="_blank" rel="noopener noreferrer" className="opn-git-btn">
                      Explore available data sources
                    </a>{' '}
                    <SolidIcon name="open" width={'8'} height={'8'} viewBox={'0 0 10 10'} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex d-flex justify-content-between">
          <label className="form-label py-1" style={{ width: 'auto' }} data-cy={`label-avilable-ds`}>
            {`Available Data sources ${!isEmpty(allUserDefinedSources) ? '(' + allUserDefinedSources.length + ')' : 0}`}
          </label>
          {canCreateDataSource() && (
            <ButtonSolid
              size="sm"
              variant="ghostBlue"
              onClick={handleAddClick}
              data-cy={`landing-page-add-new-ds-button`}
            >
              <Plus style={{ height: '16px' }} fill="var(--indigo9)" />
              Add new
            </ButtonSolid>
          )}
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
                    data-tooltip-content={decodeEntities(source.name)}
                    data-cy={`${String(source.name).toLowerCase().replace(/\s+/g, '-')}-add-query-card`}
                  >
                    <DataSourceIcon source={source} height={14} styles={{ minWidth: 14 }} />
                    <span className="text-truncate">{decodeEntities(source.name)}</span>
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
    <div>No Data sources have been added yet.</div>
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
