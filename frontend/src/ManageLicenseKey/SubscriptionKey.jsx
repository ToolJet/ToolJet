import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useLocation, useParams } from 'react-router-dom';
import cx from 'classnames';
import Textarea from '@/_ui/Textarea';
import { toast } from 'react-hot-toast';
import { licenseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { LoadingScreen } from './LoadingScreen';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';

const SubscriptionKey = () => {
  const [license, setLicense] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [featureAccess, setFeatureAccess] = useState(false);
  const { state } = useLocation();
  const hasKeyChanged = licenseKey !== license?.license_key;
  const { whiteLabelFavicon, whiteLabelText } = useWhiteLabellingStore.getState();
  const { workspaceId } = useParams();

  const optionChanged = (value) => {
    setLicenseKey(value);
  };

  const fetchLicenseSettings = () => {
    setLicenseLoading(true);
    setLoading(true);
    licenseService
      .get()
      .then((data) => {
        setLicense(data);
        setLicenseKey(data?.license_key);
        setLoading(false);
        setLicenseLoading(false);
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        setLoading(false);
        setLicenseLoading(false);
      });
  };

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
    });
  };

  const updateLicense = () => {
    setLoading(true);
    licenseService
      .update({ key: licenseKey })
      .then(() => {
        setLoading(false);
        window.location = `/${workspaceId}/settings/subscription?currentTab=subscriptionKey`;
      })
      .catch((error) => {
        console.log({ error });
        setLoading(false);
        fetchLicenseSettings();
        toast.error('Subscription key could not be updated. Please try again!', {
          position: 'top-center',
          style: { wordBreak: 'normal' },
        });
      });
  };

  useEffect(() => {
    fetchLicenseSettings();
    fetchFeatureAccess();
    if (state?.updated) {
      toast.success('Subscription key updated successfully. Start using premium features now!', {
        position: 'top-center',
        style: { maxWidth: '324px' },
      });
      window.location.reload();
    }
  }, []);

  return licenseLoading && featureAccess ? (
    <LoadingScreen />
  ) : (
    <div style={{ height: '100vh' }} className="wrapper enterprise-page">
      <div className="wrapper license-page">
        <div className="general-wrapper">
          <div className="metrics-wrapper">
            <div className="col-md-12">
              <label className="form-label mt-3" data-cy="subscription-key-label">
                Subscription key
              </label>
              <div style={{ position: 'relative' }}>
                <Textarea
                  placeholder="Enter subscription key"
                  className={cx('form-control', { 'errored-textarea': featureAccess?.licenseStatus?.isExpired })}
                  rows="12"
                  value={licenseKey}
                  onChange={(e) => optionChanged(e.target.value)}
                  disabled={loading}
                  data-cy="subscription-key-text-area"
                />
                <div className="tj-text-xsm mt-1" data-cy="subscription-key-helper-text">
                  This subscription is configured for the current workspace only
                </div>
              </div>
            </div>
            <ButtonSolid
              disabled={loading || !hasKeyChanged}
              isLoading={loading}
              onClick={updateLicense}
              variant="primary"
              fill="#fff"
              className="mt-3"
              data-cy="update-button"
            >
              Update
            </ButtonSolid>
          </div>
        </div>
      </div>
    </div>
  );
};

//For next phase
const EmptyState = ({ generatingLicense }) => {
  return (
    <div className="license-empty">
      {generatingLicense ? (
        <div>
          <div className="spinner">
            <Spinner />
          </div>
          <div className="tj-text-sm mt-1">Generating trial license key...</div>
        </div>
      ) : (
        <>
          <div className="tj-text-sm font-weight-500 mb-3">Enter license key here.</div>
          <div className="tj-text-sm mb-2">Don’t have a valid license? Get our 14-day trial plan instead!</div>
          <ButtonSolid variant="tertiary">Get trial license key</ButtonSolid>
        </>
      )}
    </div>
  );
};

export { SubscriptionKey };
