import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { ConfigHandle } from '../ConfigHandle';
var tinycolor = require('tinycolor2');

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const Modal = function Modal({
  id,
  component,
  containerProps,
  darkMode,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  registerAction,
  fireEvent,
  dataCy,
  height,
}) {
  const [showModal, setShowModal] = useState(false);

  const {
    closeOnClickingOutside = false,
    hideOnEsc,
    hideCloseButton,
    hideTitleBar,
    loadingState,
    useDefaultButton,
    triggerButtonLabel,
    modalHeight,
  } = properties;
  const {
    headerBackgroundColor,
    headerTextColor,
    bodyBackgroundColor,
    disabledState,
    visibility,
    triggerButtonBackgroundColor,
    triggerButtonTextColor,
    boxShadow,
  } = styles;
  const parentRef = useRef(null);

  const title = properties.title ?? '';
  const size = properties.size ?? 'lg';

  registerAction(
    'open',
    async function () {
      setExposedVariable('show', true);
      setShowModal(true);
    },
    [setShowModal]
  );
  registerAction(
    'close',
    async function () {
      setShowModal(false);
      setExposedVariable('show', false);
    },
    [setShowModal]
  );

  useEffect(() => {
    const canShowModal = exposedVariables.show ?? false;
    setShowModal(exposedVariables.show ?? false);
    fireEvent(canShowModal ? 'onOpen' : 'onClose');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposedVariables.show]);

  useEffect(() => {
    const handleModalOpen = () => {
      const canvasElement = document.getElementsByClassName('canvas-area')[0];
      const modalBackdropEl = document.getElementsByClassName('modal-backdrop')[0];
      const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
      const modalCanvasEl = document.getElementById(`canvas-${id}`);

      if (canvasElement && modalBackdropEl && modalCanvasEl && realCanvasEl) {
        canvasElement.style.height = '100vh';
        canvasElement.style.maxHeight = '100vh';
        canvasElement.style.minHeight = '100vh';
        canvasElement.style.height = '100vh';
        modalCanvasEl.style.height = modalHeight;

        realCanvasEl.style.height = '100vh';
        realCanvasEl.style.position = 'absolute';

        canvasElement?.classList?.add('freeze-scroll');
        modalBackdropEl.style.height = '100vh';
        modalBackdropEl.style.minHeight = '100vh';
        modalBackdropEl.style.minHeight = '100vh';
      }
    };

    const handleModalClose = () => {
      const canvasElement = document.getElementsByClassName('canvas-area')[0];
      const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
      const canvasHeight = realCanvasEl?.getAttribute('canvas-height');

      if (canvasElement && realCanvasEl && canvasHeight) {
        canvasElement.style.height = '';
        canvasElement.style.minHeight = '';
        canvasElement.style.maxHeight = '';

        realCanvasEl.style.height = canvasHeight;
        realCanvasEl.style.position = '';

        canvasElement?.classList?.remove('freeze-scroll');
      }
    };
    if (showModal) {
      handleModalOpen();
    } else {
      if (document.getElementsByClassName('modal-content')[0] == undefined) {
        handleModalClose();
      }
    }

    // Cleanup the effect
    return () => {
      if (document.getElementsByClassName('modal-content')[0] == undefined) {
        handleModalClose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, modalHeight]);

  function hideModal() {
    setShowModal(false);
    setExposedVariable('show', false).then(() => fireEvent('onClose'));
  }
  const backwardCompatibilityCheck = height == '34' || modalHeight != undefined ? true : false;

  const customStyles = {
    modalBody: {
      height: backwardCompatibilityCheck ? modalHeight : height,
      backgroundColor:
        ['#fff', '#ffffffff'].includes(bodyBackgroundColor) && darkMode ? '#1F2837' : bodyBackgroundColor,
      overflowX: 'hidden',
      overflowY: 'auto',
    },
    modalHeader: {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
      color: ['#000', '#000000', '#000000ff'].includes(headerTextColor) && darkMode ? '#fff' : headerTextColor,
    },
    buttonStyles: {
      backgroundColor: triggerButtonBackgroundColor,
      color: triggerButtonTextColor,
      width: '100%',
      display: visibility ? '' : 'none',
      '--tblr-btn-color-darker': tinycolor(triggerButtonBackgroundColor).darken(8).toString(),
      boxShadow,
    },
  };

  useEffect(() => {
    if (closeOnClickingOutside) {
      const handleClickOutside = (event) => {
        const modalRef = parentRef.current.parentElement.parentElement.parentElement;

        if (modalRef && modalRef === event.target) {
          hideModal();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeOnClickingOutside, parentRef]);
  const { t } = useTranslation();

  return (
    <>
      {useDefaultButton && (
        <Button
          variant="contained"
          disabled={disabledState}
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setShowModal(true);
            setExposedVariable('show', true);
          }}
          sx={{
            backgroundColor: triggerButtonBackgroundColor,
            color: triggerButtonTextColor,
            width: '100%',
            display: visibility ? '' : 'none',
            '--tblr-btn-color-darker': tinycolor(triggerButtonBackgroundColor).darken(8).toString(),
            boxShadow,
          }}
        >
          {triggerButtonLabel !== '' ? triggerButtonLabel : t('widget.Modal.showModal', 'Show Modal')}
        </Button>
      )}

      <Dialog
        open={showModal}
        fullWidth
        maxWidth={size}
        disableEnforceFocus
        disableEscapeKeyDown={!hideOnEsc}
        onClose={(e, reason) => {
          if (reason === 'backdropClick') {
            if (closeOnClickingOutside) {
              e.preventDefault();
              e.stopPropagation();
              hideModal();
            }
          } else {
            e.preventDefault();
            e.stopPropagation();
            hideModal();
          }
        }}
        container={document.getElementsByClassName('canvas-area')[0]}
      >
        {!hideTitleBar && (
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor:
                ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color:
                  ['#000', '#000000', '#000000ff'].includes(headerTextColor) && darkMode ? '#fff' : headerTextColor,
              }}
            >
              {title}
            </Typography>
            {!hideCloseButton && (
              <IconButton
                color="primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  hideModal();
                }}
              >
                <IconX />
              </IconButton>
            )}
          </DialogTitle>
        )}
        <Divider color="secondary" />
        <DialogContent
          sx={{
            height: backwardCompatibilityCheck ? modalHeight : height,
            backgroundColor:
              ['#fff', '#ffffffff'].includes(bodyBackgroundColor) && darkMode ? '#1F2837' : bodyBackgroundColor,
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
        >
          <Box>
            {loadingState && (
              <Box
                width="100%"
                height="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <CircularProgress size={50} />
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Component = ({ children, ...restProps }) => {
  const {
    customStyles,
    parentRef,
    id,
    title,
    hideTitleBar,
    hideCloseButton,
    hideModal,
    component,
    showConfigHandler,
    removeComponent,
    setSelected,
  } = restProps['modalProps'];

  return (
    <BootstrapModal {...restProps}>
      {showConfigHandler && (
        <ConfigHandle
          id={id}
          component={component}
          removeComponent={removeComponent}
          setSelectedComponent={setSelected} //! Only Modal uses setSelectedComponent instead of selecto lib
          customClassName={hideTitleBar ? 'modalWidget-config-handle' : ''}
        />
      )}
      {!hideTitleBar && (
        <BootstrapModal.Header
          style={{ ...customStyles.modalHeader }}
          data-cy={`modal-header`}
        >
          <BootstrapModal.Title
            id="contained-modal-title-vcenter"
            data-cy={`modal-title`}
          >
            {title}
          </BootstrapModal.Title>
          {!hideCloseButton && (
            <span
              className="cursor-pointer"
              data-cy={`modal-close-button`}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                hideModal();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-x"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  stroke="none"
                  d="M0 0h24v24H0z"
                  fill="none"
                ></path>
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                ></line>
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                ></line>
              </svg>
            </span>
          )}
        </BootstrapModal.Header>
      )}
      <BootstrapModal.Body
        style={{ ...customStyles.modalBody }}
        ref={parentRef}
        id={id}
        data-cy={`modal-body`}
      >
        {children}
      </BootstrapModal.Body>
    </BootstrapModal>
  );
};

Modal.Component = Component;
