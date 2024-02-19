import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup, OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import PlusRectangle from '@/_ui/Icon/solidIcons/PlusRectangle';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import ParameterForm from './ParameterForm';

const ParameterDetails = ({ darkMode, onSubmit, isEdit, name, defaultValue, onRemove, currentState, otherParams }) => {
  const [showModal, setShowModal] = useState(false);
  const closeMenu = () => setShowModal(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickedOnAddButton = !!event.target.closest('#runjs-param-add-btn');
      if (isClickedOnAddButton && !isEdit) {
        //if the user is in edit mode add button should close other popups open.
        //modal closing on this even will be taken care by onClick attached to trigger button
        return;
      }
      if (
        showModal &&
        event.target.closest('#parameter-form-popover') === null &&
        event.target.closest('#cm-complete-0') === null
      ) {
        closeMenu();
      }
    };

    if (showModal) {
      document.addEventListener('mouseup', handleClickOutside);
    } else {
      document.removeEventListener('mouseup', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleSubmit = (param) => {
    if (param.name) {
      onSubmit && onSubmit(param);
      setShowModal(false);
    }
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={true}
      container={document.getElementsByClassName('query-details ')[0]}
      show={showModal}
      overlay={
        <Popover
          id="parameter-form-popover"
          className={`query-manager-sort-filter-popup p-0 ${darkMode && 'popover-dark-themed dark-theme theme-dark'}`}
          style={{ width: '268px' }}
        >
          <ParameterForm
            darkMode={darkMode}
            isEdit={isEdit}
            otherParams={otherParams}
            name={name}
            defaultValue={defaultValue}
            onSubmit={handleSubmit}
            showModal={showModal}
            currentState={currentState}
          />
        </Popover>
      }
    >
      <span className="parameterItem">
        {isEdit ? (
          <PillButton
            className="parameterItemPillButton"
            name={name}
            onClick={() => setShowModal(true)}
            onRemove={onRemove}
          />
        ) : (
          <button
            onClick={() => setShowModal((show) => !show)}
            className="ms-2"
            id="runjs-param-add-btn"
            data-cy={`runjs-add-param-button`}
            style={{ background: 'none' }}
          >
            <span className="m-0">
              <PlusRectangle fill={darkMode ? '#9BA1A6' : '#687076'} width={15} />
            </span>
          </button>
        )}
      </span>
    </OverlayTrigger>
  );
};

export const PillButton = ({ name, onClick, onRemove, marginBottom, className, size }) => (
  <ButtonGroup
    aria-label="Parameter"
    className={cx({ 'mb-2': marginBottom, ...(className && { [className]: true }) })}
    style={{ borderRadius: '6px', marginLeft: '6px', height: '24px', background: '#A1A7AE1F' }}
  >
    <Button
      size="sm"
      className={cx('bg-transparent color-slate12 runjs-parameter-badge', { 'py-0 px-2': size === 'sm' })}
      onClick={onClick}
      style={{
        borderTopLeftRadius: '6px',
        borderBottomLeftRadius: '6px',
        textTransform: 'none',
        fontWeight: 500,
        ...(!onRemove && { borderRadius: '6px' }),
      }}
    >
      <span data-cy={`query-param-${String(name).toLowerCase()}`} className="text-truncate query-param-text">
        {name}
      </span>
    </Button>
    {onRemove && (
      <Button
        data-cy={`query-param-${String(name).toLowerCase()}-remove-button`}
        onClick={onRemove}
        size="sm"
        className={cx('bg-transparent color-slate12', { 'p-0': size === 'sm' })}
        style={{
          borderTopRightRadius: '6px',
          borderBottomRightRadius: '6px',
          paddingRight: '6px',
          paddingLeft: '0px',
          height: '24px',
        }}
      >
        <Remove fill="#6A727CCC" height={20} width={20} />
      </Button>
    )}
  </ButtonGroup>
);

export default ParameterDetails;
