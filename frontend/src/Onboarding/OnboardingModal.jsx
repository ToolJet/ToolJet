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
      >
        <Modal.Header>
          <Modal.Title className="text-center">Finish ToolJet installation</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <h3>Receive product updates from the ToolJet team? </h3>
          <small>We hate spam and we will never spam</small>

          <input
            // onChange={(e) => onComponentOptionChanged(component, 'value', e.target.value)}
            type="text"
            className="form-control mt-3"
            placeholder={'Your name'}
            onChange={(e) => {
              this.changeOptions('name', e.target.value);
            }}
          />

          <input
            // onChange={(e) => onComponentOptionChanged(component, 'value', e.target.value)}
            type="text"
            className="form-control mt-3"
            placeholder={'Your email'}
            onChange={(e) => {
              this.changeOptions('email', e.target.value);
            }}
          />
        </Modal.Body>

        <Modal.Footer>
          <div className="row w-100">
            <div className="col">
              <button className={`btn btn-primary`} onClick={this.finishOnboarding}>
                Finish setup
              </button>
            </div>
            <div className="col-auto">
              <a onClick={this.skipOnboard} className="mt-2">
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
