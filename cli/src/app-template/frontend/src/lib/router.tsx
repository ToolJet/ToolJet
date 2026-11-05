import React, { useEffect, useRef } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { ToolJet } from '@tooljet/custom-component-sdk';

/*
  react-router inside a ToolJet app in Code mode. The current route lives in the viewer's URL (?route=/orders/36), so a link
  to it opens it and the browser's back button works; ToolJet refuses routes the user may not open (their route
  page's permissions) and lands a refused link on the first route they may open.
*/
export function AppRouter({ children }: { children: React.ReactNode }) {
  const nav = ToolJet.useNavigation();
  if (nav.accessDenied) {
    return (
      <div className="app-root flex h-full items-center justify-center bg-page p-8 text-center text-sm text-muted-foreground">
        You do not have access to this part of the app. Ask the app's owner for access.
      </div>
    );
  }
  return (
    <MemoryRouter initialEntries={[nav.path]}>
      <RouteSync />
      {children}
    </MemoryRouter>
  );
}

function RouteSync() {
  const nav = ToolJet.useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname + location.search;
  const synced = useRef(nav.path);

  // ToolJet moved (back button, a deep link, a refused route): follow it.
  useEffect(() => {
    if (nav.path === synced.current) return;
    synced.current = nav.path;
    if (nav.path !== here) navigate(nav.path, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.path]);

  // The app moved (a link, navigate()): tell ToolJet, or go back if ToolJet refuses the route.
  useEffect(() => {
    if (here === synced.current) return;
    if (nav.navigate(here)) synced.current = here;
    else navigate(synced.current, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [here]);

  return null;
}

/** The code page's routes the signed-in user may open, for menus. */
export function useAllowedRoutes() {
  return ToolJet.useNavigation().routes.filter((route) => route.allowed);
}
