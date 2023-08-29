import React, { useContext, useEffect, useRef, useState } from 'react';
import Select, { components } from 'react-select';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import cx from 'classnames';
import { Badge, Col, Container, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import useShowPopover from '@/_hooks/useShowPopover';
import LeftOuterJoinIcon from '../../Icons/LeftOuterJoinIcon';
import RightOuterJoin from '../../Icons/RightOuterJoin';
import InnerJoinIcon from '../../Icons/InnerJoinIcon';
import FullOuterJoin from '../../Icons/FullOuterJoin';
import SelectBox from './SelectBox';
import CheveronDown from '@/_ui/Icon/bulkIcons/CheveronDown';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { isEmpty } from 'lodash';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import DropDownSelect from './DropDownSelect';

export const JoinTable = React.memo(({ darkMode }) => {
  return (
    <div>
      {/* <JoinOperationMenu /> */}
      <SelectTableMenu darkMode={darkMode} />
    </div>
  );
});

// Base Component for Join Drop Down ----------
const staticJoinOperationsList = [
  { label: 'Inner Join', value: 'inner-join' },
  { label: 'Left Join', value: 'left-join' },
  { label: 'Right Join', value: 'right-join' },
  { label: 'Full Outer Join', value: 'full-outer-join' },
];

const DBJoinIcons = ({ joinType }) => {
  switch (joinType) {
    case 'left-join':
      return <LeftOuterJoinIcon />;
    case 'inner-join':
      return <InnerJoinIcon />;
    case 'right-join':
      return <RightOuterJoin />;
    case 'full-outer-join':
      return <FullOuterJoin />;
    default:
      return '';
  }
};

const JoinOperationMenu = () => {
  const { Option, SingleValue } = components;

  const SingleValueComponent = (props) => (
    <SingleValue {...props}>
      <DBJoinIcons joinType={props.data.value} />
    </SingleValue>
  );

  const OptionWithIcons = (props) => (
    <Option {...props}>
      <DBJoinIcons joinType={props.data.value} /> <span className="ms-1 small">{props.data.label}</span>
    </Option>
  );

  return (
    <div>
      <Select
        classNames={{
          menu: () => 'tj-scrollbar',
        }}
        menuPlacement="bottom"
        placeholder="Search"
        defaultValue={staticJoinOperationsList[0]}
        options={staticJoinOperationsList}
        components={{
          SingleValue: SingleValueComponent,
          Option: OptionWithIcons,
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  );
};

// Base Component for Table Drop Down ---------------
const DropdownIndicator = (props) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <SolidIcon name="search" width="16px" />
      </components.DropdownIndicator>
    )
  );
};

