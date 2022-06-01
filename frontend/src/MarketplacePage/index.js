import React from 'react';
import { toast } from 'react-hot-toast';
import { extensionsService } from '@/_services';
import Spinner from '@/_ui/Spinner';

const MarketplacePage = () => {
  const [fetching, setFetching] = React.useState(false);
  const [extensions, setExtensions] = React.useState([]);
  React.useEffect(() => {
    extensionsService
      .getExtensions()
      .then(({ data = [] }) => setExtensions(data))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });
  }, []);

  return (
    <div className="page-body container-xl">
      <div className="row row-cards">
        {extensions.map((extension) => (
          <div key={extension.id} className="col-md-6 col-lg-3">
            <div className="card">
              <div className="ribbon bg-red">NEW</div>
              <div className="card-body">
                <h3 className="card-title text-capitalize">{extension.name}</h3>
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
