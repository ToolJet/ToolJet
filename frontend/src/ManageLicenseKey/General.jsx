import React, { useEffect, useState } from 'react';
import Textarea from '@/_ui/Textarea';
import { toast } from 'react-hot-toast';
import { licenseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const General = () => {
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
        setLoading(false);
        toast.success('License key has been updated', {
          position: 'top-center',
        });
        fetchLicenseSettings();
      })
      .catch(({ error }) => {
        setLoading(false);
        toast.error(error, { position: 'top-center' });
      });
  };

  useEffect(() => {
    fetchLicenseSettings();
  }, []);

  return (
    <div className="general-wrapper">
      <div className="col tj-dashboard-header-wrap font-weight-500">General</div>
      {license && (
        <div className="general-setting-wrapper">
          <div className="col-md-12">
            <label className="form-label mt-3">License</label>
            <Textarea
              placehlder="Enter your license key"
              className="form-control"
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

export { General };
