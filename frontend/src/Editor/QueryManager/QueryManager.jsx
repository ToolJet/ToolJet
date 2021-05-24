import React from 'react';
import { dataqueryService } from '@/_services';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import ReactTooltip from 'react-tooltip';
import { allSources } from './QueryEditors';
import { Transformation } from './Transformation';
import { defaultOptions } from './constants';
import ReactJson from 'react-json-view';
import {
  previewQuery
} from '@/_helpers/appUtils';

const queryNameRegex = new RegExp('^[A-Za-z0-9_-]*$');

const staticDataSources = [{ kind: 'restapi', id: 'restapi', name: 'REST API' }];

class QueryManager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.previewPanelRef = React.createRef();
  }

  setStateFromProps = (props) => {
    const selectedQuery = props.selectedQuery;

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
      },
      () => {
        if (this.props.mode === 'edit') {
          let source = props.dataSources.find((datasource) => datasource.id === selectedQuery.data_source_id);
          if(selectedQuery.kind === 'restapi') source = { kind: 'restapi' };

          this.setState({
            options: selectedQuery.options,
            selectedDataSource: source,
            selectedQuery,
            queryName: selectedQuery.name
          });
        } else {
          this.setState({
            options: {},
            selectedQuery: null
          });
        }
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
    this.setState({
      selectedDataSource: source,
      options: defaultOptions[source.kind],
      queryName: this.computeQueryName(source.kind)
    });
  };

  switchCurrentTab = (tab) => {
    this.setState({
      currentTab: tab
    });
  };

  validateQueryName = () => {
    const {
      queryName, dataQueries, mode, selectedQuery
    } = this.state;

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
    const {
      appId, options, selectedDataSource, mode, queryName
    } = this.state;
    const kind = selectedDataSource.kind;
    const dataSourceId = selectedDataSource.id;

    const isQueryNameValid = this.validateQueryName();
    if (!isQueryNameValid) {
      toast.error('Invalid query name. Should be unique and only include letters, numbers and underscore.', {
        hideProgressBar: true,
        position: 'bottom-center'
      });
      return;
    }

    if (mode === 'edit') {
      this.setState({ isUpdating: true });
      dataqueryService.update(this.state.selectedQuery.id, queryName, options).then(() => {
        toast.success('Query Updated', { hideProgressBar: true, position: 'bottom-center' });
        this.setState({ isUpdating: false });
        this.props.dataQueriesChanged();
      }).catch(( { error }) => {
        this.setState({ isUpdating: false });
        toast.error(error, { hideProgressBar: true, position: 'bottom-center' });
      });
    } else {
      this.setState({ isCreating: true });
      dataqueryService.create(appId, queryName, kind, options, dataSourceId).then(() => {
        toast.success('Query Added', { hideProgressBar: true, position: 'bottom-center' });
        this.setState({ isCreating: false });
        this.props.dataQueriesChanged();
      }).catch(({ error }) => {
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
      queryPaneHeight,
      currentState,
      queryName,
      previewLoading,
      queryPreviewData
    } = this.state;

    let ElementToRender = '';

    if (selectedDataSource) {
      const sourcecomponentName = selectedDataSource.kind.charAt(0).toUpperCase() + selectedDataSource.kind.slice(1);
      ElementToRender = allSources[sourcecomponentName];
    }

    let buttonText = mode === 'edit' ? 'Save' : 'Create';
    const buttonDisabled = isUpdating || isCreating;

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
          {((addingQuery || editingQuery) && selectedDataSource) && (
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
                  <img src="https://www.svgrepo.com/show/149235/edit.svg" width="12" height="12" />
                </span>
              </div>
            </div>
          )}
          <div className="col-auto">
            {(addingQuery || editingQuery) && (
              <span
                onClick={() => { 
                  const query = { data_source_id: selectedDataSource.id, options: options, kind: selectedDataSource.kind };
                  previewQuery(this, query).then(() => {
                    toast.info(`Query (${query.name}) completed.`, {
                      hideProgressBar: true,
                      position: 'bottom-center'
                    });
                    this.previewPanelRef.current.scrollIntoView();
                  }).catch(( { error, data } ) => { 
                    debugger
                  });
                }}
                className={`btn btn-secondary m-1 float-right1 ${
                  previewLoading ? ' btn-loading' : ''
                }`}
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
            {queryPaneHeight === '30%' ? (
              <span
                className="btn btn-light m-1"
                onClick={this.props.toggleQueryPaneHeight}
                data-tip="Maximize query editor"
              >
                <img src="https://www.svgrepo.com/show/310311/arrow-maximize.svg" width="12" height="12" />
              </span>
            ) : (
              <span
                className="btn btn-light m-1"
                onClick={this.props.toggleQueryPaneHeight}
                data-tip="Minimize query editor"
              >
                <img src="https://www.svgrepo.com/show/310476/arrow-minimize.svg" width="12" height="12" />
              </span>
            )}
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
                        })
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
                    <ElementToRender options={this.state.options} optionsChanged={this.optionsChanged} currentState={currentState}/>
                    <hr></hr>
                    <div className="mb-3 mt-2">
                      <Transformation changeOption={this.optionchanged} options={this.state.options} currentState={currentState}/>
                    </div>
                    <div className="row preview-header border-top" ref={this.previewPanelRef}>
                      <div className="py-2">
                        Preview
                      </div>
                    </div>
                    <div className="mb-3 mt-2">
                      {previewLoading &&  <center><div class="spinner-border text-azure mt-5" role="status"></div></center>}
                      {previewLoading === false && 
                        <div>
                          <ReactJson
                            name={false}
                            style={{ fontSize: '0.7rem' }}
                            enableClipboard={false}
                            src={queryPreviewData}
                            displayDataTypes={true}
                            collapsed={false}
                            displayObjectSize={true}
                            quotesOnKeys={false}
                            sortKeys={true}
                            indentWidth={1}
                          />
                        </div>
                      }
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

                <hr />

                <label className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => this.toggleOption('showSuccessNotification')}
                    checked={this.state.options.showSuccessNotification}
                  />
                  <span className="form-check-label">Show notification on success?</span>
                </label>

                <div className="row mt-3">
                  <div className="col-auto">
                    <label className="form-label p-2">Success Message</label>
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      disabled={!this.state.options.showSuccessNotification}
                      onChange={(e) => this.optionchanged('successMessage', e.target.value)}
                      placeholder="Query ran successfully"
                      className="form-control"
                      value={this.state.options.successMessage}
                    />
                  </div>
                </div>

                <hr />

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
          </div>
        )}
      </div>
    );
  }
}

export { QueryManager };
