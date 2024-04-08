import React, { useState, useEffect } from 'react';
import { licenseService } from '../_services/license.service';
import SolidIcon from '../_ui/Icon/SolidIcons';
import { LoadingScreen } from './LoadingScreen';

const FeatureLabels = {
  openid: 'Open ID Connect',
  ldap: 'LDAP',
  saml: 'SAML',
  auditLogs: 'Audit logs',
  customStyling: 'Custom styles',
  multiEnvironment: 'Multi-Environment',
  gitSync: 'GitSync',
  multiPlayerEdit: 'Multiplayer editing',
};

const Access = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    licenseService.getFeatureAccess().then((data) => {
      let access = Object.keys(data).map((key) => {
        return {
          label: FeatureLabels[key],
          key: key,
          value: data[key],
        };
      });
      setFeatures([...access]);
      setIsLoading(false);
    });
  }, []);

  return loading ? (
    <LoadingScreen />
  ) : (
    <div className="metrics-wrapper">
      <div className="access-content" data-cy="access-content">
        {features
          ?.filter((feature) => Object.keys(FeatureLabels).indexOf(feature?.key) !== -1)
          .map((feature, index) => (
            <label key={index} className="form-switch d-flex align-items-center metric access-switch">
              <SolidIcon name={!feature?.value ? 'circularToggleDisabled' : 'circularToggleEnabled'} />
              <span className="form-check-label" data-cy={`${feature?.label.toLowerCase().replace(/\s+/g, '-')}-label`}>
                {feature?.label}
              </span>
            </label>
          ))}
      </div>
    </div>
  );
};

export { Access };
