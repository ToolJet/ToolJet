import React from 'react';
import ConfigHandleButton from '@/_components/ConfigHandleButton';
import useStore from '@/AppBuilder/_stores/store';
import { PencilRuler } from 'lucide-react';

const PageMenuConfigHandle = ({ position, isSidebarPinned, isMobile = false }) => {
  return (
    <div
      className="navigation-tooltip"
      style={{
        position: 'absolute',
        top: position === 'top' ? 'calc(100% + 0px)' : '7px',
        left: position === 'top' ? '0px' : isSidebarPinned ? '6px' : '43px',
        zIndex: isMobile ? 49 : 1000,
        pointerEvents: 'auto', // Enable pointer events so tooltip can be hovered
        display: 'none',
        gap: '2px',
      }}
    >
      <ConfigHandleButton
        className="no-hover"
        customStyles={{
          alignItems: 'center',
          gap: '6px',
          padding: '2px 6px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ cursor: 'default' }}>Page and nav</span>
      </ConfigHandleButton>
      <ConfigHandleButton
        customStyles={{
          background: 'var(--background-surface-layer-01)',
          border: '1px solid var(--border-weak)',
        }}
      >
        <PencilRuler
          size={12}
          color="var(--icon-strong)"
          onClick={() => {
            useStore.getState().setSelectedSidebarItem('pages');
            useStore.getState().toggleLeftSidebar(true);
          }}
        />
      </ConfigHandleButton>
    </div>
  );
};

export default PageMenuConfigHandle;
