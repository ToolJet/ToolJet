import React, { useState, useEffect, useContext } from 'react';
import { tooljetDatabaseService } from '@/_services';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { FilterForm } from './FilterForm';
import { SortForm } from './SortForm';
import { toast } from 'react-hot-toast';

export const ListRows = ({ currentState, optionchanged, options, darkMode }) => {
  const { organizationId, selectedTable, columns, setColumns } = useContext(TooljetDatabaseContext);
  const [listRowsOptions, setListRowsOptions] = useState(options['list_rows'] || {});
  const [whereFilters, setWhereFilters] = useState(listRowsOptions['where_filters'] || { 0: {} });
  const [orderFilters, setOrderFilters] = useState(listRowsOptions['order_filters'] || { 0: {} });
  const [limit, setLimit] = useState(listRowsOptions['limit'] || null);

  useEffect(() => {
    fetchTableInformation(selectedTable);
  }, []);

  useEffect(() => {
    optionchanged('list_rows', listRowsOptions);
  }, [listRowsOptions]);

  useEffect(() => {
    setListRowsOptions({ ...listRowsOptions, ...{ limit } });
  }, [limit]);

  useEffect(() => {
    setListRowsOptions({
      ...listRowsOptions,
      ...{ where_filters: whereFilters },
    });
  }, [whereFilters]);

  useEffect(() => {
    setListRowsOptions({
      ...listRowsOptions,
      ...{ order_filters: orderFilters },
    });
  }, [orderFilters]);

  async function fetchTableInformation(table) {
    const { error, data } = await tooljetDatabaseService.viewTable(organizationId, table);

    if (error) {
      toast.error(error?.message ?? 'Failed to fetch table information');
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
  }

  return (
    <>
      {/* where filter */}
      <div className="row">
        <div className="my-2 col-md-12">
          <label className="form-label" data-cy="label-column-filter">
            Filter
          </label>
          {whereFilters[0] &&
            Object.values(whereFilters).map((filter, index) => {
              return (
                <div key={index}>
                  <FilterForm
                    {...filter}
                    filters={whereFilters}
                    index={index}
                    setFilters={setWhereFilters}
                    currentState={currentState}
                    darkMode={darkMode}
                  />
                </div>
              );
            })}

          <div
            className="cursor-pointer py-3"
            onClick={() =>
              setWhereFilters((prevFilters) => ({
                ...prevFilters,
                [+Object.keys(prevFilters).pop() + 1]: {},
              }))
            }
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
                fill="#466BF2"
              />
            </svg>
            &nbsp;Add Condition
          </div>
        </div>
      </div>

      {/* order filter */}
      <div className="row">
        <div className="my-2 col-md-12">
          <label className="form-label" data-cy="label-column-sort">
            Sort
          </label>
          {orderFilters[0] &&
            Object.values(orderFilters).map((filter, index) => {
              return (
                <div key={index}>
                  <SortForm {...filter} filters={orderFilters} index={index} setFilters={setOrderFilters} />
                </div>
              );
            })}

          <div
            className="cursor-pointer py-3"
            onClick={() =>
              setOrderFilters((prevFilters) => ({
                ...prevFilters,
                [+Object.keys(prevFilters).pop() + 1]: {},
              }))
            }
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
                fill="#466BF2"
              />
            </svg>
            &nbsp;Add Condition
          </div>
        </div>
      </div>

      {/* limit input */}
      {columns.length > 0 && (
        <div className="row">
          <div className="my-2 col-4">
            <label className="form-label">Limit</label>

            <CodeHinter
              {...{
                currentState,
                initialValue: limit ? (typeof limit === 'string' ? limit : JSON.stringify(limit)) : limit,
                lineNumbers: false,
                className: 'codehinter-plugins',
                onChange: (value) => setLimit(value),
                theme: darkMode ? 'monokai' : 'default',
                placeholder: 'Enter Limit',
                height: '36px',
                width: '320px',
                componentName: null,
                ignoreBraces: false,
                cyLabel: '',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
