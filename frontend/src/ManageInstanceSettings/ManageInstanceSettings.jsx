import React from 'react';
import { instanceSettingsService, authenticationService, licenseService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import Skeleton from 'react-loading-skeleton';
import { LicenseBanner } from '@/LicenseBanner';

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
      featureAccess: {},
    };
  }

  componentDidMount() {
    this.fetchSettings();
    this.fetchFeatureAccesss();
  }

  fetchFeatureAccesss = () => {
    licenseService.getFeatureAccess().then((data) => {
      this.setState({ featureAccess: data });
    });
  };

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
    this.setState({
      settings: data,
      options: data.settings,
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
    const index = this.state.options.findIndex((option) => option.key === key);
    const newOptions = [...this.state.options];
    const newValue = !this.returnBooleanValue(newOptions[index]?.value);
    newOptions[index].value = newValue.toString();
    this.setState({
      options: [...newOptions],
    });
  };

  render() {
    const { options, isSaving, featureAccess } = this.state;
    return (
      <ErrorBoundary showFallback={true}>
        <div className="wrapper instance-settings-page animation-fade">
          <ReactTooltip type="dark" effect="solid" delayShow={250} />

          <div className="page-wrapper">
            <div className="container-xl">
              <LicenseBanner classes="mt-3" limits={featureAccess} type="Instance Settings" isAvailable={true}>
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
                        {options.map((option) => (
                          <div key={option?.key} className="form-group mb-3">
                            <label className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                onChange={() => this.optionsChanged(option?.key)}
                                checked={option.value === 'true'}
                                data-cy="form-check-input"
                              />
                              <span className="form-check-label" data-cy="form-check-label">
                                {this.props.t(option?.label_key, option?.label)}
                              </span>
                            </label>
                            <div className="help-text">
                              <div data-cy="instance-settings-help-text">
                                {this.props.t(option?.helper_text_key, option?.helper_text)}
                              </div>
                            </div>
                          </div>
                        ))}

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
              </LicenseBanner>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageInstanceSettings = withTranslation()(ManageInstanceSettingsComponent);
