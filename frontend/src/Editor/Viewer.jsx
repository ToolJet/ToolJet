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

    this.setState({
      currentSidebarTab: 2,
      selectedComponent: null,
      currentState: {
        queries: {},
        components: {},
        globals: {
          current_user: {
            email: currentUser.email,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name
          },
          urlparams: {}
        }
      }
    });
  }

  render() {
    const { appDefinition, showQueryConfirmation, currentState } = this.state;

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
                    <img src="/images/logo.svg" width="110" height="32" className="navbar-brand-image" />
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
                {appDefinition.components && (
                  <div className="canvas-area">
                    <Container
                      appDefinition={appDefinition}
                      appDefinitionChanged={() => false} // function not relevant in viewer
                      snapToGrid={true}
                      onEvent={(eventName, options) => onEvent(this, eventName, options)}
                      mode="view"
                      currentState={this.state.currentState}
                      onComponentClick={(id, component) => onComponentClick(this, id, component)}
                      onComponentOptionChanged={(component, optionName, value) => onComponentOptionChanged(this, component, optionName, value)
                      }
                      onComponentOptionsChanged={(component, options) => onComponentOptionsChanged(this, component, options)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DndProvider>
      </div>
    );
  }
}

export { Viewer };
