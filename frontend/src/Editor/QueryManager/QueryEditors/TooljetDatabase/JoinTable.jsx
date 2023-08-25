import React, { useEffect, useRef, useState } from 'react';
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
  const { MenuList, Option } = components;

  const IconOptions = (props) => (
    <Option {...props}>
      <DBJoinIcons joinType={props.data.value} /> <span className="ms-1 small">{props.data.label}</span>
    </Option>
  );

  const tableList = [
    {
      label: 'Table A',
      value: 'Table A',
      id: '123',
    },
    {
      label: 'Table B',
      value: 'Table B',
      id: '2',
    },
    {
      label: 'Table C',
      value: 'Table C',
      id: '3',
    },
    {
      label: 'Table D',
      value: 'Table D',
      id: '4',
    },
    {
      label: 'Table E',
      value: 'Table E',
      id: '5',
    },
    {
      label: 'Table F',
      value: 'Table F',
      icon: 'search',
      options: [
        {
          label: 'Test 1',
          value: 2,
        },
      ],
      id: '6',
    },
  ];

  return (
    <div>
      {/* Join Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">From</label>
        <div className="field flex-grow-1 mt-1">
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
                {/* <SelectBox /> */}
              </Col>
              <Col sm="4" className="p-0 border-end">
                {/* <SelectBox /> */}
              </Col>
              <Col sm="2" className="p-0 border-end">
                {/* <SelectBox /> */}
                <DropDownSelect options={tableList} />
              </Col>
              <Col sm="4" className="p-0">
                <DropDownSelect options={tableList} isMulti />
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
        </div>
      </div>
      {/* Filter Section */}
      <div className="field-container d-flex mb-3">
        <label className="form-label">Filter</label>
        <div className="field flex-grow-1 mt-2">
          <Container className="p-0">
            <Row className="border rounded mb-1">
              <Col sm="2" className="p-0 border-end">
                {/* <SelectBox /> */}
              </Col>
              <Col sm="4" className="p-0 border-end">
                {/* <SelectBox /> */}
              </Col>
              <Col sm="2" className="p-0 border-end">
                {/* <SelectBox /> */}
                <DropDownSelect options={tableList} addBtnLabel={'Add new col'} onAdd={alert} />
              </Col>
              <Col sm="4" className="p-0">
                <DropDownSelect options={tableList} isMulti />
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

const DropDownSelect = ({ darkMode, disabled, options, isMulti, addBtnLabel, onAdd }) => {
  const popoverId = useRef(`dd-select-${generateRandomId(10)}`);
  const popoverBtnId = useRef(`dd-select-btn-${generateRandomId(10)}`);
  const [showMenu, setShowMenu] = useShowPopover(false, `#${popoverId.current}`, `#${popoverBtnId.current}`);
  const [selected, setSelected] = useState();
  const selectRef = useRef();

  useEffect(() => {
    if (showMenu) {
      // selectRef.current.focus();
    }
  }, [showMenu]);

  function checkElementPosition() {
    const selectControl = document.getElementById(popoverBtnId.current);
    if (!selectControl) {
      return 'top-start';
    }

    const elementRect = selectControl.getBoundingClientRect();
    console.log(elementRect);

    // Check proximity to top
    const halfScreenHeight = window.innerHeight / 2;

    if (elementRect.top <= halfScreenHeight) {
      return 'bottom-start';
    }

    return 'top-start';
  }

  return (
    <OverlayTrigger
      show={showMenu && !disabled}
      placement={checkElementPosition()}
      // placement="auto"
      // arrowOffsetTop={90}
      // arrowOffsetLeft={90}
      overlay={
        <Popover
          key={'page.i'}
          id={popoverId.current}
          className={`${darkMode && 'popover-dark-themed dark-theme tj-dark-mode'}`}
          style={{ width: '244px', maxWidth: '246px' }}
        >
          <SelectBox
            options={options}
            isMulti={isMulti}
            onSelect={setSelected}
            selected={selected}
            closePopup={() => setShowMenu(false)}
            onAdd={onAdd}
            addBtnLabel={addBtnLabel}
          />
        </Popover>
      }
    >
      <span className="col-auto" id={popoverBtnId.current}>
        <ButtonSolid
          size="sm"
          variant="tertiary"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) {
              return;
            }
            setShowMenu((show) => !show);
          }}
          className="px-1 pe-3 ps-2 gap-0 w-100 border-0 justify-content-start rounded-0 position-relative"
          data-cy={`show-ds-popover-button`}
        >
          {selected
            ? Array.isArray(selected)
              ? selected.map((option) => (
                  <Badge key={option.value} className="me-1" bg="secondary">
                    {option.label}
                  </Badge>
                ))
              : selected?.label
            : ''}
          <span className="dd-select-control-chevron">
            <CheveronDown />
          </span>
        </ButtonSolid>
      </span>
    </OverlayTrigger>
  );
};

function generateRandomId(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomId = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomId += characters.charAt(randomIndex);
  }

  return randomId;
}
