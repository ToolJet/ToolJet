import React from 'react';
import { datasourceService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { defaultOptions } from './DefaultOptions';
import { TestConnection } from './TestConnection';
import { DataBaseSources, ApiSources, DataSourceTypes, SourceComponents } from './SourceComponents';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import config from 'config';

class DataSourceManager extends React.Component {
  constructor(props) {
    super(props);

    let selectedDataSource = null;
    let options = {};
    let dataSourceMeta = {};

    if (props.selectedDataSource) {
      selectedDataSource = props.selectedDataSource;
      options = selectedDataSource.options;
      dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedDataSource.kind);
    }

    this.state = {
      currentUser: authenticationService.currentUserValue,
      showModal: true,
      appId: props.appId,
      selectedDataSource,
      options,
      dataSourceMeta,
      isSaving: false,
    };
  }

  componentDidMount() {
    this.setState({
      appId: this.props.appId,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedDataSource != this.props.selectedDataSource) {
      this.setState({
        selectedDataSource: this.props.selectedDataSource,
        options: this.props.selectedDataSource?.options,
        dataSourceMeta: DataSourceTypes.find((source) => source.kind === this.props.selectedDataSource?.kind),
      });
    }
  }

  selectDataSource = (source) => {
    this.setState({
      dataSourceMeta: source,
      selectedDataSource: source,
      options: defaultOptions[source.kind],
      name: source.kind,
    });
  };

  onNameChanged = (newName) => {
    this.setState({
      selectedDataSource: {
        ...this.state.selectedDataSource,
        name: newName,
      },
    });
  };

  onExit = () => {
    this.setState({
      dataSourceMeta: {},
      selectedDataSource: null,
      options: {},
    });
  };

  setStateAsync = (state) => {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  };

  optionchanged = (option, value) => {
    return this.setStateAsync({
      connectionTestError: null,
      options: {
        ...this.state.options,
        [option]: { value },
      },
    });
  };

  hideModal = () => {
    this.onExit();
    this.props.hideModal();
  };

  createDataSource = () => {
    const { appId, options, selectedDataSource } = this.state;
    const name = selectedDataSource.name;
    const kind = selectedDataSource.kind;

    const parsedOptions = Object.keys(options).map((key) => {
      const keyMeta = selectedDataSource.options[key];
      return {
        key: key,
        value: options[key].value,
        encrypted: keyMeta ? keyMeta.encrypted : false,
      };
    });

    if (selectedDataSource.id) {
      this.setState({ isSaving: true });
      datasourceService.save(selectedDataSource.id, appId, name, parsedOptions).then(() => {
        this.setState({ isSaving: false });
        this.hideModal();
        toast.success('Datasource Saved', { hideProgressBar: true, position: 'top-center' });
        this.props.dataSourcesChanged();
      });
    } else {
      this.setState({ isSaving: true });
      datasourceService.create(appId, name, kind, parsedOptions).then(() => {
        this.setState({ isSaving: false });
        this.hideModal();
        toast.success('Datasource Added', { hideProgressBar: true, position: 'top-center' });
        this.props.dataSourcesChanged();
      });
    }
  };

  renderSourceComponent = (kind) => {
    const { options, isSaving } = this.state;

    const sourceComponentName = kind.charAt(0).toUpperCase() + kind.slice(1);
    const ComponentToRender = SourceComponents[sourceComponentName];
    return (
      <ComponentToRender
        optionchanged={this.optionchanged}
        createDataSource={this.createDataSource}
        options={options}
        isSaving={isSaving}
        hideModal={this.hideModal}
        selectedDataSource={this.state.selectedDataSource}
      />
    );
  };

  onConnectionTestFailed = (data) => {
    this.setState({ connectionTestError: data });
  };

  render() {
    const { dataSourceMeta, selectedDataSource, options, isSaving, connectionTestError } = this.state;

    return (
      <div>
        <Modal
          show={this.props.showDataSourceManagerModal}
          size={selectedDataSource ? 'lg' : 'xl'}
          onEscapeKeyDown={this.hideModal}
          className="mt-5"
          contentClassName={this.props.darkMode ? 'theme-dark' : ''}
          animation={false}
          onExit={this.onExit}
        >
          <Modal.Header>
            <Modal.Title>
              {selectedDataSource && (
                <div className="row">
                  <img
                    src={`/assets/images/icons/editor/datasources/${dataSourceMeta.kind.toLowerCase()}.svg`}
                    style={{ objectFit: 'contain' }}
                    height="25"
                    width="25"
                    className="mt-1 col-md-2"
                  ></img>
                  <div className="input-icon" style={{ width: '160px' }}>
                    <input
                      type="text"
                      onChange={(e) => this.onNameChanged(e.target.value)}
                      className="form-control-plaintext form-control-plaintext-sm"
                      value={selectedDataSource.name}
                      style={{ width: '160px' }}
                      autoFocus
                    />
                    <span className="input-icon-addon">
                      <img src="/assets/images/icons/edit-source.svg" width="12" height="12" />
                    </span>
                  </div>
                </div>
              )}
              {!selectedDataSource && <span className="text-muted">Add new datasource</span>}
            </Modal.Title>
            <Button variant={this.props.darkMode ? 'secondary' : 'light'} size="sm" onClick={() => this.hideModal()}>
              x
            </Button>
          </Modal.Header>

          <Modal.Body>
            {!selectedDataSource && (
              <div>
                <div className="row row-deck">
                  <h4 className="text-muted mb-2">DATABASES</h4>
                  {DataBaseSources.map((dataSource) => (
                    <div className="col-md-2" key={dataSource.name}>
                      <div className="card mb-3" role="button" onClick={() => this.selectDataSource(dataSource)}>
                        <div className="card-body">
                          <center>
                            <img
                              src={`/assets/images/icons/editor/datasources/${dataSource.kind.toLowerCase()}.svg`}
                              width="50"
                              height="50"
                              alt=""
                            />

                            <br></br>
                            <br></br>
                            {dataSource.name}
                          </center>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row row-deck mt-2">
                  <h4 className="text-muted mb-2">APIS</h4>
                  {ApiSources.map((dataSource) => (
                    <div className="col-md-2" key={dataSource.name}>
                      <div className="card" role="button" onClick={() => this.selectDataSource(dataSource)}>
                        <div className="card-body">
                          <center>
                            <img
                              src={`/assets/images/icons/editor/datasources/${dataSource.kind.toLowerCase()}.svg`}
                              width="50"
                              height="50"
                              alt=""
                            />

                            <br></br>
                            <br></br>
                            {dataSource.name}
                          </center>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDataSource && <div>{this.renderSourceComponent(selectedDataSource.kind)}</div>}
          </Modal.Body>

          {selectedDataSource && !dataSourceMeta.customTesting && (
            <Modal.Footer>
              <div className="row w-100">
                <div className="alert alert-info" role="alert">
                  <div className="text-muted">
                    Please white-list our IP address if your datasource is not publicly accessible. IP:{' '}
                    <span className="px-2 py-1">{config.SERVER_IP}</span>
                    <CopyToClipboard
                      text={config.SERVER_IP}
                      onCopy={() =>
                        toast.success('IP copied to clipboard', {
                          hideProgressBar: true,
                          position: 'top-center',
                        })
                      }
                    >
                      <img
                        src="/assets/images/icons/copy.svg"
                        className="mx-1 svg-icon"
                        width="14"
                        height="14"
                        role="button"
                      />
                    </CopyToClipboard>
                  </div>
                </div>
              </div>

              {connectionTestError && (
                <div className="row w-100">
                  <div className="alert alert-danger" role="alert">
                    <div className="text-muted">{connectionTestError.message}</div>
                  </div>
                </div>
              )}

              <div className="col">
                <small>
                  <a
                    href={`https://docs.tooljet.io/docs/data-sources/${selectedDataSource.kind}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read documentation
                  </a>
                </small>
              </div>
              <div className="col-auto">
                <TestConnection
                  kind={selectedDataSource.kind}
                  options={options}
                  onConnectionTestFailed={this.onConnectionTestFailed}
                />
              </div>
              <div className="col-auto">
                <Button
                  className={`m-2 ${isSaving ? 'btn-loading' : ''}`}
                  disabled={isSaving}
                  variant="primary"
                  onClick={this.createDataSource}
                >
                  {'Save'}
                </Button>
              </div>
            </Modal.Footer>
          )}

          {!dataSourceMeta?.hideSave && selectedDataSource && dataSourceMeta.customTesting && (
            <Modal.Footer>
              <div className="row mt-3">
                <div className="col"></div>
                <div className="col-auto">
                  <Button className="m-2" disabled={isSaving} variant="primary" onClick={this.createDataSource}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          )}
        </Modal>
      </div>
    );
  }
}

export { DataSourceManager };
