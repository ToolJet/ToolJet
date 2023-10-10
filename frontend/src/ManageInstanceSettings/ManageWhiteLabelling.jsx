import React from 'react';
import { whiteLabellingService, authenticationService, licenseService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import Skeleton from 'react-loading-skeleton';
import { LicenseBanner } from '@/LicenseBanner';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _ from 'lodash';

class ManageWhiteLabellingComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isSaving: false,
      isLoading: false,
      errors: {},
      settings: {},
      initialSettings: {},
      hasChanges: false,
    };
  }

  componentDidMount() {
    this.fetchFeatureAccess();
    this.fetchSettings();
  }

  setDisabledStatus = (licenseData) => {
    const disabled =
      licenseData?.licenseStatus?.isExpired ||
      !licenseData?.licenseStatus?.isLicenseValid ||
      licenseData?.whiteLabelling !== true;
    this.setState({ disabled });
  };

  fetchFeatureAccess = () => {
    this.setState({ isLoading: true });
    licenseService.getFeatureAccess().then((data) => {
      this.setDisabledStatus(data);
      this.setState({ isLoading: false });
    });
  };

  fetchSettings = () => {
    this.setState({ isLoading: true });
    whiteLabellingService
      .get()
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
      settings: _.cloneDeep(data),
      initialSettings: _.cloneDeep(data),
    });
  };

  reset = () => {
    this.setState({ settings: this.state.initialSettings, hasChanges: false });
  };

  saveSettings = () => {
    this.setState({ isSaving: true });

    const transformedSettings = this.transformKeysToCamelCase(this.state.settings);

    whiteLabellingService
      .update(transformedSettings)
      .then(() => {
        window.location = `${window.public_config?.TOOLJET_HOST}${
          window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
        }instance-settings/white-labelling`;
        this.setState({ isSaving: false, hasChanges: false });
        this.fetchSettings();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.reset();
        this.setState({ isSaving: false });
      });
  };

  returnBooleanValue = (value) => (value === 'true' ? true : false);

  optionsChanged = (key, newValue) => {
    this.setState((prevState) => ({
      settings: {
        ...prevState.settings,
        [key]: newValue,
      },
      hasChanges: true,
    }));
  };

  transformKeysToCamelCase = (data) => {
    const transformedData = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const camelCaseKey = key
          .split(' ')
          .map((word, index) =>
            index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join('');
        transformedData[camelCaseKey] = data[key];
      }
    }
    return transformedData;
  };

  render() {
    const { settings, isSaving, disabled, isLoading } = this.state;
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
                        'White labelling'
                      )}
                    </div>
                    {disabled && <LicenseBanner isAvailable={false} showPaidFeatureBanner={true}></LicenseBanner>}
                  </div>
                </div>
                <div className="card-body">
                  <div
                    className="card-content"
                    style={{
                      display: 'flex',
                      width: '516px',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    {!isLoading && Object.keys(settings).length !== 0 ? (
                      <form noValidate>
                        <div key="App Logo" className="form-group mb-3">
                          <label className="form-label" data-cy="name-label">
                            App Logo
                          </label>
                          <div className="tj-app-input">
                            <div>
                              <input
                                className="form-control"
                                type="text"
                                onChange={(e) => this.optionsChanged('App Logo', e.target.value)}
                                aria-describedby="emailHelp"
                                value={settings['App Logo']}
                                data-cy={`input-field-App Logo`}
                                style={{ width: '516px' }}
                                placeholder={'https://app.tooljet.com/logo.svg' || 'Enter App Logo'}
                                disabled={disabled}
                              />
                              <div className="help-text">
                                <div
                                  data-cy="instance-settings-help-text"
                                  style={{
                                    color: 'var(--slate-light-10, var(--slate-10, #7E868C))',
                                    fontFamily: 'IBM Plex Sans',
                                    fontSize: '10px',
                                    fontStyle: 'normal',
                                    fontWeight: 400,
                                  }}
                                >
                                  This will be used for branding across the app. Required dimensions of the logo- width
                                  130px & height 26px
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div key="Page Title" className="form-group mb-3">
                          <label className="form-label" data-cy="name-label">
                            Page Title
                          </label>
                          <div className="tj-app-input">
                            <div>
                              <input
                                className="form-control"
                                type="text"
                                onChange={(e) => this.optionsChanged('Page Title', e.target.value)}
                                aria-describedby="emailHelp"
                                value={settings['Page Title']}
                                data-cy={`input-field-Page Title`}
                                style={{ width: '516px' }}
                                placeholder={'ToolJet' || 'Enter app title'}
                                disabled={disabled}
                              />
                              <div className="help-text">
                                <div
                                  data-cy="instance-settings-help-text"
                                  style={{
                                    color: 'var(--slate-light-10, var(--slate-10, #7E868C))',
                                    fontFamily: 'IBM Plex Sans',
                                    fontSize: '10px',
                                    fontStyle: 'normal',
                                    fontWeight: 400,
                                  }}
                                >
                                  This will be displayed as the browser page title
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div key="Favicon" className="form-group mb-3">
                          <label className="form-label" data-cy="label-option-field">
                            Favicon
                          </label>
                          <div className="tj-app-input">
                            <div>
                              <input
                                className="form-control"
                                type="text"
                                onChange={(e) => this.optionsChanged('Favicon', e.target.value)}
                                aria-describedby="emailHelp"
                                value={settings['Favicon']}
                                data-cy={`input-field-Favicon`}
                                style={{ width: '516px' }}
                                placeholder={'https://app.tooljet.com/favico.png' || 'Enter favicon'}
                                disabled={disabled}
                              />
                              <div className="help-text">
                                <div
                                  data-cy="instance-settings-help-text"
                                  style={{
                                    color: 'var(--slate-light-10, var(--slate-10, #7E868C))',
                                    fontFamily: 'IBM Plex Sans',
                                    fontSize: '10px',
                                    fontStyle: 'normal',
                                    fontWeight: 400,
                                  }}
                                >
                                  This will be displayed in the address bar of the browser. Required dimensions of the
                                  logo- 16x16px or 32x32px
                                </div>
                              </div>
                            </div>
                          </div>
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

export const ManageWhiteLabelling = withTranslation()(ManageWhiteLabellingComponent);
