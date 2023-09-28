import React, { useContext } from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { Col, Container, Row } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { clone } from 'lodash';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import DropDownSelect from './DropDownSelect';
import JoinConstraint from './JoinConstraint';
import JoinSelect from './JoinSelect';
import JoinSort from './JoinSort';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { filterOperatorOptions, nullOperatorOptions } from './util';

export const JoinTable = React.memo(({ darkMode }) => {
  return (
    <div>
      <SelectTableMenu darkMode={darkMode} />
    </div>
  );
});

const SelectTableMenu = ({ darkMode }) => {
  const {
    selectedTableId,
    joinOptions,
    setJoinOptions: setJoins,
    joinTableOptions,
    joinTableOptionsChange,
    deleteJoinTableOptions,
  } = useContext(TooljetDatabaseContext);

  const joins = clone(joinOptions);

  const handleJoinChange = (newJoin, index) => {
    const updatedJoin = joinOptions.map((join, i) => {
      if (i === index) return newJoin;
      return join;
    });

    const cleanedJoin = [];
    const tableSet = new Set();
    (updatedJoin || []).forEach((join, i) => {
      const { conditions } = join;
      let leftTable, rightTable;
      conditions?.conditionsList?.forEach((condition) => {
        const { leftField = {}, rightField = {} } = condition;
        if (leftField?.table) leftTable = leftField?.table;
        if (rightField?.table) rightTable = rightField?.table;
      });

      if ((tableSet.has(leftTable) && !tableSet.has(rightTable)) || i === 0) {
        if (leftTable) tableSet.add(leftTable);
        if (rightTable) tableSet.add(rightTable);
        cleanedJoin.push({ ...join });
      }
    });
    // tableSet.add(selectedTable);
    setJoins(cleanedJoin);
  };

  const calcUpdatedJoins = (updatedJoin) => {
    const cleanedJoin = [];
    const tableSet = new Set();
    (updatedJoin || []).forEach((join, i) => {
      const { _table, conditions } = join;
      let leftTable, rightTable;
      conditions?.conditionsList?.forEach((condition) => {
        const { leftField, rightField } = condition;
        if (leftField?.table) {
          // tableSet.add(leftField?.table);
          leftTable = leftField?.table;
        }
        if (rightField?.table) {
          // tableSet.add(rightField?.table);
          rightTable = rightField?.table;
        }
      });
      if ((tableSet.has(leftTable) && !tableSet.has(rightTable)) || i === 0) {
        tableSet.add(leftTable);
        tableSet.add(rightTable);
        cleanedJoin.push({ ...join });
      }
    });
    return cleanedJoin;
  };

  return (
    <div>
      {/* Join Section */}
      <div className="field-container d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">From</label>
        <div className="field flex-grow-1 mt-1">
          {joins.map((join, joinIndex) => (
            <JoinConstraint
              darkMode={darkMode}
              key={join?.id}
              index={joinIndex}
              data={join}
              onChange={(value) => handleJoinChange(value, joinIndex)}
              onRemove={() => setJoins(calcUpdatedJoins(joins.filter((join, index) => index !== joinIndex)))}
            />
          ))}
          <Row className="mx-0">
            <ButtonSolid
              variant="secondary"
              size="sm"
              onClick={() =>
                setJoins([
                  ...joins,
                  {
                    id: new Date().getTime(),
                    conditions: {
                      operator: 'AND',
                      conditionsList: [
                        {
                          operator: '=',
                          leftField: { table: selectedTableId },
                        },
                      ],
                    },
                    joinType: 'INNER',
                  },
                ])
              }
            >
              <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
              &nbsp;&nbsp; Add another table
            </ButtonSolid>
          </Row>
        </div>
      </div>
      {/* Filter Section */}
      <div className="tdb-join-filtersection field-container d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Filter</label>
        <div className="field flex-grow-1">
          <RenderFilterSection darkMode={darkMode} />
        </div>
      </div>
      {/* Sort Section */}
      <div className="field-container d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Sort</label>
        <div className="field flex-grow-1">
          <JoinSort darkMode={darkMode} />
        </div>
      </div>
      {/* Limit Section */}
      <div className="field-container d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Limit</label>
        <div className="field flex-grow-1">
          <CodeHinter
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'32px'}
            placeholder="Enter limit"
            type="code"
            initialValue={joinTableOptions?.limit ?? ''}
            onChange={(value) => {
              if (value.length) {
                joinTableOptionsChange('limit', value);
              } else {
                deleteJoinTableOptions('limit');
              }
            }}
          />
        </div>
      </div>
      {/* Offset Section */}
      <div className="field-container d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Offset</label>
        <div className="field flex-grow-1">
          <CodeHinter
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'32px'}
            placeholder="Enter offset"
            type="code"
            initialValue={joinTableOptions?.offset ?? ''}
            onChange={(value) => {
              if (value.length) {
                joinTableOptionsChange('offset', value);
              } else {
                deleteJoinTableOptions('offset');
              }
            }}
          />
        </div>
      </div>
      {/* Select Section */}
      <div className="field-container d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Select</label>
        <div className="field flex-grow-1">
          <JoinSelect darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

