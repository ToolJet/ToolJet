import React, { useEffect, useState } from 'react';
import { licenseService } from '@/_services/license.service';
import { LoadingScreen } from './LoadingScreen';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const Domains = () => {
  const [domainsList, setDomainsList] = useState([]);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    licenseService.getDomainsList().then((data) => {
      setDomainsList([...data.domains]);
      setIsLoading(false);
    });
  }, []);

  return loading ? (
    <LoadingScreen />
  ) : domainsList?.filter((domain) => domain?.hostname)?.length ? (
    <div className="domains-wrapper">
      {domainsList
        ?.filter((domain) => domain?.hostname)
        .map((domain, index) => (
          <div key={index} className="hostname-wrapper">
            <div className="heading" data-cy="host-name-label">
              Hostname
            </div>
            <input
              readOnly
              type="text"
              className={'form-control'}
              value={`${domain?.hostname}${domain?.subpath ?? ''}`}
              data-cy="host-name-field"
            />
          </div>
        ))}
    </div>
  ) : (
    <DomainsListEmptyContainer />
  );
};

const DomainsListEmptyContainer = () => {
  return (
    <div className="domains-empty-container">
      <div className="warning-holder mb-3">
        <SolidIcon name="warning" width="30" />
      </div>
      <div className="tj-text-md mb-2 font-weight-500" data-cy="no-domain-header">
        No Domain Linked
      </div>
      <div className="tj-text-sm" data-cy="no-domain-info-text">
        Please contact ToolJet team to link your domain
      </div>
    </div>
  );
};

export { Domains };
