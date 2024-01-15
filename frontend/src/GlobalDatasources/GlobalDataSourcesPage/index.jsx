import React, { useContext, useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import { Sidebar } from '../Sidebar';
import { GlobalDataSourcesContext } from '..';
import { DataSourceManager } from '@/Editor/DataSourceManager';
import { DataBaseSources, ApiSources, CloudStorageSources } from '@/Editor/DataSourceManager/SourceComponents';
import { pluginsService, globalDatasourceService, authenticationService } from '@/_services';
import { Card } from '@/_ui/Card';
import { SegregatedList } from '../SegregatedList';
import { SearchBox } from '@/_components';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { BreadCrumbContext } from '@/App';
import { pageTitles, setWindowTitle } from '@/_helpers/utils';

export const GlobalDataSourcesPage = ({ darkMode = false, updateSelectedDatasource }) => {
  const containerRef = useRef(null);
  const [plugins, setPlugins] = useState([]);
  const [filteredDataSources, setFilteredDataSources] = useState([]);
  const [queryString, setQueryString] = useState('');
  const [addingDataSource, setAddingDataSource] = useState(false);
  const [suggestingDataSource, setSuggestingDataSource] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { admin } = authenticationService.currentSessionValue;
  const marketplaceEnabled = admin && window.public_config?.ENABLE_MARKETPLACE_FEATURE == 'true';
  const [modalProps, setModalProps] = useState({
    backdrop: false,
    dialogClassName: `datasource-edit-modal`,
    enforceFocus: false,
  });

  const {
    dataSources,
    setSelectedDataSource,
    selectedDataSource,
    fetchDataSources,
    showDataSourceManagerModal,
    toggleDataSourceManagerModal,
    handleModalVisibility,
    isEditing,
    setEditing,
    currentEnvironment,
    environments,
    setCurrentEnvironment,
    activeDatasourceList,
    setActiveDatasourceList,
    isLoading,
  } = useContext(GlobalDataSourcesContext);

  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  useEffect(() => {
    pluginsService
      .findAll()
      .then(({ data = [] }) => setPlugins([...data]))
      .catch((error) => {
        toast.error(error?.message || 'Failed to fetch plugins');
      });
  }, []);

  useEffect(() => {
    setWindowTitle({ page: `${selectedDataSource?.name || pageTitles.DATA_SOURCES}` });
    if (selectedDataSource) {
      setModalProps({ ...modalProps, backdrop: false });
    }

    if (!isEditing) {
      setModalProps({ ...modalProps, backdrop: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataSource, isEditing]);

  const handleHideModal = () => {
    if (dataSources?.length) {
      if (!isEditing) {
        setEditing(true);
        setSelectedDataSource(dataSources[0]);
        updateSelectedDatasource(dataSources[0]?.name);
      } else {
        setSelectedDataSource(null);
        setEditing(true);
        toggleDataSourceManagerModal(false);
      }
    } else {
      handleModalVisibility();
      setEditing(true);
    }
  };

  const environmentChanged = (env) => {
    setCurrentEnvironment(env);
  };

  const dataSourcesChanged = (resetSelection, dataSource) => {
    setCurrentEnvironment(environments[0]);
    fetchDataSources(resetSelection, dataSource);
  };

  const handleSearch = (e) => {
    const searchQuery = e.target.value;
    setQueryString(searchQuery);

    let arr = [];

    const filtered = datasourcesGroups().map((datasourceGroup) => {
      datasourceGroup.list.map((dataSource) => {
        if (dataSource.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          arr.push({ ...dataSource, type: datasourceGroup.type });
        }
      });
      datasourceGroup.list = [...arr];
      (datasourceGroup.renderDatasources = () => renderCardGroup(datasourceGroup.list, datasourceGroup.type)),
        (arr = []);
      return datasourceGroup;
    });
    const filteredDsList = filtered.reduce((acc, filteredGroup) => [...acc, ...filteredGroup.list], []);
    filteredDsList.length >= 1 ? setSuggestingDataSource(false) : setSuggestingDataSource(true);
    setFilteredDataSources([...filtered]);
  };

  const createDataSource = (dataSource) => {
    const { id } = dataSource;
    const selectedDataSource = dataSource.manifestFile?.data?.source ?? dataSource;
    const name = dataSource.manifestFile?.data?.source?.kind ?? dataSource.kind;
    const options =
      (dataSource?.defaults ?? dataSource.options) ||
      (dataSource.manifestFile.data.defaults ?? dataSource.manifestFile.data.options);
    const pluginId = id;
    const kind = selectedDataSource?.kind;
    const scope = 'global';

    const parsedOptions = Object?.keys(options)?.map((key) => {
      const keyMeta = selectedDataSource.options[key];
      return {
        key: key,
        value: options[key].value,
        encrypted: keyMeta ? keyMeta.encrypted : false,
        ...(!options[key]?.value && { credential_id: options[key]?.credential_id }),
      };
    });
    if (name.trim() !== '') {
      setAddingDataSource(true);
      globalDatasourceService
        .create({
          plugin_id: pluginId,
          name,
          kind,
          options: parsedOptions,
          scope,
        })
        .then((data) => {
          setActiveDatasourceList('');
          setAddingDataSource(false);
          toast.success(t('editor.queryManager.dataSourceManager.toast.success.dataSourceAdded', 'Data Source Added'), {
            position: 'top-center',
          });

          dataSourcesChanged(false, data);
          setAddingDataSource(false);
        })
        .catch(({ error }) => {
          setAddingDataSource(false);
          error && toast.error(error, { position: 'top-center' });
        });
    } else {
      toast.error(
        t(
          'editor.queryManager.dataSourceManager.toast.error.noEmptyDsName',
          'The name of datasource should not be empty'
        ),
        { position: 'top-center' }
      );
    }
  };

  const segregateDataSources = () => {
    const datasources = queryString && queryString.length > 0 ? filteredDataSources : datasourcesGroups();

    return (
      <div className="datasource-list-container">
        <div className="datasource-list">
          <div className="datasource-search-holder">
            <SearchBox
              dataCy={`home-page`}
              className="border-0 homepage-search"
              darkMode={darkMode}
              placeholder={`Search  data sources`}
              initialValue={queryString}
              width={'100%'}
              callBack={handleSearch}
              onClearCallback={() => {
                setQueryString('');
                setSuggestingDataSource(false);
              }}
            />
            <div className="liner mb-4"></div>
          </div>
          {suggestingDataSource ? (
            <center className="empty-ds-container">
              <div>
                <p className="mt-2 tj-text-lg font-weight-500 tj-text">{`No results for "${queryString}"`}</p>
              </div>
              <img src="assets/images/icons/no-results.svg" width="200" height="200" />
            </center>
          ) : (
            datasources.map((dataSource) => {
              {
                return (
                  (dataSource.list.length > 0 || (!queryString && dataSource.type === 'Plugins')) && (
                    <>
                      <div id={dataSource.key} className="tj-text-md font-weight-500 tj-text">
                        {dataSource.type}
                      </div>
                      {dataSource.renderDatasources()}
                    </>
                  )
                );
              }
            })
          )}
        </div>
      </div>
    );
  };

  const renderSidebarList = () => {
    const dataSourceList = datasourcesGroups().splice(0, 5);
    const handleOnSelect = (activekey, type) => {
      setQueryString('');
      setSuggestingDataSource(false);
      toggleDataSourceManagerModal(false);
      setActiveDatasourceList(activekey);
      updateSidebarNAV(type);
      setSelectedDataSource(null);
      setTimeout(() => {
        const element = document.getElementById(activekey);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };
    return (
      <div>
        <SegregatedList
          handleOnSelect={handleOnSelect}
          activeDatasourceList={activeDatasourceList}
          dataSources={dataSourceList}
        />
      </div>
    );
  };

  const renderCardGroup = (source, type) => {
    if (type === 'Plugins' && source.length === 0) {
      return (
        <div className="add-plugins-container">
          <div className="warning-container mb-2">
            <SolidIcon name="warning" />
          </div>
          <div className="tj-text-sm font-weight-500 tj-text">No plugins added</div>
          {admin && (
            <>
              <div className="tj-text-xsm font-weight-400 mt-2 mb-3">
                Browse through plugins in marketplace to add them as a Data Source.{' '}
              </div>
              <ButtonSolid
                onClick={() => {
                  marketplaceEnabled
                    ? navigate('/integrations')
                    : toast.error('Please enable marketplace to add plugins');
                }}
                style={{ margin: 'auto' }}
                variant="secondary"
              >
                Add plugins
              </ButtonSolid>
            </>
          )}
        </div>
      );
    }
    const addDataSourceBtn = (item) => (
      <ButtonSolid
        disabled={addingDataSource}
        isLoading={addingDataSource}
        variant="secondary"
        onClick={() => createDataSource(item)}
        data-cy={`${item.title.toLowerCase().replace(/\s+/g, '-')}-add-button`}
      >
        <SolidIcon name="plus" fill={darkMode ? '#3E63DD' : '#3E63DD'} width={18} viewBox="0 0 25 25" />
        <span className="ml-2">Add</span>
      </ButtonSolid>
    );

    const datasources = source.map((datasource) => {
      const src = datasource?.iconFile?.data
        ? `data:image/svg+xml;base64,${datasource.iconFile?.data}`
        : datasource.kind.toLowerCase();

      return {
        ...datasource,
        src,
        title: datasource.name,
      };
    });

    return (
      <>
        <div className="row row-deck mt-3">
          {datasources.map((item) => (
            <Card
              key={item.key}
              title={item.title}
              src={item?.src}
              usePluginIcon={isEmpty(item?.iconFile?.data)}
              height="35px"
              width="35px"
              actionButton={addDataSourceBtn(item)}
              className="datasource-card"
              titleClassName={'datasource-card-title'}
            />
          ))}
        </div>
      </>
    );
  };

  const datasourcesGroups = () => {
    const allDataSourcesList = {
      databases: DataBaseSources,
      apis: ApiSources,
      cloudStorages: CloudStorageSources,
      plugins: plugins,
      filteredDatasources: filteredDataSources,
    };
    const dataSourceList = [
      {
        type: 'Databases',
        key: '#databases',
        list: allDataSourcesList.databases,
        renderDatasources: () => renderCardGroup(allDataSourcesList.databases, 'Databases'),
      },
      {
        type: 'APIs',
        key: '#apis',
        list: allDataSourcesList.apis,
        renderDatasources: () => renderCardGroup(allDataSourcesList.apis, 'APIs'),
      },
      {
        type: 'Cloud Storages',
        key: '#cloudstorage',
        list: allDataSourcesList.cloudStorages,
        renderDatasources: () => renderCardGroup(allDataSourcesList.cloudStorages, 'Cloud Storages'),
      },
      {
        type: 'Plugins',
        key: '#plugins',
        list: allDataSourcesList.plugins,
        renderDatasources: () => renderCardGroup(allDataSourcesList.plugins, 'Plugins'),
      },
    ];

    return dataSourceList;
  };

  return (
    <div className="row gx-0">
      <Sidebar renderSidebarList={renderSidebarList} updateSelectedDatasource={updateSelectedDatasource} />
      <div ref={containerRef} className={cx('col animation-fade datasource-modal-container', {})}>
        {containerRef && containerRef?.current && (
          <DataSourceManager
            showBackButton={selectedDataSource ? false : true}
            showDataSourceManagerModal={showDataSourceManagerModal}
            darkMode={darkMode}
            hideModal={handleHideModal}
            scope="global"
            dataSourcesChanged={dataSourcesChanged}
            selectedDataSource={selectedDataSource}
            modalProps={modalProps}
            currentEnvironment={currentEnvironment}
            environments={environments}
            environmentChanged={environmentChanged}
            container={selectedDataSource ? containerRef?.current : null}
            isEditing={isEditing}
            updateSelectedDatasource={updateSelectedDatasource}
          />
        )}
        {!selectedDataSource && activeDatasourceList && !isLoading && segregateDataSources()}
      </div>
    </div>
  );
};
