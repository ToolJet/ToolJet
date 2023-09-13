import React, { useState, useEffect } from 'react';
import { licenseService } from '../_services/license.service';
import SolidIcon from '../_ui/Icon/SolidIcons';

const FeatureLabels = {
  auditLogs: 'Audit Logs',
  openid: 'Open ID Connect',
  ldap: 'LDAP',
  customStyling: 'Custom styles',
  multiEnvironment: 'Multi-Environment',
};

const Access = () => {
  const [features, setFeatures] = useState([]);
  const [featureAccess, setFeatureAccess] = useState({});

  useEffect(() => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
      let access = Object.keys(data).map((key) => {
        return {
          label: FeatureLabels[key],
          key: key,
          value: data[key],
        };
      });
      setFeatures([...access]);
    });
  }, []);

  return (
    <div className="metrics-wrapper">
      <div className="access-content">
        {features
          ?.filter((feature) => Object.keys(FeatureLabels).indexOf(feature?.key) !== -1)
          .map((feature, index) => (
            <label key={index} className="form-switch d-flex align-items-center metric">
              <span className="form-check-label">{feature?.label}</span>
              <SolidIcon
                name={
                  featureAccess?.licenseStatus?.isExpired || !feature?.value
                    ? 'circularToggleDisabled'
                    : 'circularToggleEnabled'
                }
              />
            </label>
          ))}
      </div>
    </div>
  );
};

export { Access };
