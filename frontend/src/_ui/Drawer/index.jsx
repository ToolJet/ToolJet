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

  const onKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEventListener('keyup', onKeyPress);

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

  return createPortal(
    <ErrorBoundary showFallback={true}>
      <FocusTrap active={isOpen && !disableFocus}>
        <div
          aria-hidden={`${!isOpen}`}
          className={cx('drawer-container', {
            open: isOpen,
            in: isTransitioning,
            className,
            'theme-dark dark-theme': darkMode,
          })}
        >
          <Toast toastOptions={toastOptions} />
          <div className={cx('drawer', position)} role="dialog" style={drawerStyle}>
            {children}
          </div>
          <div className="backdrop" onClick={onClose} />
        </div>
      </FocusTrap>
    </ErrorBoundary>,
    portalRootRef.current
  );
};

export default Drawer;
