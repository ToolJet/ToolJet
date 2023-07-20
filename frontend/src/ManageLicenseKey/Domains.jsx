import React, { useEffect, useState } from 'react';
import { licenseService } from '@/_services/license.service';

const Domains = () => {
  const [domainsList, setDomainsList] = useState([]);

  useEffect(() => {
    licenseService.getDomainsList().then((data) => {
      setDomainsList([...data.domains]);
    });
  }, []);

  return (
    <div className="domains-wrapper">
      {domainsList
        ?.filter((domain) => domain?.hostname)
        .map((domain, index) => (
          <div key={index} className="hostname-wrapper">
            <div className="heading">Hostname</div>
            <input
              readOnly
              type="text"
              className={'form-control'}
              value={`${domain?.hostname}${domain?.subpath ?? ''}`}
            />
          </div>
        ))}
    </div>
  );
};

export { Domains };
