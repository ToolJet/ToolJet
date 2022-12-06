import React from 'react';
import { appService, authenticationService, orgEnvironmentVariableService, organizationService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { Confirm } from './Viewer/Confirm';
import { ViewerNavigation } from './Viewer/ViewerNavigation';
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
import ViewerLogoIcon from './Icons/viewer-logo.svg';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';
import { resolveReferences, safelyParseJSON, stripTrailingSlash } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { Link, Redirect } from 'react-router-dom';
import Spinner from '@/_ui/Spinner';

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
      errorAppId: null,
      errorVersionId: null,
      errorDetails: null,
    };
  }

  setStateForApp = (data) => {
    const copyDefinition = _.cloneDeep(data.definition);
    const pagesObj = copyDefinition.pages || {};

    const newDefinition = {
      ...copyDefinition,
      pages: pagesObj,
    };

    this.setState({
      app: data,
      isLoading: false,
      isAppLoaded: true,
      appDefinition: newDefinition || { components: {} },
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
      const currentComponents = data.definition.pages[data.definition.homePageId].components;
      mobileLayoutHasWidgets =
        Object.keys(currentComponents).filter((componentId) => currentComponents[componentId]['layouts']['mobile'])
          .length > 0;
    }

    let queryState = {};
    data.data_queries.forEach((query) => {
      if (query.pluginId) {
        queryState[query.name] = {
          ...query.plugin.manifestFile.data.source.exposedVariables,
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
          },
          variables: {},
          page: {
            handle: currentPage.handle,
            name: currentPage.name,
            variables: {},
          },
          ...variables,
        },
        dataQueries: data.data_queries,
        currentPageId: currentPage.id,
      },
      () => {
        computeComponentState(this, data?.definition?.pages[currentPage.id]?.components).then(() => {
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
    appService
      .getAppBySlug(slug)
      .then((data) => {
        this.setStateForApp(data);
        this.setStateForContainer(data);
        this.setWindowTitle(data.name);
      })
      .catch((error) => {
        this.setState({
          errorDetails: error,
          errorAppId: slug,
          errorVersionId: null,
          isLoading: false,
        });
      });
  };

  loadApplicationByVersion = (appId, versionId) => {
    appService
      .getAppByVersion(appId, versionId)
      .then((data) => {
        this.setStateForApp(data);
        this.setStateForContainer(data);
      })
      .catch((error) => {
        this.setState({
          errorDetails: error,
          errorAppId: appId,
          errorVersionId: versionId,
          isLoading: false,
        });
      });
  };

  switchOrganization = (orgId, appId, versionId) => {
    const path = `/applications/${appId}${versionId ? `/versions/${versionId}` : ''}`;
    const sub_path = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : '';

    organizationService.switchOrganization(orgId).then(
      (data) => {
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = `${sub_path}${path}`;
      },
      () => {
        return (window.location.href = `${sub_path}/login/${orgId}?redirectTo=${path}`);
      }
    );
  };

  handleError = (errorDetails, appId, versionId) => {
    try {
      if (errorDetails?.data) {
        const statusCode = errorDetails.data?.statusCode;
        if (statusCode === 403) {
          const errorObj = safelyParseJSON(errorDetails.data?.message);
          if (
            errorObj?.organizationId &&
            this.state.currentUser &&
            this.state.currentUser.organization_id !== errorObj?.organizationId
          ) {
            this.switchOrganization(errorObj?.organizationId, appId, versionId);
            return;
          }
          return <Redirect to={'/'} />;
        } else if (statusCode === 401) return <Redirect to={'/'} />;
      }
    } catch (err) {
      return <Redirect to={'/'} />;
    }
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

    this.handlePageSwitchingBasedOnURLparam();
  }

  handlePageSwitchingBasedOnURLparam() {
    const handleOnURL = this.props.match.params.pageHandle;
    const pageIdCorrespondingToHandleOnURL = handleOnURL
      ? this.findPageIdFromHandle(handleOnURL)
      : this.state.appDefinition.homePageId;

    if (pageIdCorrespondingToHandleOnURL != this.state.currentPageId) {
      const targetPage = this.state.appDefinition.pages[pageIdCorrespondingToHandleOnURL];
      this.setState(
        {
          currentPageId: pageIdCorrespondingToHandleOnURL,
          handle: targetPage.handle,
          name: targetPage.name,
          currentState: {
            ...this.state.currentState,
            globals: {
              ...this.state.currentState.globals,
              urlparams: JSON.parse(JSON.stringify(queryString.parse(this.props.location.search))),
            },
            page: {
              ...this.state.currentState.page,
              name: targetPage.name,
              handle: targetPage.handle,
              variables: {},
            },
          },
        },
        async () => {
          computeComponentState(this, this.state.appDefinition?.pages[this.state.currentPageId].components).then(
            async () => {
              const { events } = this.state.appDefinition?.pages[this.state.currentPageId];
              for (const event of events ?? []) {
                await this.handleEvent(event.eventId, event);
              }
            }
          );
        }
      );
    }
  }

  findPageIdFromHandle(handle) {
    return Object.entries(this.state.appDefinition.pages).filter(([_id, page]) => page.handle === handle)?.[0]?.[0];
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
    const { handle, name, events } = this.state.appDefinition.pages[id];

    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');
    const { globals: existingGlobals } = this.state.currentState;
    const globals = {
      ...existingGlobals,
      urlparams: JSON.parse(JSON.stringify(queryString.parse(queryParamsString))),
    };

    if (this.state.slug) this.props.history.push(`/applications/${this.state.slug}/${handle}?${queryParamsString}`);
    else
      this.props.history.push(
        `/applications/${this.state.appId}/versions/${this.state.versionId}/${handle}?${queryParamsString}`
      );
  };

  handleEvent = (eventName, options) => onEvent(this, eventName, options, 'view');

  computeCanvasMaxWidth = () => {
    const { appDefinition } = this.state;
    let computedCanvasMaxWidth = 1292;

    if (appDefinition.globalSettings?.canvasMaxWidthType === 'px')
      computedCanvasMaxWidth = +appDefinition.globalSettings?.canvasMaxWidth || 1292;
    else if (appDefinition.globalSettings?.canvasMaxWidthType === '%')
      computedCanvasMaxWidth = (window.innerWidth * +appDefinition.globalSettings?.canvasMaxWidth ?? 90) / 100;

    if (appDefinition?.showViewerNavigation) {
      computedCanvasMaxWidth -= 200;
    }

    return computedCanvasMaxWidth;
  };

  render() {
    const {
      appDefinition,
      isLoading,
      isAppLoaded,
      currentLayout,
      deviceWindowWidth,
      defaultComponentStateComputed,
      dataQueries,
      queryConfirmationList,
      errorAppId,
      errorVersionId,
      errorDetails,
      canvasWidth,
    } = this.state;

    const currentCanvasWidth =
      appDefinition?.showViewerNavigation == true
        ? (+appDefinition.globalSettings?.canvasMaxWidth || 1292) - 200
        : canvasWidth;

    const canvasMaxWidth = this.computeCanvasMaxWidth();

    if (this.state.app?.isLoading) {
      return (
        <div className="tooljet-logo-loader">
          <div>
            <div className="loader-logo">
              <ViewerLogoIcon />
            </div>
            <div className="loader-spinner">
              <Spinner />
            </div>
          </div>
        </div>
      );
    } else {
      if (errorDetails) {
        return this.handleError(errorDetails, errorAppId, errorVersionId);
      }
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
              <ViewerNavigation.Header
                showHeader={!appDefinition.globalSettings?.hideHeader && isAppLoaded}
                appName={this.state.app?.name ?? null}
                changeDarkMode={this.changeDarkMode}
                darkMode={this.props.darkMode}
                pages={Object.entries(this.state.appDefinition?.pages) ?? []}
                currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                switchPage={this.switchPage}
                currentLayout={this.state.currentLayout}
              />
              <div className="sub-section">
                <div className="main">
                  <div className="canvas-container align-items-center">
                    <div className="areas d-flex flex-rows justify-content-center">
                      {appDefinition?.showViewerNavigation && (
                        <ViewerNavigation
                          isMobileDevice={this.state.currentLayout === 'mobile'}
                          canvasBackgroundColor={this.computeCanvasBackgroundColor()}
                          pages={Object.entries(this.state.appDefinition?.pages) ?? []}
                          currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                          switchPage={this.switchPage}
                          darkMode={this.props.darkMode}
                        />
                      )}
                      <div
                        className="canvas-area"
                        style={{
                          width: currentCanvasWidth,
                          minHeight: +appDefinition.globalSettings?.canvasMaxHeight || 2400,
                          maxWidth: canvasMaxWidth,
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
}

export const Viewer = withTranslation()(ViewerComponent);
