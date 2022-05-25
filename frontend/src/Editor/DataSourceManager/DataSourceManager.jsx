import React from 'react';
import { datasourceService, authenticationService } from '@/_services';
import { Modal, Button, Tab, Row, Col, ListGroup } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { getSvgIcon } from '@/_helpers/appUtils';
import { TestConnection } from './TestConnection';
import {
  DataBaseSources,
  ApiSources,
  DataSourceTypes,
  SourceComponents,
  CloudStorageSources,
} from './SourceComponents';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import config from 'config';
import { isEmpty } from 'lodash';
import { Card } from '@/_ui/card';

class DataSourceManager extends React.Component {
  constructor(props) {
    super(props);

    let selectedDataSource = null;
    let options = {};
    let dataSourceMeta = {};

    if (props.selectedDataSource) {
      selectedDataSource = props.selectedDataSource;
      options = selectedDataSource.options;
      dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedDataSource.kind);
    }

    this.state = {
      currentUser: authenticationService.currentUserValue,
      showModal: true,
      appId: props.appId,
      selectedDataSource,
      options,
      dataSourceMeta,
      isSaving: false,
      isCopied: false,
      queryString: null,
      filteredDatasources: [],
      activeDatasourceList: '#alldatasources',
      suggestingDatasources: false,
    };
  }

  componentDidMount() {
    this.setState({
      appId: this.props.appId,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedDataSource !== this.props.selectedDataSource) {
      this.setState({
        selectedDataSource: this.props.selectedDataSource,
        options: this.props.selectedDataSource?.options,
        dataSourceMeta: DataSourceTypes.find((source) => source.kind === this.props.selectedDataSource?.kind),
      });
    }
  }

  selectDataSource = (source) => {
    this.setState({
      dataSourceMeta: source,
      selectedDataSource: source,
      name: source.kind,
    });
  };

  onNameChanged = (newName) => {
    this.setState({
      selectedDataSource: {
        ...this.state.selectedDataSource,
        name: newName,
      },
    });
  };

  onExit = () => {
    this.setState({
      dataSourceMeta: {},
      selectedDataSource: null,
      options: {},
      connectionTestError: null,
      queryString: null,
      filteredDatasources: [],
      activeDatasourceList: '#alldatasources',
    });
  };

  setStateAsync = (state) => {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  };

  optionchanged = (option, value) => {
    return this.setStateAsync({
      connectionTestError: null,
      options: {
        ...this.state.options,
        [option]: { value },
      },
    });
  };

  hideModal = () => {
    this.onExit();
    this.props.hideModal();
  };

  createDataSource = () => {
    const { appId, options, selectedDataSource } = this.state;
    const name = selectedDataSource.name;
    const kind = selectedDataSource.kind;
    const appVersionId = this.props.editingVersionId;

    const parsedOptions = Object.keys(options).map((key) => {
      const keyMeta = selectedDataSource.options[key];
      return {
        key: key,
        value: options[key].value,
        encrypted: keyMeta ? keyMeta.encrypted : false,
      };
    });
    if (name.trim() !== '') {
      if (selectedDataSource.id) {
        this.setState({ isSaving: true });
        datasourceService.save(selectedDataSource.id, appId, name, parsedOptions).then(() => {
          this.setState({ isSaving: false });
          this.hideModal();
          toast.success('Datasource Saved', { position: 'top-center' });
          this.props.dataSourcesChanged();
        });
      } else {
        this.setState({ isSaving: true });
        datasourceService.create(appId, appVersionId, name, kind, parsedOptions).then(() => {
          this.setState({ isSaving: false });
          this.hideModal();
          toast.success('Datasource Added', { position: 'top-center' });
          this.props.dataSourcesChanged();
        });
      }
    } else {
      toast.error('The name of datasource should not be empty', { position: 'top-center' });
    }
  };

  handleSearch = (searchQuery, activeDatasourceList) => {
    this.setState({ queryString: searchQuery });

    const arr = [];
    const filteredDatasources = this.datasourcesGroups().filter((group) => group.key === activeDatasourceList)[0].list;

    filteredDatasources.forEach((datasource) => {
      if (datasource.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        arr.push(datasource);
      }
    });
    this.setState({ filteredDatasources: arr });
  };

  handleBackToAllDatasources = () => {
    this.setState({
      queryString: null,
      filteredDatasources: [],
      activeDatasourceList: '#alldatasources',
    });
  };

  updateSuggestedDatasources = () => {
    this.setState({ suggestingDatasources: true, activeDatasourceList: '#' });
  };

  renderSourceComponent = (kind) => {
    const { options, isSaving } = this.state;

    const sourceComponentName = kind.charAt(0).toUpperCase() + kind.slice(1);
    const ComponentToRender = SourceComponents[sourceComponentName];
    return (
      <ComponentToRender
        optionsChanged={(options = {}) => this.setState({ options })}
        optionchanged={this.optionchanged}
        createDataSource={this.createDataSource}
        options={options}
        isSaving={isSaving}
        hideModal={this.hideModal}
        selectedDataSource={this.state.selectedDataSource}
        isEditMode={!isEmpty(this.state.selectedDataSource)}
      />
    );
  };

  onConnectionTestFailed = (data) => {
    this.setState({ connectionTestError: data });
  };

  segregateDataSources = (suggestingDatasources, darkMode) => {
    const datasources = this.datasourcesGroups();

    const handleOnSelect = (activekey) => {
      if (suggestingDatasources) {
        this.setState({ suggestingDatasources: false });
      }
      this.setState({ activeDatasourceList: activekey });
    };

    const goBacktoAllDatasources = () => {
      this.setState({ suggestingDatasources: false });
      this.handleBackToAllDatasources();
    };

    const datasourceSuggestionUI = () => {
      return (
        <div className="empty-state-wrapper suggestingDatasourcesWrapper">
          <EmptyStateContainer
            suggestionUI={true}
            queryString={this.state.queryString}
            handleBackToAllDatasources={goBacktoAllDatasources}
            darkMode={this.props.darkMode}
            placeholder={'Suggest an integration'}
          />
        </div>
      );
    };

    return (
      <Tab.Container
        activeKey={this.state.activeDatasourceList}
        unmountOnExit={true}
        onSelect={(activekey) => handleOnSelect(activekey)}
        id="list-group-tabs-example"
        defaultActiveKey={this.state.activeDatasourceList}
      >
        <Row>
          <Col sm={6} md={4} className={`modal-sidebar ${darkMode ? 'dark' : ''}`}>
            {this.renderSidebarList()}
          </Col>
          <Col style={{ left: '25%' }} className={`modal-body-content ${darkMode ? 'dark' : ''}`}>
            <div className="selected-datasource-list-content">
              <Tab.Content>
                {suggestingDatasources ? (
                  <div className="suggestion-container">
                    <h4 className="justify-content-start">Suggest Datasource</h4>
                    {datasourceSuggestionUI()}
                  </div>
                ) : (
                  <>
                    <div className="input-icon modal-searchbar">
                      <SearchBoxContainer
                        onChange={this.handleSearch}
                        onClear={this.handleBackToAllDatasources}
                        queryString={this.state.queryString}
                        activeDatasourceList={this.state.activeDatasourceList}
                      />
                    </div>
                    {datasources.map((datasource) => (
                      <Tab.Pane
                        transition={false}
                        active={this.state.activeDatasourceList === datasource.key}
                        bsPrefix={`datasource-modal-${this.state.activeDatasourceList}`}
                        eventKey={datasource.key}
                        key={datasource.key}
                      >
                        {datasource.renderDatasources()}
                      </Tab.Pane>
                    ))}
                  </>
                )}
                {!suggestingDatasources && this.state.queryString && this.state.filteredDatasources.length === 0 && (
                  <div className="empty-state-wrapper row">
                    <EmptyStateContainer
                      queryString={this.state.queryString}
                      handleBackToAllDatasources={this.handleBackToAllDatasources}
                      darkMode={this.props.darkMode}
                      placeholder={'Tell us what you were looking for?'}
                    />
                  </div>
                )}
              </Tab.Content>
            </div>
          </Col>
        </Row>
      </Tab.Container>
    );
  };

  datasourcesGroups = () => {
    const allDataSourcesList = {
      databases: DataBaseSources,
      apis: ApiSources,
      cloudStorages: CloudStorageSources,
      filteredDatasources: this.state.filteredDatasources,
    };
    const dataSourceList = [
      {
        type: 'All Datasources',
        key: '#alldatasources',
        list: [...allDataSourcesList.databases, ...allDataSourcesList.apis, ...allDataSourcesList.cloudStorages],
        renderDatasources: () => this.renderCardGroup(allDataSourcesList, 'All Datasources'),
      },
      {
        type: 'Databases',
        key: '#databases',
        list: allDataSourcesList.databases,
        renderDatasources: () => this.renderCardGroup(allDataSourcesList.databases, 'Databases'),
      },
      {
        type: 'APIs',
        key: '#apis',
        list: allDataSourcesList.apis,
        renderDatasources: () => this.renderCardGroup(allDataSourcesList.apis, 'APIs'),
      },
      {
        type: 'Cloud Storage',
        key: '#cloudstorage',
        list: allDataSourcesList.cloudStorages,
        renderDatasources: () => this.renderCardGroup(allDataSourcesList.cloudStorages, 'Cloud Storages'),
      },
      {
        type: 'Filtered Datasources',
        key: '#filtereddatasources',
        list: allDataSourcesList.filteredDatasources,
        renderDatasources: () => this.renderCardGroup(this.state.filteredDatasources, this.state.activeDatasourceList),
      },
    ];

    return dataSourceList;
  };

  renderSidebarList = () => {
    const dataSourceList = this.datasourcesGroups().splice(0, 4);

    const updateSuggestionState = () => {
      this.updateSuggestedDatasources();
    };

    return (
      <>
        <ListGroup className="datasource-lists-modal" variant="flush">
          {dataSourceList.map((datasource) => (
            <ListGroup.Item key={datasource.key} eventKey={datasource.key}>
              {`${datasource.type} (${datasource.list.length})`}
            </ListGroup.Item>
          ))}
        </ListGroup>
        <div className="datasource-modal-sidebar-footer">
          <p>
            <span className="footer-text">Don&apos;t see what you were looking for?</span>
            <br />
            <span className="link-span" onClick={updateSuggestionState}>
              Suggest
            </span>
          </p>
        </div>
      </>
    );
  };

  renderCardGroup = (source, type) => {
    const renderSelectedDatasource = (dataSource) => this.selectDataSource(dataSource);

    if (this.state.queryString && this.state.queryString.length > 0) {
      const filteredDatasources = this.state.filteredDatasources.map((datasource) => {
        return {
          ...datasource,
          src: datasource.kind.toLowerCase(),
          title: datasource.name,
        };
      });

      // if (filteredDatasources.length === 0) {
      //   return (
      //     <div className="empty-state-wrapper row">
      //       <EmptyStateContainer
      //         queryString={this.state.queryString}
      //         handleBackToAllDatasources={this.handleBackToAllDatasources}
      //         darkMode={this.props.darkMode}
      //         placeholder={'Tell us what you were looking for?'}
      //       />
      //     </div>
      //   );
      // }

      return (
        <>
          <div className="row row-deck mt-4">
            <h4 className="mb-2">{type}</h4>
            {filteredDatasources.map((item) => (
              <Card
                key={item.key}
                title={item.title}
                src={item.src}
                handleClick={() => renderSelectedDatasource(item)}
                usepluginIcon={true}
                height="35px"
                width="35px"
              />
            ))}
          </div>
        </>
      );
    }

    if (type === 'All Datasources') {
      const databases = source.databases.map((datasource) => {
        return {
          ...datasource,
          src: datasource.kind.toLowerCase(),
          title: datasource.name,
        };
      });
      const apis = source.apis.map((datasource) => {
        return {
          ...datasource,
          src: datasource.kind.toLowerCase(),
          title: datasource.name,
        };
      });
      const cloudStorages = source.cloudStorages.map((datasource) => {
        return {
          ...datasource,
          src: datasource.kind.toLowerCase(),
          title: datasource.name,
        };
      });

      return (
        <>
          <div>
            <div className="row row-deck mt-4">
              <h4 className="mb-2">{'Databases'}</h4>
              {databases.map((item) => (
                <Card
                  key={item.key}
                  title={item.title}
                  src={item.src}
                  handleClick={() => renderSelectedDatasource(item)}
                  usepluginIcon={true}
                  height="35px"
                  width="35px"
                />
              ))}
            </div>
          </div>
          <div>
            <div className="row row-deck mt-4">
              <h4 className="mb-2">{'APIs'}</h4>
              {apis.map((item) => (
                <Card
                  key={item.key}
                  title={item.title}
                  src={item.src}
                  handleClick={() => renderSelectedDatasource(item)}
                  usepluginIcon={true}
                  height="35px"
                  width="35px"
                />
              ))}
            </div>
          </div>
          <div>
            <div className="row row-deck mt-4">
              <h4 className="mb-2">{'Cloud Storages'}</h4>
              {cloudStorages.map((item) => (
                <Card
                  key={item.key}
                  title={item.title}
                  src={item.src}
                  handleClick={() => renderSelectedDatasource(item)}
                  usepluginIcon={true}
                  height="35px"
                  width="35px"
                />
              ))}
            </div>
          </div>
        </>
      );
    }

    const datasources = source.map((datasource) => {
      return {
        ...datasource,
        src: datasource.kind.toLowerCase(),
        title: datasource.name,
      };
    });

    return (
      <>
        <div className="row row-deck mt-4">
          <h4 className="mb-2">{type}</h4>
          {datasources.map((item) => (
            <Card
              key={item.key}
              title={item.title}
              src={item.src}
              handleClick={() => renderSelectedDatasource(item)}
              usepluginIcon={true}
              height="35px"
              width="35px"
            />
          ))}
        </div>
      </>
    );
  };

  render() {
    const { dataSourceMeta, selectedDataSource, options, isSaving, connectionTestError, isCopied } = this.state;

    return (
      <div>
        <Modal
          show={this.props.showDataSourceManagerModal}
          size={selectedDataSource ? 'lg' : 'xl'}
          onEscapeKeyDown={this.hideModal}
          className={selectedDataSource ? 'animation-fade' : 'select-datasource-list-modal animation-fade'}
          contentClassName={this.props.darkMode ? 'theme-dark' : ''}
          animation={false}
          onExit={this.onExit}
        >
          <Modal.Header>
            <Modal.Title>
              {selectedDataSource && (
                <div className="row">
                  {getSvgIcon(dataSourceMeta.kind.toLowerCase(), 35, 35)}
                  <div className="input-icon" style={{ width: '160px' }}>
                    <input
                      type="text"
                      onChange={(e) => this.onNameChanged(e.target.value)}
                      className="form-control-plaintext form-control-plaintext-sm"
                      value={selectedDataSource.name}
                      style={{ width: '160px' }}
                      autoFocus
                    />
                    <span className="input-icon-addon">
                      <img src="/assets/images/icons/edit-source.svg" width="12" height="12" />
                    </span>
                  </div>
                </div>
              )}
              {!selectedDataSource && <span className="text-muted">Add new datasource</span>}
            </Modal.Title>
            <span
              className={`close-btn mx-4 mt-3 ${this.props.darkMode ? 'dark' : ''}`}
              onClick={() => this.hideModal()}
            >
              <img src="/assets/images/icons/close.svg" width="12" height="12" />
            </span>
          </Modal.Header>

          <Modal.Body>
            {selectedDataSource && <div>{this.renderSourceComponent(selectedDataSource.kind)}</div>}
            {!selectedDataSource && this.segregateDataSources(this.state.suggestingDatasources, this.props.darkMode)}
          </Modal.Body>

          {selectedDataSource && !dataSourceMeta.customTesting && (
            <Modal.Footer>
              <div className="row w-100">
                <div className="card-body datasource-footer-info">
                  <div className="row">
                    <div className="col-1">
                      <svg
                        className="m-2"
                        width="14"
                        height="16"
                        viewBox="0 0 14 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.4305 2.4488C10.2559 1.27263 8.68244 0.624972 7.00002 0.624972C6.17871 0.623014 5.3651 0.783339 4.60593 1.09674C3.84676 1.41014 3.15699 1.87043 2.57624 2.45119C1.99548 3.03195 1.53518 3.72172 1.22178 4.48089C0.908385 5.24006 0.74806 6.05366 0.750018 6.87497C0.750018 8.69607 1.44806 10.3996 2.66408 11.5484L2.83439 11.7082C3.53791 12.366 4.50002 13.2672 4.50002 14.0625V15.625H6.37502V10.5121L4.64533 9.53122L5.35939 8.50466L7.00002 9.37497L8.61291 8.50036L9.359 9.50349L7.62502 10.5191V15.625H9.50002V14.0625C9.50002 13.2859 10.4516 12.3855 11.1465 11.7277L11.3383 11.5457C12.5891 10.3515 13.25 8.73474 13.25 6.87497C13.2542 6.05358 13.0955 5.23952 12.7832 4.4798C12.4709 3.72009 12.0111 3.0298 11.4305 2.4488Z"
                          fill="#EEB209"
                        />
                      </svg>
                    </div>
                    <div className="col" style={{ maxWidth: '480px' }}>
                      <p>Please white-list our IP address if the data source is not publicly accessible.</p>
                    </div>
                    <div className="col-auto">
                      {isCopied ? (
                        <center className="my-2">
                          <span className="copied">Copied</span>
                        </center>
                      ) : (
                        <CopyToClipboard
                          text={config.SERVER_IP}
                          onCopy={() => {
                            this.setState({ isCopied: true });
                          }}
                        >
                          <button type="button" className={`copy-button ${this.props.darkMode && 'dark-button'}`}>
                            <svg
                              width="15"
                              height="18"
                              viewBox="0 0 15 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.5 15.6667H2.16667V4.83334C2.16667 4.37501 1.79167 4.00001 1.33333 4.00001C0.875 4.00001 0.5 4.37501 0.5 4.83334V15.6667C0.5 16.5833 1.25 17.3333 2.16667 17.3333H10.5C10.9583 17.3333 11.3333 16.9583 11.3333 16.5C11.3333 16.0417 10.9583 15.6667 10.5 15.6667ZM14.6667 12.3333V2.33334C14.6667 1.41667 13.9167 0.666672 13 0.666672H5.5C4.58333 0.666672 3.83333 1.41667 3.83333 2.33334V12.3333C3.83333 13.25 4.58333 14 5.5 14H13C13.9167 14 14.6667 13.25 14.6667 12.3333ZM13 12.3333H5.5V2.33334H13V12.3333Z"
                                fill="currentColor"
                              />
                            </svg>
                            Copy
                          </button>
                        </CopyToClipboard>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {connectionTestError && (
                <div className="row w-100">
                  <div className="alert alert-danger" role="alert">
                    <div className="text-muted">{connectionTestError.message}</div>
                  </div>
                </div>
              )}

              <div className="col">
                <small>
                  <a
                    className="color-primary"
                    href={`https://docs.tooljet.io/docs/data-sources/${selectedDataSource.kind}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read documentation
                  </a>
                </small>
              </div>
              <div className="col-auto">
                <TestConnection
                  kind={selectedDataSource.kind}
                  options={options}
                  onConnectionTestFailed={this.onConnectionTestFailed}
                  darkMode={this.props.darkMode}
                />
              </div>
              <div className="col-auto">
                <Button
                  className={`m-2 ${isSaving ? 'btn-loading' : ''}`}
                  disabled={isSaving}
                  variant="primary"
                  onClick={this.createDataSource}
                >
                  {'Save'}
                </Button>
              </div>
            </Modal.Footer>
          )}

          {!dataSourceMeta?.hideSave && selectedDataSource && dataSourceMeta.customTesting && (
            <Modal.Footer>
              <div className="col">
                <small>
                  <a
                    href={`https://docs.tooljet.io/docs/data-sources/${selectedDataSource.kind}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read documentation
                  </a>
                </small>
              </div>
              <div className="col-auto">
                <Button className="m-2" disabled={isSaving} variant="primary" onClick={this.createDataSource}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Modal.Footer>
          )}
        </Modal>
      </div>
    );
  }
}

const EmptyStateContainer = ({
  suggestionUI = false,
  queryString,
  handleBackToAllDatasources,
  darkMode,
  placeholder,
}) => {
  const [inputValue, set] = React.useState(() => '');

  const [status, setStatus] = React.useState(false);
  const handleSend = () => {
    if (inputValue) {
      setStatus(true);
      //send value to backend
    }
  };

  React.useEffect(() => {
    setStatus(false);
  }, [queryString]);

  return (
    <div className="empty">
      {queryString && !suggestionUI && <h3>No results for &quot;{queryString} &quot;</h3>}
      <center className={`empty-results ${suggestionUI ? 'suggestionUI-results' : ''}`}>
        <img src="/assets/images/icons/no-results.svg" width="150" height="150" />
        {status ? (
          <div>
            <p className="text-success mt-2">Thank you, we&apos;ve taken a note of that!</p>
            <button
              className={`datasource-modal-button ${darkMode && 'dark-button'}`}
              onClick={handleBackToAllDatasources}
            >
              {'Go to all Datasources'}
            </button>
          </div>
        ) : (
          <div className="row empty-search">
            <div className="col-9 mt-2">
              <div className="input-icon">
                <input
                  type="text"
                  className="form-control mb-2"
                  value={inputValue}
                  placeholder={placeholder}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            </div>
            <div className="col-auto">
              <Button className="mt-2" variant="primary" onClick={handleSend}>
                {'Send'}
              </Button>
            </div>
          </div>
        )}
      </center>
    </div>
  );
};

const SearchBoxContainer = ({ onChange, onClear, queryString, activeDatasourceList }) => {
  const [searchText, setSearchText] = React.useState(queryString ?? '');

  const handleChange = (e) => {
    setSearchText(e.target.value);
    onChange(e.target.value, activeDatasourceList);
  };

  const clearSearch = () => {
    setSearchText('');
    onClear();
  };

  React.useEffect(() => {
    if (searchText.length > 0) {
      onChange(searchText, activeDatasourceList);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDatasourceList]);

  React.useEffect(() => {
    if (queryString === null) {
      setSearchText('');
    }
  }, [queryString]);
  React.useEffect(() => {
    if (searchText === '') {
      onClear();
    }
    if (searchText) {
      document.querySelector('.input-icon .form-control:not(:first-child)').style.paddingLeft = '0.5rem';
    }

    return () => {
      document.querySelector('.input-icon .form-control:not(:first-child)').style.paddingLeft = '2.5rem';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <div className="search-box-wrapper">
      <div style={{ height: '36px' }} className="input-icon d-flex">
        {searchText.length === 0 && (
          <span className="search-icon mt-2 mx-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <circle cx="10" cy="10" r="7" />
              <line x1="21" y1="21" x2="15" y2="15" />
            </svg>
          </span>
        )}
        {searchText.length > 0 && (
          <span className="clear-icon mt-2" onClick={clearSearch}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-circle-x"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M10 10l4 4m0 -4l-4 4"></path>
            </svg>
          </span>
        )}
        <input type="text" value={searchText} onChange={handleChange} className="form-control" placeholder="Search" />
      </div>
    </div>
  );
};

export { DataSourceManager };