const SelectTableMenu = ({ darkMode }) => {
  const { columns, listRowsOptions, limitOptionChanged, handleOptionsChange, selectedTable, tables } =
    useContext(TooljetDatabaseContext);
  const { MenuList, Option } = components;

  const IconOptions = (props) => (
    <Option {...props}>
      <DBJoinIcons joinType={props.data.value} /> <span className="ms-1 small">{props.data.label}</span>
    </Option>
  );

  const tableList = tables.map((t) => ({ label: t, value: t }));

  return (
    <div>
      {/* Join Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">From</label>
        <div className="field flex-grow-1 mt-1">
          <JoinConstraint darkMode={darkMode} />
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
        <div className="field flex-grow-1 mt-2">
          <Container className="p-0">
            <Row className="mb-2">
              <div
                style={{
                  border: '1px dashed var(--slate-08, #C1C8CD)',
                }}
                className="px-4 py-2 text-center rounded-1"
              >
                There are no conditions
              </div>
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
          <Container className="p-0">
            <Row className="border rounded">
              <Col sm="2" className="p-0 border-end text-center">
                Table A
              </Col>
              <Col sm="10" className="p-0 border-end">
                <DropDownSelect options={tableList} isMulti />
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  );
};

/**
 * {
      "joinType": "INNER",
      "table": "orders",
      "conditions": {
        "operator": "AND",
        "conditionsList": [
          {
            "operator": "=",
            "leftField": {
              "columnName": "id",
              "table": "users",
              "type": "Column"
            },
            "rightField": {
              "columnName": "user_id",
              "table": "orders",
              "type": "Column"
            }
          },
          {
            "operator": ">",
            "leftField": {
              "columnName": "order_date",
              "table": "orders",
              "type": "Column"
            },
            "rightField": {
              "value": "2022-01-01",
              "type": "Value"
            }
          }
        ]
      }
    }
 */
const JoinConstraint = ({ darkMode, index }) => {
  const { columns, selectedTable, tables, loadTableInformation, tableInfo } = useContext(TooljetDatabaseContext);
  const tableList = tables.map((t) => ({ label: t, value: t }));
  const [rightField, setRightField] = useState();
  const [leftField, setLeftField] = useState(selectedTable);

  return (
    <Container className="p-0">
      <Row>
        <Col sm="6" className="text-center">
          Selected Table
        </Col>
        <Col sm="6" className="text-center">
          Joining Table
        </Col>
      </Row>
      <Row className="border rounded mb-2">
        <Col sm="2" className="p-0 border-end">
          <div className="tj-small-btn">Join</div>
        </Col>
        <Col sm="4" className="p-0 border-end">
          {/* <DropDownSelect options={tableList} darkMode={darkMode} /> */}
          {index ? (
            <DropDownSelect options={tableList} darkMode={darkMode} />
          ) : (
            <div className="tj-small-btn">{selectedTable}</div>
          )}
          {/* <SelectBox /> */}
        </Col>
        <Col sm="2" className="p-0 border-end">
          {/* <SelectBox /> */}
          <DropDownSelect options={staticJoinOperationsList} darkMode={darkMode} />
        </Col>
        <Col sm="4" className="p-0">
          <DropDownSelect
            options={tableList}
            darkMode={darkMode}
            onChange={(value) => {
              value?.value && loadTableInformation(value?.value);
              setRightField(value?.value);
            }}
          />
          {/* <DropDownSelect options={tableList} isMulti darkMode={darkMode} /> */}
        </Col>
      </Row>
      <Row className="border rounded mb-2">
        <Col sm="2" className="p-0 border-end">
          <div className="tj-small-btn">On</div>
        </Col>
        <Col sm="4" className="p-0 border-end">
          <DropDownSelect
            options={
              (index
                ? tableInfo[leftField]?.map((col) => ({ label: col.Header, value: col.Header }))
                : columns.map((col) => ({ label: col.Header, value: col.Header }))) || []
            }
            darkMode={darkMode}
          />
          {/* <SelectBox /> */}
        </Col>
        <Col sm="2" className="p-0 border-end">
          {/* <SelectBox /> */}
          <DropDownSelect options={[{ label: '=', value: '=' }]} darkMode={darkMode} />
        </Col>
        <Col sm="4" className="p-0">
          <DropDownSelect
            options={tableInfo[rightField]?.map((col) => ({ label: col.Header, value: col.Header })) || []}
            darkMode={darkMode}
          />
          {/* <DropDownSelect options={tableList} isMulti darkMode={darkMode} /> */}
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
      <Row>
        <ButtonSolid variant="secondary" size="sm">
          <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
          &nbsp;&nbsp; Add another table
        </ButtonSolid>
      </Row>
    </Container>
  );
};

// Component to Render Filter Section
const RenderFilterSection = ({ darkMode }) => {
  const { tables, tableInfo, joinTableOptions, joinTableOptionsChange } = useContext(TooljetDatabaseContext);

  // Add New Filter Condition
  // Update Filter condition
  // Delete Filter Condition
  // Handle Column Change
  // Handle Operator Change
  // Handle Value Change
  // Component must change based on First and Rest options
  // When operator is selected we cannot change
  // Re-populate the Saved Query *
  // Multiple Condition
  // Existing Options Filter
  // OnChange functionality
  // Have constants in a separate file
  // Multiple Condition
  // Delete Icon

  // function addNewFilterConditionPair() {
  //   const
  // }

  const tableList = Object.entries(tableInfo).map(([key, value]) => {
    const tableDetails = {
      label: key,
      value: key,
      options: value.map((columns) => ({ label: columns.Header, value: columns.Header })),
    };
    return tableDetails;
  });

  return (
    <Container className="p-0">
      {/* Dynamically render below Row */}
      <Row className="border rounded mb-1">
        <Col sm="2" className="p-0 border-end">
          <div className="tj-small-btn">Where</div>
        </Col>
        <Col sm="4" className="p-0 border-end">
          <DropDownSelect options={tableList} darkMode={darkMode} />
        </Col>
        <Col sm="1" className="p-0 border-end">
          <DropDownSelect options={[{ label: '=', value: '=' }]} darkMode={darkMode} />
        </Col>
        <Col sm="4" className="p-0">
          {/* <CodeHinter
            // initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'32px'}
            placeholder="Value"
            // onChange={(newValue) => handleValueChange(newValue)}
          /> */}
        </Col>
        <Col sm="1" className="p-0">
          {/* <DropDownSelect options={tableList} isMulti darkMode={darkMode} /> */}
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

// Component to Render Sort Section
const RenderSortSection = () => {};

// Component to Render Select Section
const RenderSelectSection = () => {};

// const tableList = [
//   {
//     label: 'Table A',
//     value: 'Table A',
//     id: '123',
//   },
//   {
//     label: 'Table B',
//     value: 'Table B',
//     id: '2',
//   },
//   {
//     label: 'Table C',
//     value: 'Table C',
//     id: '3',
//   },
//   {
//     label: 'Table D',
//     value: 'Table D',
//     id: '4',
//   },
//   {
//     label: 'Table E',
//     value: 'Table E',
//     id: '5',
//   },
//   {
//     label: 'Table F',
//     value: 'Table F',
//     icon: 'search',
//     options: [
//       {
//         label: 'Test 1',
//         value: 2,
//       },
//     ],
//     id: '6',
//   },
// ];
