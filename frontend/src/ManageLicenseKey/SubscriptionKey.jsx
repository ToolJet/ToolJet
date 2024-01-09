import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import cx from 'classnames';
import Textarea from '@/_ui/Textarea';
import { toast } from 'react-hot-toast';
import { licenseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { LoadingScreen } from './LoadingScreen';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { setFaviconAndTitle } from '@/_helpers/utils';

const SubscriptionKey = ({ fetchFeatureAccess, featureAccess }) => {
  const [license, setLicense] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState(false);
  const { state } = useLocation();
  const hasKeyChanged = licenseKey !== license?.license_key;
  const [isLicenseUpdated, setIsLicenseUpdated] = useState(false);
  const { whiteLabelFavicon, whiteLabelText } = useWhiteLabellingStore.getState();

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

  const updateLicense = () => {
    setLoading(true);
    licenseService
      .update({ key: licenseKey })
      .then(() => {
        setLoading(false);
        setIsLicenseUpdated(true);
        window.location = `/${workspaceId}/settings/subscription?currentTab=subscriptionKey`;
      })
      .catch(({ error }) => {
        setLoading(false);
        fetchLicenseSettings();
        toast.error('Subscription key could not be updated. Please try again!', {
          position: 'top-center',
          style: { wordBreak: 'normal' },
        });
      });
  };

  useEffect(() => {
    setFaviconAndTitle(whiteLabelFavicon, whiteLabelText);
    fetchLicenseSettings();
    if (state?.updated) {
      toast.success('Subscription key updated successfully. Start using premium features now!', {
        position: 'top-center',
        style: { maxWidth: '324px' },
      });
      window.location.reload();
    }
  }, []);

  return licenseLoading ? (
    <LoadingScreen />
  ) : (
    <div className="general-wrapper">
      <div className="metrics-wrapper">
        <div className="col-md-12">
          <label className="form-label mt-3">Subscription key</label>
          <div style={{ position: 'relative' }}>
            <Textarea
              placeholder="Enter subscription key"
              className={cx('form-control', { 'errored-textarea': featureAccess?.licenseStatus?.isExpired })}
              rows="12"
              value={licenseKey}
              onChange={(e) => optionChanged(e.target.value)}
              disabled={loading}
            />
            <div className="tj-text-xsm mt-1">This subscription is configured for the current workspace only</div>
          </div>
        </div>
        <ButtonSolid
          disabled={loading || !hasKeyChanged}
          isLoading={loading}
          onClick={updateLicense}
          variant="primary"
          fill="#fff"
          className="mt-3"
        >
          Update
        </ButtonSolid>
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
