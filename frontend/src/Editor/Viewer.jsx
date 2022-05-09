import React from 'react';
import { appService, authenticationService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { Confirm } from './Viewer/Confirm';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onComponentClick,
  onQueryConfirm,
  onQueryCancel,
  onEvent,
  runQuery,
  computeComponentState,
} from '@/_helpers/appUtils';
import queryString from 'query-string';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import LogoIcon from './Icons/logo.svg';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';

class Viewer extends React.Component {
  constructor(props) {
    super(props);

    const deviceWindowWidth = window.screen.width - 5;
    const isMobileDevice = deviceWindowWidth < 600;

    this.state = {
      deviceWindowWidth,
      currentLayout: isMobileDevice ? 'mobile' : 'desktop',
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      users: null,
      appDefinition: { components: {} },
      currentState: {
        queries: {},
        components: {},
        globals: {
          currentUser: {},
          theme: { name: props.darkMode ? 'dark' : 'light' },
          urlparams: {},
        },
      },
    };
  }

  setStateForApp = (data) => {
    this.setState({
      app: data,
      isLoading: false,
      appDefinition: data.definition || { components: {} },
    });
  };

  setStateForContainer = (data) => {
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
      queryState[query.name] = {
        ...DataSourceTypes.find((source) => source.kind === query.kind).exposedVariables,
        ...this.state.currentState.queries[query.name],
      };
    });

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
        },
      },
      () => {
        computeComponentState(this, data?.definition?.components).then(() => {
          console.log('Default component state computed and set');
          this.runQueries(data.data_queries);
        });
      }
    );
  };

  runQueries = (data_queries) => {
    data_queries.forEach((query) => {
      if (query.options.runOnPageLoad) {
        runQuery(this, query.id, query.name);
      }
    });
  };

  loadApplicationBySlug = (slug) => {
    appService.getAppBySlug(slug).then((data) => {
      this.setStateForApp(data);
      this.setStateForContainer(data);
      this.setState({ isLoading: false });
      this.setWindowTitle(data.name);
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

  render() {
    const {
      appDefinition,
      showQueryConfirmation,
      isLoading,
      currentLayout,
      deviceWindowWidth,
      defaultComponentStateComputed,
      canvasWidth,
    } = this.state;

    if (this.state.app?.is_maintenance_on) {
      return (
        <div className="maintenance_container">
          <div className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h3>Sorry!. This app is under maintenance</h3>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="viewer wrapper">
          <Confirm
            show={showQueryConfirmation}
            message={'Do you want to run this query?'}
            onConfirm={(queryConfirmationData) => onQueryConfirm(this, queryConfirmationData)}
            onCancel={() => onQueryCancel(this)}
            queryConfirmationData={this.state.queryConfirmationData}
          />
          <DndProvider backend={HTML5Backend}>
            {!appDefinition.globalSettings?.hideHeader && (
              <div className="header">
                <header className="navbar navbar-expand-md navbar-light d-print-none">
                  <div className="container-xl header-container">
                    <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0">
                      <a href="/">
                        <LogoIcon />
                      </a>
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
                <div className="canvas-container align-items-center">
                  <div
                    className="canvas-area"
                    style={{
                      width: canvasWidth,
                      minHeight: +appDefinition.globalSettings?.canvasMaxHeight || 2400,
                      maxWidth: +appDefinition.globalSettings?.canvasMaxWidth || 1292,
                      maxHeight: +appDefinition.globalSettings?.canvasMaxHeight || 2400,
                      backgroundColor: appDefinition.globalSettings?.canvasBackgroundColor || '#edeff5',
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
                          />
                        )}
                      </>
                    )}
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

export { Viewer };
