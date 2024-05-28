import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import cx from 'classnames';
import useMountTransition from '@/_hooks/useMountTransition';
import { useEventListener } from '@/_hooks/use-event-listener';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import '@/_styles/drawer.scss';
import Toast from '@/_ui/Toast';

function createPortalRoot() {
  const drawerRoot = document.createElement('div');
  drawerRoot.setAttribute('id', 'tooljet-drawer-root');

  return drawerRoot;
}

const Drawer = ({
  isOpen,
  disableFocus = false,
  children,
  className,
  onClose,
  position = 'left',
  removeWhenClosed = true,
  drawerStyle,
  isForeignKeyRelation = false,
}) => {
  const bodyRef = useRef(document.querySelector('body'));
  const portalRootRef = useRef(document.getElementById('tooljet-drawer-root') || createPortalRoot());
  const isTransitioning = useMountTransition(isOpen, 300);

  // Append portal root on mount
  useEffect(() => {
    bodyRef.current.appendChild(portalRootRef.current);
  }, []);

  // Prevent page scrolling when the drawer is open
  useEffect(() => {
    const updatePageScroll = () => {
      if (isOpen) {
        bodyRef.current.style.overflow = 'hidden';
      } else {
        bodyRef.current.style.overflow = '';
      }
    };

    updatePageScroll();
  }, [isOpen]);

  if (!isTransitioning && removeWhenClosed && !isOpen) {
    return null;
  }

  const darkMode = localStorage.getItem('darkMode') === 'true';
  let toastOptions = {
    style: {
      wordBreak: 'break-all',
    },
  };

  if (darkMode) {
    toastOptions = {
      className: 'toast-dark-mode',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        wordBreak: 'break-all',
      },
    };
  }

  const isForeignKeyDrawer = isForeignKeyRelation ? 'foreignKeyDrawerRight' : '';
  const isForeignKeyBackdrop = isForeignKeyRelation ? 'foreignKeyBackdrop' : '';

  return createPortal(
    <ErrorBoundary showFallback={true}>
      <FocusTrap
        // The allowOutsideClick option is used to enable or disable clicks outside the popover for functions that are inside the popover but not within the focus trap. On the other hand, clickOutsideDeactivates is used to unfocus the last focused element which is outside the popover.
        focusTrapOptions={{ initialFocus: false, allowOutsideClick: true, clickOutsideDeactivates: true }}
        active={isOpen && !disableFocus}
      >
        <div
          aria-hidden={`${!isOpen}`}
          className={cx('drawer-container', {
            open: isOpen,
            in: isTransitioning,
            [className]: true,
            'theme-dark dark-theme': darkMode,
          })}
        >
          <Toast toastOptions={toastOptions} />
          <div className={cx('drawer', position, isForeignKeyDrawer)} role="dialog" style={drawerStyle}>
            {children}
          </div>
          <div className={cx('backdrop', isForeignKeyBackdrop)} onClick={onClose} />
        </div>
      </FocusTrap>
    </ErrorBoundary>,
    portalRootRef.current
  );
};

export default Drawer;
