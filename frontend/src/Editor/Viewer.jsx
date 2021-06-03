import React from 'react';
import { appService, authenticationService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import 'react-toastify/dist/ReactToastify.css';
import { Confirm } from './Viewer/Confirm';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onComponentClick,
  onQueryConfirm,
  onQueryCancel,
  onEvent,
  runQuery
} from '@/_helpers/appUtils';

class Viewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      users: null,
      appDefinition: {
        components: null
      },
      currentState: {
        queries: {},
        components: {},
        globals: {
          current_user: {},
          urlparams: {}
        }
      }
    };
  }

  componentDidMount() {
    const id = this.props.match.params.id;

    const deviceWindowWidth = window.screen.width;
    const isMobileDevice = deviceWindowWidth < 600;

    let scaleValue = isMobileDevice ? deviceWindowWidth / 450 : 1;

    this.setState({
      isLoading: true,
      deviceWindowWidth,
      scaleValue,
      currentLayout: isMobileDevice ? 'mobile' : 'desktop'
    });

    appService.getApp(id).then((data) => this.setState(
      {
        app: data,
        isLoading: false,
        appDefinition: data.definition
      },
      () => {
        data.data_queries.forEach((query) => {
          if (query.options.runOnPageLoad) {
            runQuery(this, query.id, query.name);
          }
        });
      }
    ));

    const currentUser = authenticationService.currentUserValue;
    let userVars = { };

    if(currentUser) {
      userVars = {
        email: currentUser.email,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name
      };
    }


    this.setState({
      currentSidebarTab: 2,
      selectedComponent: null,
      currentState: {
        queries: {},
        components: {},
        globals: {
          current_user: userVars,
          urlparams: {}
        }
      }
    });
  }

  render() {
    const { 
      appDefinition, 
      showQueryConfirmation, 
      currentState, 
      isLoading,
      currentLayout,
      deviceWindowWidth,
      scaleValue
    } = this.state;

    console.log('currentState', currentState);

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
          <div className="header">
            <header className="navbar navbar-expand-md navbar-light d-print-none">
              <div className="container-xl header-container">
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
                  <span className="navbar-toggler-icon"></span>
                </button>
                <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                  <a href="/">
                    <img src="/assets/images/logo.svg" width="110" height="32" className="navbar-brand-image" />
                  </a>
                </h1>
                {this.state.app && <span>{this.state.app.name}</span>}
                <div className="navbar-nav flex-row order-md-last"></div>
              </div>
            </header>
          </div>
          <div className="sub-section">
            <div className="main">
              <div className="canvas-container align-items-center">
                <div className="canvas-area" style={{width: currentLayout === 'desktop' ? '1292px' : `${deviceWindowWidth}px`}}>
                <Container
                    appDefinition={appDefinition}
                    appDefinitionChanged={() => false} // function not relevant in viewer
                    snapToGrid={true}
                    appLoading={isLoading}
                    onEvent={(eventName, options) => onEvent(this, eventName, options)}
                    mode="view"
                    scaleValue={scaleValue}
                    deviceWindowWidth={deviceWindowWidth}
                    currentLayout={currentLayout}
                    currentState={this.state.currentState}
                    onComponentClick={(id, component) => onComponentClick(this, id, component)}
                    onComponentOptionChanged={(component, optionName, value) => onComponentOptionChanged(this, component, optionName, value)
                    }
                    onComponentOptionsChanged={(component, options) => onComponentOptionsChanged(this, component, options)
                    }
                />
                </div>
              </div>
            </div>
          </div>
        </DndProvider>
      </div>
    );
  }
}

export { Viewer };
