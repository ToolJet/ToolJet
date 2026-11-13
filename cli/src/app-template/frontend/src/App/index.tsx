import React from 'react';
import { NavLink, Route, Routes } from 'react-router';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AppRouter, useAllowedRoutes } from '../lib/router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import '../styles/globals.css';

/*
  The app's screens (Code mode). Data comes from the app's queries (useAppQuery in tooljet.gen.ts, or ToolJet.useQuery), the user from
  ToolJet.useGlobals, and routes from app.json through AppRouter. Hooks work in any component.
*/

const Home: React.FC = () => {
  const { currentUser, environment } = ToolJet.useGlobals();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, {currentUser.name || 'there'}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This page is code. Create queries in ToolJet, run `tooljet app pull`, then read them with useAppQuery. Running in{' '}
        {environment.name || 'development'}.
      </CardContent>
    </Card>
  );
};

const About: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>About</CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">Routes are declared in app.json, each with its own page permissions.</CardContent>
  </Card>
);

const Shell: React.FC = () => {
  const routes = useAllowedRoutes();
  return (
    <div className="app-root grid h-full grid-cols-[200px_1fr] bg-page">
      <nav className="flex flex-col gap-1 border-r bg-background p-3">
        <div className="mb-3 px-3 py-2 font-semibold">__DISPLAY_NAME__</div>
        {routes
          .filter((r) => !r.path.includes(':'))
          .map((r) => (
            <NavLink
              key={r.id}
              to={r.path}
              end
              className={({ isActive }) =>
                cn('rounded-md px-3 py-2 text-sm font-medium', isActive ? 'bg-accent' : 'text-muted-foreground hover:bg-accent')
              }
            >
              {r.title ?? r.id}
            </NavLink>
          ))}
      </nav>
      <main className="min-h-0 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 100, usage: 'A ToolJet app in Code mode.' });
  return (
    <AppRouter>
      <Shell />
    </AppRouter>
  );
};
