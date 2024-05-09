import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import cx from 'classnames';
import Textarea from '@/_ui/Textarea';
import { toast } from 'react-hot-toast';
import { licenseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { LoadingScreen } from './LoadingScreen';
import { textAreaEnterOnSave } from '@/_components/FormWrapper';
import { ERROR_TYPES, ERROR_MESSAGES } from '@/_helpers/constants';
import { LicenseUpgradeErrorModal } from '../_components/ErrorComponents/LicenseUpgradeErrorModal';

const LicenseKey = ({ fetchFeatureAccess, featureAccess, darkMode }) => {
  const [license, setLicense] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState(false);
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const hasKeyChanged = licenseKey !== license?.value;
  const [showErrorModal, setShowErrorModal] = useState(false);

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
    if (!hasKeyChanged) return;
    setLoading(true);
    licenseService
      .update({ key: licenseKey })
      .then(() => {
        setLoading(false);
        window.location = `${window.public_config?.TOOLJET_HOST}${
          window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
        }instance-settings/license`;
      })
      .catch((error) => {
        setLoading(false);
        fetchLicenseSettings();
        if (error?.data?.statusCode == 402) {
          setShowErrorModal(true);
        } else {
          toast.error(error?.error, { position: 'top-center' });
        }
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
            <label className="form-label mt-3" data-cy="license-label">
              License
            </label>
            <div style={{ position: 'relative' }}>
              <Textarea
                placeholder="Enter license key"
                className={cx('form-control', { 'errored-textarea': featureAccess?.licenseStatus?.isExpired })}
                rows="12"
                value={licenseKey}
                onChange={(e) => optionChanged(e.target.value)}
                disabled={loading}
                data-cy="license-text-area"
                onKeyDown={(event) => textAreaEnterOnSave(event, updateLicense)}
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
            data-cy="update-button"
          >
            Update
          </ButtonSolid>
        </div>
      )}
      {showErrorModal && (
        <LicenseUpgradeErrorModal
          show={showErrorModal}
          onHide={() => setShowErrorModal(false)}
          errorMsg={ERROR_MESSAGES[ERROR_TYPES.USERS_EXCEEDING_LICENSE_LIMIT]}
          darkMode={darkMode}
        />
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
