import React from 'react';
import { toast } from 'react-hot-toast';
import { pluginsService } from '@/_services';
import Spinner from '@/_ui/Spinner';

const MarketplacePage = () => {
  const [fetching, setFetching] = React.useState(false);
  const [plugins, setPlugins] = React.useState([]);
  React.useEffect(() => {
    pluginsService
      .getPlugins()
      .then(({ data = [] }) => setPlugins(data))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });
  }, []);

  return (
    <div className="page-body container-xl">
      <div className="row row-cards">
        {plugins.map((plugin) => (
          <div key={plugin.id} className="col-md-6 col-lg-3">
            <div className="card">
              <div className="ribbon bg-red">NEW</div>
              <div className="card-body">
                <h3 className="card-title text-capitalize">{plugin.name}</h3>
              </div>
              <div className="card-footer">
                <a href="#" className="btn btn-primary">
                  Install
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { MarketplacePage };
