import React from 'react';
import { pluginsService } from '@/_services';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';

export const InstalledPlugins = ({ isActive, darkMode }) => {
  const [plugins, setPlugins] = React.useState([]);
  const [fetching, setFetching] = React.useState(false);
  React.useEffect(() => {
    pluginsService
      .findAll()
      .then(({ data = [] }) => setPlugins(data))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });
  }, [isActive]);

  return (
    <div className="col-9">
      <div className="row row-cards">
        {plugins?.map((plugin) => (
          <div key={plugin.id} className="col-sm-6 col-lg-4">
            <div className="card card-sm card-borderless">
              <div className="card-header" style={{ borderBottom: 0 }}>
                <div className="card-actions btn-actions">
                  <a href="#" className="btn-action">
                    {darkMode ? (
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M16 0C7.16 0 0 7.16 0 16C0 23.08 4.58 29.06 10.94 31.18C11.74 31.32 12.04 30.84 12.04 30.42C12.04 30.04 12.02 28.78 12.02 27.44C8 28.18 6.96 26.46 6.64 25.56C6.46 25.1 5.68 23.68 5 23.3C4.44 23 3.64 22.26 4.98 22.24C6.24 22.22 7.14 23.4 7.44 23.88C8.88 26.3 11.18 25.62 12.1 25.2C12.24 24.16 12.66 23.46 13.12 23.06C9.56 22.66 5.84 21.28 5.84 15.16C5.84 13.42 6.46 11.98 7.48 10.86C7.32 10.46 6.76 8.82 7.64 6.62C7.64 6.62 8.98 6.2 12.04 8.26C13.32 7.9 14.68 7.72 16.04 7.72C17.4 7.72 18.76 7.9 20.04 8.26C23.1 6.18 24.44 6.62 24.44 6.62C25.32 8.82 24.76 10.46 24.6 10.86C25.62 11.98 26.24 13.4 26.24 15.16C26.24 21.3 22.5 22.66 18.94 23.06C19.52 23.56 20.02 24.52 20.02 26.02C20.02 28.16 20 29.88 20 30.42C20 30.84 20.3 31.34 21.1 31.18C27.42 29.06 32 23.06 32 16C32 7.16 24.84 0 16 0V0Z"
                          fill="white"
                        />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="none">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M16 0C7.16 0 0 7.16 0 16C0 23.08 4.58 29.06 10.94 31.18C11.74 31.32 12.04 30.84 12.04 30.42C12.04 30.04 12.02 28.78 12.02 27.44C8 28.18 6.96 26.46 6.64 25.56C6.46 25.1 5.68 23.68 5 23.3C4.44 23 3.64 22.26 4.98 22.24C6.24 22.22 7.14 23.4 7.44 23.88C8.88 26.3 11.18 25.62 12.1 25.2C12.24 24.16 12.66 23.46 13.12 23.06C9.56 22.66 5.84 21.28 5.84 15.16C5.84 13.42 6.46 11.98 7.48 10.86C7.32 10.46 6.76 8.82 7.64 6.62C7.64 6.62 8.98 6.2 12.04 8.26C13.32 7.9 14.68 7.72 16.04 7.72C17.4 7.72 18.76 7.9 20.04 8.26C23.1 6.18 24.44 6.62 24.44 6.62C25.32 8.82 24.76 10.46 24.6 10.86C25.62 11.98 26.24 13.4 26.24 15.16C26.24 21.3 22.5 22.66 18.94 23.06C19.52 23.56 20.02 24.52 20.02 26.02C20.02 28.16 20 29.88 20 30.42C20 30.84 20.3 31.34 21.1 31.18C27.42 29.06 32 23.06 32 16C32 7.16 24.84 0 16 0V0Z"
                          fill="#24292E"
                        />
                      </svg>
                    )}
                  </a>
                </div>
              </div>
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="bg-blue text-white avatar">
                      <img height="32" width="32" src={plugin.iconFile.data} />
                    </span>
                  </div>
                  <div className="col">
                    <div className="font-weight-medium text-capitalize">{plugin.name}</div>
                    <div className="text-muted">{plugin.description}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="row">
                    <div className="col">
                      <sub>v{plugin.version}</sub>
                    </div>
                    <div className="col-auto">
                      <a href="#">Remove</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
