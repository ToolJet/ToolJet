import React from 'react';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import ReactTooltip from 'react-tooltip';
import { allSources } from './QueryEditors';
import { Transformation } from './Transformation';
import { previewQuery } from '@/_helpers/appUtils';
import { EventManager } from '../Inspector/EventManager';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { DataSourceTypes } from '../DataSourceManager/SourceComponents';
import RunjsIcon from '../Icons/runjs.svg';
import Preview from './Preview';
import DataSourceLister from './DataSourceLister';
import { allSvgs } from '@tooljet/plugins/client';
// import { Confirm } from '../Viewer/Confirm';
import _, { isEmpty, isEqual } from 'lodash';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';

const queryNameRegex = new RegExp('^[A-Za-z0-9_-]*$');

const staticDataSources = [
  { kind: 'restapi', id: 'null', name: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
];

let QueryManager = class QueryManager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: {},
      selectedQuery: null,
      selectedDataSource: null,
      dataSourceMeta: {},
      dataQueries: [],
      theme: {},
      isSourceSelected: false,
      isFieldsChanged: false,
      paneHeightChanged: false,
      showSaveConfirmation: false,
      restArrayValuesChanged: false,
      nextProps: null,
      buttonText: '',
    };

    this.previewPanelRef = React.createRef();
    this.buttonConfig = JSON.parse(localStorage.getItem('queryManagerButtonConfig'));
  }

  setStateFromProps = (props) => {
    const selectedQuery = props.selectedQuery;
    const dataSourceId = selectedQuery?.data_source_id;
    const source = props.dataSources.find((datasource) => datasource.id === dataSourceId);
    let dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedQuery?.kind);
    const paneHeightChanged = this.state.queryPaneHeight !== props.queryPaneHeight;
    const dataQueries = props.dataQueries?.length ? props.dataQueries : this.state.dataQueries;
    const queryPaneDragged = this.state.isQueryPaneDragging !== props.isQueryPaneDragging;
    this.setState(
      {
        appId: props.appId,
        dataSources: props.dataSources,
        dataQueries: dataQueries,
        mode: props.mode,
        currentTab: 1,
        addingQuery: props.addingQuery,
        editingQuery: props.editingQuery,
        queryPaneHeight: props.queryPaneHeight,
        isQueryPaneDragging: props.isQueryPaneDragging,
        currentState: props.currentState,
        selectedSource: source,
        dataSourceMeta,
        paneHeightChanged,
        isSourceSelected: paneHeightChanged || queryPaneDragged ? this.state.isSourceSelected : props.isSourceSelected,
        selectedDataSource:
          paneHeightChanged || queryPaneDragged ? this.state.selectedDataSource : props.selectedDataSource,
        theme: {
          scheme: 'bright',
          author: 'chris kempson (http://chriskempson.com)',
          base00: props.darkMode ? '#272822' : '#000000',
          base01: '#303030',
          base02: '#505050',
          base03: '#b0b0b0',
          base04: '#d0d0d0',
          base05: '#e0e0e0',
          base06: '#f5f5f5',
          base07: '#ffffff',
          base08: '#fb0120',
          base09: '#fc6d24',
          base0A: '#fda331',
          base0B: '#a1c659',
          base0C: '#76c7b7',
          base0D: '#6fb3d2',
          base0E: '#d381c3',
          base0F: '#be643c',
        },
        buttonText:
          props.mode === 'edit'
            ? this.buttonConfig?.editMode?.text ?? 'Save & Run'
            : this.buttonConfig?.createMode?.text ?? 'Create & Run',
        shouldRunQuery:
          props.mode === 'edit'
            ? this.buttonConfig?.editMode?.shouldRunQuery ?? true
            : this.buttonConfig?.createMode?.shouldRunQuery ?? true,
      },
      () => {
        if (this.props.mode === 'edit') {
          let source = props.dataSources.find((datasource) => datasource.id === selectedQuery.data_source_id);
          if (selectedQuery.kind === 'restapi') {
            if (!selectedQuery.data_source_id) {
              source = { kind: 'restapi', id: 'null', name: 'REST API' };
            }
          }
          if (selectedQuery.kind === 'runjs') {
            if (!selectedQuery.data_source_id) {
              source = { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' };
            }
          }

          this.setState({
            options:
              paneHeightChanged || this.state.selectedQuery?.id === selectedQuery?.id
                ? this.state.options
                : selectedQuery.options,
            selectedDataSource: source,
            selectedQuery,
            queryName: selectedQuery.name,
          });
        }
      }
    );
  };

  componentWillReceiveProps(nextProps) {
    // const themeModeChanged = this.props.darkMode !== nextProps.darkMode;
    // if (!nextProps.isQueryPaneDragging && !this.state.paneHeightChanged && !themeModeChanged) {
    //   if (this.props.mode === 'create' && this.state.isFieldsChanged) {
    //     this.setState({ showSaveConfirmation: true, nextProps });
    //     return;
    //   } else if (this.props.mode === 'edit') {
    //     if (this.state.selectedQuery) {
    //       const isQueryChanged = !_.isEqual(
    //         this.removeRestKey(this.state.options),
    //         this.removeRestKey(this.state.selectedQuery.options)
    //       );
    //       if (this.state.isFieldsChanged && isQueryChanged) {
    //         this.setState({ showSaveConfirmation: true, nextProps });
    //         return;
    //       } else if (
    //         !isQueryChanged &&
    //         this.state.selectedQuery.kind === 'restapi' &&
    //         this.state.restArrayValuesChanged
    //       ) {
    //         this.setState({ showSaveConfirmation: true, nextProps });
    //         return;
    //       }
    //     }
    //   }
    // }
    if (!isEmpty(this.state.updatedQuery)) {
      const query = nextProps.dataQueries.find((q) => q.id === this.state.updatedQuery.id);
      if (query) {
        const isLoading = nextProps.currentState?.queries[query.name]
          ? nextProps.currentState?.queries[query.name]?.isLoading
          : false;
        const prevLoading = this.state.currentState?.queries[query.name]
          ? this.state.currentState?.queries[query.name]?.isLoading
          : false;
        if (!isEmpty(nextProps.selectedQuery) && !isEqual(this.state.selectedQuery, nextProps.selectedQuery)) {
          if (query && !isLoading && !prevLoading) {
            this.props.runQuery(query.id, query.name);
          }
        } else if (!isLoading && prevLoading) {
          this.state.updatedQuery.updateQuery
            ? this.setState({ updatedQuery: {}, isUpdating: false })
            : this.setState({ updatedQuery: {}, isCreating: false });
        }
      }
    }
    this.setStateFromProps(nextProps);
  }

  removeRestKey = (options) => {
    delete options.arrayValuesChanged;
    return options;
  };

  componentDidMount() {
    this.setStateFromProps(this.props);
  }

  handleBackButton = () => {
    this.setState({
      isSourceSelected: true,
    });
  };

  changeDataSource = (sourceId) => {
    const source = [...this.state.dataSources, ...staticDataSources].find((datasource) => datasource.id === sourceId);

    const isSchemaUnavailable = ['restapi', 'stripe', 'runjs'].includes(source.kind);
    const schemaUnavailableOptions = {
      restapi: {
        method: 'get',
        url: null,
        url_params: [],
        headers: [],
        body: [],
      },
      stripe: {},
      runjs: {},
    };

    this.setState({
      selectedDataSource: source,
      selectedSource: source,
      queryName: this.computeQueryName(source.kind),
      ...(isSchemaUnavailable && {
        options: schemaUnavailableOptions[source.kind],
      }),
    });
  };

  switchCurrentTab = (tab) => {
    this.setState({
      currentTab: tab,
    });
  };

  validateQueryName = () => {
    const { queryName, dataQueries, mode, selectedQuery } = this.state;

    if (mode === 'create') {
      return dataQueries.find((query) => query.name === queryName) === undefined && queryNameRegex.test(queryName);
    }
    const existingQuery = dataQueries.find((query) => query.name === queryName);
    if (existingQuery) {
      return existingQuery.id === selectedQuery.id && queryNameRegex.test(queryName);
    }
    return queryNameRegex.test(queryName);
  };

  computeQueryName = (kind) => {
    const { dataQueries } = this.state;
    const currentQueriesForKind = dataQueries.filter((query) => query.kind === kind);
    let found = false;
    let newName = '';
    let currentNumber = currentQueriesForKind.length + 1;

    while (!found) {
      newName = `${kind}${currentNumber}`;
      if (dataQueries.find((query) => query.name === newName) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }

    return newName;
  };

  createOrUpdateDataQuery = () => {
    const { appId, options, selectedDataSource, mode, queryName, shouldRunQuery } = this.state;
    const appVersionId = this.props.editingVersionId;
    const kind = selectedDataSource.kind;
    const dataSourceId = selectedDataSource.id === 'null' ? null : selectedDataSource.id;

    const isQueryNameValid = this.validateQueryName();
    if (!isQueryNameValid) {
      toast.error('Invalid query name. Should be unique and only include letters, numbers and underscore.');
      return;
    }

    if (mode === 'edit') {
      this.setState({ isUpdating: true });
      dataqueryService
        .update(this.state.selectedQuery.id, queryName, options)
        .then((data) => {
          this.setState({
            isUpdating: shouldRunQuery ? true : false,
            isFieldsChanged: false,
            restArrayValuesChanged: false,
            updatedQuery: shouldRunQuery ? { ...data, updateQuery: true } : {},
          });
          this.props.dataQueriesChanged();
          this.props.setStateOfUnsavedQueries(false);
        })
        .catch(({ error }) => {
          this.setState({ isUpdating: false, isFieldsChanged: false, restArrayValuesChanged: false });
          this.props.setStateOfUnsavedQueries(false);
          toast.error(error);
        });
    } else {
      this.setState({ isCreating: true });
      dataqueryService
        .create(appId, appVersionId, queryName, kind, options, dataSourceId)
        .then((data) => {
          toast.success('Query Added');
          this.setState({
            isCreating: shouldRunQuery ? true : false,
            isFieldsChanged: false,
            restArrayValuesChanged: false,
            updatedQuery: shouldRunQuery ? { ...data, updateQuery: false } : {},
          });
          this.props.dataQueriesChanged();
          this.props.setStateOfUnsavedQueries(false);
        })
        .catch(({ error }) => {
          this.setState({ isCreating: false, isFieldsChanged: false, restArrayValuesChanged: false });
          this.props.setStateOfUnsavedQueries(false);
          toast.error(error);
        });
    }
  };

  validateNewOptions = (newOptions) => {
    const headersChanged = newOptions.arrayValuesChanged ?? false;
    let isFieldsChanged = false;
    if (this.state.selectedQuery) {
      const isQueryChanged = !_.isEqual(
        this.removeRestKey(newOptions),
        this.removeRestKey(this.state.selectedQuery.options)
      );
      if (isQueryChanged) {
        isFieldsChanged = true;
      } else if (this.state.selectedQuery.kind === 'restapi' && headersChanged) {
        isFieldsChanged = true;
      }
    } else if (this.props.mode === 'create') {
      isFieldsChanged = true;
    }
    if (isFieldsChanged) this.props.setStateOfUnsavedQueries(true);
    this.setState({
      options: newOptions,
      isFieldsChanged,
      restArrayValuesChanged: headersChanged,
    });
  };

  optionchanged = (option, value) => {
    const newOptions = { ...this.state.options, [option]: value };
    this.validateNewOptions(newOptions);
  };

  optionsChanged = (newOptions) => {
    this.validateNewOptions(newOptions);
  };

  toggleOption = (option) => {
    const currentValue = this.state.options[option] ? this.state.options[option] : false;
    this.optionchanged(option, !currentValue);
  };

  // Here we have mocked data query in format of a component to be usable by event manager
  // TODO: Refactor EventManager to be generic
  mockDataQueryAsComponent = () => {
    const dataQueryEvents = this.state.options?.events || [];

    return {
      component: { component: { definition: { events: dataQueryEvents } } },
      componentMeta: {
        events: {
          onDataQuerySuccess: { displayName: 'Query Success' },
          onDataQueryFailure: { displayName: 'Query Failure' },
        },
      },
    };
  };

  eventsChanged = (events) => {
    this.optionchanged('events', events);
  };

  updateButtonText = (text, shouldRunQuery) => {
    if (this.state.mode === 'edit') {
      this.buttonConfig = { ...this.buttonConfig, editMode: { text: text, shouldRunQuery: shouldRunQuery } };
      localStorage.setItem('queryManagerButtonConfig', JSON.stringify(this.buttonConfig));
    } else {
      this.buttonConfig = { ...this.buttonConfig, createMode: { text: text, shouldRunQuery: shouldRunQuery } };
      localStorage.setItem('queryManagerButtonConfig', JSON.stringify(this.buttonConfig));
    }
    this.setState({ buttonText: text, shouldRunQuery: shouldRunQuery });
  };

  render() {
    const {
      dataSources,
      selectedDataSource,
      mode,
      options,
      currentTab,
      isUpdating,
      isCreating,
      addingQuery,
      editingQuery,
      selectedQuery,
      currentState,
      queryName,
      previewLoading,
      queryPreviewData,
      dataSourceMeta,
    } = this.state;

    let ElementToRender = '';

    if (selectedDataSource) {
      const sourcecomponentName = selectedDataSource.kind.charAt(0).toUpperCase() + selectedDataSource.kind.slice(1);
      ElementToRender = allSources[sourcecomponentName];
    }

    let dropDownButtonText = mode === 'edit' ? 'Save' : 'Create';
    const buttonDisabled = isUpdating || isCreating;
    const mockDataQueryComponent = this.mockDataQueryAsComponent();
    const Icon = allSvgs[this?.state?.selectedDataSource?.kind];

    return (
      <div className="query-manager" key={selectedQuery ? selectedQuery.id : ''}>
        <ReactTooltip type="dark" effect="solid" delayShow={250} />
        {/* <Confirm
          show={this.state.showSaveConfirmation}
          message={'Query is unsaved, save or leave without saving. Do you want to save?'}
          onConfirm={() => this.createOrUpdateDataQuery()}
          onCancel={() => {
            this.setState({ showSaveConfirmation: false, isFieldsChanged: false });
            this.setStateFromProps(this.state.nextProps);
            this.props.setStateOfUnsavedQueries(false);
          }}
          queryConfirmationData={this.state.queryConfirmationData}
        /> */}
        <div className="row header">
          <div className="col">
            {(addingQuery || editingQuery) && selectedDataSource && (
              <div className="nav-header">
                <ul className="nav nav-tabs query-manager-header" data-bs-toggle="tabs">
                  <li className="nav-item">
                    <a
                      onClick={() => this.switchCurrentTab(1)}
                      className={currentTab === 1 ? 'nav-link active' : 'nav-link'}
                    >
                      &nbsp; General
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      onClick={() => this.switchCurrentTab(2)}
                      className={currentTab === 2 ? 'nav-link active' : 'nav-link'}
                    >
                      &nbsp; Advanced
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
          {(addingQuery || editingQuery) && selectedDataSource && (
            <div className="col-2 query-name-field">
              <input
                type="text"
                onChange={(e) => this.setState({ queryName: e.target.value })}
                className="form-control-plaintext form-control-plaintext-sm mt-1"
                value={queryName}
                autoFocus={false}
              />
            </div>
          )}
          <div className="col-auto px-1 m-auto">
            {selectedDataSource && (addingQuery || editingQuery) && (
              <button
                onClick={() => {
                  const _options = { ...options };

                  const query = {
                    data_source_id: selectedDataSource.id === 'null' ? null : selectedDataSource.id,
                    options: _options,
                    kind: selectedDataSource.kind,
                  };
                  previewQuery(this, query)
                    .then(() => {
                      this.previewPanelRef.current.scrollIntoView();
                    })
                    .catch(({ error, data }) => {
                      console.log(error, data);
                    });
                }}
                className={`btn button-family-secondary m-1 float-right1 ${previewLoading ? 'button-loading' : ''} ${
                  this.props.darkMode ? 'dark' : ''
                } ${this.state.selectedDataSource ? '' : 'disabled'}`}
                style={{ width: '72px', height: '28px' }}
              >
                Preview
              </button>
            )}
            {selectedDataSource && (addingQuery || editingQuery) && (
              <Dropdown as={ButtonGroup} className={'m-1 float-right'} style={{ display: 'initial', height: '28px' }}>
                <Button
                  className={`btn btn-primary ${isUpdating || isCreating ? 'btn-loading' : ''} ${
                    this.state.selectedDataSource ? '' : 'disabled'
                  }`}
                  style={{ height: '28px', zIndex: 10 }}
                  onClick={this.createOrUpdateDataQuery}
                  disabled={buttonDisabled}
                >
                  {this.state.buttonText}
                </Button>
                <Dropdown.Toggle
                  split
                  className="btn btn-primary d-none d-lg-inline create-save-button-dropdown-toggle"
                  style={{ height: '28px', paddingTop: '5px' }}
                />
                <Dropdown.Menu className="import-lg-position">
                  <Dropdown.Item
                    onClick={() => {
                      this.updateButtonText(dropDownButtonText, false);
                    }}
                  >
                    {dropDownButtonText}
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      this.updateButtonText(`${dropDownButtonText} & Run`, true);
                    }}
                  >
                    {`${dropDownButtonText} & Run`}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
            <span onClick={this.props.toggleQueryEditor} className="cursor-pointer m-3" data-tip="Hide query editor">
              <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L9 9L17 1" stroke="#61656F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        {(addingQuery || editingQuery) && (
          <div className="py-2">
            {currentTab === 1 && (
              <div className="row row-deck px-2 mt-0 query-details">
                {dataSources && mode === 'create' && (
                  <div className="datasource-picker mt-1 mb-2">
                    <div className="datasource-heading ">
                      {this.state.selectedDataSource !== null && (
                        <p
                          onClick={() => {
                            this.setState({
                              isSourceSelected: false,
                              selectedDataSource: null,
                            });
                          }}
                          style={{ marginTop: '-7px' }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon icon-tabler icon-tabler-arrow-left"
                            width="44"
                            height="44"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="#9e9e9e"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <line x1="5" y1="12" x2="11" y2="18" />
                            <line x1="5" y1="12" x2="11" y2="6" />
                          </svg>
                        </p>
                      )}
                      {!this.state.isSourceSelected && <label className="form-label col-md-3">Select Datasource</label>}{' '}
                      {this?.state?.selectedDataSource?.kind && (
                        <div className="header-query-datasource-card-container">
                          <div
                            className="header-query-datasource-card badge "
                            style={{
                              background: this.props.darkMode ? '#2f3c4c' : 'white',
                              color: this.props.darkMode ? 'white' : '#3e525b',
                            }}
                          >
                            {this.state?.selectedDataSource?.kind === 'runjs' ? (
                              <RunjsIcon style={{ height: 18, width: 18, marginTop: '-3px' }} />
                            ) : (
                              Icon && <Icon style={{ height: 18, width: 18, marginLeft: 7 }} />
                            )}
                            <p className="header-query-datasource-name">
                              {' '}
                              {this.state?.selectedDataSource?.kind && this.state.selectedDataSource.kind}
                            </p>
                          </div>{' '}
                        </div>
                      )}
                    </div>
                    {!this.state.isSourceSelected && (
                      <DataSourceLister
                        dataSources={dataSources}
                        staticDataSources={staticDataSources}
                        changeDataSource={this.changeDataSource}
                        handleBackButton={this.handleBackButton}
                        darkMode={this.props.darkMode}
                        dataSourceModalHandler={this.props.dataSourceModalHandler}
                      />
                    )}
                  </div>
                )}

                {selectedDataSource && (
                  <div>
                    <ElementToRender
                      selectedDataSource={selectedDataSource}
                      options={this.state.options}
                      optionsChanged={this.optionsChanged}
                      optionchanged={this.optionchanged}
                      currentState={currentState}
                      darkMode={this.props.darkMode}
                      isEditMode={this.props.mode === 'edit'}
                      queryName={this.state.queryName}
                    />

                    {!dataSourceMeta?.disableTransformations && selectedDataSource?.kind != 'runjs' && (
                      <div>
                        <div className="mb-3 mt-4">
                          <Transformation
                            changeOption={this.optionchanged}
                            options={this.props.selectedQuery.options ?? {}}
                            currentState={currentState}
                            darkMode={this.props.darkMode}
                          />
                        </div>
                      </div>
                    )}
                    <Preview
                      previewPanelRef={this.previewPanelRef}
                      previewLoading={previewLoading}
                      queryPreviewData={queryPreviewData}
                      theme={this.state.theme}
                      darkMode={this.props.darkMode}
                    />
                  </div>
                )}
              </div>
            )}

            {currentTab === 2 && (
              <div className="advanced-options-container m-2">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => this.toggleOption('runOnPageLoad')}
                    checked={this.state.options.runOnPageLoad}
                  />
                  <span className="form-check-label">Run this query on page load?</span>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => this.toggleOption('requestConfirmation')}
                    checked={this.state.options.requestConfirmation}
                  />
                  <span className="form-check-label">Request confirmation before running query?</span>
                </div>

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => this.toggleOption('showSuccessNotification')}
                    checked={this.state.options.showSuccessNotification}
                  />
                  <span className="form-check-label">Show notification on success?</span>
                </div>
                {this.state.options.showSuccessNotification && (
                  <div>
                    <div className="row mt-3">
                      <div className="col-auto">
                        <label className="form-label p-2">Success Message</label>
                      </div>
                      <div className="col">
                        <CodeHinter
                          currentState={this.props.currentState}
                          initialValue={this.state.options.successMessage}
                          height="36px"
                          className="form-control"
                          theme={'default'}
                          onChange={(value) => this.optionchanged('successMessage', value)}
                          placeholder="Query ran successfully"
                        />
                      </div>
                    </div>

                    <div className="row mt-3">
                      <div className="col-auto">
                        <label className="form-label p-2">Notification duration (s)</label>
                      </div>
                      <div className="col">
                        <input
                          type="number"
                          disabled={!this.state.options.showSuccessNotification}
                          onChange={(e) => this.optionchanged('notificationDuration', e.target.value)}
                          placeholder={5}
                          className="form-control"
                          value={this.state.options.notificationDuration}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="hr-text hr-text-left">Events</div>

                <div className="query-manager-events">
                  <EventManager
                    eventsChanged={this.eventsChanged}
                    component={mockDataQueryComponent.component}
                    componentMeta={mockDataQueryComponent.componentMeta}
                    currentState={this.props.currentState}
                    dataQueries={this.props.dataQueries}
                    components={this.props.allComponents}
                    apps={this.props.apps}
                    popoverPlacement="top"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};

QueryManager = React.memo(QueryManager);
export { QueryManager };
