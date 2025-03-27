import React, { useContext, useEffect, useRef, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import DropDownSelect from './DropDownSelect';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import RightArrow from '@/_ui/Icon/solidIcons/RightArrow';
import DownArrow from '@/_ui/Icon/solidIcons/DownArrow';
import InfomrationCirlce from '@/_ui/Icon/solidIcons/InformationCircle';
import { ToolTip } from '@/_components/ToolTip';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import { NoCondition } from './NoConditionUI';

export default function JoinSelect({ darkMode }) {
  const { joinOptions, tableInfo, joinTableOptions, joinTableOptionsChange, findTableDetails } =
    useContext(TooljetDatabaseContext);

  const joinSelectOptions = deepClone(joinTableOptions['fields']) || [];
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

  const handleJSonChange = (value, colName, table) => {
    const selectedJsonColumns = [...joinSelectOptions];
    const indexToBeChanged = selectedJsonColumns.findIndex((col) => col.name === colName && col.table === table);
    if (indexToBeChanged !== -1) {
      selectedJsonColumns[indexToBeChanged] = { ...selectedJsonColumns[indexToBeChanged], jsonpath: value };
    }
    setJoinSelectOptions(selectedJsonColumns);
  };

  return (
    <Container fluid className="p-0 d-flex flex-column custom-gap-8">
      {tables.length ? (
        tables.map((table) => {
          const respectiveTableSelectedOptions = joinSelectOptions.filter((val) => val?.table === table);
          const respectiveTableOptions = tableOptions[table] ?? [];

          const tableDetails = findTableDetails(table);

          const allOptionOfTableWithDataType = [];

          const tableJsonbColumntypes = tableInfo[tableDetails?.table_name]?.reduce((acc, col) => {
            if (col?.dataType === 'jsonb') {
              acc.push(col.accessor);
              allOptionOfTableWithDataType.push({ label: col.accessor, value: col.accessor, icon: col.dataType });
            } else {
              allOptionOfTableWithDataType.push({ label: col.accessor, value: col.accessor, icon: col.dataType });
            }
            return acc;
          }, []);

          const selectedJsonbColumns = respectiveTableSelectedOptions?.filter((col) =>
            tableJsonbColumntypes?.includes(col.name)
          );

          return (
            <div key={table}>
              <Row className="mb-2 mx-0">
                <Col sm="3" className="p-0">
                  <div
                    style={{
                      height: '30px',
                      borderRadius: 0,
                    }}
                    className="tj-small-btn px-2 border border-end-0 rounded-start"
                  >
                    {findTableDetails(table)?.table_name ?? ''}
                  </div>
                </Col>
                <Col sm="9" className="p-0">
                  <DropDownSelect
                    buttonClasses="border rounded-end"
                    highlightSelected={false}
                    showPlaceHolder
                    options={[
                      { label: 'Select All', value: 'SELECT ALL' },
                      ...(allOptionOfTableWithDataType?.sort((a, b) => {
                        const aChecked = joinSelectOptions.some(
                          (item) => item.name === a.value && item.table === table
                        );
                        const bChecked = joinSelectOptions.some(
                          (item) => item.name === b.value && item.table === table
                        );
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

              <JsonBfieldsForSelect
                selectedJsonbColumns={selectedJsonbColumns}
                handleJSonChange={handleJSonChange}
                table={table}
                // removeJsonPathColPair={removeJsonPathColPair}
              />
            </div>
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

const JsonBfieldsForSelect = ({ selectedJsonbColumns, handleJSonChange, table }) => {
  const [jsonPaths, setJsonPaths] = useState({});
  const [jsonPathTooltip, setJsonPathTooltip] = useState(jsonPaths);

  useEffect(() => {
    setJsonPathTooltip(jsonPaths);
  }, [jsonPaths]);

  const isInitialized = useRef(false);

  useEffect(() => {
    // Check if selectedJsonbColumns has data and if initialization has not already occurred
    if (!isInitialized.current && selectedJsonbColumns?.length > 0) {
      const jsonPathsToUpdate = selectedJsonbColumns.reduce((acc, col) => {
        const uuid = uuidv4();
        acc[uuid] = {
          name: col.name,
          jsonpath: col?.jsonpath || '',
          id: uuid,
          table: col.table,
        };
        return acc;
      }, {});
      setJsonPaths(jsonPathsToUpdate);
      isInitialized.current = true; // Prevent further re-runs
    }
  }, [selectedJsonbColumns]); // Dependency array to track changes

  const handleRemove = (id, colName, colTable) => {
    const jsonpathsToUpdate = { ...jsonPaths };
    delete jsonpathsToUpdate[id];
    handleJSonChange('', colName, colTable);
    setJsonPaths(jsonpathsToUpdate);
  };

  const handleColumnChange = (id, selectedOption) => {
    const jsonpathsToUpdate = { ...jsonPaths };
    jsonpathsToUpdate[id] = { ...jsonpathsToUpdate[id], name: selectedOption.value };
    setJsonPaths(jsonpathsToUpdate);
    handleJSonChange(jsonpathsToUpdate[id].jsonpath, jsonpathsToUpdate[id].name, jsonpathsToUpdate[id].table);
  };

  const addNewColumnOptionsPair = () => {
    const jsonpathsToUpdate = { ...jsonPaths };
    const uuid = uuidv4();
    jsonpathsToUpdate[uuid] = {
      name: '',
      jsonpath: '',
      id: uuid,
      table: table,
    };
    setJsonPaths(jsonpathsToUpdate);
  };

  const handleJSonPathChange = (value, colName, tableId, id) => {
    const jsonpathsToUpdate = { ...jsonPaths };
    jsonpathsToUpdate[id] = { ...jsonpathsToUpdate[id], jsonpath: value };
    setJsonPaths(jsonpathsToUpdate);
    handleJSonChange(value, colName, tableId);
  };
  const preSelectedOptions = Object.values(jsonPaths).map((col) => col.name);

  const options = selectedJsonbColumns
    .filter((col) => !preSelectedOptions.includes(col.name)) // Filter out columns
    .map((col) => ({ label: col.name, value: col.name, table: col.table, icon: 'jsonb' })); // Transform each filtered column

  const isJsonbColumnSelected = _.isEmpty(selectedJsonbColumns);

  return (
    <div className="d-flex flex-column custom-gap-4 w-100">
      <div>
        {isJsonbColumnSelected ? (
          <RightArrow fill="var(--slate9)" width="14" />
        ) : (
          <DownArrow fill="var(--slate9)" width="14" />
        )}
        <span>Access nested JSON field</span>
        <ToolTip
          message="Use -> for JSON object and ->> for text"
          tooltipClassName="tjdb-table-tooltip"
          placement="top"
          trigger={['hover', 'focus']}
        >
          <span>
            <InfomrationCirlce fill="var(--slate9)" width="14" />
          </span>
        </ToolTip>
      </div>
      {!isJsonbColumnSelected && (
        <div className="d-flex flex-column custom-gap-4" style={{ padding: '0 28px' }}>
          {Object.entries(jsonPaths).map(([key, colDetails]) => {
            return (
              <div className="p-0 field custom-gap-4 flex-grow-1" key={key}>
                <Row className="mx-0">
                  <Col sm="4" className="p-0">
                    <DropDownSelect
                      useMenuPortal={true}
                      showPlaceHolder
                      placeholder="Select column"
                      value={{ label: colDetails.name, value: colDetails.name }}
                      options={options}
                      onChange={(selectedOption) => handleColumnChange(colDetails.id, selectedOption)}
                      // darkMode={darkMode}
                      buttonClasses="border border-end-0 rounded-start overflow-hidden"
                    />
                  </Col>
                  <Col sm="8" className="p-0 d-flex tjdb-codhinter-wrapper">
                    <ToolTip
                      message={
                        jsonPathTooltip[colDetails.id]?.jsonpath ||
                        'Access nested JSON fields by using -> for JSON object and ->> for text'
                      }
                      tooltipClassName="tjdb-table-tooltip"
                      placement="top"
                      trigger={['hover', 'focus']}
                      width="160px"
                    >
                      <div className="w-100">
                        <CodeHinter
                          type="basic"
                          initialValue={colDetails?.jsonpath || ''}
                          value={colDetails?.jsonpath || ''}
                          onChange={(value) => {
                            handleJSonPathChange(value, colDetails.name, colDetails.table, colDetails.id);
                          }}
                          enablePreview={false}
                          height="30"
                          placeholder="->>'key'"
                          componentName={colDetails?.name ? `{}${colDetails?.name}` : ''}
                          onInputChange={(value) => {
                            const jsonpathsToUpdate = { ...jsonPaths };
                            jsonpathsToUpdate[colDetails.id] = { ...jsonpathsToUpdate[colDetails.id], jsonpath: value };
                            setJsonPathTooltip(jsonpathsToUpdate);
                          }}
                        />
                      </div>
                    </ToolTip>
                    <ButtonSolid
                      size="sm"
                      variant="ghostBlack"
                      className="px-1 rounded-0 border rounded-end"
                      customStyles={{
                        height: '30px',
                      }}
                      onClick={() => handleRemove(colDetails.id, colDetails.name, colDetails.table)}
                    >
                      <Trash fill="var(--slate9)" style={{ height: '16px' }} />
                    </ButtonSolid>
                  </Col>
                </Row>
              </div>
            );
          })}
          {_.isEmpty(jsonPaths) && <NoCondition text="There are no columns added" />}

          <ToolTip
            message={'There are no more JSON type columns'}
            tooltipClassName="tjdb-table-tooltip"
            placement="top"
            trigger={['hover', 'focus']}
            width="160px"
            show={_.isEmpty(options)}
          >
            <ButtonSolid
              variant="ghostBlue"
              size="sm"
              onClick={addNewColumnOptionsPair}
              className={`cursor-pointer fit-content mt-2}`}
              disabled={_.isEmpty(options)}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
                  fill="#466BF2"
                />
              </svg>
              &nbsp; Add column
            </ButtonSolid>
          </ToolTip>
        </div>
      )}
    </div>
  );
};
