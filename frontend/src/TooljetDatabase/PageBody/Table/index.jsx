/* eslint-disable react/jsx-key */
import React, { useEffect, useContext } from 'react';
import { useTable } from 'react-table';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../../index';
import { toast } from 'react-hot-toast';
import { TablePopover } from './TablePopover';

const Table = ({ selectedTable }) => {
  const [data, setData] = React.useState([]);
  const { organizationId, columns, setColumns } = useContext(TooljetDatabaseContext);

  useEffect(() => {
    if (selectedTable) {
      tooljetDatabaseService.findOne(organizationId, selectedTable).then(({ data = [], error }) => {
        if (error) {
          toast.error(`Error fetching table "${selectedTable}" data`);
          return;
        }

        setData(data);
        if (data?.length > 0) {
          setColumns(Object.keys(data[0]).map((key) => ({ Header: key, accessor: key })));
        }
      });
    }
  }, [selectedTable]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

  const handleClick = (event) => {
    event.persist();
  };

  return (
    <div className="table-responsive">
      <table {...getTableProps()} className="table card-table table-vcenter text-nowrap datatable">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <TablePopover>
                  <th {...column.getHeaderProps()} className="w-1" onClick={handleClick}>
                    {column.render('Header')}
                    <svg
                      className="mt-1 float-right"
                      width="7"
                      height="4"
                      viewBox="0 0 7 4"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.8957 3.7666L0.779035 1.64994C0.567924 1.43882 0.517924 1.19716 0.629035 0.924935C0.740146 0.652713 0.945702 0.516602 1.2457 0.516602H5.47903C5.76792 0.516602 5.96792 0.652713 6.07904 0.924935C6.19015 1.19716 6.14015 1.43882 5.92904 1.64994L3.81237 3.7666C3.7457 3.83327 3.67348 3.88049 3.5957 3.90827C3.51792 3.93605 3.44015 3.94994 3.36237 3.94994C3.26237 3.94994 3.17626 3.93605 3.10403 3.90827C3.03181 3.88049 2.96237 3.83327 2.8957 3.7666Z"
                        fill="#576574"
                      />
                    </svg>
                  </th>
                </TablePopover>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
