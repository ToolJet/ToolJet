import React from 'react';
import config from 'config';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { pluginsService } from '@/_services';

export const MarketplaceCard = ({ id, name, description, version, isInstalled = false }) => {
  const [installed, setInstalled] = React.useState(isInstalled);
  const [installing, setInstalling] = React.useState(false);

  React.useEffect(() => {
    setInstalled(isInstalled);
  }, [isInstalled]);

  const installPlugin = async () => {
    const body = {
      id,
      name,
      description,
      version,
    };

    setInstalling(true);
    const { error } = await pluginsService.installPlugin(body);
    setInstalling(false);

    if (error) {
      toast.error(error?.message || `Unable to install ${name}`);
      return;
    }
    setInstalled(true);
  };

  return (
    <div className="col-sm-6 col-lg-4">
      <div className="card card-sm card-borderless">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <span className="bg-blue text-white avatar">
                <img height="40" width="40" src={`${config.MARKETPLACE_URL}/marketplace-assets/${id}/lib/icon.svg`} />
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
                <sub>v{version}</sub>
              </div>
              <div className={cx('col-auto', { disabled: installing || installed })} onClick={installPlugin}>
                <a href="#">Install{installed && 'ed'}</a>
              </div>
            </div>
          </div>
        </div>
        {installing && (
          <div className="progress progress-sm">
            <div className="progress-bar progress-bar-indeterminate"></div>
          </div>
        )}
      </div>
    </div>
  );
};
