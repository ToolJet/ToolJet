import React from 'react';
import AppCard from '../AppCard';

export default function AppList({ apps }) {
  // const apps = Array.from({ length: 11 }, (v, i) => i);

  return <GridLayoutContainer apps={apps} />;
}

function GridLayoutContainer({ apps }) {
  return (
    <section className="tw-grid tw-grid-cols-[repeat(auto-fill,minmax(292px,1fr))] tw-gap-6">
      {apps.map((app) => (
        <AppCard key={app.id} appDetails={app} />
      ))}
    </section>
  );
}
