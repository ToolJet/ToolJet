import React, { useEffect, useRef } from 'react';
import Select, { components } from 'react-select';
import cx from 'classnames';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useShowPopover from '@/_hooks/useShowPopover';
import LeftOuterJoinIcon from '../../Icons/LeftOuterJoinIcon';
import RightOuterJoin from '../../Icons/RightOuterJoin';
import InnerJoinIcon from '../../Icons/InnerJoinIcon';
import FullOuterJoin from '../../Icons/FullOuterJoin';

// Common :-
// - Try to make it as : Re-usable component
// - Style the Component
// - Dark Theme
// - Keydown Close the popup
// - Translation if needed

// Pending :- Join Drop Down
// - Reduce the Width
// - Different CSS Styles ( Active, Hover, Disabled )
// - Same must be used for ( Join, Operator Symbol, Multiple condition operation )
// - Selected Option Tick icon + Bg Color change
// - Now it is Un-controlled component, Make it to controlled component
// - Make the Icon component Dynamic - So that for Dark theme it might be useful

// Pending :- Drop Down for Table
// - For Join Scenario : Only on Table B - Add table button must come
// -

// Pending :- Drop Down for Table with CheckBox & Info

// Pending :- Drop Down for Table - with Multiple Column

// Customization
// 1. To customize [ Select Drop Down Menu ] - with Search, or Buttons use `Menu List Component` from React Select

export const JoinTable = React.memo(() => {
  return (
    <div>
      <JoinOperationMenu />
      <SelectTableMenu />
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

const SelectTableMenu = () => {
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
      id: '6',
    },
  ];

  return (
    <div>
      <Select
        classNames={{
          menu: () => 'tj-scrollbar',
        }}
        menuPlacement="bottom"
        isSearchable={false}
        options={tableList}
        components={{
          IndicatorSeparator: () => null,
          MenuList: MenuListComponent,
        }}
      />
    </div>
  );
};

const MenuListComponent = ({ children, getStyles, innerRef, ...props }) => {
  const menuListStyles = getStyles('menuList', props);

  return (
    <>
      <div className={`search-box-wrapper`}>
        <div className="input-icon">
          <span className="input-icon-addon">
            <SolidIcon name="search" width="16" />
          </span>

          <input
            style={{ width: '164px' }}
            type="text"
            className={cx('form-control', {
              'dark-theme-placeholder': false,
              // [className]: !!className,
            })}
            // placeholder={placeholder}
            // onFocus={() => setFocussed(true)}
            // onBlur={() => setFocussed(false)}
            // data-cy={`${dataCy}-search-bar`}
            // autoFocus={autoFocus}
            // ref={ref}
          />

          <span className="input-icon-addon end">
            <div className="d-flex tj-common-search-input-clear-icon" title="clear">
              <SolidIcon name="remove" />
            </div>
          </span>
        </div>
      </div>
      <div style={menuListStyles} ref={innerRef}>
        {children}
      </div>
      <div>
        <ButtonSolid variant="ghostBlue" size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M9 3C9.41421 3 9.75 3.33579 9.75 3.75V8.25H14.25C14.6642 8.25 15 8.58579 15 9C15 9.41421 14.6642 9.75 14.25 9.75H9.75V14.25C9.75 14.6642 9.41421 15 9 15C8.58579 15 8.25 14.6642 8.25 14.25V9.75H3.75C3.33579 9.75 3 9.41421 3 9C3 8.58579 3.33579 8.25 3.75 8.25H8.25V3.75C8.25 3.33579 8.58579 3 9 3Z"
              fill="#3E63DD"
            />
          </svg>
          &nbsp;Add Condition
        </ButtonSolid>
      </div>
    </>
  );
};
