import React from 'react';
import Modal from 'react-bootstrap/Modal';

export const QueryConfirmPopup = ({ show, message, onConfirm, onCancel, darkMode, dialogKey }) => {
  return (
    <Modal
      show={show}
      animation={false}
      onHide={onCancel}
      centered
      backdrop
      dialogClassName="tw-max-w-[491px]"
      contentClassName={`tw-flex tw-flex-col tw-items-start tw-gap-10 tw-p-6 !tw-rounded-[8px] !tw-border-0 !tw-bg-[var(--cc-surface1-surface)] !tw-shadow-elevation-400 ${
        darkMode ? 'dark-theme' : ''
      }`}
      key={dialogKey}
    >
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-[2px] tw-w-full">
        <p
          className="tw-m-0 tw-w-full tw-text-lg tw-font-normal tw-text-[var(--cc-primary-text)] tw-break-words"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          data-cy="modal-message"
        >
          {message}
        </p>
      </div>
      <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-self-stretch">
        <button
          type="button"
          onClick={onCancel}
          data-cy="modal-cancel-button"
          className="tw-inline-flex tw-min-w-[80px] tw-items-center tw-justify-center tw-gap-1.5 tw-px-3 tw-py-2 tw-rounded-[6px] tw-border tw-border-solid tw-border-[var(--cc-default-border)] tw-bg-[var(--cc-surface1-surface)] tw-text-lg tw-font-medium tw-text-[var(--cc-primary-text)] tw-cursor-pointer tw-whitespace-nowrap tw-transition-colors hover:tw-bg-[var(--cc-surface2-surface)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          data-cy="modal-confirm-button"
          className="tw-inline-flex tw-min-w-[80px] tw-items-center tw-justify-center tw-gap-1.5 tw-px-3 tw-py-2 tw-rounded-[6px] tw-border tw-border-solid tw-border-transparent tw-bg-[var(--cc-primary-brand)] tw-text-lg tw-font-medium tw-text-white tw-cursor-pointer tw-whitespace-nowrap tw-transition-opacity hover:tw-opacity-90"
        >
          Yes
        </button>
      </div>
    </Modal>
  );
};
