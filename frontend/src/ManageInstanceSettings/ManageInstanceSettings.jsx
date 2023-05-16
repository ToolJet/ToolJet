import React from 'react';
import { instanceSettingsService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import Skeleton from 'react-loading-skeleton';

class ManageInstanceSettingsComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isSaving: false,
      isLoading: false,
      errors: {},
      settings: [],
      options: {},
    };
  }

  componentDidMount() {
    this.fetchSettings();
  }

  fetchSettings = () => {
    this.setState({ isLoading: true });
    instanceSettingsService
      .fetchSettings()
      .then((data) => {
        this.setInitialValues(data);
        this.setState({ isLoading: false });
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ isLoading: false });
      });
  };

  setInitialValues = (data) => {
    const allow_personal_workspace = data.settings?.find((setting) => setting.key === 'ALLOW_PERSONAL_WORKSPACE');
    //const allow_plugin_integration = data.settings?.find((setting) => setting.key === 'ALLOW_PLUGIN_INTEGRATION');
    this.setState({
      settings: data,
      options: {
        allow_personal_workspace: {
          value: allow_personal_workspace.value,
          id: allow_personal_workspace.id,
        },
        // allow_plugin_integration: {
        //   value: allow_plugin_integration.value,
        //   id: allow_plugin_integration.id,
        // },
      },
    });
  };

  reset = () => {
    this.setInitialValues(this.state.settings);
  };

  saveSettings = () => {
    this.setState({ isSaving: true });
    instanceSettingsService
      .update(this.state.options)
      .then(() => {
        toast.success('Instance settings have been updated', {
          position: 'top-center',
        });
        this.setState({ isSaving: false });
        this.fetchSettings();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ isSaving: false });
      });
  };

  returnBooleanValue = (value) => (value === 'true' ? true : false);

  optionsChanged = (key) => {
    const options = this.state.options;
    const newValue = !this.returnBooleanValue(options[`${key}`]?.value);
    options[`${key}`].value = newValue.toString();
    this.setState({
      options,
    });
  };

  render() {
    const { options, isSaving } = this.state;
    return (
      <ErrorBoundary showFallback={true}>
        <div className="wrapper instance-settings-page animation-fade">
          <ReactTooltip type="dark" effect="solid" delayShow={250} />

          <div className="page-wrapper">
            <div className="page-body container-xl">
              <div className="card">
                <div className="card-header">
                  <div className="card-title" data-cy="card-title">
                    {this.props.t(
                      'header.organization.menus.manageInstanceSettings.instanceSettings',
                      'Instance Settings'
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {Object.entries(options) != 0 ? (
                    <form noValidate>
                      <div className="form-group mb-3">
                        <label className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            onChange={() => this.optionsChanged('allow_personal_workspace')}
                            checked={options.allow_personal_workspace.value === 'true'}
                            data-cy="form-check-input"
                          />
                          <span className="form-check-label" data-cy="form-check-label">
                            {this.props.t(
                              'header.organization.menus.manageSSO.generalSettings.allowPersonalWorkspace',
                              'Allow Personal Workspace'
                            )}
                          </span>
                        </label>
                        <div className="help-text">
                          <div data-cy="instance-settings-help-text">
                            {this.props.t(
                              'header.organization.menus.manageSSO.generalSettings.allowPersonalWorkspaceDetails',
                              `This feature will enable users to create their own workspace`
                            )}
                          </div>
                        </div>
                      </div>

                      {/* <div className="form-group mb-3">
                      <label className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          onChange={() => this.optionsChanged('allow_plugin_integration')}
                          checked={options.allow_plugin_integration.value === 'true'}
                          data-cy="form-check-input"
                        />
                        <span className="form-check-label" data-cy="form-check-label">
                          {this.props.t(
                            'header.organization.menus.manageSSO.generalSettings.allowPluginIntegration',
                            'Allow Plugin Integration'
                          )}
                        </span>
                      </label>
                    </div> */}

                      <div className="form-footer">
                        <button
                          type="button"
                          className="btn btn-light mr-2"
                          onClick={this.reset}
                          data-cy="cancel-button"
                        >
                          {this.props.t('globals.cancel', 'Cancel')}
                        </button>
                        <button
                          type="button"
                          className={`btn mx-2 btn-primary ${isSaving ? 'btn-loading' : ''}`}
                          disabled={isSaving}
                          onClick={this.saveSettings}
                          data-cy="save-button"
                        >
                          {this.props.t('globals.save', 'Save')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <Skeleton className="mb-2" />
                        <Skeleton />
                      </div>
                      <div className="row mt-4">
                        <div className=" col-1">
                          <Skeleton />
                        </div>
                        <div className="col-1">
                          <Skeleton />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageInstanceSettings = withTranslation()(ManageInstanceSettingsComponent);
