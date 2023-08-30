import React, { useContext } from 'react';
// import Select, { components } from 'react-select';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { Col, Container, Row } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
// import SolidIcon from '@/_ui/Icon/SolidIcons';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
// import useShowPopover from '@/_hooks/useShowPopover';
// import LeftOuterJoinIcon from '../../Icons/LeftOuterJoinIcon';
// import RightOuterJoin from '../../Icons/RightOuterJoin';
// import InnerJoinIcon from '../../Icons/InnerJoinIcon';
// import FullOuterJoin from '../../Icons/FullOuterJoin';
// import SelectBox from './SelectBox';
// import CheveronDown from '@/_ui/Icon/bulkIcons/CheveronDown';
// import Remove from '@/_ui/Icon/bulkIcons/Remove';
// import { isEmpty } from 'lodash';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import DropDownSelect from './DropDownSelect';
import JoinConstraint from './JoinConstraint';
import JoinSelect from './JoinSelect';

export const JoinTable = React.memo(({ darkMode }) => {
  return (
    <div>
      {/* <JoinOperationMenu /> */}
      <SelectTableMenu darkMode={darkMode} />
    </div>
  );
});

// Base Component for Join Drop Down ----------
// const staticJoinOperationsList = [
//   { label: 'Inner Join', value: 'INNER' },
//   { label: 'Left Join', value: 'LEFT' },
//   { label: 'Right Join', value: 'RIGHT' },
//   { label: 'Full Outer Join', value: 'FULL OUTER' },
// ];

// const DBJoinIcons = ({ joinType }) => {
//   switch (joinType) {
//     case 'left-join':
//       return <LeftOuterJoinIcon />;
//     case 'inner-join':
//       return <InnerJoinIcon />;
//     case 'right-join':
//       return <RightOuterJoin />;
//     case 'full-outer-join':
//       return <FullOuterJoin />;
//     default:
//       return '';
//   }
// };

// const JoinOperationMenu = () => {
//   const { Option, SingleValue } = components;

//   const SingleValueComponent = (props) => (
//     <SingleValue {...props}>
//       <DBJoinIcons joinType={props.data.value} />
//     </SingleValue>
//   );

//   const OptionWithIcons = (props) => (
//     <Option {...props}>
//       <DBJoinIcons joinType={props.data.value} /> <span className="ms-1 small">{props.data.label}</span>
//     </Option>
//   );

//   return (
//     <div>
//       <Select
//         classNames={{
//           menu: () => 'tj-scrollbar',
//         }}
//         menuPlacement="bottom"
//         placeholder="Search"
//         defaultValue={staticJoinOperationsList[0]}
//         options={staticJoinOperationsList}
//         components={{
//           SingleValue: SingleValueComponent,
//           Option: OptionWithIcons,
//           IndicatorSeparator: () => null,
//         }}
//       />
//     </div>
//   );
// };

// Base Component for Table Drop Down ---------------
// const DropdownIndicator = (props) => {
//   return (
//     components.DropdownIndicator && (
//       <components.DropdownIndicator {...props}>
//         <SolidIcon name="search" width="16px" />
//       </components.DropdownIndicator>
//     )
//   );
// };

