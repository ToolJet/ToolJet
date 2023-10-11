import React from 'react';
import cx from 'classnames';
import { pluginsService } from '@/_services';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import { capitalizeFirstLetter } from './utils';
import { ConfirmDialog } from '@/_components';

export const InstalledPlugins = ({
  allPlugins = [],
  installedPlugins,
  fetching,
  fetchPlugins,
  ENABLE_MARKETPLACE_DEV_MODE,
}) => {
  return (
    <div className="col-9">
      {fetching && (
        <div className="m-auto text-center">
          <Spinner />
        </div>
      )}
      {!fetching && allPlugins.length > 0 && (
        <div className="row row-cards">
          {installedPlugins?.map((plugin) => {
            const marketplacePlugin = allPlugins?.find((m) => m.id === plugin.pluginId);
            const isUpdateAvailable = marketplacePlugin?.version !== plugin.version;
            return (
              <InstalledPlugins.Plugin
                key={plugin.id}
                plugin={plugin}
                marketplacePlugin={marketplacePlugin}
                fetchPlugins={fetchPlugins}
                isDevMode={ENABLE_MARKETPLACE_DEV_MODE}
                isUpdateAvailable={isUpdateAvailable}
              />
            );
          })}
          {!fetching && installedPlugins?.length === 0 && (
            <div className="empty">
              <p className="empty-title">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InstalledPluginCard = ({ plugin, marketplacePlugin, fetchPlugins, isDevMode, isUpdateAvailable }) => {
  const [updating, setUpdating] = React.useState(false);
  const [isDeleteModalVisible, setDeleteModalVisibility] = React.useState(false);
  const [isDeletingPlugin, setDeletingPlugin] = React.useState(false);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { id, name } = plugin;

  const executePluginDeletion = () => {
    setDeleteModalVisibility(true);
    deletePlugin({ id, name });
    setDeleteModalVisibility(false);
  };

  const cancelDeletePlugin = () => {
    setDeleteModalVisibility(false);
  };

  const deletePlugin = async ({ id, name }) => {
    setDeletingPlugin(true);
    const { error } = await pluginsService.deletePlugin(id);
    if (error) {
      toast.error(error?.message || 'Unable to delete plugin');
      return;
    }
    setDeletingPlugin(false);
    toast.success(`${capitalizeFirstLetter(name)} deleted`);
    fetchPlugins();
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
      toast.error(error?.message || `Unable to update ${capitalizeFirstLetter(name)}`);
      return;
    }
    toast.success(`${capitalizeFirstLetter(name)} updated`);
    fetchPlugins();
  };

  const reloadPlugin = async ({ id, name }) => {
    setUpdating(true);
    const { error } = await pluginsService.reloadPlugin(id);
    setUpdating(false);

    if (error) {
      toast.error(error?.message || `Unable to reload ${capitalizeFirstLetter(name)}`);
      return;
    }
    toast.success(`${capitalizeFirstLetter(name)} reloaded`);
  };

  return (
    <>
      <ConfirmDialog
        show={isDeleteModalVisible}
        message={'Are you sure you want to delete ' + capitalizeFirstLetter(name) + '?'}
        confirmButtonLoading={isDeletingPlugin}
        onConfirm={executePluginDeletion}
        onCancel={cancelDeletePlugin}
        darkMode={darkMode}
      />
      <div key={plugin.id} className="col-sm-6 col-lg-4">
        <div className="plugins-card">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-auto">
                <span className="text-white avatar">
                  <img height="32" width="32" src={`data:image/svg+xml;base64,${plugin.iconFile.data}`} />
                </span>
              </div>
              <div className="col">
                <div className="font-weight-medium text-capitalize tj-text">{plugin.name}</div>
                <div>{plugin.description}</div>
              </div>
              <div className="col-2">
                {isDevMode && (
                  <button
                    disabled={updating}
                    onClick={(e) => {
                      e.preventDefault();
                      reloadPlugin(plugin);
                    }}
                    className="btn btn-icon"
                    aria-label="Button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon icon-tabler icon-tabler-refresh"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
                      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
                    </svg>
                  </button>
                )}
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
                        onClick={() => updatePlugin(plugin, marketplacePlugin?.version)}
                      >
                        <small className="font-weight-light">(click to update to v{marketplacePlugin?.version})</small>
                      </span>
                    )}
                  </sub>
                </div>
                <div className="col-auto">
                  <div
                    className={cx('cursor-pointer link-primary', { disabled: updating })}
                    onClick={() => setDeleteModalVisibility(true)}
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
    </>
  );
};

InstalledPlugins.Plugin = InstalledPluginCard;
