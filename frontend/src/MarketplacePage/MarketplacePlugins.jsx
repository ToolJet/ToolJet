import React from 'react';
import { toast } from 'react-hot-toast';
import { pluginsService } from '@/_services';
import config from 'config';
import Spinner from '@/_ui/Spinner';

export const MarketplacePlugins = ({ isActive }) => {
  const [packages, setPackages] = React.useState([]);
  const [fetching, setFetching] = React.useState(false);
  React.useEffect(() => {
    fetch('https://raw.githubusercontent.com/ToolJet/ToolJet/add-marketplace/marketplace/plugins.json')
      .then((response) => response.json())
      .then(({ packages }) => setPackages(packages))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });
  }, [isActive]);

  const installPlugin = async (body) => {
    const [error] = await pluginsService.installPlugin(body);
    if (error) {
      toast.error(error?.message || 'unable to install plugin');
    }
  };

  return (
    <div className="col-9">
      <div className="row row-cards">
        {packages?.map(({ id, name, version, description }) => {
          return (
            <div key={id} className="col-sm-6 col-lg-4">
              <div className="card card-sm card-borderless">
                <div className="card-header" style={{ borderBottom: 0 }}>
                  <div className="card-actions btn-actions">v{version}</div>
                </div>
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-blue text-white avatar">
                        <img
                          height="40"
                          width="40"
                          src={`${config.MARKETPLACE_URL}/marketplace-assets/${id}/lib/icon.svg`}
                        />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium text-capitalize">{name}</div>
                      <div className="text-muted">{description}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="row">
                      <div className="col">
                        <div className="avatar-list avatar-list-stacked">
                          <span className="avatar avatar-xs avatar-rounded"></span>
                        </div>
                      </div>
                      <div
                        className="col-auto"
                        onClick={() =>
                          installPlugin({
                            id,
                            name,
                            description,
                            version,
                          })
                        }
                      >
                        <a href="#">Install</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