const SelectTableMenu = ({ darkMode }) => {
  const {
    // columns,
    // listRowsOptions,
    // limitOptionChanged,
    // handleOptionsChange,
    selectedTable,
    tables,
    joinOptions: joins,
    setJoinOptions: setJoins,
  } = useContext(TooljetDatabaseContext);
  // const { Option } = components;

  // const IconOptions = (props) => (
  //   <Option {...props}>
  //     <DBJoinIcons joinType={props.data.value} /> <span className="ms-1 small">{props.data.label}</span>
  //   </Option>
  // );

  const tableList = tables.map((t) => ({ label: t, value: t }));

  const handleJoinChange = (newJoin, index) => {
    setJoins((joins) =>
      joins.map((join, i) => {
        if (i === index) {
          return newJoin;
        }
        return join;
      })
    );
  };

  return (
    <div>
      {/* Join Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">From</label>
        <div className="field flex-grow-1 mt-1">
          {joins.map((join, i) => (
            <JoinConstraint
              darkMode={darkMode}
              key={i}
              index={i}
              // conditionsList={join?.conditions?.conditionsList}
              // operator={join?.conditions?.operator}
              data={join}
              onChange={(value) => handleJoinChange(value, i)}
              onRemove={() => setJoins((joins) => joins.filter((join, index) => index !== i))}
            />
          ))}
          <Row>
            <ButtonSolid
              variant="secondary"
              size="sm"
              onClick={() => setJoins((joins) => [...joins, { table: selectedTable }])}
            >
              <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
              &nbsp;&nbsp; Add another table
            </ButtonSolid>
          </Row>
        </div>
      </div>
      {/* Filter Section */}
      <div className="field-container d-flex mb-4">
        <label className="form-label">Filter</label>
        <div className="field flex-grow-1">
          <RenderFilterSection darkMode={darkMode} />
        </div>
      </div>
      {/* Sort Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">Sort</label>
        <div className="field flex-grow-1">
          <RenderSortSection darkMode={darkMode} />
        </div>
      </div>
      {/* Limit Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">Limit</label>
        <div className="field flex-grow-1">
          <CodeHinter
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'32px'}
            placeholder="Enter limit"
          />
        </div>
      </div>
      {/* Select Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">Select</label>
        <div className="field flex-grow-1">
          <JoinSelect darkMode={darkMode} />
          {/* <Container className="p-0">
            <Row className="border rounded">
              <Col sm="2" className="p-0 border-end text-center">
                Table A
              </Col>
              <Col sm="10" className="p-0 border-end">
                <DropDownSelect options={tableList} isMulti />
              </Col>
            </Row>
          </Container> */}
        </div>
      </div>
    </div>
  );
};

//   "conditions": {
//     "operator": "AND",
//       "conditionsList": [
//         {
//           "operator": ">",
//           "leftField": {
//             "columnName": "registration_date",
//             "table": "users",
//             "type": "Column"
//           },
//           "rightField": {
//             "value": "2022-01-01",
//             "type": "Value"
//           }
//         }
//       ]
//   }

