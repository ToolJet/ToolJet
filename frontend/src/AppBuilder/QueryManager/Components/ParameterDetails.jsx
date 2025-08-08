import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup, OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import PlusRectangle from '@/_ui/Icon/solidIcons/PlusRectangle';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import ParameterForm from './ParameterForm';
import usePopoverObserver from '@/AppBuilder/_hooks/usePopoverObserver';

const ParameterDetails = ({ darkMode, onSubmit, isEdit, name, defaultValue, onRemove, otherParams }) => {
  const [showModal, setShowModal] = useState(false);
  const closeMenu = () => setShowModal(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickedOnAddButton = !!event.target.closest('#runjs-param-add-btn');
      const parameterItemPillButton = event.target.closest('.parameterItemPillButton');
      const isClickedOnPillButton = !!(parameterItemPillButton?.id === `query-param-${String(name).toLowerCase()}`);
      if (isClickedOnAddButton && !isEdit) {
        return;
      }
      if (isClickedOnPillButton) {
        return;
      }
      if (
        showModal &&
        event.target.closest('#parameter-form-popover') === null &&
        event.target.closest('.cm-completionListIncompleteBottom') === null
      ) {
        closeMenu();
      }
    };

    if (showModal) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]); // Include isEdit in the dependency array

  const handleSubmit = (param) => {
    if (param.name) {
      onSubmit && onSubmit(param);
      setShowModal(false);
    }
  };

  usePopoverObserver(
    document.getElementsByClassName('query-details')[0],
    isEdit
      ? document.getElementById(`query-param-${String(name).toLowerCase()}`)
      : document.getElementById('runjs-param-add-btn'),
    document.getElementById('parameter-form-popover'),
    showModal,
    () => setShowModal(true),
    closeMenu
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-end"
      rootClose={true}
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
          />
        </Popover>
      }
    >
      <span className="parameterItem">
        {isEdit ? (
          <PillButton
            className="parameterItemPillButton"
            id={`query-param-${String(name).toLowerCase()}`}
            name={name}
            onClick={() => setShowModal(true)}
            onRemove={onRemove}
          />
        ) : (
          <button
            onClick={() => setShowModal((show) => !show)}
            className="add-params-btn"
            id="runjs-param-add-btn"
            data-cy={`runjs-add-param-button`}
            style={{ background: 'none', border: 'none' }}
          >
            <p className="m-0 text-default">
              <PlusRectangle fill={'var(--icons-default)'} width={15} />
              <span style={{ marginLeft: '6px' }}>Add</span>
            </p>
          </button>
        )}
      </span>
    </OverlayTrigger>
  );
};

export const PillButton = ({ name, onClick, onRemove, marginBottom, className, size, id }) => (
  <ButtonGroup
    aria-label="Parameter"
    className={cx({ 'mb-2': marginBottom, ...(className && { [className]: true }) })}
    {...(id && { id })}
    style={{ borderRadius: '6px', marginRight: '6px', height: '28px', background: 'var(--interactive-default)' }}
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
          height: '28px',
        }}
      >
        <Remove fill="#6A727CCC" height={20} width={20} />
      </Button>
    )}
  </ButtonGroup>
);

export default ParameterDetails;
