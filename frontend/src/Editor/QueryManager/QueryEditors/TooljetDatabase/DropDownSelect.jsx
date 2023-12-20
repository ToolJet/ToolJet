import React, { useEffect, useRef, useState } from 'react';
import SelectBox from './SelectBox';
import cx from 'classnames';
import useShowPopover from '@/_hooks/useShowPopover';
import { Badge, OverlayTrigger, Popover } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import CheveronDown from '@/_ui/Icon/bulkIcons/CheveronDown';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';

const DropDownSelect = ({
  darkMode,
  disabled,
  options,
  isMulti,
  addBtnLabel,
  onAdd,
  onChange,
  value,
  renderSelected,
  emptyError,
  shouldCenterAlignText = false,
  showPlaceHolder = false,
  highlightSelected = true,
  buttonClasses = '',
}) => {
  const popoverId = useRef(`dd-select-${uuidv4()}`);
  const popoverBtnId = useRef(`dd-select-btn-${uuidv4()}`);
  const [showMenu, setShowMenu] = useShowPopover(false, `#${popoverId.current}`, `#${popoverBtnId.current}`);
  const [selected, setSelected] = useState(value);
  const selectRef = useRef();
  const [isOverflown, setIsOverflown] = useState(false);

  useEffect(() => {
    if (showMenu) {
      // selectRef.current.focus();
    }
  }, [showMenu]);

  useEffect(() => {
    if (Array.isArray(value) || selected?.value !== value?.value || selected?.label !== value?.label) {
      setSelected(value);
    }
  }, [value]);

  useEffect(() => {
    // onChange && onChange(selected);
    const badges = document.querySelectorAll('.dd-select-value-badge');
    if (isEmpty(badges)) {
      return () => {};
    }
    let isNewOverFlown = false;
    for (let i = 0; i < badges.length; i++) {
      const el = badges[i];
      isNewOverFlown = el.clientWidth - el.scrollWidth < 0;
      if (isOverflown) {
        break;
      }
    }
    if (isNewOverFlown !== isOverflown) {
      setIsOverflown(isNewOverFlown);
    }
  }, [selected]);

  function checkElementPosition() {
    const selectControl = document.getElementById(popoverBtnId.current);
    if (!selectControl) {
      return 'top-start';
    }

    const elementRect = selectControl.getBoundingClientRect();

    // Check proximity to top
    const halfScreenHeight = window.innerHeight / 2;

    if (elementRect.top <= halfScreenHeight) {
      return 'bottom-start';
    }

    return 'top-start';
  }

  function isValidInput(input) {
    if (!input) return false;
    if (Array.isArray(input)) {
      return input.length ? true : false;
    }
    if (typeof input === 'object' && !Array.isArray(input)) {
      if (!Object.keys(input).length) return false;
      if (!input.value) return false;
      return true;
    }
    return true;
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
          style={{
            width: '244px',
            maxWidth: '246px',
            overflow: 'hidden',
            boxShadow: '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.10)',
          }}
        >
          <SelectBox
            options={options}
            isMulti={isMulti}
            onSelect={(values) => {
              setIsOverflown(false);
              onChange && onChange(values);
              setSelected(values);
            }}
            selected={selected}
            closePopup={() => setShowMenu(false)}
            onAdd={onAdd}
            addBtnLabel={addBtnLabel}
            emptyError={emptyError}
            highlightSelected={highlightSelected}
          />
        </Popover>
      }
    >
      <div className={`col-auto ${buttonClasses}`} id={popoverBtnId.current}>
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
          className={cx(
            {
              'justify-content-start': !shouldCenterAlignText,
              'justify-content-centre': shouldCenterAlignText,
            },
            'tdb-dropdown-btn',
            'gap-0',
            'w-100',
            'border-0',
            'rounded-0',
            'position-relative',
            'font-weight-normal',
            'px-1'
          )}
          data-cy={`show-ds-popover-button`}
        >
          <div className={`text-truncate`}>
            {renderSelected && renderSelected(selected)}

            {!renderSelected && isValidInput(selected) ? (
              Array.isArray(selected) ? (
                !isOverflown && (
                  <MultiSelectValueBadge
                    options={options}
                    selected={selected}
                    setSelected={setSelected}
                    onChange={onChange}
                  />
                )
              ) : (
                selected?.label
              )
            ) : showPlaceHolder ? (
              <span style={{ color: '#9e9e9e' }}>Select..</span>
            ) : (
              ''
            )}
            {!renderSelected && isOverflown && !Array.isArray(selected) && (
              <Badge className="me-1 dd-select-value-badge" bg="secondary">
                {selected?.length} selected
                <span
                  role="button"
                  onClick={(e) => {
                    setSelected([]);
                    onChange && onChange([]);
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Remove fill="var(--slate12)" width="12px" />
                </span>
              </Badge>
            )}
          </div>
          <div className="dd-select-control-chevron">
            <CheveronDown width="15" height="15" />
          </div>
        </ButtonSolid>
      </div>
    </OverlayTrigger>
  );
};

function MultiSelectValueBadge({ options, selected, setSelected, onChange }) {
  if (options?.length === selected?.length && selected?.length !== 0) {
    // Filter Options without 'Select All'
    const optionsWithoutSelectAll = options.filter((option) => option.value !== 'SELECT ALL');
    return (
      <Badge className={`me-1 dd-select-value-badge`} bg="secondary">
        All {optionsWithoutSelectAll?.length} selected
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelected([]);
            onChange([]);
            e.preventDefault();
          }}
        >
          <Remove fill="var(--slate12)" />
        </span>
      </Badge>
    );
  }

  return selected.map((option) => (
    <Badge key={option.value} className="me-1 dd-select-value-badge" bg="secondary">
      {option.label}
      <span
        role="button"
        onClick={(e) => {
          setSelected((selected) => {
            onChange && onChange(selected.filter((opt) => opt.value !== option.value));
            return selected.filter((opt) => opt.value !== option.value);
          });
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Remove fill="var(--slate12)" />
      </span>
    </Badge>
  ));
}

export default DropDownSelect;
