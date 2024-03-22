import React, { useState, useCallback, useEffect } from 'react';
import cx from 'classnames';
import { AppMenu } from './AppMenu';
import moment from 'moment';
import { ToolTip } from '@/_components/index';
import useHover from '@/_hooks/useHover';
import configs from './Configs/AppIcon.json';
import { Link, useNavigate } from 'react-router-dom';
import urlJoin from 'url-join';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import BulkIcon from '@/_ui/Icon/BulkIcons';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

import { getPrivateRoute, getSubpath } from '@/_helpers/routes';
import { validateName } from '@/_helpers/utils';
const { defaultIcon } = configs;

export default function AppCard({
  app,
  canCreateApp,
  canDeleteApp,
  deleteApp,
  exportApp,
  appActionModal,
  canUpdateApp,
  currentFolder,
}) {
  const canUpdate = canUpdateApp(app);
  const [hoverRef, isHovered] = useHover();
  const [focused, setFocused] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onMenuToggle = useCallback(
    (status) => {
      setMenuOpen(!!status);
      !status && !isHovered && setFocused(false);
    },
    [isHovered]
  );

  const appActionModalCallBack = useCallback(
    (action) => {
      appActionModal(app, currentFolder, action);
    },
    [app, appActionModal, currentFolder]
  );

  const isValidSlug = (slug) => {
    const validate = validateName(slug, 'slug', true, false, false, false);
    return validate.status;
  };

  useEffect(() => {
    !isMenuOpen && setFocused(!!isHovered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  const updated_at = app?.editing_version?.updated_at || app?.updated_at;
  const updated = moment(updated_at).fromNow(true);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  let AppIcon;
  try {
    AppIcon = <BulkIcon fill={'#3E63DD'} name={app?.icon || defaultIcon} />;
  } catch (e) {
    console.error('App icon not found', app.icon);
  }
  return (
    <div className="">
      {/* <div key={app?.id} ref={hoverRef} data-cy={`${app?.name.toLowerCase().replace(/\s+/g, '-')}-card`}>
        <div className="row home-app-card-header">
          <div className="col-12 d-flex justify-content-between">
            <div>
              <div className="app-icon-main">
                <div className="app-icon d-flex" data-cy={`app-card-${app?.icon}-icon`}>
                  {AppIcon && AppIcon}
                </div>
              </div>
            </div>
            <div visible={focused ? true : undefined}>
              {(canCreateApp(app) || canDeleteApp(app) || canUpdateApp(app)) && (
                <AppMenu
                  onMenuOpen={onMenuToggle}
                  openAppActionModal={appActionModalCallBack}
                  canCreateApp={canCreateApp()}
                  canDeleteApp={canDeleteApp(app)}
                  canUpdateApp={canUpdateApp(app)}
                  deleteApp={() => deleteApp(app)}
                  exportApp={() => exportApp(app)}
                  isMenuOpen={isMenuOpen}
                  darkMode={darkMode}
                  currentFolder={currentFolder}
                />
              )}
            </div>
          </div>
        </div>
        <div>
          <ToolTip trigger={['hover']} message={app.name}>
            <h3
              className="app-card-name font-weight-500 tj-text-md"
              data-cy={`${app.name.toLowerCase().replace(/\s+/g, '-')}-title`}
            >
              {app.name}
            </h3>
          </ToolTip>
        </div>
        <div className="app-creation-time-container" style={{ marginBottom: '12px' }}>
          {canUpdate && (
            <div className="app-creation-time tj-text-xsm" data-cy="app-creation-details">
              <ToolTip message={app.created_at && moment(app.created_at).format('dddd, MMMM Do YYYY, h:mm:ss a')}>
                <span>{updated === 'just now' ? `Edited ${updated}` : `Edited ${updated} ago`}</span>
              </ToolTip>
              &nbsp;by{' '}
              {`${app.user?.first_name ? app.user.first_name : ''} ${app.user?.last_name ? app.user.last_name : ''}`}
            </div>
          )}
        </div>
        <div className="appcard-buttons-wrap">
          {canUpdate && (
            <div>
              <ToolTip message="Open in app builder">
                <Link
                  to={getPrivateRoute('editor', {
                    slug: isValidSlug(app.slug) ? app.slug : app.id,
                  })}
                >
                  <button type="button" className="tj-primary-btn edit-button tj-text-xsm" data-cy="edit-button">
                    <SolidIcon name="editrectangle" width="14" fill={darkMode ? '#11181C' : '#FDFDFE'} />
                    &nbsp;{t('globals.edit', 'Edit')}
                  </button>
                </Link>
              </ToolTip>
            </div>
          )}
          <div>
            <ToolTip
              message={
                app?.current_version_id === null
                  ? t('homePage.appCard.noDeployedVersion', 'App does not have a deployed version')
                  : t('homePage.appCard.openInAppViewer', 'Open in app viewer')
              }
            >
              <button
                type="button"
                className={cx(
                  ` launch-button tj-text-xsm ${
                    app?.current_version_id === null || app?.is_maintenance_on ? 'tj-disabled-btn ' : 'tj-tertiary-btn'
                  }`
                )}
                onClick={() => {
                  if (app?.current_version_id) {
                    window.open(
                      urlJoin(window.public_config?.TOOLJET_HOST, getSubpath() ?? '', `/applications/${app.slug}`)
                    );
                  } else {
                    navigate(app?.current_version_id ? `/applications/${app.slug}` : '');
                  }
                }}
                data-cy="launch-button"
              >
                <SolidIcon
                  name="rightarrrow"
                  width="14"
                  fill={
                    app?.current_version_id === null || app?.is_maintenance_on
                      ? '#4C5155'
                      : darkMode
                      ? '#FDFDFE'
                      : '#11181C'
                  }
                />

                {app?.is_maintenance_on
                  ? t('homePage.appCard.maintenance', 'Maintenance')
                  : t('homePage.appCard.launch', 'Launch')}
              </button>
            </ToolTip>
          </div>
        </div>
      </div> */}
      {/* <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <img className="mx-auto h-12" src="https://tailwindui.com/img/logos/workcation-logo-indigo-600.svg" alt="" />
          <figure className="mt-10">
            <blockquote className="text-center text-xl font-semibold leading-8 text-gray-900 sm:text-2xl sm:leading-9">
              <p>
                “Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo expedita voluptas culpa sapiente alias
                molestiae. Numquam corrupti in laborum sed rerum et corporis.”
              </p>
            </blockquote>
            <figcaption className="mt-10">
              <img
                className="mx-auto h-10 w-10 rounded-full"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
              <div className="mt-4 flex items-center justify-center space-x-3 text-base">
                <div className="font-semibold text-gray-900">Judith Black</div>
                <svg viewBox="0 0 2 2" width={3} height={3} aria-hidden="true" className="fill-gray-900">
                  <circle cx={1} cy={1} r={1} />
                </svg>
                <div className="text-gray-600">CEO of Workcation</div>
              </div>
            </figcaption>
          </figure>
        </div>
      </section> */}
      <Button variant="destructive">Destructive</Button>{' '}
      <Button disabled>
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        Please wait
      </Button>
      <Input />
      <HoverCard>
        <HoverCardTrigger>Hover</HoverCardTrigger>
        <HoverCardContent>The React Framework – created and maintained by @vercel.</HoverCardContent>
      </HoverCard>
    </div>
  );
}
