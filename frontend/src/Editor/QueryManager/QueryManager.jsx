import React from 'react';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import ReactTooltip from 'react-tooltip';
import { allSources, source } from './QueryEditors';
import { Transformation } from './Transformation';
import { previewQuery, getSvgIcon } from '@/_helpers/appUtils';
import { EventManager } from '../Inspector/EventManager';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { DataSourceTypes } from '../DataSourceManager/SourceComponents';
import RunjsIcon from '../Icons/runjs.svg';
import Preview from './Preview';
import DataSourceLister from './DataSourceLister';
import _, { isEmpty, isEqual } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { withTranslation } from 'react-i18next';
import cx from 'classnames';
import { Confirm } from '../Viewer/Confirm';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { dataSourceDefaultValue } from './DataSourceDefaults';

const queryNameRegex = new RegExp('^[A-Za-z0-9_-]*$');

const staticDataSources = [
  { kind: 'restapi', id: 'null', name: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
];
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
      isEventsChanged: false,
      isQueryNameChanged: false,
      showSaveConfirmation: false,
      restArrayValuesChanged: false,
      nextProps: null,
      buttonText: '',
      showEditedQuery: false,
    };

    this.prevLoadingButtonRef = React.createRef(false);
    this.prevEventsRef = React.createRef([]);
    this.previewPanelRef = React.createRef();
  }

  setStateFromProps = (props) => {
    const selectedQuery = props.selectedQuery;
    const dataSourceId = selectedQuery?.data_source_id;
    const source = props.dataSources.find((datasource) => datasource.id === dataSourceId);
    let dataSourceMeta;
    if (selectedQuery?.pluginId) {
      dataSourceMeta = selectedQuery.manifestFile.data.source;
    } else {
      dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedQuery?.kind);
    }
    // const paneHeightChanged = this.state.queryPaneHeight !== props.queryPaneHeight;
    const dataQueries = props.dataQueries?.length ? props.dataQueries : this.state.dataQueries;
    this.setState(
      {
        appId: props.appId,
        dataSources: props.dataSources,
        dataQueries: dataQueries,
        mode: props.mode,
        currentTab: 1,
        addingQuery: props.addingQuery,
        editingQuery: props.editingQuery,
        selectedSource: source,
        dataSourceMeta,
        isSourceSelected: props.isSourceSelected,
        selectedDataSource: props.selectedDataSource,
        queryPreviewData: this.state.selectedQuery?.id !== props.selectedQuery?.id ? undefined : props.queryPreviewData,
        selectedQuery: props.mode === 'create' ? selectedQuery : this.state.selectedQuery,
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
        buttonText: props.mode === 'edit' ? 'Save' : 'Create',
        shouldRunQuery: props.mode === 'edit' ? this.state.isFieldsChanged : true,
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

          // Stores the previous events of the selected query
          this.prevEventsRef.current = selectedQuery?.options?.events ?? [];
          this.prevEventsRef.current = [...this.prevEventsRef.current];

          this.setState({
            options: this.state.selectedQuery?.id === selectedQuery?.id ? this.state.options : selectedQuery.options,
            selectedDataSource: source,
            selectedQuery,
            queryName: selectedQuery.name,
          });
        }
      }
    );
  };

  componentWillReceiveProps(nextProps) {
    if (!isEmpty(this.state.updatedQuery)) {
      const query = nextProps.dataQueries.find((q) => q.id === this.state.updatedQuery.id);
      if (query) {
        const isLoading = nextProps.currentState?.queries[query.name]
          ? nextProps.currentState?.queries[query.name]?.isLoading
          : false;
        if (!isEmpty(nextProps.selectedQuery) && !isEqual(this.state.selectedQuery, nextProps.selectedQuery)) {
          if (query && !isLoading && !this.prevLoadingButtonRef.current) {
            this.props.runQuery(query.id, query.name);
          }
        } else if (!isLoading && this.prevLoadingButtonRef.current) {
          this.state.updatedQuery.updateQuery
            ? this.setState({ updatedQuery: {}, isUpdating: false })
            : this.setState({ updatedQuery: {}, isCreating: false });
        }
        this.prevLoadingButtonRef.current = isLoading;
      }
    }

    const diffProps = diff(this.props, nextProps);
    // If create query button is clicked, then show the confirmation dialog
    // if there is any change in the query
    if (nextProps.createQueryButtonState.isClicked) {
      nextProps.createQueryButtonState.isClicked = false;
      this.handleBackButtonClick();
    }
    // Trnasformation needs the value of the currentState from state
    if (diffProps.hasOwnProperty('currentState')) {
      this.setState({ currentState: nextProps.currentState });
    }
    // currentState & allComponents are changed when the widgets are changed
    // Should not update the state when currentState & allComponents are changed
    if (
      nextProps.loadingDataSources ||
      Object.keys(diffProps).length === 0 ||
      ((diffProps.hasOwnProperty('currentState') || diffProps.hasOwnProperty('allComponents')) &&
        !diffProps.hasOwnProperty('selectedQuery'))
    ) {
      // Hack to provide currentState updates to codehinter suggestion
      return this.setState({ selectedQuery: null }, () => {
        this.setState({ selectedQuery: this.props.selectedQuery });
      });
    } else if (
      diffProps.hasOwnProperty('selectedQuery') &&
      nextProps.selectedQuery?.id === this.state.selectedQuery?.id &&
      this.state.showEditedQuery
    ) {
      this.setState({
        showEditedQuery: false,
        showSaveConfirmation: false,
      });
      return;
    }
    const themeModeChanged = this.props.darkMode !== nextProps.darkMode;
    if (!themeModeChanged) {
      if (this.props.mode === 'create' && (this.state.isFieldsChanged || this.state.isQueryNameChanged)) {
        this.setState({ showSaveConfirmation: true, nextProps });
        return;
      } else if (this.props.mode === 'edit') {
        // If events are changed - pass the previous events to the nextProps
        // The older events will be retained when the user click cancel button on save confirmation
        if (this.state.isEventsChanged && this.state.isFieldsChanged) {
          const dataQuery = nextProps.dataQueries.find((query) => query.id === this.state.selectedQuery?.id) || {};
          dataQuery.options.events = this.prevEventsRef.current;
          this.setState({ showSaveConfirmation: true, nextProps });
          return;
        } else if (this.state.isQueryNameChanged) {
          this.setState({ showSaveConfirmation: true, nextProps });
          return;
        } else if (
          this.state.selectedQuery &&
          nextProps.dataQueries.some((query) => query.id === this.state.selectedQuery?.id)
        ) {
          const isQueryChanged = !_.isEqual(
            this.removeRestKey(this.state.options),
            this.removeRestKey(this.state.selectedQuery.options)
          );
          if (this.state.isFieldsChanged && isQueryChanged) {
            this.setState({ showSaveConfirmation: true, nextProps });
            return;
          } else if (
            !isQueryChanged &&
            this.state.selectedQuery.kind === 'restapi' &&
            this.state.restArrayValuesChanged
          ) {
            this.setState({ showSaveConfirmation: true, nextProps });
            return;
          }
        } else if (this.state.isFieldsChanged) {
          this.setState({ showSaveConfirmation: true, nextProps });
          return;
        }
      }
    }
    if (this.props.showQueryConfirmation && !nextProps.showQueryConfirmation) {
      if (this.state.isUpdating) {
        this.setState({
          isUpdating: false,
        });
      }
      if (this.state.isCreating) {
        this.setState({
          isCreating: false,
        });
      }
    }
    this.setStateFromProps(nextProps);
  }

  removeRestKey = (options = {}) => {
    options.hasOwnProperty('arrayValuesChanged') && delete options.arrayValuesChanged;
    return options;
  };

  handleBackButton = () => {
    this.setState({
      isSourceSelected: true,
    });
  };

  changeDataSource = (sourceId) => {
    const source = [...this.state.dataSources, ...staticDataSources].find((datasource) => datasource.id === sourceId);
    const isSchemaUnavailable = dataSourceDefaultValue.hasOwnProperty(source.kind);

    // Set to FALSE when any of the datasource is selected
    this.props.createQueryButtonState.isClicked = false;
    let newOptions = {};
    if (isSchemaUnavailable) {
      newOptions = {
        ...dataSourceDefaultValue[source.kind],
        ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript' }),
      };
    } else {
      newOptions = {
        ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript' }),
      };
    }

    this.setState({
      selectedDataSource: source,
      selectedSource: source,
      queryName: this.computeQueryName(source.kind),
      options: { ...newOptions },
    });
  };

  switchCurrentTab = (tab) => {
    this.setState({
      currentTab: tab,
    });
  };

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

  computeQueryName = (kind) => {
    const { dataQueries } = this.props;
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

  createOrUpdateDataQuery = (stopRunningQuery = false) => {
    const { appId, options, selectedDataSource, mode, queryName, shouldRunQuery } = this.state;
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
            isUpdating: !stopRunningQuery && shouldRunQuery ? true : false,
            isFieldsChanged: false,
            isEventsChanged: false,
            isQueryNameChanged: false,
            restArrayValuesChanged: false,
            updatedQuery: !stopRunningQuery && shouldRunQuery ? { ...data, updateQuery: true } : {},
          });
          this.props.dataQueriesChanged();
          this.props.setStateOfUnsavedQueries(false);
          localStorage.removeItem('transformation');
        })
        .catch(({ error }) => {
          this.setState({
            isUpdating: false,
            isFieldsChanged: false,
            isEventsChanged: false,
            isQueryNameChanged: false,
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
          console.log(data, shouldRunQuery, 'q');
          this.setState({
            isCreating: !stopRunningQuery && shouldRunQuery ? true : false,
            isFieldsChanged: false,
            isEventsChanged: false,
            restArrayValuesChanged: false,
            isQueryNameChanged: false,
            updatedQuery: !stopRunningQuery && shouldRunQuery ? { ...data, updateQuery: false } : {},
          });
          this.props.dataQueriesChanged();
          this.props.setStateOfUnsavedQueries(false);
        })
        .catch(({ error }) => {
          this.setState({
            isCreating: false,
            isFieldsChanged: false,
            isEventsChanged: false,
            isQueryNameChanged: false,
            restArrayValuesChanged: false,
          });
          this.props.setStateOfUnsavedQueries(false);
          toast.error(error);
        });
    }
  };

  validateNewOptions = (newOptions, isEventsChanged = false) => {
    const headersChanged = newOptions.arrayValuesChanged ?? false;
    let isFieldsChanged = false || isEventsChanged;
    if (this.state.selectedQuery && !isFieldsChanged) {
      const isQueryChanged = !_.isEqual(this.removeRestKey(newOptions), this.removeRestKey(this.state.options));
      if (isQueryChanged) {
        isFieldsChanged = true;
      } else if (this.state.selectedQuery.kind === 'restapi' && headersChanged) {
        isFieldsChanged = true;
      }
    }
    if (isFieldsChanged) this.props.setStateOfUnsavedQueries(true);
    this.setState({
      options: newOptions,
      isFieldsChanged,
      isEventsChanged,
      restArrayValuesChanged: headersChanged,
    });
  };

  optionchanged = (option, value) => {
    if (this.state.options?.[option] !== value) {
      const newOptions = { ...this.state.options, [option]: value };
      this.validateNewOptions(newOptions, option === 'events' ? true : false);
    }
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

  handleBackButtonClick = () => {
    if (this.state.isFieldsChanged || this.state.isQueryNameChanged) {
      this.setState({ showSaveConfirmation: true, nextProps: this.props });
    } else {
      this.setState({
        isSourceSelected: false,
        selectedDataSource: null,
      });
    }
  };

  render() {
    const {
      dataSources,
      selectedDataSource,
      mode,
      options,
      // currentTab,
      isUpdating,
      isCreating,
      addingQuery,
      editingQuery,
      selectedQuery,
      queryName,
      previewLoading,
      queryPreviewData,
      dataSourceMeta,
      isFieldsChanged,
    } = this.state;
    let ElementToRender = '';

    if (selectedDataSource) {
      const sourcecomponentName = selectedDataSource.kind.charAt(0).toUpperCase() + selectedDataSource.kind.slice(1);
      ElementToRender = allSources[sourcecomponentName] || source;
    }

    // let dropDownButtonText = mode === 'edit' ? 'Save' : 'Create';
    const buttonDisabled = isUpdating || isCreating || (editingQuery && !isFieldsChanged);
    const mockDataQueryComponent = this.mockDataQueryAsComponent();
    const iconFile = this?.state?.selectedDataSource?.plugin?.icon_file?.data ?? undefined;
    const Icon = () => getSvgIcon(this?.state?.selectedDataSource?.kind, 18, 18, iconFile, { marginLeft: 7 });

    return (
      <div
        className={cx(`query-manager font-size-12 ${this.props.darkMode ? 'dark' : ''}`, {
          'd-none': this.props.loadingDataSources,
        })}
        key={selectedQuery ? selectedQuery.id : ''}
      >
        <ReactTooltip type="dark" effect="solid" delayShow={250} />
        <Confirm
          show={this.state.showSaveConfirmation}
          message={`Query ${queryName} has unsaved changes`}
          onCancel={() => {
            this.setState({ showEditedQuery: true, showSaveConfirmation: false }, () => {
              mode === 'edit' ? this.props.selectQuery(selectedQuery, mode) : this.props.selectQuery({}, mode);
            });
          }}
          onConfirm={() => {
            this.setState({
              showSaveConfirmation: false,
              isFieldsChanged: false,
              isEventsChanged: false,
              restArrayValuesChanged: false,
              isQueryNameChanged: false,
            });
            this.setStateFromProps(this.state.nextProps);
            this.props.setStateOfUnsavedQueries(false);
          }}
          queryConfirmationData={this.state.queryConfirmationData}
          confirmButtonText="Discard changes"
          cancelButtonText="Continue editing"
          callCancelFnOnConfirm={false}
        />
        <div className="row header" style={{ padding: '8px 0' }}>
          {
            <div className="col d-flex align-items-center px-3 h-100 font-weight-500">
              {(addingQuery || editingQuery) && selectedDataSource && (
                <>
                  <span
                    className={`${this.props.darkMode ? 'color-dark-slate-11' : 'color-light-slate-11'} cursor-pointer`}
                    onClick={() => this.handleBackButtonClick()}
                  >
                    Queries
                  </span>
                  <span className={`px-2 breadcrum`}>
                    <svg width="8" height="8" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.292893 0.292893C0.683417 -0.0976311 1.31658 -0.0976311 1.70711 0.292893L7.70711 6.29289C8.09763 6.68342 8.09763 7.31658 7.70711 7.70711L1.70711 13.7071C1.31658 14.0976 0.683417 14.0976 0.292893 13.7071C-0.0976311 13.3166 -0.0976311 12.6834 0.292893 12.2929L5.58579 7L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683417 0.292893 0.292893Z"
                        fill="#C1C8CD"
                      />
                    </svg>
                  </span>
                  <span className="query-manager-header-query-name">{queryName}</span>
                </>
              )}
            </div>
          }
          <div
            className={`col-auto m-auto d-flex align-items-center h-100 query-header-buttons ${
              this.props.darkMode ? 'theme-dark' : ''
            }`}
          >
            {selectedDataSource && (addingQuery || editingQuery) && (
              <button
                onClick={() => {
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
                className={`default-tertiary-button float-right1 ${previewLoading ? 'button-loading' : ''} ${
                  this.state.selectedDataSource ? '' : 'disabled'
                }`}
              >
                <span>
                  <svg width="14.67" height="10.67" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2.15986 8C4.65779 12.1305 7.61278 14 11 14C14.3872 14 17.3422 12.1305 19.8401 8C17.3422 3.86948 14.3872 2 11 2C7.61278 2 4.65779 3.86948 2.15986 8ZM0.131768 7.50384C2.9072 2.64709 6.51999 0 11 0C15.48 0 19.0928 2.64709 21.8682 7.50384C22.0439 7.81128 22.0439 8.18871 21.8682 8.49616C19.0928 13.3529 15.48 16 11 16C6.51999 16 2.9072 13.3529 0.131768 8.49616C-0.0439228 8.18871 -0.0439228 7.81128 0.131768 7.50384ZM11 7C10.4477 7 10 7.44772 10 8C10 8.55228 10.4477 9 11 9C11.5523 9 12 8.55228 12 8C12 7.44772 11.5523 7 11 7ZM8 8C8 6.34315 9.34315 5  11 5C12.6569 5 14 6.34315 14 8C14 9.65685 12.6569 11 11 11C9.34315 11 8 9.65685 8 8Z"
                      fill="#11181C"
                    />
                  </svg>
                </span>
                <span>{this.props.t('editor.queryManager.preview', 'Preview')}</span>
              </button>
            )}
            {selectedDataSource && (addingQuery || editingQuery) && (
              <button
                className={`default-tertiary-button ${isUpdating || isCreating ? 'btn-loading' : ''} ${
                  this.state.selectedDataSource ? '' : 'disabled'
                } 
                ${editingQuery && !isFieldsChanged && 'disable-tertiary-button'}`}
                onClick={this.createOrUpdateDataQuery}
                disabled={buttonDisabled}
              >
                <span className="d-flex">
                  <svg width="12" height="12" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3 2.5C2.73478 2.5 2.48043 2.60536 2.29289 2.79289C2.10536 2.98043 2 3.23478 2 3.5V15.5C2 15.7652 2.10536 16.0196 2.29289 16.2071C2.48043 16.3946 2.73478 16.5 3 16.5H15C15.2652 16.5 15.5196 16.3946 15.7071 16.2071C15.8946 16.0196 16 15.7652 16 15.5V5.91421L12.5858 2.5H12V5.5C12 6.05228 11.5523 6.5 11 6.5H5C4.44772 6.5 4 6.05228 4 5.5V2.5H3ZM3 0.5C2.20435 0.5 1.44129 0.81607 0.87868 1.37868C0.31607 1.94129 0 2.70435 0 3.5V15.5C0 16.2956 0.31607 17.0587 0.87868 17.6213C1.44129 18.1839 2.20435 18.5 3 18.5H15C15.7957 18.5 16.5587 18.1839 17.1213 17.6213C17.6839 17.0587 18 16.2957 18 15.5V5.5C18 5.23478 17.8946 4.98043 17.7071 4.79289L13.7071 0.792893C13.5196 0.605357 13.2652 0.5 13 0.5H3ZM6 2.5V4.5H10V2.5H6ZM9 10.5C8.44772 10.5 8 10.9477 8 11.5C8 12.0523 8.44772 12.5 9 12.5C9.55228 12.5 10 12.0523 10 11.5C10 10.9477 9.55229 10.5 9 10.5ZM6 11.5C6 9.84315 7.34315 8.5 9 8.5C10.6569 8.5 12 9.84315 12 11.5C12 13.1569 10.6569 14.5 9 14.5C7.34315 14.5 6 13.1569 6 11.5Z"
                      fill="#11181C"
                    />
                  </svg>
                </span>
                <span>{this.state.buttonText}</span>
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
                className={`border-0 default-secondary-button float-right1 ${this.props.darkMode ? 'dark' : ''} ${
                  this.state.selectedDataSource ? '' : 'disabled'
                }`}
              >
                <span>
                  <svg width="10.67" height="8" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.292893 0.292893C0.683417 -0.0976311 1.31658 -0.0976311 1.70711 0.292893L6.70711 5.29289C7.09763 5.68342 7.09763 6.31658 6.70711 6.70711L1.70711 11.7071C1.31658 12.0976 0.683417 12.0976 0.292893 11.7071C-0.0976311 11.3166 -0.0976311 10.6834 0.292893 10.2929L4.58579 6L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683417 0.292893 0.292893ZM8 11C8 10.4477 8.44772 10 9 10H15C15.5523 10 16 10.4477 16 11C16 11.5523 15.5523 12 15 12H9C8.44772 12 8 11.5523 8 11Z"
                      fill="#3A5CCC"
                    />
                  </svg>
                </span>
                <span>Run</span>
              </button>
            )}
            <span onClick={this.props.toggleQueryEditor} className={`cursor-pointer m-3`} data-tip="Hide query editor">
              <svg width="20" height="20" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.00013 4.18288C2.94457 4.18288 2.88624 4.17177 2.82513 4.14954C2.76402 4.12732 2.70569 4.08843 2.65013 4.03288L0.366797 1.74954C0.266797 1.64954 0.216797 1.52732 0.216797 1.38288C0.216797 1.23843 0.266797 1.11621 0.366797 1.01621C0.466797 0.916211 0.583464 0.866211 0.716797 0.866211C0.85013 0.866211 0.966797 0.916211 1.0668 1.01621L3.00013 2.94954L4.93346 1.01621C5.03346 0.916211 5.15291 0.866211 5.2918 0.866211C5.43069 0.866211 5.55013 0.916211 5.65013 1.01621C5.75013 1.11621 5.80013 1.23566 5.80013 1.37454C5.80013 1.51343 5.75013 1.63288 5.65013 1.73288L3.35013 4.03288C3.29457 4.08843 3.23902 4.12732 3.18346 4.14954C3.12791 4.17177 3.0668 4.18288 3.00013 4.18288ZM0.366797 10.9662C0.266797 10.8662 0.216797 10.7468 0.216797 10.6079C0.216797 10.469 0.266797 10.3495 0.366797 10.2495L2.65013 7.96621C2.70569 7.91065 2.76402 7.87177 2.82513 7.84954C2.88624 7.82732 2.94457 7.81621 3.00013 7.81621C3.0668 7.81621 3.12791 7.82732 3.18346 7.84954C3.23902 7.87177 3.29457 7.91065 3.35013 7.96621L5.65013 10.2662C5.75013 10.3662 5.80013 10.4829 5.80013 10.6162C5.80013 10.7495 5.75013 10.8662 5.65013 10.9662C5.55013 11.0662 5.42791 11.1162 5.28346 11.1162C5.13902 11.1162 5.0168 11.0662 4.9168 10.9662L3.00013 9.04954L1.08346 10.9662C0.983464 11.0662 0.864019 11.1162 0.72513 11.1162C0.586241 11.1162 0.466797 11.0662 0.366797 10.9662Z"
                  fill="#576574"
                />
              </svg>
            </span>
          </div>
        </div>

        {(addingQuery || editingQuery) && (
          <div className="">
            <div className="row row-deck mt-0 query-details">
              {dataSources && mode === 'create' && (
                <div className="datasource-picker mt-1 mb-2 px-4">
                  <div className="datasource-heading ">
                    {this.state.selectedDataSource !== null && (
                      <p onClick={() => this.handleBackButtonClick()} style={{ marginTop: '-7px' }}>
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
                    {!this.state.isSourceSelected && (
                      <label className="form-label col-md-3">
                        {this.props.t('editor.queryManager.selectDatasource', 'Select Datasource')}
                      </label>
                    )}
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
                <div className="px-4 border-bottom">
                  <ElementToRender
                    pluginSchema={this.state.selectedDataSource?.plugin?.operations_file?.data}
                    selectedDataSource={selectedDataSource}
                    options={this.state.options}
                    optionsChanged={this.optionsChanged}
                    optionchanged={this.optionchanged}
                    currentState={this.props.currentState}
                    darkMode={this.props.darkMode}
                    isEditMode={this.props.mode === 'edit'}
                    queryName={this.state.queryName}
                    shouldChangeOptionsOnMount={false}
                  />
                  {!dataSourceMeta?.disableTransformations && selectedDataSource?.kind != 'runjs' && (
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
              )}
            </div>

            {selectedDataSource && (addingQuery || editingQuery) && (
              <div className="advanced-options-container font-weight-500">
                <div className="advance-options-input-form-container">
                  <div className="form-check form-switch mx-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onClick={() => this.toggleOption('runOnPageLoad')}
                      checked={this.state.options.runOnPageLoad}
                    />
                    <span className="form-check-label">
                      {this.props.t('editor.queryManager.runQueryOnPageLoad', 'Run this query on page load?')}
                    </span>
                  </div>
                  <div className="form-check form-switch mx-4 pb-3 pt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onClick={() => this.toggleOption('requestConfirmation')}
                      checked={this.state.options.requestConfirmation}
                    />
                    <span className="form-check-label">
                      {this.props.t(
                        'editor.queryManager.confirmBeforeQueryRun',
                        'Request confirmation before running query?'
                      )}
                    </span>
                  </div>
                  <div className="form-check form-switch mx-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onClick={() => this.toggleOption('showSuccessNotification')}
                      checked={this.state.options.showSuccessNotification}
                    />
                    <span className="form-check-label">
                      {this.props.t('editor.queryManager.notificationOnSuccess', 'Show notification on success?')}
                    </span>
                  </div>
                  {this.state.options.showSuccessNotification && (
                    <div className="mx-4" style={{ paddingLeft: '100px' }}>
                      <div className="row mt-1">
                        <div className="col-auto" style={{ width: '200px' }}>
                          <label className="form-label p-2 font-size-12">
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
                          />
                        </div>
                      </div>
                      <div className="row mt-3">
                        <div className="col-auto" style={{ width: '200px' }}>
                          <label className="form-label p-2 font-size-12">
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
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="border-top pt-4 hr-text-left px-4"
                  style={{ color: this.props.darkMode ? '#ECEDEE' : '#11181C' }}
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
