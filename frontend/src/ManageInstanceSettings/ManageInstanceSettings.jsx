import React from 'react';
import { instanceSettingsService, authenticationService, licenseService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import Skeleton from 'react-loading-skeleton';
import { LicenseBanner } from '@/LicenseBanner';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _ from 'lodash';

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
      hasChanges: false,
      initialOptions: {},
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
        this.setState({ isLoading: false, hasChanges: false });
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ isLoading: false });
      });
  };

  setInitialValues = (data) => {
    this.setState({
      settings: data,
      options: _.cloneDeep(data?.settings),
      initialOptions: _.cloneDeep(data?.settings),
    });
  };

  reset = () => {
    this.setState({ options: this.state.initialOptions, hasChanges: false });
  };

  saveSettings = () => {
    this.setState({ isSaving: true });
    instanceSettingsService
      .update(this.state.options)
      .then(() => {
        toast.success('Instance settings have been updated', {
          position: 'top-center',
        });
        this.setState({ isSaving: false, hasChanges: false });
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
    const newOptions = _.cloneDeep(this.state.options);
    const newValue = !this.returnBooleanValue(newOptions[index]?.value);
    newOptions[index].value = newValue.toString();
    this.setState({
      options: [...newOptions],
      hasChanges: true,
    });
  };

  render() {
    const { options, isSaving } = this.state;
    const { disabled } = this.props;
    return (
      <ErrorBoundary showFallback={true}>
        <div className="wrapper instance-settings-page animation-fade">
          <ReactTooltip type="dark" effect="solid" delayShow={250} />

          <div className="page-wrapper">
            <div className="container-xl">
              <div className="card">
                <div className="card-header">
                  <div className="title-banner-wrapper">
                    <div className="card-title" data-cy="card-title">
                      {this.props.t(
                        'header.organization.menus.manageInstanceSettings.instanceSettings',
                        'Manage instance settings'
                      )}
                    </div>
                    {disabled && <LicenseBanner isAvailable={false} showPaidFeatureBanner={true}></LicenseBanner>}
                  </div>
                </div>
                <div className="card-body" style={{ width: '880px', height: '499px', padding: '24px' }}>
                  <div
                    className="card-content"
                    style={{
                      display: 'flex',
                      width: '370px',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    {Object.entries(options) != 0 ? (
                      <form noValidate>
                        {options.map((option) => (
                          <div key={option?.key} className="form-group mb-3">
                            {option && (
                              <label className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  onChange={() => this.optionsChanged(option?.key)}
                                  checked={option.value === 'true'}
                                  data-cy="form-check-input"
                                  disabled={disabled}
                                />
                                <span className="form-check-label" data-cy="form-check-label">
                                  {this.props.t(option?.label_key, option?.label)}
                                </span>
                                <div className="help-text">
                                  <div data-cy="instance-settings-help-text">
                                    {this.props.t(option?.helper_text_key, option?.helper_text)}
                                  </div>
                                </div>
                              </label>
                            )}
                          </div>
                        ))}
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
                <div className="card-footer">
                  <button type="button" className="btn btn-light mr-2" onClick={this.reset} data-cy="cancel-button">
                    {this.props.t('globals.cancel', 'Cancel')}
                  </button>
                  <ButtonSolid
                    onClick={this.saveSettings}
                    disabled={isSaving || disabled || !this.state.hasChanges}
                    data-cy="save-button"
                    variant="primary"
                    className={`btn mx-2 btn-primary ${isSaving ? 'btn-loading' : ''}`}
                    leftIcon="floppydisk"
                    fill="#fff"
                    iconWidth="20"
                  >
                    {this.props.t('globals.savechanges', 'Save')}
                  </ButtonSolid>
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
