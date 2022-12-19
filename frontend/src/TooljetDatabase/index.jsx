import React, { createContext, useState, useMemo } from 'react';
import Layout from '@/_ui/Layout';
import TooljetDatabasePage from './TooljetDatabasePage';

export const TooljetDatabaseContext = createContext({
  organizationId: null,
  setOrganizationId: () => {},
  selectedTable: '',
  setSelectedTable: () => {},
  searchParam: '',
  setSearchParam: () => {},
  selectedTableData: [],
  setSelectedTableData: () => {},
  tables: [],
  setTables: () => {},
  columns: [],
  setColumns: () => {},
});

export const TooljetDatabase = (props) => {
  const { organization_id } = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [organizationId, setOrganizationId] = useState(organization_id);
  const [columns, setColumns] = useState([]);
  const [tables, setTables] = useState([]);
  const [searchParam, setSearchParam] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedTableData, setSelectedTableData] = useState([]);

  const value = useMemo(
    () => ({
      searchParam,
      setSearchParam,
      organizationId,
      setOrganizationId,
      tables,
      setTables,
      columns,
      setColumns,
      selectedTable,
      setSelectedTable,
      selectedTableData,
      setSelectedTableData,
    }),
    [searchParam, organizationId, tables, columns, selectedTable, selectedTableData]
  );

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="page-wrapper tooljet-database">
        <TooljetDatabaseContext.Provider value={value}>
          <TooljetDatabasePage />
        </TooljetDatabaseContext.Provider>
      </div>
    </Layout>
  );
};
