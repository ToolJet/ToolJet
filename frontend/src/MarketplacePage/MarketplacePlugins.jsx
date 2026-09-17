import React from 'react';
import { toast } from 'react-hot-toast';
import { MarketplaceCard } from './MarketplaceCard';
import { pluginsService, marketplaceService } from '@/_services';
import { SearchBox } from '@/_components';

export const MarketplacePlugins = () => {
  const [installedPlugins, setInstalledPlugins] = React.useState({});
  const [allPlugins, setAllPlugins] = React.useState([]);
  const [queryString, setQueryString] = React.useState('');
  const [filteredPlugins, setFilteredPlugins] = React.useState([]);
  const [suggestingDataSource, setSuggestingDataSource] = React.useState(false);

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

  const handleSearch = (e) => {
    const searchQuery = e.target.value;
    setQueryString(searchQuery);
    const filtered = allPlugins.filter((plugin) => plugin.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setSuggestingDataSource(filtered.length === 0);
    setFilteredPlugins(filtered);
  };

  const displayedPlugins = queryString ? filteredPlugins : allPlugins;

  return (
    <div className="col-9 pb-3" style={{ marginLeft: 'auto' }}>
      <div className="marketplace-search-holder">
        <SearchBox
          dataCy="marketplace-plugins"
          className="border-0"
          placeholder="Search plugins"
          width="100%"
          callBack={handleSearch}
          onClearCallback={() => {
            setQueryString('');
            setSuggestingDataSource(false);
          }}
          initialValue={queryString}
        />
      </div>
      {suggestingDataSource ? (
        <center className="marketplace-empty-state">
          <p className="mt-2 tj-text-lg font-weight-500 tj-text">{`No results for "${queryString}"`}</p>
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
