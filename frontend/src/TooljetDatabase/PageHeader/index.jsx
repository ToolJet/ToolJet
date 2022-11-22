import React, { useState, useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateTableForm from '../Forms/TableForm';
import CreateRowForm from '../Forms/RowForm';
import CreateColumnForm from '../Forms/ColumnForm';
import Search from './Search';
import Filter from './Filter';
import Sort from './Sort';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';

const PageHeader = () => {
  const { organizationId, columns, selectedTable, setSelectedTableData, setTables, setColumns } =
    useContext(TooljetDatabaseContext);
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);
  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);

  const handleUpdateSelectedTableData = async (query) => {
    const { data, error } = await tooljetDatabaseService.findOne(organizationId, selectedTable, query);

    if (error) {
      toast.error(error?.message ?? 'Something went wrong');
      return;
    }

    if (Array.isArray(data)) {
      setSelectedTableData(data);
    }
  };

  return (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <div className="row g-2 align-items-center">
          <div className="col-3">
            <button
              className="btn btn-outline-secondary active w-100"
              type="button"
              onClick={() => setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen)}
            >
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.66602 1.8265C2.4892 1.8265 2.31964 1.89674 2.19461 2.02176C2.06959 2.14678 1.99935 2.31635 1.99935 2.49316V11.8265C1.99935 12.0033 2.06959 12.1729 2.19461 12.2979C2.31964 12.4229 2.4892 12.4932 2.66602 12.4932H9.33268C9.50949 12.4932 9.67906 12.4229 9.80409 12.2979C9.92911 12.1729 9.99935 12.0033 9.99935 11.8265V5.15983H7.99935C7.64573 5.15983 7.30659 5.01935 7.05654 4.76931C6.80649 4.51926 6.66602 4.18012 6.66602 3.8265V1.8265H2.66602ZM7.99935 2.76931L9.05654 3.8265H7.99935V2.76931ZM1.2518 1.07895C1.62687 0.703878 2.13558 0.493164 2.66602 0.493164H7.33268C7.50949 0.493164 7.67906 0.563402 7.80409 0.688426L11.1374 4.02176C11.2624 4.14678 11.3327 4.31635 11.3327 4.49316V11.8265C11.3327 12.3569 11.122 12.8656 10.7469 13.2407C10.3718 13.6158 9.86312 13.8265 9.33268 13.8265H2.66602C2.13558 13.8265 1.62687 13.6158 1.2518 13.2407C0.876729 12.8656 0.666016 12.3569 0.666016 11.8265V2.49316C0.666016 1.96273 0.876729 1.45402 1.2518 1.07895ZM5.99935 5.8265C6.36754 5.8265 6.66602 6.12497 6.66602 6.49316V7.8265H7.99935C8.36754 7.8265 8.66602 8.12497 8.66602 8.49316C8.66602 8.86135 8.36754 9.15983 7.99935 9.15983H6.66602V10.4932C6.66602 10.8614 6.36754 11.1598 5.99935 11.1598C5.63116 11.1598 5.33268 10.8614 5.33268 10.4932V9.15983H3.99935C3.63116 9.15983 3.33268 8.86135 3.33268 8.49316C3.33268 8.12497 3.63116 7.8265 3.99935 7.8265H5.33268V6.49316C5.33268 6.12497 5.63116 5.8265 5.99935 5.8265Z"
                  fill="#889096"
                />
              </svg>
              &nbsp;&nbsp;Add table
            </button>
            <Search />
          </div>
          <div className="col-9">
            <div className="card">
              <div className="card-header">{selectedTable}</div>
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col">
                    <button
                      onClick={() => setIsCreateColumnDrawerOpen(!isCreateColumnDrawerOpen)}
                      className="btn no-border m-2"
                    >
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M1.05654 0.550681C1.30659 0.300633 1.64573 0.160156 1.99935 0.160156H4.66602C5.01964 0.160156 5.35878 0.300633 5.60882 0.550681C5.85887 0.800729 5.99935 1.13987 5.99935 1.49349V10.8268C5.99935 11.1804 5.85887 11.5196 5.60882 11.7696C5.35877 12.0197 5.01964 12.1602 4.66602 12.1602H1.99935C1.64573 12.1602 1.30659 12.0197 1.05654 11.7696C0.806491 11.5196 0.666016 11.1804 0.666016 10.8268V1.49349C0.666016 1.13987 0.806492 0.800729 1.05654 0.550681ZM4.66602 1.49349L1.99935 1.49349L1.99935 10.8268H4.66602V1.49349ZM9.33268 4.16016C9.70087 4.16016 9.99935 4.45863 9.99935 4.82682V5.49349H10.666C11.0342 5.49349 11.3327 5.79197 11.3327 6.16016C11.3327 6.52835 11.0342 6.82682 10.666 6.82682H9.99935V7.49349C9.99935 7.86168 9.70087 8.16016 9.33268 8.16016C8.96449 8.16016 8.66602 7.86168 8.66602 7.49349V6.82682H7.99935C7.63116 6.82682 7.33268 6.52835 7.33268 6.16016C7.33268 5.79197 7.63116 5.49349 7.99935 5.49349H8.66602V4.82682C8.66602 4.45863 8.96449 4.16016 9.33268 4.16016Z"
                          fill="#889096"
                        />
                      </svg>
                      &nbsp;&nbsp;Add new column
                    </button>
                    {columns?.length > 0 && (
                      <>
                        <Filter onClose={handleUpdateSelectedTableData} />
                        <Sort onClose={handleUpdateSelectedTableData} />
                        <button
                          onClick={() => setIsCreateRowDrawerOpen(!isCreateRowDrawerOpen)}
                          className="btn no-border m-2"
                          style={{ backgroundColor: '#F0F4FF', color: '#F0F4FF', fontWeight: 500, fontSize: 12 }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M0.390524 1.21767C0.640573 0.967625 0.979711 0.827148 1.33333 0.827148H10.6667C11.0203 0.827148 11.3594 0.967624 11.6095 1.21767C11.8595 1.46772 12 1.80686 12 2.16048V4.82715C12 5.18077 11.8595 5.51991 11.6095 5.76996C11.3594 6.02001 11.0203 6.16048 10.6667 6.16048H1.33333C0.979711 6.16048 0.640573 6.02001 0.390524 5.76996C0.140476 5.51991 0 5.18077 0 4.82715V2.16048C0 1.80686 0.140476 1.46772 0.390524 1.21767ZM10.6667 2.16048H1.33333L1.33333 4.82715H10.6667V2.16048ZM6 7.49381C6.36819 7.49381 6.66667 7.79229 6.66667 8.16048V8.82715H7.33333C7.70152 8.82715 8 9.12562 8 9.49381C8 9.862 7.70152 10.1605 7.33333 10.1605H6.66667V10.8271C6.66667 11.1953 6.36819 11.4938 6 11.4938C5.63181 11.4938 5.33333 11.1953 5.33333 10.8271V10.1605H4.66667C4.29848 10.1605 4 9.862 4 9.49381C4 9.12562 4.29848 8.82715 4.66667 8.82715H5.33333V8.16048C5.33333 7.79229 5.63181 7.49381 6 7.49381Z"
                              fill="#3E63DD"
                            />
                          </svg>
                          &nbsp;&nbsp;<span className="color-primary">Add new row</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Drawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} position="right">
        <CreateTableForm
          onCreate={() => {
            tooljetDatabaseService.findAll(organizationId).then(({ data = [] }) => {
              if (Array.isArray(data?.result) && data.result.length > 0) {
                setTables(data.result || []);
              }
            });
            setIsCreateTableDrawerOpen(false);
          }}
          onClose={() => setIsCreateTableDrawerOpen(false)}
        />
      </Drawer>
      <Drawer isOpen={isCreateColumnDrawerOpen} onClose={() => setIsCreateColumnDrawerOpen(false)} position="right">
        <CreateColumnForm
          onCreate={() => {
            tooljetDatabaseService.viewTable(organizationId, selectedTable).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
                return;
              }

              if (data?.result?.length > 0) {
                setColumns(
                  data?.result.map(({ column_name, data_type, keytype, ...rest }) => ({
                    Header: column_name,
                    accessor: column_name,
                    dataType: data_type,
                    isPrimaryKey: keytype?.toLowerCase() === 'primary key',
                    ...rest,
                  }))
                );
              }
            });
            setIsCreateColumnDrawerOpen(false);
          }}
          onClose={() => setIsCreateColumnDrawerOpen(false)}
        />
      </Drawer>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={() => setIsCreateRowDrawerOpen(false)} position="right">
        <CreateRowForm
          onCreate={() => {
            tooljetDatabaseService.findOne(organizationId, selectedTable).then(({ data = [] }) => {
              if (Array.isArray(data) && data?.length > 0) {
                setSelectedTableData(data);
              }
            });
            setIsCreateRowDrawerOpen(false);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
};

export default PageHeader;