// Component to Render Filter Section
const RenderFilterSection = ({ darkMode }) => {
  const { tableInfo, joinTableOptions, joinTableOptionsChange, deleteJoinTableOptions, joinOptions, findTableDetails } =
    useContext(TooljetDatabaseContext);
  const { conditions = {} } = joinTableOptions;
  const { conditionsList = [] } = conditions;

  function handleWhereFilterChange(conditionsEdited) {
    joinTableOptionsChange('conditions', conditionsEdited);
  }

  function addNewFilterConditionEntry() {
    let editedFilterCondition = {};

    const emptyConditionTemplate = { operator: '=', leftField: {}, rightField: {} };

    // First time populate operator & conditionList details
    if (!Object.keys(conditions).length) {
      editedFilterCondition = {
        operator: 'AND',
        conditionsList: [{ ...emptyConditionTemplate }],
      };
    } else {
      editedFilterCondition = {
        ...conditions,
        conditionsList: [...conditionsList, { ...emptyConditionTemplate }],
      };
    }

    handleWhereFilterChange(editedFilterCondition);
  }

  function removeFilterConditionEntry(index) {
    if (!Object.keys(conditions).length || !conditionsList.length) return;

    // If there is one condition left, then make the 'conditions' state to default.
    let editedFilterConditions = {};
    if (conditionsList.length > 1) {
      editedFilterConditions = {
        ...conditions,
        conditionsList: conditionsList.filter((condition, i) => i !== index),
      };
    }

    if (Object.keys(editedFilterConditions).length === 0) {
      deleteJoinTableOptions('conditions');
    } else {
      handleWhereFilterChange(editedFilterConditions);
    }
  }

  function updateFilterConditionEntry(type, indexToUpdate, valueToUpdate) {
    if (!Object.keys(conditions).length || !conditionsList.length) return;
    // type: Column | Value | Operator

    // @desc : Input Need for Each Type
    // Column -> table, columnName, isLeftSideCondition
    // Value -> value, isLeftSideCondition
    // Operator -> operator

    const editedConditionList = conditionsList.map((conditionDetail, index) => {
      if (indexToUpdate === index) {
        switch (type) {
          case 'Column':
            return valueToUpdate.isLeftSideCondition
              ? {
                  ...conditionDetail,
                  leftField: {
                    columnName: valueToUpdate.columnName,
                    table: valueToUpdate.table,
                    type: 'Column',
                  },
                }
              : {
                  ...conditionDetail,
                  rightField: {
                    columnName: valueToUpdate.columnName,
                    table: valueToUpdate.table,
                    type: 'Column',
                  },
                };
          case 'Value':
            return valueToUpdate.isLeftSideCondition
              ? {
                  ...conditionDetail,
                  leftField: {
                    value: valueToUpdate.value,
                    type: 'Value',
                  },
                }
              : {
                  ...conditionDetail,
                  rightField: {
                    value: valueToUpdate.value,
                    type: 'Value',
                  },
                };
          case 'Operator':
            return {
              ...conditionDetail,
              ...((conditionDetail.operator === 'IS' || valueToUpdate.operator === 'IS') && {
                rightField: {
                  value: '',
                  type: 'Value',
                },
              }),
              operator: valueToUpdate.operator,
            };
          default:
            return conditionDetail;
        }
      }
      return conditionDetail;
    });
    handleWhereFilterChange({ ...conditions, conditionsList: [...editedConditionList] });
  }

  function updateOperatorForConditions(changedOperator) {
    let editedFilterConditions = { ...conditions, operator: changedOperator };
    handleWhereFilterChange(editedFilterConditions);
  }

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
  const tableList = [];

  tables.forEach((tableId) => {
    const tableDetails = findTableDetails(tableId);
    if (tableDetails?.table_name && tableInfo[tableDetails.table_name]) {
      const tableDetailsForDropDown = {
        label: tableDetails.table_name,
        value: tableId,
        options:
          tableInfo[tableDetails.table_name]?.map((columns) => ({
            label: columns.Header,
            value: columns.Header + '-' + tableId,
            table: tableId,
          })) || [],
      };
      tableList.push(tableDetailsForDropDown);
    }
  });

  const groupOperators = [
    { value: 'AND', label: 'AND' },
    { value: 'OR', label: 'OR' },
  ];

  const filterComponents = conditionsList.map((conditionDetail, index) => {
    const { operator = '', leftField = {}, rightField = {} } = conditionDetail;
    const LeftSideTableDetails = leftField?.table ? findTableDetails(leftField?.table) : '';
    return (
      <Row className="border rounded mb-2 mx-0" key={index}>
        <Col sm="2" className="p-0 border-end">
          {index === 1 && (
            <DropDownSelect
              showPlaceHolder
              onChange={(change) => updateOperatorForConditions(change?.value)}
              options={groupOperators}
              darkMode={darkMode}
              value={groupOperators.find((op) => op.value === conditions.operator)}
            />
          )}
          {index === 0 && <div className="tj-small-btn px-2">Where</div>}
          {index > 1 && <div className="tj-small-btn px-2">{conditions?.operator}</div>}
        </Col>
        <Col sm="3" className="p-0 border-end">
          <DropDownSelect
            showPlaceHolder
            onChange={(newValue) =>
              updateFilterConditionEntry('Column', index, {
                table: newValue.table,
                columnName: newValue.label,
                isLeftSideCondition: true,
              })
            }
            value={{
              label: LeftSideTableDetails?.table_name
                ? LeftSideTableDetails?.table_name + '.' + leftField?.columnName
                : leftField?.columnName,
              value: leftField?.columnName && leftField?.table ? leftField?.columnName + '-' + leftField?.table : '',
              table: leftField?.table,
            }}
            options={tableList}
            darkMode={darkMode}
          />
        </Col>
        <Col sm="3" className="p-0 border-end">
          <DropDownSelect
            showPlaceHolder
            onChange={(change) => updateFilterConditionEntry('Operator', index, { operator: change?.value })}
            value={filterOperatorOptions.find((op) => op.value === operator)}
            options={filterOperatorOptions}
            darkMode={darkMode}
          />
        </Col>
        <Col sm="4" className="p-0 d-flex">
          <div className="flex-grow-1">
            {operator === 'IS' ? (
              <DropDownSelect
                showPlaceHolder
                onChange={(change) =>
                  updateFilterConditionEntry('Value', index, { value: change?.value, isLeftSideCondition: false })
                }
                options={nullOperatorOptions}
                darkMode={darkMode}
                value={nullOperatorOptions.find((op) => op.value === rightField.value)}
              />
            ) : (
              <CodeHinter
                initialValue={
                  rightField?.value
                    ? typeof rightField?.value === 'string'
                      ? rightField?.value
                      : JSON.stringify(rightField?.value)
                    : rightField?.value
                }
                className="codehinter-plugins"
                theme={darkMode ? 'monokai' : 'default'}
                height={'28px'}
                placeholder="Value"
                onChange={(newValue) =>
                  updateFilterConditionEntry('Value', index, { value: newValue, isLeftSideCondition: false })
                }
              />
            )}
          </div>
          <ButtonSolid
            size="sm"
            variant="ghostBlack"
            className="px-1 rounded-0 border-start"
            onClick={() => removeFilterConditionEntry(index)}
          >
            <Trash fill="var(--slate9)" style={{ height: '16px' }} />
          </ButtonSolid>
        </Col>
      </Row>
    );
  });

  return (
    <Container fluid className="p-0">
      {conditionsList.length === 0 && (
        <Row className="mb-2 mx-0">
          <div
            style={{
              gap: '4px',
              height: '30px',
              border: '1px dashed var(--slate-08, #C1C8CD)',
            }}
            className="px-4 py-2 text-center rounded-1"
          >
            <SolidIcon name="information" style={{ height: 14, width: 14 }} width={14} height={14} /> There are no
            conditions
          </div>
        </Row>
      )}
      {filterComponents}
      <Row className="mx-0">
        <Col className="p-0">
          <ButtonSolid variant="ghostBlue" size="sm" onClick={() => addNewFilterConditionEntry()}>
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp; Add more
          </ButtonSolid>
        </Col>
      </Row>
    </Container>
  );
};
