import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import Textarea from '@/_ui/Textarea';
import { toast } from 'react-hot-toast';
import { licenseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const LicenseKey = ({ fetchFeatureAccess, featureAccess }) => {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(false);

  const optionChanged = (value) => {
    setLicense({
      ...license,
      value: value,
    });
  };

  const fetchLicenseSettings = () => {
    setLoading(true);
    licenseService
      .get()
      .then((data) => {
        setLicense(data);
        setLoading(false);
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        setLoading(false);
      });
  };

  const updateLicense = () => {
    setLoading(true);
    licenseService
      .update({ key: license.value })
      .then(() => {
        fetchFeatureAccess();
        setLoading(false);
        toast.success('License key has been updated', {
          position: 'top-center',
        });
        fetchLicenseSettings();
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

  return (
    <div className="general-wrapper">
      {license && (
        <div className="metrics-wrapper">
          <div className="col-md-12">
            <label className="form-label mt-3">License</label>
            <Textarea
              placehlder="Enter your license key"
              className={cx('form-control', { 'errored-textarea': featureAccess?.licenseStatus?.isExpired })}
              rows="12"
              value={license?.value}
              onChange={(e) => optionChanged(e.target.value)}
            />
          </div>
          <ButtonSolid
            disabled={loading}
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

export { LicenseKey };
