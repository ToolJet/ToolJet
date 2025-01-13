import React, { useState } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import config from 'config';

export const PluginsListForAppModal = ({ dependentPluginsForTemplate, dependentPluginsDetail }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="w-full"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="text-default tj-text-xsm">Marketplace plugins to be installed</div>
      <div className="text-placeholder tj-text-xxsm">
        Following plugins will be installed in your workspace to create their respective queries in this template app
      </div>
      <span onClick={toggleExpanded}>
        <span className="mr-1 tj-text-xsm text-default font-weight-500">View all plugins</span>
        {isExpanded ? (
          <SolidIcon name="arrowDownTriangle" width="12" />
        ) : (
          <SolidIcon name="arrowUpTriangle" width="12" />
        )}
      </span>

      {isExpanded && dependentPluginsForTemplate && dependentPluginsForTemplate.length > 0 && (
        <div
          style={{
            minHeight: '20px',
            maxHeight: '150px',
            overflowY: 'auto',
            borderLeft: '1px solid var(--border-weak)',
          }}
        >
          {dependentPluginsForTemplate.map((plugin, index) => {
            const pluginsName = dependentPluginsDetail[plugin].name || plugin;
            const iconSrc = `${config.TOOLJET_MARKETPLACE_URL}/marketplace-assets/${plugin}/lib/icon.svg`;
            return (
              <div
                key={`${pluginsName}-${index}`}
                className="d-flex custom-gap-6 flex-row align-items-center"
                style={{ padding: '8px 7px' }}
              >
                <img height="15" width="15" src={iconSrc} />
                <span className="tj-text-xsm text-default">{pluginsName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
