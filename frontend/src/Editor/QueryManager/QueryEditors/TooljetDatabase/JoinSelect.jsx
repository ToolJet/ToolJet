import React, { useContext } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import DropDownSelect from './DropDownSelect';
import { cloneDeep } from 'lodash';

export default function JoinSelect({ darkMode }) {
  const { joinOptions, tableInfo, joinTableOptions, joinTableOptionsChange } = useContext(TooljetDatabaseContext);
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

  const tables = [...tableSet];
  const tableOptions = {};
  for (let index = 0; index < tables.length; index++) {
    const table = tables[index];
    tableOptions[table] = (tableInfo[table] || []).map((column) => ({ label: column.Header, value: column.Header }));
  }

  // When column name are same, alias has been added
  const handleChange = (columns, table) => {
    const unchangedSelectFields = joinSelectOptions.filter((t) => t.table !== table);
    let newSelectFields = [...unchangedSelectFields, ...columns.map((column) => ({ name: column?.value, table }))];

    newSelectFields = newSelectFields.map((field) => {
      if (newSelectFields.filter(({ name }) => name === field.name).length > 1 && !('alias' in field)) {
        return {
          ...field,
          alias: field.table + '_' + field.name,
        };
      }

      return {
        ...field,
        ...(!('alias' in field) && { alias: field.table + '_' + field.name }),
      };
    });
    setJoinSelectOptions(newSelectFields);
  };

  return (
    <Container className="p-0">
      {tables.map((table) => (
        <Row key={table} className="border rounded mb-2">
          <Col sm="3" className="p-0 border-end">
            <div className="tj-small-btn px-2">{table}</div>
          </Col>
          <Col sm="9" className="p-0 border-end">
            <DropDownSelect
              options={tableOptions[table]?.sort((a, b) => {
                const aChecked = joinSelectOptions.some((item) => item.name === a.value && item.table === table);
                const bChecked = joinSelectOptions.some((item) => item.name === b.value && item.table === table);
                if (aChecked && !bChecked) {
                  return -1;
                }
                if (!aChecked && bChecked) {
                  return 1;
                }
                return 0;
              })}
              darkMode={darkMode}
              isMulti
              onChange={(values) => handleChange(values, table)}
              value={joinSelectOptions
                .filter((val) => val?.table === table)
                .map((column) => ({ value: column?.name, label: column?.name }))}
            />
          </Col>
        </Row>
      ))}
    </Container>
  );
}
