/* eslint-disable react/jsx-key */
import React, { useState, useEffect, useRef } from 'react';
import { useTable } from 'react-table';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
// import postgrest from '@/_helpers/postgrest';

const App = () => {
  // useEffect(() => {
  //   postgrest
  //     .from('tables')
  //     .select()
  //     .then((response) => {
  //       console.log('response', response);
  //     });
  // }, []);

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

  const [show, setShow] = useState(false);
  const [target, setTarget] = useState(null);
  const ref = useRef(null);

  const handleClick = (event) => {
    event.persist();
    setShow(!show);
    setTarget(event.target);
  };

  return (
    <div className="table-responsive">
      <table {...getTableProps()} className="table card-table table-vcenter text-nowrap datatable">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th ref={ref} {...column.getHeaderProps()} className="w-1" onClick={handleClick}>
                  {column.render('Header')}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-sm text-dark icon-thick float-right"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <polyline points="6 15 12 9 18 15"></polyline>
                  </svg>
                </th>
              ))}
              <Overlay show={show} target={target} placement="bottom" container={ref} containerPadding={20}>
                <Popover id="popover-contained">
                  <Popover.Title as="h3">Popover bottom</Popover.Title>
                  <Popover.Content>
                    <strong>Holy guacamole!</strong> Check this info.
                  </Popover.Content>
                </Popover>
              </Overlay>
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
