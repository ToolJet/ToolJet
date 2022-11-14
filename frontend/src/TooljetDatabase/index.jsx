import React, { createContext, useState, useMemo } from 'react';
import { Header } from '@/_components';
import TooljetDatabasePageHeader from './PageHeader';
import TooljetDatabasePageBody from './PageBody';

export const TooljetDatabaseContext = createContext({
  columns: [],
  setColumns: () => {},
});

export const TooljetDatabase = ({ switchDarkMode, darkMode }) => {
  const [columns, setColumns] = useState([]);
  const [tables, setTables] = useState([]);
  const value = useMemo(() => ({ tables, columns, setColumns, setTables }), [tables, columns]);

  return (
    <div className="page-wrapper">
      <Header switchDarkMode={switchDarkMode} darkMode={darkMode} />
      <TooljetDatabaseContext.Provider value={value}>
        <TooljetDatabasePageHeader />
        <TooljetDatabasePageBody />
      </TooljetDatabaseContext.Provider>
    </div>
  );
};
