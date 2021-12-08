import React from 'react';
import { dataqueryService } from '@/_services';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
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
    // const paneHeightChanged = this.state.queryPaneHeight !== props.queryPaneHeight;

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
        selectedDataSource: props.selectedDataSource,
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
            options: selectedQuery.options,
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
    const kind = selectedDataSource.kind;
    const dataSourceId = selectedDataSource.id === 'null' ? null : selectedDataSource.id;

    const isQueryNameValid = this.validateQueryName();
    if (!isQueryNameValid) {
      toast.error('Invalid query name. Should be unique and only include letters, numbers and underscore.', {
        hideProgressBar: true,
        position: 'bottom-center',
      });
      return;
    }

    if (mode === 'edit') {
      this.setState({ isUpdating: true });
      dataqueryService
        .update(this.state.selectedQuery.id, queryName, options)
        .then(() => {
          toast.success('Query Updated', { hideProgressBar: true, position: 'bottom-center' });
          this.setState({ isUpdating: false });
          this.props.dataQueriesChanged();
        })
        .catch(({ error }) => {
          this.setState({ isUpdating: false });
          toast.error(error, { hideProgressBar: true, position: 'bottom-center' });
        });
    } else {
      this.setState({ isCreating: true });
      dataqueryService
        .create(appId, queryName, kind, options, dataSourceId)
        .then(() => {
          toast.success('Query Added', { hideProgressBar: true, position: 'bottom-center' });
          this.setState({ isCreating: false });
          this.props.dataQueriesChanged();
        })
        .catch(({ error }) => {
          this.setState({ isCreating: false });
          toast.error(error, { hideProgressBar: true, position: 'bottom-center' });
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
    return (
      <button {...props} className={className} type="button">
        <div className="row">
          <div className="col-md-9">
            <span className="text-muted mx-2">{option.name}</span>
          </div>
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

  renderQueryEditorIcon = () => {
    if (this.state.queryPaneHeight === '30%') {
      return (
        <span
          className="cursor-pointer m-3"
          onClick={this.props.toggleQueryPaneHeight}
          data-tip="Maximize query editor"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 1C16 0.734784 15.8946 0.48043 15.7071 0.292893C15.5196 0.105357 15.2652 0 15 0H10C9.73478 0 9.48043 0.105357 9.29289 0.292893C9.10536 0.48043 9 0.734784 9 1C9 1.26522 9.10536 1.51957 9.29289 1.70711C9.48043 1.89464 9.73478 2 10 2H12.57L9.29 5.29C9.19627 5.38296 9.12188 5.49356 9.07111 5.61542C9.02034 5.73728 8.9942 5.86799 8.9942 6C8.9942 6.13201 9.02034 6.26272 9.07111 6.38458C9.12188 6.50644 9.19627 6.61704 9.29 6.71C9.38296 6.80373 9.49356 6.87812 9.61542 6.92889C9.73728 6.97966 9.86799 7.0058 10 7.0058C10.132 7.0058 10.2627 6.97966 10.3846 6.92889C10.5064 6.87812 10.617 6.80373 10.71 6.71L14 3.42V6C14 6.26522 14.1054 6.51957 14.2929 6.70711C14.4804 6.89464 14.7348 7 15 7C15.2652 7 15.5196 6.89464 15.7071 6.70711C15.8946 6.51957 16 6.26522 16 6V1ZM6.71 9.29C6.61704 9.19627 6.50644 9.12188 6.38458 9.07111C6.26272 9.02034 6.13201 8.9942 6 8.9942C5.86799 8.9942 5.73728 9.02034 5.61542 9.07111C5.49356 9.12188 5.38296 9.19627 5.29 9.29L2 12.57V10C2 9.73478 1.89464 9.48043 1.70711 9.29289C1.51957 9.10536 1.26522 9 1 9C0.734784 9 0.48043 9.10536 0.292893 9.29289C0.105357 9.48043 0 9.73478 0 10V15C0 15.2652 0.105357 15.5196 0.292893 15.7071C0.48043 15.8946 0.734784 16 1 16H6C6.26522 16 6.51957 15.8946 6.70711 15.7071C6.89464 15.5196 7 15.2652 7 15C7 14.7348 6.89464 14.4804 6.70711 14.2929C6.51957 14.1054 6.26522 14 6 14H3.42L6.71 10.71C6.80373 10.617 6.87812 10.5064 6.92889 10.3846C6.97966 10.2627 7.0058 10.132 7.0058 10C7.0058 9.86799 6.97966 9.73728 6.92889 9.61542C6.87812 9.49356 6.80373 9.38296 6.71 9.29Z"
              fill="#61656F"
            />
          </svg>
        </span>
      );
    }

    return (
      <span className="cursor-pointer m-3" onClick={this.props.toggleQueryPaneHeight} data-tip="Minimize query editor">
        <svg width="16" height="16" viewBox="0 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g id="🔍-System-Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g id="ic_fluent_arrow_minimize_28_filled" fill="#212121" fillRule="nonzero">
              <path
                d="M4,15 L12,15 C12.5128358,15 12.9355072,15.3860402 12.9932723,15.8833789 L13,16 L13,24 C13,24.5522847 12.5522847,25 12,25 C11.4871642,25 11.0644928,24.6139598 11.0067277,24.1166211 L11,24 L11,18.413 L3.70710678,25.7071068 C3.31658249,26.0976311 2.68341751,26.0976311 2.29289322,25.7071068 C1.93240926,25.3466228 1.90467972,24.7793918 2.20970461,24.3871006 L2.29289322,24.2928932 L9.585,17 L4,17 C3.48716416,17 3.06449284,16.6139598 3.00672773,16.1166211 L3,16 C3,15.4871642 3.38604019,15.0644928 3.88337887,15.0067277 L4,15 L12,15 L4,15 Z M25.7071068,2.29289322 C26.0675907,2.65337718 26.0953203,3.22060824 25.7902954,3.61289944 L25.7071068,3.70710678 L18.413,11 L24,11 C24.5128358,11 24.9355072,11.3860402 24.9932723,11.8833789 L25,12 C25,12.5128358 24.6139598,12.9355072 24.1166211,12.9932723 L24,13 L16,13 C15.4871642,13 15.0644928,12.6139598 15.0067277,12.1166211 L15,12 L15,4 C15,3.44771525 15.4477153,3 16,3 C16.5128358,3 16.9355072,3.38604019 16.9932723,3.88337887 L17,4 L17,9.585 L24.2928932,2.29289322 C24.6834175,1.90236893 25.3165825,1.90236893 25.7071068,2.29289322 Z"
                id="🎨-Color"
              ></path>
            </g>
          </g>
        </svg>
      </span>
    );
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
            <>
              {this.renderQueryEditorIcon()}
              <span onClick={this.props.toggleQueryEditor} className="cursor-pointer m-3" data-tip="Hide query editor">
                <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 1L9 9L17 1"
                    stroke="#61656F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </>
          </div>
        </div>

        {(addingQuery || editingQuery) && (
          <div className="py-2">
            {currentTab === 1 && (
              <div className="row row-deck px-2 pt-1 query-details">
                {dataSources && mode === 'create' && (
                  <div className="datasource-picker mb-2">
                    <label className="form-label col-md-2">Datasource</label>
                    <SelectSearch
                      options={[
                        ...dataSources.map((source) => {
                          return { name: source.name, value: source.id };
                        }),
                        ...staticDataSources.map((source) => {
                          return { name: source.name, value: source.id };
                        }),
                      ]}
                      value={selectedDataSource ? selectedDataSource.id : ''}
                      search={true}
                      onChange={(value) => this.changeDataSource(value)}
                      filterOptions={fuzzySearch}
                      renderOption={this.renderDataSourceOption}
                      placeholder="Select a data source"
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
                    />
                    {!dataSourceMeta?.disableTransformations && (
                      <div>
                        <hr></hr>
                        <div className="mb-3 mt-2">
                          <Transformation
                            changeOption={this.optionchanged}
                            options={this.state.options}
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
                <label className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => this.toggleOption('runOnPageLoad')}
                    checked={this.state.options.runOnPageLoad}
                  />
                  <span className="form-check-label">Run this query on page load?</span>
                </label>
                <label className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => this.toggleOption('requestConfirmation')}
                    checked={this.state.options.requestConfirmation}
                  />
                  <span className="form-check-label">Request confirmation before running query?</span>
                </label>

                <label className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => this.toggleOption('showSuccessNotification')}
                    checked={this.state.options.showSuccessNotification}
                  />
                  <span className="form-check-label">Show notification on success?</span>
                </label>
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
