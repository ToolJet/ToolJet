import React from 'react';
import { appService, authenticationService, orgEnvironmentVariableService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { Confirm } from './Viewer/Confirm';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onComponentClick,
  onQueryConfirmOrCancel,
  onEvent,
  runQuery,
  computeComponentState,
} from '@/_helpers/appUtils';
import queryString from 'query-string';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import LogoIcon from './Icons/logo.svg';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';
import { resolveReferences } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import _ from 'lodash';

class ViewerComponent extends React.Component {
  constructor(props) {
    super(props);

    const deviceWindowWidth = window.screen.width - 5;
    const isMobileDevice = deviceWindowWidth < 600;

    const pageHandle = this.props.match?.params?.pageHandle;

    const slug = this.props.match.params.slug;
    const appId = this.props.match.params.id;
    const versionId = this.props.match.params.versionId;

    this.state = {
      slug,
      appId,
      versionId,
      deviceWindowWidth,
      currentLayout: isMobileDevice ? 'mobile' : 'desktop',
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      users: null,
      appDefinition: { pages: {} },
      currentState: {
        queries: {},
        components: {},
        globals: {
          currentUser: {},
          theme: { name: props.darkMode ? 'dark' : 'light' },
          urlparams: {},
          environment_variables: {},
          page: {
            handle: pageHandle,
          },
        },
        variables: {},
      },
      queryConfirmationList: [],
      isAppLoaded: false,
    };
  }

  setStateForApp = (data) => {
    this.setState({
      app: data,
      isLoading: false,
      isAppLoaded: true,
      appDefinition: data.definition || { components: {} },
    });
  };

  setStateForContainer = async (data) => {
    const currentUser = authenticationService.currentUserValue;
    let userVars = {};

    if (currentUser) {
      userVars = {
        email: currentUser.email,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        groups: currentUser?.group_permissions.map((group) => group.group),
      };
    }

    let mobileLayoutHasWidgets = false;

    if (this.state.currentLayout === 'mobile') {
      mobileLayoutHasWidgets =
        Object.keys(data.definition.components).filter(
          (componentId) => data.definition.components[componentId]['layouts']['mobile']
        ).length > 0;
    }

    let queryState = {};
    data.data_queries.forEach((query) => {
      if (query.plugin_id) {
        queryState[query.name] = {
          ...query.plugin.manifest_file.data.source.exposedVariables,
          ...this.state.currentState.queries[query.name],
        };
      } else {
        queryState[query.name] = {
          ...DataSourceTypes.find((source) => source.kind === query.kind).exposedVariables,
          ...this.state.currentState.queries[query.name],
        };
      }
    });

    const variables = await this.fetchOrgEnvironmentVariables(data.slug, data.is_public);

    const pages = Object.entries(data.definition.pages).map(([pageId, page]) => ({ id: pageId, ...page }));
    const homePageId = data.definition.homePageId;
    const startingPageHandle = this.props.match?.params?.pageHandle;
    const currentPageId = pages.filter((page) => page.handle === startingPageHandle)[0]?.id ?? homePageId;
    const currentPage = pages.find((page) => page.id === currentPageId);

    this.setState(
      {
        currentSidebarTab: 2,
        currentLayout: mobileLayoutHasWidgets ? 'mobile' : 'desktop',
        canvasWidth:
          this.state.currentLayout === 'desktop'
            ? '100%'
            : mobileLayoutHasWidgets
            ? `${this.state.deviceWindowWidth}px`
            : '1292px',
        selectedComponent: null,
        currentState: {
          queries: queryState,
          components: {},
          globals: {
            currentUser: userVars,
            theme: { name: this.props.darkMode ? 'dark' : 'light' },
            urlparams: JSON.parse(JSON.stringify(queryString.parse(this.props.location.search))),
            page: {
              handle: currentPage.handle,
              name: currentPage.name,
              variables: {},
            },
          },
          variables: {},
          ...variables,
        },
        dataQueries: data.data_queries,
        currentPageId: currentPage.id,
      },
      () => {
        computeComponentState(this, data?.definition?.pages[currentPageId].components).then(() => {
          console.log('Default component state computed and set');
          this.runQueries(data.data_queries);
        });
      }
    );
  };

