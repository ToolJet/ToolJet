import React, { createContext, useState, useMemo } from 'react';
import { Header } from '@/_components';
import TooljetDatabasePageHeader from './PageHeader';
import TooljetDatabasePageBody from './PageBody';

export const TooljetDatabaseContext = createContext({
  organizationId: null,
  setOrganizationId: () => {},
  selectedTable: '',
  setSelectedTable: () => {},
  tables: [],
  setTables: () => {},
  columns: [],
  setColumns: () => {},
});

export const TooljetDatabase = ({ switchDarkMode, darkMode }) => {
  const { organization_id } = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [organizationId, setOrganizationId] = useState(organization_id);
  const [columns, setColumns] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');

  const value = useMemo(
    () => ({
      organizationId,
      setOrganizationId,
      tables,
      setTables,
      columns,
      setColumns,
      selectedTable,
      setSelectedTable,
    }),
    [organizationId, tables, columns, selectedTable]
  );

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