// Component to Render Filter Section
const RenderFilterSection = ({ darkMode }) => {
  const { tableInfo, joinTableOptions, joinTableOptionsChange } = useContext(TooljetDatabaseContext);
  const { conditions = {} } = joinTableOptions;
  const { conditionsList = [] } = conditions;

  // Re-populate the Saved Query *
  // Fix all the Edge Cases
  // Have constants in a separate file
  // Edit the Codehinter UI
  // While Executing Query - Emtpy Fields must be removed

  function handleWhereFilterChange(conditionsEdited) {
    joinTableOptionsChange('conditions', conditionsEdited);
  }

  function addNewFilterConditionEntry() {
    let editedFilterCondition = {};

    const emptyConditionTemplate = { operator: '', leftField: {}, rightField: {} };

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

    handleWhereFilterChange(editedFilterConditions);
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
              operator: valueToUpdate.operator,
            };
          default:
            return conditionDetail;
        }
      }
      return conditionDetail;
    });
    handleWhereFilterChange({ ...conditions, conditionsList: editedConditionList });
  }

  function updateOperatorForConditions(changedOperator) {
    let editedFilterConditions = { ...conditions, operator: changedOperator };
    handleWhereFilterChange(editedFilterConditions);
  }

  const tableList = Object.entries(tableInfo).map(([key, value]) => {
    const tableDetails = {
      label: key,
      value: key,
      options: value.map((columns) => ({ label: columns.Header, value: columns.Header, table: key })),
    };
    return tableDetails;
  });

  const operatorConstants = [{ label: '=', value: '=' }];
  const groupOperators = [
    { value: 'AND', label: 'AND' },
    { value: 'OR', label: 'OR' },
  ];

  const filterComponents = conditionsList.map((conditionDetail, index) => {
    const { operator = '', leftField = {}, rightField = {} } = conditionDetail;
    return (
      <Row className="border rounded mb-2" key={index}>
        <Col sm="2" className="p-0 border-end">
          {index === 1 && (
            <DropDownSelect
              onChange={(change) => updateOperatorForConditions(change?.value)}
              options={groupOperators}
              darkMode={darkMode}
              value={groupOperators.find((op) => op.value === conditions.operator)}
            />
          )}
          {index === 0 && <div className="tj-small-btn px-2">Where</div>}
          {index > 1 && <div className="tj-small-btn px-2">{conditions?.operator}</div>}
        </Col>
        <Col sm="4" className="p-0 border-end">
          <DropDownSelect
            onChange={(newValue) =>
              updateFilterConditionEntry('Column', index, {
                table: newValue.table,
                columnName: newValue.value,
                isLeftSideCondition: true,
              })
            }
            value={{ label: leftField?.columnName, value: leftField?.columnName, table: leftField?.table }}
            options={tableList}
            darkMode={darkMode}
          />
        </Col>
        <Col sm="1" className="p-0 border-end">
          <DropDownSelect
            onChange={(change) => updateFilterConditionEntry('Operator', index, { operator: change?.value })}
            value={operatorConstants.find((op) => op.value === operator)}
            options={operatorConstants}
            darkMode={darkMode}
          />
        </Col>
        <Col sm="5" className="p-0 d-flex">
          <div className="flex-grow-1">
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
    <Container className="p-0">
      {Object.keys(conditions).length === 0 && (
        <Row className="mb-2">
          <div
            style={{
              height: '30px',
              border: '1px dashed var(--slate-08, #C1C8CD)',
            }}
            className="px-4 py-2 text-center rounded-1"
          >
            There are no conditions
          </div>
        </Row>
      )}
      {filterComponents}
      <Row className="mb-2">
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

// "order_by": [
//   {
//     "columnName": "total_spent",
//     "direction": "DESC"
//   },
//   {
//     "columnName": "name",
//     "table": "users",
//     "direction": "ASC"
//   }
// ]

// Component to Render Sort Section
const RenderSortSection = ({ darkMode }) => {
  const { tableInfo } = useContext(TooljetDatabaseContext);

  // Function name: joinTableOptionsChange

  const tableList = Object.entries(tableInfo).map(([key, value]) => {
    const tableDetails = {
      label: key,
      value: key,
      options: value.map((columns) => ({ label: columns.Header, value: columns.Header })),
    };
    return tableDetails;
  });

  const sortbyConstants = [
    { label: 'Ascending', value: 'ASC' },
    { label: 'Descending', value: 'DESC' },
  ];

  return (
    <Container className="p-0">
      <Row className="mb-2">
        <div
          style={{
            height: '30px',
            border: '1px dashed var(--slate-08, #C1C8CD)',
          }}
          className="px-4 py-2 text-center rounded-1"
        >
          There are no conditions
        </div>
      </Row>
      {/* Dynamically render below Row */}
      <Row className="border rounded mb-1">
        <Col sm="6" className="p-0 border-end">
          <DropDownSelect options={tableList} darkMode={darkMode} />
        </Col>
        <Col sm="5" className="p-0 border-end d-flex">
          <div className="flex-grow-1">
            <DropDownSelect options={sortbyConstants} darkMode={darkMode} />
          </div>
        </Col>
        <Col sm="1" className="p-0">
          {/* onClick={onRemove} */}
          <ButtonSolid size="sm" variant="ghostBlack" className="px-1 w-100 rounded-0">
            <Trash fill="var(--slate9)" style={{ height: '16px' }} />
          </ButtonSolid>
        </Col>
      </Row>
      <Row className="mb-2">
        <Col className="p-0">
          <ButtonSolid variant="ghostBlue" size="sm">
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp; Add more
          </ButtonSolid>
        </Col>
      </Row>
    </Container>
  );
};