  runQueries = (data_queries) => {
    data_queries.forEach((query) => {
      if (query.options.runOnPageLoad) {
        runQuery(this, query.id, query.name, undefined, 'view');
      }
    });
  };

  fetchOrgEnvironmentVariables = async (slug, isPublic) => {
    const variables = {
      client: {},
      server: {},
    };

    let variablesResult;
    if (!isPublic) {
      variablesResult = await orgEnvironmentVariableService.getVariables();
    } else {
      variablesResult = await orgEnvironmentVariableService.getVariablesFromPublicApp(slug);
    }

    variablesResult.variables.map((variable) => {
      variables[variable.variable_type][variable.variable_name] =
        variable.variable_type === 'server' ? 'HiddenEnvironmentVariable' : variable.value;
    });
    return variables;
  };

  loadApplicationBySlug = (slug) => {
    appService.getAppBySlug(slug).then((data) => {
      this.setStateForApp(data);
      this.setStateForContainer(data);
      this.setWindowTitle(data.name);
      this.setState({ isLoading: false });
    });
  };

  loadApplicationByVersion = (appId, versionId) => {
    appService.getAppByVersion(appId, versionId).then((data) => {
      this.setStateForApp(data);
      this.setStateForContainer(data);
    });
  };

  componentDidMount() {
    const slug = this.props.match.params.slug;
    const appId = this.props.match.params.id;
    const versionId = this.props.match.params.versionId;

    this.setState({ isLoading: false });
    slug ? this.loadApplicationBySlug(slug) : this.loadApplicationByVersion(appId, versionId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.slug && this.props.match.params.slug !== prevProps.match.params.slug) {
      this.setState({ isLoading: true });
      this.loadApplicationBySlug(this.props.match.params.slug);
    }
  }

