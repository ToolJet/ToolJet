import React from 'react';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
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
// eslint-disable-next-line import/no-unresolved
import { withTranslation } from 'react-i18next';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { ChangeDataSource } from './ChangeDataSource';

const queryNameRegex = new RegExp('^[A-Za-z0-9_-]*$');

const staticDataSources = [
  { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
  { kind: 'restapi', id: 'null', name: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
  { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
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
      paneHeightChanged: false,
      showSaveConfirmation: false,
      restArrayValuesChanged: false,
      nextProps: null,
      buttonText: '',
      renameQuery: false,
    };

    this.defaultOptions = React.createRef({});
    this.previewPanelRef = React.createRef();
    this.skipSettingSourceToNull = React.createRef(false);
  }

  setStateFromProps = (props) => {
    const selectedQuery = props.selectedQuery;

    const dataSourceId = selectedQuery?.data_source_id;
    const source = [...props.dataSources, ...props.globalDataSources].find(
      (datasource) => datasource.id === dataSourceId
    );
    const selectedDataSource =
      paneHeightChanged || queryPaneDragged ? this.state.selectedDataSource : props.selectedDataSource;
    const dataSourceMeta = selectedQuery?.pluginId
      ? selectedQuery?.manifestFile?.data?.source
      : DataSourceTypes.find((source) => source.kind === selectedQuery?.kind);

    const paneHeightChanged = this.state.queryPaneHeight !== props.queryPaneHeight;
    const dataQueries = props.dataQueries?.length ? props.dataQueries : this.state.dataQueries;
    const queryPaneDragged = this.state.isQueryPaneDragging !== props.isQueryPaneDragging;

    this.setState(
      {
        appId: props.appId,
        dataSources: props.dataSources,
        globalDataSources: props.globalDataSources,
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
        shouldRunQuery: props.mode === 'edit' ? this.state.isFieldsChanged : this.props.isSourceSelected,
      },
      () => {
        let source = [...props.dataSources, ...props.globalDataSources].find(
          (datasource) => datasource.id === selectedQuery?.data_source_id
        );
        if (selectedQuery?.kind === 'restapi') {
          if (!selectedQuery.data_source_id) {
            source = { kind: 'restapi', id: 'null', name: 'REST API' };
          }
        }
        if (selectedQuery?.kind === 'runjs') {
          if (!selectedQuery.data_source_id) {
            source = { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' };
          }
        }

        if (selectedQuery?.kind === 'tooljetdb') {
          if (!selectedQuery.data_source_id) {
            source = { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' };
          }
        }

        if (selectedQuery?.kind === 'runpy') {
          if (!selectedQuery.data_source_id) {
            source = { kind: 'runpy', id: 'runpy', name: 'Run Python code' };
          }
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

  componentDidUpdate(prevState) {
    if (prevState?.selectedQuery?.name !== this.state?.selectedQuery?.name) {
      this.setState({
        queryName: this.state.selectedQuery?.name,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.loadingDataSources) return;
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

  removeRestKey = (options) => {
    delete options.arrayValuesChanged;
    return options;
  };

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
        source?.plugin?.operationsFile?.data?.defaults ?? allOperations[capitalize(source.kind)]?.defaults;
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

    const newQueryName = this.computeQueryName(source.kind);
    this.defaultOptions.current = { ...newOptions };
    this.setState({
      selectedDataSource: source,
      selectedSource: source,
      queryName: newQueryName,
      options: { ...newOptions },
    });

    this.props.createDraftQuery(
      { ...source, data_source_id: source.id, name: newQueryName, id: 'draftQuery', options: { ...newOptions } },
      source
    );
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

  createOrUpdateDataQuery = () => {
    const { appId, options, selectedDataSource, mode, queryName, shouldRunQuery } = this.state;
    const appVersionId = this.props.editingVersionId;
    const kind = selectedDataSource.kind;
    const dataSourceId = selectedDataSource.id === 'null' ? null : selectedDataSource.id;
    const pluginId = selectedDataSource.pluginId || selectedDataSource.plugin_id;

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
      const isQueryChanged = !_.isEqual(
        this.removeRestKey(updatedOptions),
        this.removeRestKey(this.defaultOptions.current)
      );
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
  createInputElementToUpdateQueryName = () => {
    this.setState({ renameQuery: true });
  };
  executeQueryNameUpdation = (newName) => {
    if (this.state.queryName === newName) return this.setState({ renameQuery: false });
    const isNewQueryNameAlreadyExists = this.state.dataQueries.some((query) => query.name === newName);
    if (newName && !isNewQueryNameAlreadyExists) {
      if (this.state.mode === 'create') {
        this.setState({
          queryName: newName,
          renameQuery: false,
        });
        this.props.updateDraftQueryName(newName);
      } else {
        dataqueryService
          .update(this.state.selectedQuery.id, newName)
          .then(() => {
            this.props.dataQueriesChanged();
            toast.success('Query Name Updated');
            this.setState({
              renameQuery: false,
            });
          })
          .catch(({ error }) => {
            this.setState({ renameQuery: false });
            toast.error(error);
          });
      }
    } else {
      if (isNewQueryNameAlreadyExists) toast.error('Query name already exists');
      this.setState({ renameQuery: false });
    }
  };

  changeDataSourceQueryAssociation = (selectedDataSource, selectedQuery) => {
    this.setState({
      selectedDataSource: selectedDataSource,
      isUpdating: true,
    });
    dataqueryService
      .changeQueryDataSource(selectedQuery?.id, selectedDataSource.id)
      .then(() => {
        this.props.dataQueriesChanged();
        this.setState({
          isUpdating: false,
        });
        toast.success('Data source changed');
      })
      .catch((error) => {
        toast.error(error);
        this.setState({
          isUpdating: false,
        });
      });
  };

  render() {
    const {
      dataSources,
      globalDataSources,
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
    let ElementToRender = '';
    if (selectedDataSource) {
      const sourcecomponentName = selectedDataSource.kind.charAt(0).toUpperCase() + selectedDataSource.kind.slice(1);
      ElementToRender = selectedDataSource?.pluginId ? source : allSources[sourcecomponentName];
    }
    const buttonDisabled = isUpdating || isCreating;
    const mockDataQueryComponent = this.mockDataQueryAsComponent();

    return (
      <div
        className={cx(`query-manager ${this.props.darkMode ? 'theme-dark' : ''}`, {
          'd-none': this.props.loadingDataSources,
        })}
        key={selectedQuery ? selectedQuery.id : ''}
      >
        <div className="row header" style={{ padding: '8px 0' }}>
          <div className="col d-flex align-items-center px-3 h-100 font-weight-500 py-1" style={{ gap: '10px' }}>
            {(addingQuery || editingQuery) && selectedDataSource && (
              <>
                <span
                  className={`${
                    this.props.darkMode ? 'color-light-gray-c3c3c3' : 'color-light-slate-11'
                  } cursor-pointer font-weight-400`}
                  onClick={() => {
                    this.props.addNewQueryAndDeselectSelectedQuery();
                  }}
                  data-cy={`query-type-header`}
                >
                  {mode === 'create' ? 'New Query' : 'Queries'}
                </span>
                <span className="breadcrum">
                  <svg width="5.33" height="9.33" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.292893 0.292893C0.683417 -0.0976311 1.31658 -0.0976311 1.70711 0.292893L7.70711 6.29289C8.09763 6.68342 8.09763 7.31658 7.70711 7.70711L1.70711 13.7071C1.31658 14.0976 0.683417 14.0976 0.292893 13.7071C-0.0976311 13.3166 -0.0976311 12.6834 0.292893 12.2929L5.58579 7L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683417 0.292893 0.292893Z"
                      fill="#C1C8CD"
                    />
                  </svg>
                </span>
                <div className="query-name-breadcrum d-flex align-items-center">
                  <span
                    className={`query-manager-header-query-name font-weight-400 ${
                      !this.state.renameQuery && 'ellipsis'
                    }`}
                    data-cy={`query-name-label`}
                  >
                    {this.state.renameQuery ? (
                      <input
                        data-cy={`query-rename-input`}
                        type="text"
                        className={`query-name query-name-input-field border-indigo-09 bg-transparent  ${
                          this.props.darkMode && 'text-white'
                        }`}
                        autoFocus
                        defaultValue={queryName}
                        onKeyUp={(event) => {
                          event.persist();
                          if (event.keyCode === 13) {
                            this.executeQueryNameUpdation(event.target.value);
                          }
                        }}
                        onBlur={({ target }) => this.executeQueryNameUpdation(target.value)}
                      />
                    ) : (
                      queryName
                    )}
                  </span>
                  <span
                    className={`breadcrum-rename-query-icon ${this.state.renameQuery && 'd-none'}`}
                    onClick={this.createInputElementToUpdateQueryName}
                  >
                    <svg width="auto" height="auto" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M13.7087 1.40712C14.29 0.826221 15.0782 0.499893 15.9 0.499893C16.7222 0.499893 17.5107 0.82651 18.0921 1.40789C18.6735 1.98928 19.0001 2.7778 19.0001 3.6C19.0001 4.42197 18.6737 5.21028 18.0926 5.79162C18.0924 5.79178 18.0928 5.79145 18.0926 5.79162L16.8287 7.06006C16.7936 7.11191 16.753 7.16118 16.7071 7.20711C16.6621 7.25215 16.6138 7.292 16.563 7.32665L9.70837 14.2058C9.52073 14.3942 9.26584 14.5 9 14.5H6C5.44772 14.5 5 14.0523 5 13.5V10.5C5 10.2342 5.10585 9.97927 5.29416 9.79163L12.1733 2.93697C12.208 2.88621 12.2478 2.83794 12.2929 2.79289C12.3388 2.74697 12.3881 2.70645 12.4399 2.67132L13.7079 1.40789C13.7082 1.40763 13.7084 1.40738 13.7087 1.40712ZM13.0112 4.92545L7 10.9153V12.5H8.58474L14.5745 6.48876L13.0112 4.92545ZM15.9862 5.07202L14.428 3.51376L15.1221 2.82211C15.3284 2.6158 15.6082 2.49989 15.9 2.49989C16.1918 2.49989 16.4716 2.6158 16.6779 2.82211C16.8842 3.02842 17.0001 3.30823 17.0001 3.6C17.0001 3.89177 16.8842 4.17158 16.6779 4.37789L15.9862 5.07202ZM0.87868 5.37868C1.44129 4.81607 2.20435 4.5 3 4.5H4C4.55228 4.5 5 4.94772 5 5.5C5 6.05228 4.55228 6.5 4 6.5H3C2.73478 6.5 2.48043 6.60536 2.29289 6.79289C2.10536 6.98043 2 7.23478 2 7.5V16.5C2 16.7652 2.10536 17.0196 2.29289 17.2071C2.48043 17.3946 2.73478 17.5 3 17.5H12C12.2652 17.5 12.5196 17.3946 12.7071 17.2071C12.8946 17.0196 13 16.7652 13 16.5V15.5C13 14.9477 13.4477 14.5 14 14.5C14.5523 14.5 15 14.9477 15 15.5V16.5C15 17.2957 14.6839 18.0587 14.1213 18.6213C13.5587 19.1839 12.7957 19.5 12 19.5H3C2.20435 19.5 1.44129 19.1839 0.87868 18.6213C0.31607 18.0587 0 17.2957 0 16.5V7.5C0 6.70435 0.31607 5.94129 0.87868 5.37868Z"
                        fill="#11181C"
                      />
                    </svg>
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="col-auto d-flex align-items-center h-100 query-header-buttons m-auto">
            {selectedDataSource && (addingQuery || editingQuery) && (
              <button
                onClick={() => {
                  const _options = { ...options };

                  const query = {
                    data_source_id: selectedDataSource.id === 'null' ? null : selectedDataSource.id,
                    pluginId: selectedDataSource.pluginId,
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
                className={`default-tertiary-button float-right1 ${
                  previewLoading ? (this.props.darkMode ? 'btn-loading' : 'button-loading') : ''
                } ${this.props.darkMode ? 'theme-dark ' : ''} ${this.state.selectedDataSource ? '' : 'disabled'}`}
                data-cy={'query-preview-button'}
              >
                <span
                  className="query-preview-svg d-flex align-items-center query-icon-wrapper"
                  style={{ width: '16px', height: '16px', padding: '2.67px 0.67px', margin: '6px 0' }}
                >
                  <svg width="auto" height="auto" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                className={`default-tertiary-button ${
                  isUpdating || isCreating ? (this.props.darkMode ? 'btn-loading' : 'button-loading') : ''
                } ${this.props.darkMode ? 'theme-dark' : ''} ${this.state.selectedDataSource ? '' : 'disabled'} `}
                onClick={this.createOrUpdateDataQuery}
                disabled={buttonDisabled}
                data-cy={`query-${this.state.buttonText.toLowerCase()}-button`}
              >
                <span className="d-flex query-create-run-svg query-icon-wrapper">
                  <svg width="auto" height="auto" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <svg width="auto" height="auto" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.292893 0.292893C0.683417 -0.0976311 1.31658 -0.0976311 1.70711 0.292893L6.70711 5.29289C7.09763 5.68342 7.09763 6.31658 6.70711 6.70711L1.70711 11.7071C1.31658 12.0976 0.683417 12.0976 0.292893 11.7071C-0.0976311 11.3166 -0.0976311 10.6834 0.292893 10.2929L4.58579 6L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683417 0.292893 0.292893ZM8 11C8 10.4477 8.44772 10 9 10H15C15.5523 10 16 10.4477 16 11C16 11.5523 15.5523 12 15 12H9C8.44772 12 8 11.5523 8 11Z"
                      fill="#3A5CCC"
                    />
                  </svg>
                </span>
                <span className="query-manager-btn-name">
                  {this.state.currentState.queries[selectedQuery.name]?.isLoading ? ' ' : 'Run'}
                </span>
              </button>
            )}
            <span
              onClick={this.props.toggleQueryEditor}
              className={`cursor-pointer m-3 toggle-query-editor-svg d-flex`}
              data-tooltip-id="tooltip-for-hide-query-editor"
              data-tooltip-content="Hide query editor"
            >
              <svg width="5.58" height="10.25" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.00013 4.18288C2.94457 4.18288 2.88624 4.17177 2.82513 4.14954C2.76402 4.12732 2.70569 4.08843 2.65013 4.03288L0.366797 1.74954C0.266797 1.64954 0.216797 1.52732 0.216797 1.38288C0.216797 1.23843 0.266797 1.11621 0.366797 1.01621C0.466797 0.916211 0.583464 0.866211 0.716797 0.866211C0.85013 0.866211 0.966797 0.916211 1.0668 1.01621L3.00013 2.94954L4.93346 1.01621C5.03346 0.916211 5.15291 0.866211 5.2918 0.866211C5.43069 0.866211 5.55013 0.916211 5.65013 1.01621C5.75013 1.11621 5.80013 1.23566 5.80013 1.37454C5.80013 1.51343 5.75013 1.63288 5.65013 1.73288L3.35013 4.03288C3.29457 4.08843 3.23902 4.12732 3.18346 4.14954C3.12791 4.17177 3.0668 4.18288 3.00013 4.18288ZM0.366797 10.9662C0.266797 10.8662 0.216797 10.7468 0.216797 10.6079C0.216797 10.469 0.266797 10.3495 0.366797 10.2495L2.65013 7.96621C2.70569 7.91065 2.76402 7.87177 2.82513 7.84954C2.88624 7.82732 2.94457 7.81621 3.00013 7.81621C3.0668 7.81621 3.12791 7.82732 3.18346 7.84954C3.23902 7.87177 3.29457 7.91065 3.35013 7.96621L5.65013 10.2662C5.75013 10.3662 5.80013 10.4829 5.80013 10.6162C5.80013 10.7495 5.75013 10.8662 5.65013 10.9662C5.55013 11.0662 5.42791 11.1162 5.28346 11.1162C5.13902 11.1162 5.0168 11.0662 4.9168 10.9662L3.00013 9.04954L1.08346 10.9662C0.983464 11.0662 0.864019 11.1162 0.72513 11.1162C0.586241 11.1162 0.466797 11.0662 0.366797 10.9662Z"
                  fill="#576574"
                />
              </svg>
            </span>
            <Tooltip id="tooltip-for-hide-query-editor" className="tooltip" />
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
                      staticDataSources={staticDataSources}
                      changeDataSource={this.changeDataSource}
                      handleBackButton={this.handleBackButton}
                      darkMode={this.props.darkMode}
                      showAddDatasourceBtn={false}
                      dataSourceModalHandler={this.props.dataSourceModalHandler}
                    />
                  )}
                </div>
              )}

              {dataSources && mode === 'create' && !this.state.isSourceSelected && (
                <div className="datasource-picker">
                  {!this.state.isSourceSelected && <label className="form-label col-md-3">Global Datasources</label>}{' '}
                  {!this.state.isSourceSelected && (
                    <DataSourceLister
                      dataSources={globalDataSources}
                      staticDataSources={[]}
                      changeDataSource={this.changeDataSource}
                      handleBackButton={this.handleBackButton}
                      darkMode={this.props.darkMode}
                      dataSourceModalHandler={this.props.dataSourceModalHandler}
                      showAddDatasourceBtn={false}
                    />
                  )}
                </div>
              )}

              {selectedDataSource && (
                <div style={{ padding: '0 32px' }}>
                  <div>
                    <ElementToRender
                      pluginSchema={this.state.selectedDataSource?.plugin?.operationsFile?.data}
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
                {mode === 'edit' && selectedQuery.data_source_id && (
                  <div className="mt-2 pb-4">
                    <div
                      className={`border-top query-manager-border-color px-4 hr-text-left py-2 ${
                        this.props.darkMode ? 'color-white' : 'color-light-slate-12'
                      }`}
                    >
                      Change Datasource
                    </div>
                    <ChangeDataSource
                      dataSources={[...globalDataSources, ...this.props.dataSources]}
                      value={selectedDataSource}
                      selectedQuery={selectedQuery}
                      onChange={(selectedDataSource) => {
                        this.changeDataSourceQueryAssociation(selectedDataSource, selectedQuery);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export const QueryManager = withTranslation()(React.memo(QueryManagerComponent));
