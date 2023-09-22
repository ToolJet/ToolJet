import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import cx from 'classnames';
import Textarea from '@/_ui/Textarea';
import { toast } from 'react-hot-toast';
import { licenseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { LoadingScreen } from './LoadingScreen';

const LicenseKey = ({ fetchFeatureAccess, featureAccess }) => {
  const [license, setLicense] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState(false);
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const hasKeyChanged = licenseKey !== license?.value;

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
        setLicenseKey(data?.value);
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
        fetchFeatureAccess();
        setLoading(false);
        window.location = `${window.public_config?.TOOLJET_HOST}${
          window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
        }instance-settings?save_license=success`;
      })
      .catch(({ error }) => {
        setLoading(false);
        fetchLicenseSettings();
        toast.error(error, { position: 'top-center' });
      });
  };

  useEffect(() => {
    fetchLicenseSettings();
  }, []);

  return licenseLoading ? (
    <LoadingScreen />
  ) : (
    <div className="general-wrapper">
      {license && (
        <div className="metrics-wrapper">
          <div className="col-md-12">
            <label className="form-label mt-3">License</label>
            <div style={{ position: 'relative' }}>
              <Textarea
                placeholder="Enter license key"
                className={cx('form-control', { 'errored-textarea': featureAccess?.licenseStatus?.isExpired })}
                rows="12"
                value={licenseKey}
                onChange={(e) => optionChanged(e.target.value)}
                disabled={loading}
              />
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
      )}
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

export { LicenseKey };
