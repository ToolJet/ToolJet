import React from 'react';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import ReactTooltip from 'react-tooltip';
import { allSources, source } from './QueryEditors';
import { Transformation } from './Transformation';
import { previewQuery } from '@/_helpers/appUtils';
import { EventManager } from '../Inspector/EventManager';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { DataSourceTypes } from '../DataSourceManager/SourceComponents';
import Preview from './Preview';
import DataSourceLister from './DataSourceLister';
import _, { isEmpty, isEqual, capitalize } from 'lodash';
import { allOperations } from '@tooljet/plugins/client';
import { withTranslation } from 'react-i18next';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { SOURCE_CONFIGS, STATIC_DATA_SOURCES, removeRestKey, getDefaultTheme, computeQueryName } from './qmUtils';
import QMIcons from './QMIcons';
import BreadCrumb from './Header/BreadCrumb';
import PreviewButton from './Header/PreviewButton';

const queryNameRegex = new RegExp('^[A-Za-z0-9_-]*$');

class QueryManagerComponent extends React.Component {
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
    };

    this.defaultOptions = React.createRef({});
    this.previewPanelRef = React.createRef();
    this.skipSettingSourceToNull = React.createRef(false);
  }

  setStateFromProps = (props) => {
    console.log('setStateFromProps--- ', props.isUnsavedQueriesAvailable);
    const selectedQuery = props.selectedQuery;
    const dataSourceId = selectedQuery?.data_source_id;
    const source = props.dataSources.find((datasource) => datasource.id === dataSourceId);
    const selectedDataSource =
      paneHeightChanged || queryPaneDragged ? this.state.selectedDataSource : props.selectedDataSource;
    let dataSourceMeta;
    if (selectedQuery?.pluginId) {
      dataSourceMeta = selectedQuery.manifestFile.data.source;
    } else {
      dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedQuery?.kind);
    }

    const paneHeightChanged = this.state.queryPaneHeight !== props.queryPaneHeight;
    const dataQueries = props.dataQueries?.length ? props.dataQueries : this.state.dataQueries;
    const queryPaneDragged = this.state.isQueryPaneDragging !== props.isQueryPaneDragging;

    this.setState(
      {
        dataQueries: dataQueries,
        appDefinition: props.appDefinition,
        mode: props.mode,
        addingQuery: props.addingQuery,
        editingQuery: props.editingQuery,
        queryPanelHeight: props.queryPanelHeight,
        isQueryPaneDragging: props.isQueryPaneDragging,
        currentState: props.currentState,
        selectedSource: source,
        options:
          this.state.isFieldsChanged || props.isUnsavedQueriesAvailable
            ? this.state.options
            : selectedQuery?.options ?? {},
        dataSourceMeta,
        paneHeightChanged,
        isSourceSelected: paneHeightChanged || queryPaneDragged ? this.state.isSourceSelected : props.isSourceSelected,
        selectedDataSource: this.skipSettingSourceToNull.current ? this.state.selectedDataSource : selectedDataSource,
        queryPreviewData: this.state.selectedQuery?.id !== props.selectedQuery?.id ? undefined : props.queryPreviewData,
        selectedQuery: props.mode === 'create' ? selectedQuery : this.state.selectedQuery,
        isFieldsChanged: props.isUnsavedQueriesAvailable,
        theme: getDefaultTheme({ darkMode: props.darkMode }),
        shouldRunQuery: props.mode === 'edit' ? this.state.isFieldsChanged : this.props.isSourceSelected,
      },
      () => {
        let source = props.dataSources.find((datasource) => datasource.id === selectedQuery?.data_source_id);
        if (selectedQuery?.kind && !selectedQuery.data_source_id) {
          source = SOURCE_CONFIGS[selectedQuery?.kind];
        }
        if (this.props.mode === 'edit') {
          this.defaultOptions.current =
            this.state.selectedQuery?.id === selectedQuery?.id ? this.state.options : selectedQuery.options;
          this.setState({
            options: paneHeightChanged || props.isUnsavedQueriesAvailable ? this.state.options : selectedQuery.options,
            selectedQuery,
            queryName: selectedQuery.name,
          });
        }
        if (this.skipSettingSourceToNull.current) {
          this.skipSettingSourceToNull.current = false;
        } else {
          // Hack to provide state updated to codehinter suggestion
          this.setState({ selectedDataSource: null }, () => {
            this.setState({ selectedDataSource: props.mode === 'edit' ? source : selectedDataSource });
          });
        }
      }
    );
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.loadingDataSources) return;
    if (this.props.showQueryConfirmation && !nextProps.showQueryConfirmation) {
      if (this.state.isUpdating) {
        this.setState({ isUpdating: false });
      }
      if (this.state.isCreating) {
        this.setState({ isCreating: false });
      }
    }
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

    const diffProps = diff(this.props, nextProps);

    if (
      Object.keys(diffProps).length === 0 ||
      'toggleQueryEditor' in diffProps ||
      'darkMode' in diffProps ||
      (Object.keys(diffProps).length === 1 && 'addNewQueryAndDeselectSelectedQuery' in diffProps) ||
      (!this.props.isUnsavedQueriesAvailable && nextProps.isUnsavedQueriesAvailable)
    ) {
      return;
    }

    this.setStateFromProps(nextProps);
  }

  handleBackButton = () => {
    this.setState({
      isSourceSelected: true,
      queryPreviewData: undefined,
    });
  };

  changeDataSource = (source) => {
    const isSchemaUnavailable = ['restapi', 'stripe', 'runjs', 'runpy', 'tooljetdb'].includes(source.kind);
    const schemaUnavailableOptions = {
      restapi: {
        method: 'get',
        url: '',
        url_params: [['', '']],
        headers: [['', '']],
        body: [['', '']],
        json_body: null,
        body_toggle: false,
      },
      stripe: {},
      tooljetdb: {
        operation: '',
      },
      runjs: {
        code: '',
      },
      runpy: {},
    };

    let newOptions = {};

    if (isSchemaUnavailable) {
      newOptions = {
        ...{ ...schemaUnavailableOptions[source.kind] },
        ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript', enableTransformation: false }),
      };
    } else {
      const selectedSourceDefault =
        source?.plugin?.operations_file?.data?.defaults ?? allOperations[capitalize(source.kind)]?.defaults;
      if (selectedSourceDefault) {
        newOptions = {
          ...{ ...selectedSourceDefault },
          ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript', enableTransformation: false }),
        };
      } else {
        newOptions = {
          ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript', enableTransformation: false }),
        };
      }
    }
    const newQueryName = computeQueryName(this.props.dataQueries, source.kind);
    this.defaultOptions.current = { ...newOptions };

    this.setState({
      selectedDataSource: source,
      selectedSource: source,
      queryName: newQueryName,
      options: { ...newOptions },
    });

    this.props.createDraftQuery(
      { ...source, name: newQueryName, id: 'draftQuery', options: { ...newOptions } },
      source
    );
  };

  //TODO: Can moved to a util file if needed.
  validateQueryName = () => {
    const { queryName, mode, selectedQuery } = this.state;
    const { dataQueries } = this.props;
    if (mode === 'create') {
      return dataQueries.find((query) => query.name === queryName) === undefined && queryNameRegex.test(queryName);
    }
    const existingQuery = dataQueries.find((query) => query.name === queryName);
    if (existingQuery) {
      return existingQuery.id === selectedQuery.id && queryNameRegex.test(queryName);
    }
    return queryNameRegex.test(queryName);
  };

  createOrUpdateDataQuery = () => {
    const { options, selectedDataSource, mode, queryName, shouldRunQuery } = this.state;
    const { appId } = this.props;
    const appVersionId = this.props.editingVersionId;
    const kind = selectedDataSource.kind;
    const dataSourceId = selectedDataSource.id === 'null' ? null : selectedDataSource.id;
    const pluginId = selectedDataSource.plugin_id;

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
          localStorage.removeItem('transformation');
          toast.success('Query Saved');
        })
        .catch(({ error }) => {
          this.setState({
            isUpdating: false,
            isFieldsChanged: false,
            restArrayValuesChanged: false,
          });
          this.props.setStateOfUnsavedQueries(false);
          toast.error(error);
        });
    } else {
      this.setState({ isCreating: true });
      dataqueryService
        .create(appId, appVersionId, queryName, kind, options, dataSourceId, pluginId)
        .then((data) => {
          toast.success('Query Added');
          this.setState({
            isCreating: shouldRunQuery ? true : false,
            isFieldsChanged: false,
            restArrayValuesChanged: false,
            updatedQuery: shouldRunQuery ? { ...data, updateQuery: false } : {},
          });
          this.props.clearDraftQuery();
          this.props.dataQueriesChanged();
          this.props.setStateOfUnsavedQueries(false);
        })
        .catch(({ error }) => {
          this.setState({
            isCreating: false,
            isFieldsChanged: false,
            restArrayValuesChanged: false,
          });
          this.props.setStateOfUnsavedQueries(false);
          toast.error(error);
        });
    }
  };

  // Clear the focus field value from options
  cleanFocusedFields = (newOptions) => {
    const diffFields = diff(newOptions, this.defaultOptions.current);
    const updatedOptions = { ...newOptions };
    Object.keys(diffFields).forEach((key) => {
      if (newOptions[key] === '' && this.defaultOptions.current[key] === undefined) {
        delete updatedOptions[key];
      }
    });
    return updatedOptions;
  };

  validateNewOptions = (newOptions) => {
    const headersChanged = newOptions.arrayValuesChanged ?? false;
    const updatedOptions = this.cleanFocusedFields(newOptions);
    let isFieldsChanged = false;
    if (this.state.selectedQuery) {
      const isQueryChanged = !_.isEqual(removeRestKey(updatedOptions), removeRestKey(this.defaultOptions.current));
      if (isQueryChanged) {
        isFieldsChanged = true;
      } else if (this.state.selectedQuery.kind === 'restapi') {
        if (headersChanged) {
          isFieldsChanged = true;
        }
        if (Object.is(updatedOptions.body_toggle, !this.state.options.body_toggle)) {
          this.skipSettingSourceToNull.current = true;
        }
      }
    }
    this.setState(
      {
        options: { ...this.state.options, ...updatedOptions },
        isFieldsChanged,
        restArrayValuesChanged: headersChanged,
      },
      () => {
        if (isFieldsChanged !== this.props.isUnsavedQueriesAvailable)
          this.props.setStateOfUnsavedQueries(isFieldsChanged);
      }
    );
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

  executeQueryNameUpdation = (newName) => {
    if (this.state.queryName === newName) return;
    const isNewQueryNameAlreadyExists = this.state.dataQueries.some((query) => query.name === newName);
    if (newName && !isNewQueryNameAlreadyExists) {
      if (this.state.mode === 'create') {
        this.setState({
          queryName: newName,
        });
        this.props.updateDraftQueryName(newName);
      } else {
        dataqueryService
          .update(this.state.selectedQuery.id, newName)
          .then(() => {
            this.props.dataQueriesChanged();
            toast.success('Query Name Updated');
          })
          .catch(({ error }) => {
            toast.error(error);
          });
      }
    } else {
      if (isNewQueryNameAlreadyExists) toast.error('Query name already exists');
    }
  };

  render() {
    const {
      selectedDataSource,
      mode,
      options,
      isUpdating,
      isCreating,
      addingQuery,
      editingQuery,
      selectedQuery,
      queryName,
      previewLoading,
      queryPreviewData,
      dataSourceMeta,
    } = this.state;
    const { dataSources } = this.props;
    let ElementToRender = '';
    if (selectedDataSource) {
      const sourcecomponentName = selectedDataSource.kind.charAt(0).toUpperCase() + selectedDataSource.kind.slice(1);
      ElementToRender = allSources[sourcecomponentName] || source;
    }
    const buttonDisabled = isUpdating || isCreating;
    const mockDataQueryComponent = this.mockDataQueryAsComponent();
    const buttonText = this.props.mode === 'edit' ? 'Save' : 'Create';

    return (
      <div
        className={cx(`query-manager ${this.props.darkMode ? 'theme-dark' : ''}`, {
          'd-none': this.props.loadingDataSources,
        })}
        key={selectedQuery ? selectedQuery.id : ''}
      >
        <ReactTooltip type="dark" effect="solid" delayShow={250} />

        <div className="row header" style={{ padding: '8px 0' }}>
          <div className="col d-flex align-items-center px-3 h-100 font-weight-500 py-1" style={{ gap: '10px' }}>
            <BreadCrumb
              show={(addingQuery || editingQuery) && selectedDataSource}
              darkMode={this.props.darkMode}
              onFirstBreadCrumbClick={this.props.addNewQueryAndDeselectSelectedQuery}
              onSave={this.executeQueryNameUpdation}
              mode={mode}
              queryName={queryName}
            />
          </div>
          <div className="col-auto d-flex align-items-center h-100 query-header-buttons m-auto">
            <PreviewButton
              show={selectedDataSource && (addingQuery || editingQuery)}
              previewLoading={previewLoading}
              darkMode={this.props.darkMode}
              selectedDataSource={this.state.selectedDataSource}
              label={this.props.t('editor.queryManager.preview', 'Preview')}
              onPreview={() => {
                const _options = { ...options };

                const query = {
                  data_source_id: selectedDataSource.id === 'null' ? null : selectedDataSource.id,
                  pluginId: selectedDataSource.plugin_id,
                  options: _options,
                  kind: selectedDataSource.kind,
                };

                previewQuery(this, query, this.props.editorState)
                  .then(() => {
                    this.previewPanelRef.current.scrollIntoView();
                  })
                  .catch(({ error, data }) => {
                    console.log(error, data);
                  });
              }}
            />
            {selectedDataSource && (addingQuery || editingQuery) && (
              <button
                className={`default-tertiary-button ${
                  isUpdating || isCreating ? (this.props.darkMode ? 'btn-loading' : 'button-loading') : ''
                } ${this.props.darkMode ? 'theme-dark' : ''} ${this.state.selectedDataSource ? '' : 'disabled'} `}
                onClick={this.createOrUpdateDataQuery}
                disabled={buttonDisabled}
                data-cy={`query-${buttonText.toLowerCase()}-button`}
              >
                <span className="d-flex query-create-run-svg query-icon-wrapper">
                  <QMIcons.Wrapper />
                </span>
                <span>{buttonText}</span>
              </button>
            )}
            {selectedDataSource && (addingQuery || editingQuery) && (
              <button
                onClick={() => {
                  if (this.state.isFieldsChanged || this.state.addingQuery) {
                    this.setState({ shouldRunQuery: true }, () => this.createOrUpdateDataQuery());
                  } else {
                    this.props.runQuery(selectedQuery.id, selectedQuery.name);
                  }
                }}
                className={`border-0 default-secondary-button float-right1 ${this.props.darkMode ? 'theme-dark' : ''} ${
                  this.state.selectedDataSource ? '' : 'disabled'
                } ${
                  this.state.currentState.queries[selectedQuery.name]?.isLoading
                    ? this.props.darkMode
                      ? 'btn-loading'
                      : 'button-loading'
                    : ''
                }`}
                data-cy="query-run-button"
              >
                <span
                  className={`query-manager-btn-svg-wrapper d-flex align-item-center query-icon-wrapper query-run-svg ${
                    this.state.currentState.queries[selectedQuery.name]?.isLoading && 'invisible'
                  }`}
                >
                  <QMIcons.Cli />
                </span>
                <span className="query-manager-btn-name">
                  {this.state.currentState.queries[selectedQuery.name]?.isLoading ? ' ' : 'Run'}
                </span>
              </button>
            )}
            <span
              onClick={this.props.toggleQueryEditor}
              className={`cursor-pointer m-3 toggle-query-editor-svg d-flex`}
              data-tip="Hide query editor"
            >
              <QMIcons.Collapse />
            </span>
          </div>
        </div>

        {(addingQuery || editingQuery) && (
          <div>
            <div
              className={`row row-deck px-2 mt-0 query-details ${
                selectedDataSource?.kind === 'tooljetdb' && 'tooljetdb-query-details'
              }`}
            >
              {dataSources && mode === 'create' && !this.state.isSourceSelected && (
                <div className="datasource-picker">
                  {!this.state.isSourceSelected && (
                    <label className="form-label col-md-3" data-cy={'label-select-datasource'}>
                      {this.props.t('editor.queryManager.selectDatasource', 'Select Datasource')}
                    </label>
                  )}{' '}
                  {!this.state.isSourceSelected && (
                    <DataSourceLister
                      dataSources={dataSources}
                      staticDataSources={STATIC_DATA_SOURCES}
                      changeDataSource={this.changeDataSource}
                      handleBackButton={this.handleBackButton}
                      darkMode={this.props.darkMode}
                      dataSourceModalHandler={this.props.dataSourceModalHandler}
                    />
                  )}
                </div>
              )}

              {selectedDataSource && (
                <div style={{ padding: '0 32px' }}>
                  <div>
                    <ElementToRender
                      pluginSchema={this.state.selectedDataSource?.plugin?.operations_file?.data}
                      selectedDataSource={selectedDataSource}
                      options={this.state.options}
                      optionsChanged={this.optionsChanged}
                      optionchanged={this.optionchanged}
                      currentState={this.props.currentState}
                      darkMode={this.props.darkMode}
                      isEditMode={true} // Made TRUE always to avoid setting default options again
                      queryName={this.state.queryName}
                    />

                    {!dataSourceMeta?.disableTransformations &&
                      (selectedDataSource?.kind != 'runjs' || selectedDataSource?.kind != 'runpy') && (
                        <div>
                          <Transformation
                            changeOption={this.optionchanged}
                            options={options ?? {}}
                            currentState={this.props.currentState}
                            darkMode={this.props.darkMode}
                            queryId={selectedQuery?.id}
                          />
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
                </div>
              )}
            </div>

            {selectedDataSource && (addingQuery || editingQuery) && (
              <div className="advanced-options-container font-weight-400 border-top query-manager-border-color">
                <div className="advance-options-input-form-container">
                  <div className="mx-4">
                    <CustomToggleSwitch
                      dataCy={`run-on-app-load`}
                      isChecked={this.state.options.runOnPageLoad}
                      toggleSwitchFunction={this.toggleOption}
                      action="runOnPageLoad"
                      darkMode={this.props.darkMode}
                      label={this.props.t(
                        'editor.queryManager.runQueryOnApplicationLoad',
                        'Run this query on application load?'
                      )}
                    />
                  </div>
                  <div className=" mx-4 pb-3 pt-3">
                    <CustomToggleSwitch
                      dataCy={`confirmation-before-run`}
                      isChecked={this.state.options.requestConfirmation}
                      toggleSwitchFunction={this.toggleOption}
                      action="requestConfirmation"
                      darkMode={this.props.darkMode}
                      label={this.props.t(
                        'editor.queryManager.confirmBeforeQueryRun',
                        'Request confirmation before running query?'
                      )}
                    />
                  </div>
                  <div className=" mx-4">
                    <CustomToggleSwitch
                      dataCy={`notification-on-success`}
                      isChecked={this.state.options.showSuccessNotification}
                      toggleSwitchFunction={this.toggleOption}
                      action="showSuccessNotification"
                      darkMode={this.props.darkMode}
                      label={this.props.t('editor.queryManager.notificationOnSuccess', 'Show notification on success?')}
                    />
                  </div>
                  {this.state.options.showSuccessNotification && (
                    <div className="mx-4" style={{ paddingLeft: '100px', paddingTop: '12px' }}>
                      <div className="row mt-1">
                        <div className="col-auto" style={{ width: '200px' }}>
                          <label className="form-label p-2 font-size-12" data-cy={'label-success-message-input'}>
                            {this.props.t('editor.queryManager.successMessage', 'Success Message')}
                          </label>
                        </div>
                        <div className="col">
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.successMessage}
                            height="36px"
                            theme={this.props.darkMode ? 'monokai' : 'default'}
                            onChange={(value) => this.optionchanged('successMessage', value)}
                            placeholder={this.props.t(
                              'editor.queryManager.queryRanSuccessfully',
                              'Query ran successfully'
                            )}
                            cyLabel={'success-message'}
                          />
                        </div>
                      </div>
                      <div className="row mt-3">
                        <div className="col-auto" style={{ width: '200px' }}>
                          <label className="form-label p-2 font-size-12" data-cy={'label-notification-duration-input'}>
                            {this.props.t('editor.queryManager.notificationDuration', 'Notification duration (s)')}
                          </label>
                        </div>
                        <div className="col query-manager-input-elem">
                          <input
                            type="number"
                            disabled={!this.state.options.showSuccessNotification}
                            onChange={(e) => this.optionchanged('notificationDuration', e.target.value)}
                            placeholder={5}
                            className="form-control"
                            value={this.state.options.notificationDuration}
                            data-cy={'notification-duration-input-field'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`border-top query-manager-border-color hr-text-left px-4 ${
                    this.props.darkMode ? 'color-white' : 'color-light-slate-12'
                  }`}
                  style={{ paddingTop: '28px' }}
                >
                  {this.props.t('editor.queryManager.eventsHandler', 'Events Handler')}
                </div>
                <div className="query-manager-events px-4 mt-2 pb-4">
                  <EventManager
                    eventsChanged={this.eventsChanged}
                    component={mockDataQueryComponent.component}
                    componentMeta={mockDataQueryComponent.componentMeta}
                    currentState={this.props.currentState}
                    dataQueries={this.props.dataQueries}
                    components={this.props.allComponents}
                    apps={this.props.apps}
                    popoverPlacement="top"
                    pages={
                      this.props.appDefinition?.pages
                        ? Object.entries(this.props.appDefinition?.pages).map(([id, page]) => ({ ...page, id }))
                        : []
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export const QueryManager = withTranslation()(React.memo(QueryManagerComponent));
