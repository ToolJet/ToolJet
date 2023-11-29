import React, { useContext } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import DropDownSelect from './DropDownSelect';
import { cloneDeep } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export default function JoinSelect({ darkMode }) {
  const { joinOptions, tableInfo, joinTableOptions, joinTableOptionsChange, findTableDetails } =
    useContext(TooljetDatabaseContext);

  const joinSelectOptions = cloneDeep(joinTableOptions['fields']) || [];
  const setJoinSelectOptions = (fields) => {
    joinTableOptionsChange('fields', fields);
  };

  const tableSet = new Set();
  (joinOptions || []).forEach((join) => {
    const { table, conditions } = join;
    tableSet.add(table);
    conditions?.conditionsList?.forEach((condition) => {
      const { leftField, rightField } = condition;
      if (leftField?.table) {
        tableSet.add(leftField?.table);
      }
      if (rightField?.table) {
        tableSet.add(rightField?.table);
      }
    });
  });

  const tables = [...tableSet].filter((table) => !!table);
  const tableOptions = {};
  for (let index = 0; index < tables.length; index++) {
    const tableId = tables[index];

    const tableDetails = findTableDetails(tableId);
    if (tableDetails?.table_name) {
      tableOptions[tableId] = (tableInfo[tableDetails.table_name] || []).map((column) => ({
        label: column.Header,
        value: column.Header,
      }));
    }
  }

  // When column name are same, alias has been added
  const handleChange = (columns, table) => {
    const unchangedSelectFields = [];
    const prevSelectedFields = [];
    joinSelectOptions.forEach((t) => {
      if (t.table !== table) unchangedSelectFields.push(t);
      if (t.table === table) prevSelectedFields.push(t);
    });

    // Select All & Deselect Functionality
    const allColumnsOfTable = tableOptions[table] ?? [];
    const columnsWithoutSelectAllOption = columns.filter((column) => column.value !== 'SELECT ALL');
    const isSelectAllExists = columns.findIndex((column) => column.value === 'SELECT ALL') >= 0;

    let newSelectFields = [...unchangedSelectFields];
    if (
      (!isSelectAllExists && prevSelectedFields.length !== columnsWithoutSelectAllOption.length) ||
      (isSelectAllExists && prevSelectedFields.length === allColumnsOfTable.length)
    )
      columnsWithoutSelectAllOption.forEach((column) => newSelectFields.push({ name: column?.value, table }));
    // Push all the Columns When Select All options is clicked
    if (isSelectAllExists && allColumnsOfTable.length && prevSelectedFields.length !== allColumnsOfTable.length)
      allColumnsOfTable.forEach((column) => newSelectFields.push({ name: column?.value, table }));

    newSelectFields = newSelectFields.map((field) => {
      if (newSelectFields.filter(({ name }) => name === field.name).length > 1 && !('alias' in field)) {
        return {
          ...field,
          // alias: field.table + '_' + field.name,
        };
      }

      return {
        ...field,
        // ...(!('alias' in field) && { alias: field.table + '_' + field.name }),
      };
    });
    setJoinSelectOptions(newSelectFields);
  };

  return (
    <Container fluid className="p-0">
      {tables.length ? (
        tables.map((table) => {
          const respectiveTableSelectedOptions = joinSelectOptions.filter((val) => val?.table === table);
          const respectiveTableOptions = tableOptions[table] ?? [];
          return (
            <Row key={table} className="border rounded mb-2 mx-0">
              <Col sm="3" className="p-0 border-end">
                <div className="tj-small-btn px-2">{findTableDetails(table)?.table_name ?? ''}</div>
              </Col>
              <Col sm="9" className="p-0 border-end">
                <DropDownSelect
                  showPlaceHolder
                  options={[
                    { label: 'Select All', value: 'SELECT ALL' },
                    ...(tableOptions[table]?.sort((a, b) => {
                      const aChecked = joinSelectOptions.some((item) => item.name === a.value && item.table === table);
                      const bChecked = joinSelectOptions.some((item) => item.name === b.value && item.table === table);
                      if (aChecked && !bChecked) {
                        return -1;
                      }
                      if (!aChecked && bChecked) {
                        return 1;
                      }
                      return 0;
                    }) ?? []),
                  ]}
                  darkMode={darkMode}
                  isMulti
                  onChange={(values) => handleChange(values, table)}
                  value={[
                    ...(respectiveTableOptions?.length === respectiveTableSelectedOptions?.length &&
                    respectiveTableSelectedOptions?.length !== 0
                      ? [
                          {
                            label: 'Select All',
                            value: 'SELECT ALL',
                          },
                        ]
                      : []),
                    ...respectiveTableSelectedOptions.map((column) => ({ value: column?.name, label: column?.name })),
                  ]}
                />
              </Col>
            </Row>
          );
        })
      ) : (
        <Row className="mb-2 mx-0">
          <div
            style={{
              gap: '4px',
              height: '30px',
              border: '1px dashed var(--slate-08, #C1C8CD)',
            }}
            className="px-4 py-2 text-center rounded-1"
          >
            <SolidIcon name="information" style={{ height: 14, width: 14 }} width={14} height={14} /> Tables are not
            selected
          </div>
        </Row>
      )}
    </Container>
  );
}
