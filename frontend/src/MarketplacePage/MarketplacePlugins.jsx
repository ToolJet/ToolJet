import React from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { MarketplaceCard } from './MarketplaceCard';
import { pluginsService, marketplaceService } from '@/_services';
import { SearchBox } from '@/_components';

export const MarketplacePlugins = () => {
  const [installedPlugins, setInstalledPlugins] = React.useState({});
  const [allPlugins, setAllPlugins] = React.useState([]);
  // `?search=HubSpot` lets a link name the plugin it wants — the AI builder sends people here
  // when a build needs a source whose plugin is not installed yet.
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [queryString, setQueryString] = React.useState(urlSearch);
  React.useEffect(() => setQueryString(urlSearch), [urlSearch]);

  const displayedPlugins = React.useMemo(() => {
    const term = queryString.trim().toLowerCase();
    if (!term) return allPlugins;
    return allPlugins.filter(({ name, description }) => `${name} ${description ?? ''}`.toLowerCase().includes(term));
  }, [allPlugins, queryString]);
  const suggestingDataSource = !!queryString.trim() && displayedPlugins.length === 0;

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
      <div className="marketplace-search-holder">
        <SearchBox
          dataCy="marketplace-plugins"
          className="border-0"
          placeholder="Search plugins"
          width="100%"
          callBack={(e) => setQueryString(e.target.value)}
          onClearCallback={() => setQueryString('')}
          initialValue={queryString}
        />
      </div>
      {suggestingDataSource ? (
        <center className="marketplace-empty-state">
          <p className="mt-2 tj-text-lg font-weight-500 tj-text" data-cy="marketplace-no-results">
            {`No results for "${queryString}"`}
          </p>
          <img src="assets/images/icons/no-results.svg" width="200" height="200" />
        </center>
      ) : (
        <div className="row row-cards">
          {displayedPlugins?.map(({ id, name, repo, version, description }) => {
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
      )}
    </div>
  );
};
