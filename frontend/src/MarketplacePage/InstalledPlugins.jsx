import React from 'react';
import { pluginsService } from '@/_services';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';

export const InstalledPlugins = ({ isActive }) => {
  const [plugins, setPlugins] = React.useState([]);
  const [fetching, setFetching] = React.useState(false);

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
    const { error } = await pluginsService.deletePlugin(id);
    if (error) {
      toast.error(error?.message || 'unable to delete plugin');
      return;
    }
    toast.success(`${name} deleted`);
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
          {plugins?.map((plugin) => (
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
                        <sub>v{plugin.version}</sub>
                      </div>
                      <div className="col-auto">
                        <div className="cursor-pointer link-primary" onClick={() => deletePlugin(plugin)}>
                          Remove
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
