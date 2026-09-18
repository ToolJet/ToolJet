import React from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { MarketplaceCard } from './MarketplaceCard';
import { pluginsService, marketplaceService } from '@/_services';
import { SearchBox } from '@/_components';

export const MarketplacePlugins = () => {
  const [installedPlugins, setInstalledPlugins] = React.useState({});
  const [allPlugins, setAllPlugins] = React.useState([]);
  // The catalogue is a flat grid of every plugin, so finding one meant reading the whole page.
  // `?search=HubSpot` also lets a link name the plugin it wants — the AI builder sends people here
  // when a build needs a source whose plugin is not installed yet.
  const [searchParams] = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get('search') ?? '');
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const visiblePlugins = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allPlugins;
    return allPlugins.filter(({ name, description }) => `${name} ${description ?? ''}`.toLowerCase().includes(term));
  }, [allPlugins, query]);

  React.useEffect(() => {
    marketplaceService
      .findAll()
      .then(({ data = [] }) => setAllPlugins(data))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });

    () => {
      setAllPlugins([]);
    };
  }, []);

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
    <div className="col-9 pb-3" style={{ marginLeft: 'auto' }}>
      <div className="mb-3">
        <SearchBox
          dataCy="marketplace"
          darkMode={darkMode}
          placeholder="Search plugins"
          initialValue={query}
          width="100%"
          callBack={(e) => setQuery(e.target.value)}
          onClearCallback={() => setQuery('')}
        />
      </div>
      {query.trim() && visiblePlugins.length === 0 && (
        <p className="tj-text" data-cy="marketplace-no-results">{`No plugins match "${query}"`}</p>
      )}
      <div className="row row-cards">
        {visiblePlugins?.map(({ id, name, repo, version, description }) => {
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
