import React, { createContext, useState, useMemo } from 'react';
import { Header } from '@/_components';
import StorageLayerPageHeader from './PageHeader';
import StorageLayerPageBody from './PageBody';

export const StorageLayerContext = createContext({
  columns: [],
  setColumns: () => {},
});

export const StorageLayer = ({ switchDarkMode, darkMode }) => {
  const [columns, setColumns] = useState([]);
  const value = useMemo(() => ({ columns, setColumns }), [columns]);

  return (
    <div className="page-wrapper">
      <Header switchDarkMode={switchDarkMode} darkMode={darkMode} />
      <StorageLayerContext.Provider value={value}>
        <StorageLayerPageHeader />
        <StorageLayerPageBody />
      </StorageLayerContext.Provider>
    </div>
  );
};