  getCanvasWidth = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0].getBoundingClientRect();
    return canvasBoundingRect?.width;
  };

  setWindowTitle(name) {
    document.title = name ?? 'Untitled App';
  }

  computeCanvasBackgroundColor = () => {
    const resolvedBackgroundColor =
      resolveReferences(this.state.appDefinition?.globalSettings?.backgroundFxQuery, this.state.currentState) ??
      '#edeff5';
    if (['#2f3c4c', '#edeff5'].includes(resolvedBackgroundColor)) {
      return this.props.darkMode ? '#2f3c4c' : '#edeff5';
    }
    return resolvedBackgroundColor;
  };

  changeDarkMode = (newMode) => {
    this.setState({
      currentState: {
        ...this.state.currentState,
        globals: {
          ...this.state.currentState.globals,
          theme: { name: newMode ? 'dark' : 'light' },
        },
      },
      showQuerySearchField: false,
    });
    this.props.switchDarkMode(newMode);
  };

  switchPage = (id, queryParams = []) => {
    const { handle, name } = this.state.appDefinition.pages[id];

    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');
    const { globals: existingGlobals } = this.state.currentState;
    const globals = {
      ...existingGlobals,
      urlparams: JSON.parse(JSON.stringify(queryString.parse(queryParamsString))),
    };

    this.setState(
      {
        currentPageId: id,
        handle,
        name,
        currentState: {
          ...this.state.currentState,
          globals,
          page: {
            ...this.state.currentState.page,
            variables: {},
          },
        },
      },
      () => {
        if (this.state.slug) this.props.history.push(`/applications/${this.state.slug}/${handle}?${queryParamsString}`);
        else
          this.props.history.push(
            `/applications/${this.state.appId}/versions/${this.state.versionId}/${handle}?${queryParamsString}`
          );
        computeComponentState(this, this.state.appDefinition?.pages[id].components);
      }
    );
  };

  render() {
    const {
      appDefinition,
      isLoading,
      isAppLoaded,
      currentLayout,
      deviceWindowWidth,
      defaultComponentStateComputed,
      canvasWidth,
      dataQueries,
      queryConfirmationList,
    } = this.state;

    const currentCanvasWidth =
      appDefinition?.showViewerNavigation == true
        ? (+appDefinition.globalSettings?.canvasMaxWidth || 1292) - 200
        : canvasWidth;

    if (this.state.app?.is_maintenance_on) {
      return (
        <div className="maintenance_container">
          <div className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h3>{this.props.t('viewer', 'Sorry!. This app is under maintenance')}</h3>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="viewer wrapper">
          <Confirm
            show={queryConfirmationList.length > 0}
            message={'Do you want to run this query?'}
            onConfirm={(queryConfirmationData) => onQueryConfirmOrCancel(this, queryConfirmationData, true, 'view')}
            onCancel={() => onQueryConfirmOrCancel(this, queryConfirmationList[0], false, 'view')}
            queryConfirmationData={queryConfirmationList[0]}
            key={queryConfirmationList[0]?.queryName}
          />
          <DndProvider backend={HTML5Backend}>
            {!appDefinition.globalSettings?.hideHeader && isAppLoaded && (
              <div className="header">
                <header className="navbar navbar-expand-md navbar-light d-print-none">
                  <div className="container-xl header-container">
                    <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0">
                      <Link to="/" data-cy="viewer-page-logo">
                        <LogoIcon />
                      </Link>
                    </h1>
                    {this.state.app && <span>{this.state.app.name}</span>}
                    <div className="d-flex align-items-center m-1 p-1">
                      <DarkModeToggle switchDarkMode={this.changeDarkMode} darkMode={this.props.darkMode} />
                    </div>
                  </div>
                </header>
              </div>
            )}

            <div className="sub-section">
              <div className="main">
                <div className="canvas-container">
                  <div className="areas d-flex flex-rows justify-content-center">
                    {appDefinition?.showViewerNavigation && (
                      <div
                        className="navigation-area"
                        style={{
                          width: 200,
                          backgroundColor: this.computeCanvasBackgroundColor(),
                        }}
                      >
                        <div className="page-handler-wrapper">
                          {Object.entries(this.state.appDefinition?.pages ?? {}).map(([id, page]) => (
                            <div
                              key={page.handle}
                              onClick={() => this.switchPage(id)}
                              className={`viewer-page-handler cursor-pointer ${this.props.darkMode && 'dark'}`}
                            >
                              {console.log('this.state.currentPageId', id === this.state.currentPageId)}
                              <div className={`card mb-1  ${id === this.state.currentPageId ? 'active' : ''}`}>
                                <div className="card-body">
                                  <span className="mx-3">{_.truncate(page.name, { length: 22 })}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div
                      className="canvas-area"
                      style={{
                        width: currentCanvasWidth,
                        minHeight: +appDefinition.globalSettings?.canvasMaxHeight || 2400,
                        maxWidth: (+appDefinition.globalSettings?.canvasMaxWidth || 1292) - 200,
                        maxHeight: +appDefinition.globalSettings?.canvasMaxHeight || 2400,
                        backgroundColor: this.computeCanvasBackgroundColor(),
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {defaultComponentStateComputed && (
                        <>
                          {isLoading ? (
                            <div className="mx-auto mt-5 w-50 p-5">
                              <center>
                                <div className="spinner-border text-azure" role="status"></div>
                              </center>
                            </div>
                          ) : (
                            <Container
                              appDefinition={appDefinition}
                              appDefinitionChanged={() => false} // function not relevant in viewer
                              snapToGrid={true}
                              appLoading={isLoading}
                              darkMode={this.props.darkMode}
                              onEvent={(eventName, options) => onEvent(this, eventName, options, 'view')}
                              mode="view"
                              deviceWindowWidth={deviceWindowWidth}
                              currentLayout={currentLayout}
                              currentState={this.state.currentState}
                              selectedComponent={this.state.selectedComponent}
                              onComponentClick={(id, component) => {
                                this.setState({
                                  selectedComponent: { id, component },
                                });
                                onComponentClick(this, id, component, 'view');
                              }}
                              onComponentOptionChanged={(component, optionName, value) => {
                                return onComponentOptionChanged(this, component, optionName, value);
                              }}
                              onComponentOptionsChanged={(component, options) =>
                                onComponentOptionsChanged(this, component, options)
                              }
                              canvasWidth={this.getCanvasWidth()}
                              dataQueries={dataQueries}
                              currentPageId={this.state.currentPageId}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DndProvider>
        </div>
      );
    }
  }
}

export const Viewer = withTranslation()(ViewerComponent);
