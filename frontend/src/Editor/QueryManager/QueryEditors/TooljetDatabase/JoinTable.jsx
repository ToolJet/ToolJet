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

// Pending :-
// - For StateManagement we can process with context
// - Try to make it as : Re-usable component
// - Dark Theme
// - Keydown Close the popup
// - Translation if needed
// - Different CSS Styles ( Active, Hover, Disabled )

// Pending :- Drop Down for Table
// - For Join Scenario : Only on Table B - Add table button must come
// -

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
      <div className="field-container d-flex mb-3">
        <label className="form-label">Filter</label>
        <div className="field flex-grow-1 mt-2">
          <Container className="p-0">
            <Row className="border rounded mb-1">
              <Col sm="2" className="p-0 border-end">
                <div className="tj-small-btn">Join</div>
              </Col>
              <Col sm="4" className="p-0 border-end">
                <DropDownSelect options={tableList} addBtnLabel={'Add new col'} onAdd={alert} darkMode={darkMode} />
              </Col>
              <Col sm="2" className="p-0 border-end">
                {/* <SelectBox /> */}
                <DropDownSelect options={tableList} addBtnLabel={'Add new col'} onAdd={alert} darkMode={darkMode} />
              </Col>
              <Col sm="4" className="p-0">
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
        </div>
      </div>
      {/* Sort Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">Filter</label>
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
      <div className="field-container d-flex">
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
