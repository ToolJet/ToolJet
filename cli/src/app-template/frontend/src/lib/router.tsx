import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavigationType, Router, createPath, parsePath, useLocation, useNavigate } from 'react-router';
import type { Location, Navigator, To } from 'react-router';
import { ToolJet } from '@tooljet/custom-component-sdk';

/*
  react-router inside a ToolJet app in Code mode. The current route lives in the viewer's URL (?route=/orders/36), so a link
  to it opens it and the browser's back button works; ToolJet refuses routes the user may not open (their route
  page's permissions) and lands a refused link on the first route they may open.

  Unsaved work: a screen with typed values calls useUnsavedChanges(dirty, message). While any screen does, a link or
  navigate() asks before leaving it, and ToolJet asks before the browser's back button, a reload or closing the tab.
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
    <GuardedMemoryRouter initial={nav.path}>
      <RouteSync />
      {children}
    </GuardedMemoryRouter>
  );
}

const unsaved = new Map<symbol, string>();
const unsavedMessage = (): string | null => unsaved.values().next().value ?? null;

/**
 * True when nothing is unsaved, or the user agrees to leave it. For a dialog with typed values:
 * `onOpenChange={(open) => { if (open || !dirty || confirmLeave(message)) setOpen(open); }}`.
 */
export function confirmLeave(message?: string): boolean {
  const ask = message ?? unsavedMessage();
  return !ask || window.confirm(ask);
}

/**
 * While `dirty`, leaving this screen asks first: `message` is the question, in the screen's language ("Leave without
 * saving?"). Pass false once the work is saved or discarded.
 */
export function useUnsavedChanges(dirty: boolean, message: string) {
  const nav = ToolJet.useNavigation();
  const latest = useRef(nav);
  latest.current = nav;
  const key = useRef(Symbol('unsaved')).current;
  useEffect(() => {
    if (!dirty) return undefined;
    unsaved.set(key, message);
    latest.current.setLeaveWarning?.(unsavedMessage());
    return () => {
      unsaved.delete(key);
      latest.current.setLeaveWarning?.(unsavedMessage());
    };
  }, [dirty, message, key]);
}

const toLocation = (to: To, state: unknown, key: string): Location => {
  const path = typeof to === 'string' ? parsePath(to) : to;
  return {
    pathname: path.pathname || '/',
    search: path.search || '',
    hash: path.hash || '',
    state: state ?? null,
    key,
  };
};

/** MemoryRouter, but a push or a step through its history asks first while a screen has unsaved work. */
function GuardedMemoryRouter({ initial, children }: { initial: string; children: React.ReactNode }) {
  const [state, setState] = useState(() => ({
    action: NavigationType.Pop,
    location: toLocation(initial, null, 'default'),
  }));
  const stack = useRef<Location[]>([state.location]);
  const index = useRef(0);

  const navigator = useMemo<Navigator>(() => {
    let count = 0;
    const commit = (action: NavigationType, location: Location) => setState({ action, location });
    return {
      createHref: (to: To) => (typeof to === 'string' ? to : createPath(to)),
      encodeLocation: (to: To) => {
        const path = typeof to === 'string' ? parsePath(to) : to;
        return { pathname: path.pathname || '', search: path.search || '', hash: path.hash || '' };
      },
      push(to: To, pushState?: unknown) {
        const location = toLocation(to, pushState, `k${++count}`);
        if (createPath(location) !== createPath(stack.current[index.current]) && !confirmLeave()) return;
        stack.current = [...stack.current.slice(0, index.current + 1), location];
        index.current = stack.current.length - 1;
        commit(NavigationType.Push, location);
      },
      replace(to: To, replaceState?: unknown) {
        const location = toLocation(to, replaceState, `k${++count}`);
        stack.current[index.current] = location;
        commit(NavigationType.Replace, location);
      },
      go(delta: number) {
        const next = Math.max(0, Math.min(stack.current.length - 1, index.current + delta));
        if (next === index.current || !confirmLeave()) return;
        index.current = next;
        commit(NavigationType.Pop, stack.current[next]);
      },
    };
  }, []);

  return (
    <Router location={state.location} navigationType={state.action} navigator={navigator}>
      {children}
    </Router>
  );
}

function RouteSync() {
  const nav = ToolJet.useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname + location.search;
  const synced = useRef(nav.path);

  // ToolJet moved (back button, a deep link, a refused route): follow it. ToolJet already asked about unsaved work.
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
