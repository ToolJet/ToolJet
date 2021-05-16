import React from 'react';
import { appService, appVersionService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Skeleton from 'react-loading-skeleton';

class SaveAndPreview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      appId: props.appId,
      isLoading: true,
      showVersionForm: false
    };
  }

  componentDidMount() {
    const appId = this.props.appId;

    this.fetchVersions();

    this.setState({ appId });
  }

  fetchVersions = () => {
    appVersionService.getAll(this.props.appId).then((data) => this.setState({
      versions: data.versions,
      isLoading: false
    }));
  };

  hideModal = () => {
    this.setState({
      showModal: false
    });
  };

  createVersion = () => {
    const newVersionName = this.state.newVersionName;
    const appId = this.props.appId;
    this.setState({ creatingVersion: true });

    appVersionService.create(appId, newVersionName).then(() => {
      this.setState({ showVersionForm: false, creatingVersion: false });
      toast.success('Version Created', { hideProgressBar: true, position: 'top-center' });
      this.fetchVersions();
    });
  };

  saveVersion = (versionId) => {
    this.setState({ isSaving: true });
    appVersionService.save(this.props.appId, versionId, this.props.appDefinition).then(() => {
      this.setState({ showVersionForm: false, isSaving: false });
      toast.success('Version Saved', { hideProgressBar: true, position: 'top-center' });
      this.fetchVersions();
    });
  };

  deployVersion = (versionId) => {
    this.setState({ isDeploying: true });
    appService.saveApp(this.props.appId, { name: this.props.appName, current_version_id: versionId }).then(() => {
      this.setState({ isDeploying: false });
      toast.success('Version Deployed', { hideProgressBar: true, position: 'top-center' });
    });
  };

  render() {
    const {
      showModal, isLoading, versions, showVersionForm, isSaving, isDeploying, creatingVersion
    } = this.state;

    return (
      <div>
        {!showModal && (
          <button className="btn btn-primary btn-sm" onClick={() => this.setState({ showModal: true })}>
            Deploy
          </button>
        )}

        <Modal show={this.state.showModal} size="md" backdrop="static" centered={true} keyboard={true}>
          <Modal.Header>
            <Modal.Title>Versions and deployments</Modal.Title>
            <div>
              {!showVersionForm && (
                <button className="btn btn-primary btn-sm mx-2" onClick={() => this.setState({ showVersionForm: true })}>
                  + Version
                </button>
              )}

              <Button variant="light" size="sm" onClick={() => this.hideModal()}>
                x
              </Button>
            </div>
          </Modal.Header>

          <Modal.Body>
            {showVersionForm && (
              <div className="row">
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="version name"
                    onChange={(e) => this.setState({ newVersionName: e.target.value })}
                  />
                </div>
                <div className="col-auto">
                  <Button variant="primary" onClick={() => this.createVersion()} disabled={creatingVersion}>
                    {creatingVersion ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div style={{ width: '100%' }} className="p-5">
                <Skeleton count={5} />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-vcenter">
                  <tbody>
                    {versions.map((version) => (
                      <tr key={version.id}>
                        <td>
                          <div className="row">
                            <div className="col">
                            {version.name}
                            {version.id === this.props.app.current_version_id && (
                              <small className="mx-2">(current)</small>
                            )}
                            </div>
                            <div className="col-auto">
                              <button
                                className="btn btn-sm"
                                onClick={() => this.saveVersion(version.id)}
                                disabled={isSaving}
                              >
                                {isSaving ? 'saving...' : 'save'}
                              </button>
                              <button
                                className="btn btn-primary btn-sm mx-2"
                                onClick={() => this.deployVersion(version.id)}
                              >
                                {isDeploying ? 'deploying...' : 'deploy'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer></Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export { SaveAndPreview };
