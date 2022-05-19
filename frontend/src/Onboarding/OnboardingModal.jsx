import React from 'react';
import { tooljetService } from '@/_services';
import Modal from 'react-bootstrap/Modal';

class OnboardingModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: true,
      options: {},
    };
  }

  componentDidMount() {}

  hideModal = () => {
    this.setState({
      showModal: false,
    });
  };

  finishOnboarding = () => {
    this.setState({
      showModal: false,
    });

    tooljetService.finishOnboarding(this.state.options);
  };

  skipOnboard = () => {
    tooljetService.skipOnboarding();
    this.setState({ showModal: false });
  };

  changeOptions = (option, value) => {
    this.setState({
      options: {
        ...this.state.options,
        [option]: value,
      },
    });
  };

  render() {
    return (
      <Modal
        show={this.state.showModal}
        size="md"
        backdrop="static"
        centered={true}
        keyboard={true}
        onEscapeKeyDown={this.hideModal}
        className={`${this.props.darkMode && 'dark'} onboarding-modal`}
      >
        <Modal.Header>
          <Modal.Title className="text-center">Finish ToolJet installation</Modal.Title>
          <br />
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3 mt-2">
            <label className="form-label">Organization</label>
            <div className="input-group input-group-flat">
              <input
                type="text"
                className="form-control"
                onChange={(e) => {
                  this.changeOptions('org', e.target.value);
                }}
              />
              <span className="input-group-text"></span>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Name</label>
            <div className="input-group input-group-flat">
              <input
                type="text"
                className="form-control"
                onChange={(e) => {
                  this.changeOptions('name', e.target.value);
                }}
              />
              <span className="input-group-text"></span>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <div className="input-group input-group-flat">
              <input
                type="text"
                className="form-control"
                onChange={(e) => {
                  this.changeOptions('email', e.target.value);
                }}
              />
              <span className="input-group-text"></span>
            </div>
          </div>
          <small>You will receive updates from the ToolJet team ( 1-2 emails every month, we do not spam )</small>
        </Modal.Body>

        <Modal.Footer>
          <div className="row w-100 gx-0">
            <div className="col">
              <button className={`btn btn-primary`} onClick={this.finishOnboarding}>
                Finish setup
              </button>
            </div>
            <div className="col-auto">
              <a onClick={this.skipOnboard} className="mt-3 text-muted" data-cy="skip-button">
                Skip
              </a>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}

export { OnboardingModal };
