import React from 'react';
import cx from 'classnames';
import { marketplaceService, pluginsService } from '@/_services';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';

export const InstalledPlugins = ({ isActive }) => {
  const [plugins, setPlugins] = React.useState([]);
  const [updating, setUpdating] = React.useState(false);
  const [marketplacePlugins, setMarketplacePlugins] = React.useState([]);
  const [fetching, setFetching] = React.useState(false);

  React.useEffect(() => {
    marketplaceService
      .findAll()
      .then(({ data = [] }) => setMarketplacePlugins(data))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });
  }, [isActive]);

  const fetchPlugins = async () => {
    setFetching(true);
    const { data, error } = await pluginsService.findAll();
    setFetching(false);

    if (error) {
      toast.error(error?.message || 'something went wrong');
      return;
    }

    setPlugins(data);
  };

  React.useEffect(() => {
    fetchPlugins();
  }, [isActive]);

  const deletePlugin = async ({ id, name }) => {
    var result = confirm('Are you sure you want to delete ' + name + '?');
    if (result) {
      const { error } = await pluginsService.deletePlugin(id);
      if (error) {
        toast.error(error?.message || 'unable to delete plugin');
        return;
      }
      toast.success(`${name} deleted`);
      fetchPlugins();
    }
  };

  const updatePlugin = async ({ id, pluginId, name, repo }, newVersion) => {
    const body = {
      id,
      pluginId,
      repo,
      version: newVersion,
    };

    setUpdating(true);
    const { error } = await pluginsService.updatePlugin(body);
    setUpdating(false);

    if (error) {
      toast.error(error?.message || `Unable to update ${name}`);
      return;
    }
    toast.success(`${name} updated`);
    fetchPlugins();
  };

  return (
    <div className="col-9">
      {fetching && (
        <div className="m-auto text-center">
          <Spinner />
        </div>
      )}
      {!fetching && (
        <div className="row row-cards">
          {plugins?.map((plugin) => {
            const marketplacePlugin = marketplacePlugins.find((m) => m.id === plugin.pluginId);
            const isUpdateAvailable = marketplacePlugin.version !== plugin.version;
            return (
              <div key={plugin.id} className="col-sm-6 col-lg-4">
                <div className="card card-sm card-borderless">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="text-white avatar">
                          <img height="32" width="32" src={`data:image/svg+xml;base64,${plugin.iconFile.data}`} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium text-capitalize">{plugin.name}</div>
                        <div>{plugin.description}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="row">
                        <div className="col">
                          <sub>
                            v{plugin.version}{' '}
                            {isUpdateAvailable && (
                              <span
                                className={cx('link-span', { disabled: updating })}
                                onClick={() => updatePlugin(plugin, marketplacePlugin.version)}
                              >
                                <small className="font-weight-light">
                                  (click to update to v{marketplacePlugin.version})
                                </small>
                              </span>
                            )}
                          </sub>
                        </div>
                        <div className="col-auto">
                          <div
                            className={cx('cursor-pointer link-primary', { disabled: updating })}
                            onClick={() => deletePlugin(plugin)}
                          >
                            Remove
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {updating && (
                    <div className="progress progress-sm">
                      <div className="progress-bar progress-bar-indeterminate"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {!fetching && plugins?.length === 0 && (
            <div className="empty">
              <p className="empty-title">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
