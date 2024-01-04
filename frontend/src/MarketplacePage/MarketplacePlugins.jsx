import React from 'react';
import { toast } from 'react-hot-toast';
import { MarketplaceCard } from './MarketplaceCard';
import { pluginsService } from '@/_services';

export const MarketplacePlugins = ({ allPlugins = [] }) => {
  const [installedPlugins, setInstalledPlugins] = React.useState({});

  React.useEffect(() => {
    pluginsService
      .findAll()
      .then(({ data = [] }) => {
        const installedPlugins = data.reduce((acc, { pluginId }) => {
          acc[pluginId] = true;
          return acc;
        }, {});
        setInstalledPlugins(installedPlugins);
      })
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });

    return () => {
      setInstalledPlugins({});
    };
  }, []);

  return (
    <div className="col-9">
      <div className="row row-cards">
        {allPlugins?.map(({ id, name, repo, version, description }) => {
          return (
            <MarketplaceCard
              key={id}
              id={id}
              isInstalled={installedPlugins[id]}
              name={name}
              repo={repo}
              version={version}
              description={description}
            />
          );
        })}
      </div>
    </div>
  );
};
