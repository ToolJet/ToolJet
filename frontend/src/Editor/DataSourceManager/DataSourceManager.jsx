import React from 'react';
import { datasourceService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-hot-toast';
import { getSvgIcon } from '@/_helpers/appUtils';
import { TestConnection } from './TestConnection';
import {
  DataBaseSources,
  ApiSources,
  DataSourceTypes,
  SourceComponents,
  CloudStorageSources,
} from './SourceComponents';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import config from 'config';
import { isEmpty } from 'lodash';

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
      isCopied: false,
    };
  }

  componentDidMount() {
    this.setState({
      appId: this.props.appId,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedDataSource !== this.props.selectedDataSource) {
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
      connectionTestError: null,
      isCopied: false,
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
    const appVersionId = this.props.editingVersionId;

    const parsedOptions = Object.keys(options).map((key) => {
      const keyMeta = selectedDataSource.options[key];
      return {
        key: key,
        value: options[key].value,
        encrypted: keyMeta ? keyMeta.encrypted : false,
      };
    });
    if (name.trim() !== '') {
      if (selectedDataSource.id) {
        this.setState({ isSaving: true });
        datasourceService.save(selectedDataSource.id, appId, name, parsedOptions).then(() => {
          this.setState({ isSaving: false });
          this.hideModal();
          toast.success('Datasource Saved', { position: 'top-center' });
          this.props.dataSourcesChanged();
        });
      } else {
        this.setState({ isSaving: true });
        datasourceService.create(appId, appVersionId, name, kind, parsedOptions).then(() => {
          this.setState({ isSaving: false });
          this.hideModal();
          toast.success('Datasource Added', { position: 'top-center' });
          this.props.dataSourcesChanged();
        });
      }
    } else {
      toast.error('The name of datasource should not be empty', { position: 'top-center' });
    }
  };

  renderSourceComponent = (kind) => {
    const { options, isSaving } = this.state;

    const sourceComponentName = kind.charAt(0).toUpperCase() + kind.slice(1);
    const ComponentToRender = SourceComponents[sourceComponentName];
    return (
      <ComponentToRender
        optionsChanged={(options = {}) => this.setState({ options })}
        optionchanged={this.optionchanged}
        createDataSource={this.createDataSource}
        options={options}
        isSaving={isSaving}
        hideModal={this.hideModal}
        selectedDataSource={this.state.selectedDataSource}
        isEditMode={!isEmpty(this.state.selectedDataSource)}
      />
    );
  };

  onConnectionTestFailed = (data) => {
    this.setState({ connectionTestError: data });
  };

  render() {
    const { dataSourceMeta, selectedDataSource, options, isSaving, connectionTestError, isCopied } = this.state;

    return (
      <div>
        <Modal
          show={this.props.showDataSourceManagerModal}
          size={selectedDataSource ? 'lg' : 'xl'}
          onEscapeKeyDown={this.hideModal}
          contentClassName={this.props.darkMode ? 'theme-dark' : ''}
          animation={false}
          onExit={this.onExit}
        >
          <Modal.Header>
            <Modal.Title>
              {selectedDataSource && (
                <div className="row">
                  {getSvgIcon(dataSourceMeta.kind.toLowerCase(), 35, 35)}
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
                  <h4 className="mb-2">DATABASES</h4>
                  {DataBaseSources.map((dataSource) => (
                    <div className="col-md-2" key={dataSource.name}>
                      <div className="card mb-3" role="button" onClick={() => this.selectDataSource(dataSource)}>
                        <div className="card-body">
                          <center>
                            {getSvgIcon(dataSource.kind.toLowerCase())}
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
                  <h4 className="mb-2">APIS</h4>
                  {ApiSources.map((dataSource) => (
                    <div className="col-md-2" key={dataSource.name}>
                      <div className="card mb-3" role="button" onClick={() => this.selectDataSource(dataSource)}>
                        <div className="card-body">
                          <center>
                            {getSvgIcon(dataSource.kind.toLowerCase())}
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
                  <h4 className="mb-2">CLOUD STORAGES</h4>
                  {CloudStorageSources.map((dataSource) => (
                    <div className="col-md-2" key={dataSource.name}>
                      <div className="card mb-3" role="button" onClick={() => this.selectDataSource(dataSource)}>
                        <div className="card-body">
                          <center>
                            {getSvgIcon(dataSource.kind.toLowerCase())}
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
                <div className="card-body datasource-footer-info">
                  <div className="row">
                    <div className="col-1">
                      <svg
                        className="m-2"
                        width="14"
                        height="16"
                        viewBox="0 0 14 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.4305 2.4488C10.2559 1.27263 8.68244 0.624972 7.00002 0.624972C6.17871 0.623014 5.3651 0.783339 4.60593 1.09674C3.84676 1.41014 3.15699 1.87043 2.57624 2.45119C1.99548 3.03195 1.53518 3.72172 1.22178 4.48089C0.908385 5.24006 0.74806 6.05366 0.750018 6.87497C0.750018 8.69607 1.44806 10.3996 2.66408 11.5484L2.83439 11.7082C3.53791 12.366 4.50002 13.2672 4.50002 14.0625V15.625H6.37502V10.5121L4.64533 9.53122L5.35939 8.50466L7.00002 9.37497L8.61291 8.50036L9.359 9.50349L7.62502 10.5191V15.625H9.50002V14.0625C9.50002 13.2859 10.4516 12.3855 11.1465 11.7277L11.3383 11.5457C12.5891 10.3515 13.25 8.73474 13.25 6.87497C13.2542 6.05358 13.0955 5.23952 12.7832 4.4798C12.4709 3.72009 12.0111 3.0298 11.4305 2.4488Z"
                          fill="#EEB209"
                        />
                      </svg>
                    </div>
                    <div className="col" style={{ maxWidth: '480px' }}>
                      <p>Please white-list our IP address if your databases are not publicly accessabile</p>
                    </div>
                    <div className="col-auto">
                      {isCopied ? (
                        <center className="my-2">
                          <span className="copied">Copied</span>
                        </center>
                      ) : (
                        <CopyToClipboard
                          text={config.SERVER_IP}
                          onCopy={() => {
                            this.setState({ isCopied: true });
                          }}
                        >
                          <button type="button" className={`copy-button ${this.props.darkMode && 'dark-button'}`}>
                            <svg
                              width="15"
                              height="18"
                              viewBox="0 0 15 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.5 15.6667H2.16667V4.83334C2.16667 4.37501 1.79167 4.00001 1.33333 4.00001C0.875 4.00001 0.5 4.37501 0.5 4.83334V15.6667C0.5 16.5833 1.25 17.3333 2.16667 17.3333H10.5C10.9583 17.3333 11.3333 16.9583 11.3333 16.5C11.3333 16.0417 10.9583 15.6667 10.5 15.6667ZM14.6667 12.3333V2.33334C14.6667 1.41667 13.9167 0.666672 13 0.666672H5.5C4.58333 0.666672 3.83333 1.41667 3.83333 2.33334V12.3333C3.83333 13.25 4.58333 14 5.5 14H13C13.9167 14 14.6667 13.25 14.6667 12.3333ZM13 12.3333H5.5V2.33334H13V12.3333Z"
                                fill="currentColor"
                              />
                            </svg>
                            Copy
                          </button>
                        </CopyToClipboard>
                      )}
                    </div>
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
                    className="color-primary"
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
                  darkMode={this.props.darkMode}
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
                <Button className="m-2" disabled={isSaving} variant="primary" onClick={this.createDataSource}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Modal.Footer>
          )}
        </Modal>
      </div>
    );
  }
}

export { DataSourceManager };
