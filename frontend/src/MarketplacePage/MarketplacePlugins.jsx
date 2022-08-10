import React from 'react';
import { toast } from 'react-hot-toast';
import { MarketplaceCard } from './MarketplaceCard';
import { pluginsService } from '@/_services';

export const MarketplacePlugins = ({ isActive }) => {
  const [plugins, setPlugins] = React.useState([]);
  const [installedPlguins, setInstalledPlugins] = React.useState({});
  React.useEffect(() => {
    fetch('https://raw.githubusercontent.com/ToolJet/ToolJet/add-marketplace/marketplace/plugins.json')
      .then((response) => response.json())
      .then((plugins) => setPlugins(plugins))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });
  }, [isActive]);

  React.useEffect(() => {
    pluginsService
      .findAll()
      .then(({ data = [] }) => {
        const installedPlguins = data.reduce((acc, { id }) => {
          acc[id] = true;
          return acc;
        }, {});
        setInstalledPlugins(installedPlguins);
      })
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });
  }, []);

  return (
    <div className="col-9">
      <div className="row row-cards">
        {plugins?.map(({ id, name, version, description }) => {
          return (
            <MarketplaceCard
              key={id}
              id={id}
              installed={installedPlguins[id]}
              name={name}
              version={version}
              description={description}
            />
          );
        })}
      </div>
    </div>
  );
};
