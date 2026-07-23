import React, { useContext, useEffect, useState, Suspense, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { BreadCrumbContext } from '@/App/App';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import Layout from './index';

type LayoutRouteWrapperProps = {
  darkMode: boolean;
  switchDarkMode: () => void;
};

const LayoutRouteWrapper = ({ darkMode, switchDarkMode }: LayoutRouteWrapperProps) => {
  const location = useLocation();

  const { updateSidebarNAV } = useContext(BreadCrumbContext) as { updateSidebarNAV: (value: string) => void };

  const initialMountRef = useRef(true);
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [enableCollapsibleSidebar, setEnableCollapsibleSidebar] = useState(false);

  // Two cases for resetting the breadcrumb:
  // 1. First mount (e.g. arriving here from a route outside this group, like HomePage): reset
  //    immediately in the effect body, since there's no previous effect instance to clean up yet —
  //    otherwise the breadcrumb from whatever page we came from would linger during the lazy-loaded
  //    page's chunk-loading gap.
  // 2. Every subsequent pathname change: reset in the cleanup instead of the body. React runs every
  //    changed component's cleanup (this one, for the OLD pathname) before running any new effect
  //    bodies, so this fires and clears the breadcrumb before the newly-matched page's own
  //    mount/location effect sets its real value — without clobbering it afterwards. This also means
  //    same-page sub-route navigation (e.g. workspace-settings/users -> workspace-settings/groups) is
  //    unaffected, since that page's own effect re-sets the correct breadcrumb in the same commit,
  //    after this cleanup runs.
  useEffect(() => {
    if (initialMountRef.current) {
      updateSidebarNAV('');
      initialMountRef.current = false;

      return;
    }

    return () => {
      updateSidebarNAV('');
    };
  }, [location.pathname]);

  return (
    <Layout
      switchDarkMode={switchDarkMode}
      darkMode={darkMode}
      enableCollapsibleSidebar={enableCollapsibleSidebar}
      collapseSidebar={collapseSidebar}
      toggleCollapsibleSidebar={() => setCollapseSidebar((prev) => !prev)}
    >
      <Suspense fallback={<TJLoader />}>
        <Outlet context={{ collapseSidebar, setCollapseSidebar, setEnableCollapsibleSidebar }} />
      </Suspense>
    </Layout>
  );
};

export default LayoutRouteWrapper;
