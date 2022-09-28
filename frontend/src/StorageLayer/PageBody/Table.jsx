/* eslint-disable react/jsx-key */
import React, { useEffect } from 'react';
import { useTable } from 'react-table';
import postgrest from '@/_helpers/postgrest';

const App = () => {
  useEffect(() => {
    postgrest
      .from('tables')
      .select()
      .then((response) => {
        console.log('response', response);
      });
  }, []);

  const data = React.useMemo(
    () => [
      {
        name: 'Name1',
        class: 'Class1',
        age: 'Age1',
      },
      {
        name: 'Name2',
        class: 'Class2',
        age: 'Age2',
      },
      {
        name: 'Name3',
        class: 'Class3',
        age: 'Age3',
      },
    ],
    []
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Class',
        accessor: 'class',
      },
      {
        Header: 'Age',
        accessor: 'age',
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

  return (
    <div className="table-responsive">
      <table {...getTableProps()} className="table card-table table-vcenter text-nowrap datatable">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()} className="w-1">
                  {column.render('Header')}
                </th>
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

export default App;
