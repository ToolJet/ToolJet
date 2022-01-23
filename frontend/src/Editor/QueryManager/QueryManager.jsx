import React from 'react';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import ReactTooltip from 'react-tooltip';
import { allSources } from './QueryEditors';
import { Transformation } from './Transformation';
import ReactJson from 'react-json-view';
import { previewQuery } from '@/_helpers/appUtils';
import { EventManager } from '../Inspector/EventManager';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { DataSourceTypes } from '../DataSourceManager/SourceComponents';
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
    };

    this.previewPanelRef = React.createRef();
  }

  setStateFromProps = (props) => {
    const selectedQuery = props.selectedQuery;
    const dataSourceId = selectedQuery?.data_source_id;
    const source = props.dataSources.find((datasource) => datasource.id === dataSourceId);
    let dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedQuery?.kind);
    const paneHeightChanged = this.state.queryPaneHeight !== props.queryPaneHeight;

    this.setState(
      {
        appId: props.appId,
        dataSources: props.dataSources,
        dataQueries: props.dataQueries,
        mode: props.mode,
        currentTab: 1,
        addingQuery: props.addingQuery,
        editingQuery: props.editingQuery,
        queryPaneHeight: props.queryPaneHeight,
        currentState: props.currentState,
        selectedSource: source,
        dataSourceMeta,
        selectedDataSource: paneHeightChanged ? this.state.selectedDataSource : props.selectedDataSource,
      },
      () => {
        if (this.props.mode === 'edit') {
          let source = props.dataSources.find((datasource) => datasource.id === selectedQuery.data_source_id);
          if (selectedQuery.kind === 'restapi') {
            if (!selectedQuery.data_source_id) {
              source = { kind: 'restapi' };
            }
          }
          if (selectedQuery.kind === 'runjs') {
            if (!selectedQuery.data_source_id) {
              source = { kind: 'runjs' };
            }
          }

          this.setState({
            options: paneHeightChanged ? this.state.options : selectedQuery.options,
            selectedDataSource: source,
            selectedQuery,
            queryName: selectedQuery.name,
          });
        }
        // } else {
        // this.setState({
        //   options: {},
        //   selectedQuery: null,
        //   selectedDataSource: paneHeightChanged ? this.state.selectedDataSource : props.selectedDataSource,
        // });
        // }
      }
    );
  };

  componentWillReceiveProps(nextProps) {
    this.setStateFromProps(nextProps);
  }

  componentDidMount() {
    this.setStateFromProps(this.props);
  }

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
      ...(isSchemaUnavailable && { options: schemaUnavailableOptions[source.kind] }),
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
    const { appId, options, selectedDataSource, mode, queryName } = this.state;
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
        .then(() => {
          toast.success('Query Updated');
          this.setState({ isUpdating: false });
          this.props.dataQueriesChanged();
        })
        .catch(({ error }) => {
          this.setState({ isUpdating: false });
          toast.error(error);
        });
    } else {
      this.setState({ isCreating: true });
      dataqueryService
        .create(appId, appVersionId, queryName, kind, options, dataSourceId)
        .then(() => {
          toast.success('Query Added');
          this.setState({ isCreating: false });
          this.props.dataQueriesChanged();
        })
        .catch(({ error }) => {
          this.setState({ isCreating: false });
          toast.error(error);
        });
    }
  };

  optionchanged = (option, value) => {
    this.setState({ options: { ...this.state.options, [option]: value } });
  };

  optionsChanged = (newOptions) => {
    this.setState({ options: newOptions });
  };

  toggleOption = (option) => {
    const currentValue = this.state.options[option] ? this.state.options[option] : false;
    this.optionchanged(option, !currentValue);
  };

  renderDataSourceOption = (props, option, snapshot, className) => {
    const icon = option.kind ? `/assets/images/icons/editor/datasources/${option.kind.toLowerCase() + '.svg'}` : null;
    return (
      <button
        {...props}
        className={`${className} ${this.props.darkMode ? 'select-search__option__dark' : ''}`}
        type="button"
      >
        <div>
          <span>
            {icon && (
              <img
                src={icon}
                style={{
                  margin: 'auto',
                  marginRight: '3px',
                }}
                height="25"
                width="25"
              ></img>
            )}
            {option.name}
          </span>
        </div>
      </button>
    );
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

    let buttonText = mode === 'edit' ? 'Save' : 'Create';
    const buttonDisabled = isUpdating || isCreating;
    const mockDataQueryComponent = this.mockDataQueryAsComponent();

    return (
      <div className="query-manager" key={selectedQuery ? selectedQuery.id : ''}>
        <ReactTooltip type="dark" effect="solid" delayShow={250} />
        <div className="row header">
          <div className="col">
            {(addingQuery || editingQuery) && (
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
            <div className="col query-name-field">
              <div className="input-icon" style={{ width: '160px' }}>
                <input
                  type="text"
                  onChange={(e) => this.setState({ queryName: e.target.value })}
                  className="form-control-plaintext form-control-plaintext-sm mt-1"
                  value={queryName}
                  style={{ width: '160px' }}
                  autoFocus={false}
                />
                <span className="input-icon-addon">
                  <img className="svg-icon" src="/assets/images/icons/edit.svg" width="12" height="12" />
                </span>
              </div>
            </div>
          )}
          <div className="col-auto px-1 m-auto">
            {(addingQuery || editingQuery) && (
              <span
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
                className={`btn btn-secondary m-1 float-right1 ${previewLoading ? ' btn-loading' : ''}`}
              >
                Preview
              </span>
            )}
            {(addingQuery || editingQuery) && (
              <button
                onClick={this.createOrUpdateDataQuery}
                disabled={buttonDisabled}
                className={`btn btn-primary m-1 float-right ${isUpdating || isCreating ? 'btn-loading' : ''}`}
              >
                {buttonText}
              </button>
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
              <div className="row row-deck px-2 pt-1 query-details">
                {dataSources && mode === 'create' && (
                  <div className="datasource-picker mb-2">
                    <label className="form-label col-md-2">Datasource</label>
                    <Select
                      options={[
                        ...dataSources.map((source) => {
                          return { label: source.name, value: source.id };
                        }),
                        ...staticDataSources.map((source) => {
                          return { label: source.name, value: source.id };
                        }),
                      ]}
                      onChange={(newValue) => this.changeDataSource(newValue.value)}
                      placeholder="Select a data source"
                      styles={{
                        menu: (provided) => ({
                          ...provided,
                          zIndex: 2,
                        }),
                      }}
                    />
                  </div>
                )}

                {selectedDataSource && (
                  <div>
                    <ElementToRender
                      selectedDataSource={this.state.selectedSource}
                      options={this.state.options}
                      optionsChanged={this.optionsChanged}
                      optionchanged={this.optionchanged}
                      currentState={currentState}
                      darkMode={this.props.darkMode}
                      isEditMode={this.props.mode === 'edit'}
                      queryName={this.state.queryName}
                    />
                    {!dataSourceMeta?.disableTransformations && (
                      <div>
                        <hr></hr>
                        <div className="mb-3 mt-2">
                          <Transformation
                            changeOption={this.optionchanged}
                            options={this.props.selectedQuery.options ?? {}}
                            currentState={currentState}
                            darkMode={this.props.darkMode}
                          />
                        </div>
                      </div>
                    )}
                    <div className="row preview-header border-top" ref={this.previewPanelRef}>
                      <div className="py-2">Preview</div>
                    </div>
                    <div className="mb-3 mt-2">
                      {previewLoading && (
                        <center>
                          <div className="spinner-border text-azure mt-5" role="status"></div>
                        </center>
                      )}
                      {previewLoading === false && (
                        <div>
                          <ReactJson
                            name={false}
                            style={{ fontSize: '0.7rem' }}
                            enableClipboard={false}
                            src={queryPreviewData}
                            theme={this.props.darkMode ? 'shapeshifter' : 'rjv-default'}
                            displayDataTypes={true}
                            collapsed={false}
                            displayObjectSize={true}
                            quotesOnKeys={false}
                            sortKeys={true}
                            indentWidth={1}
                          />
                        </div>
                      )}
                    </div>
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
