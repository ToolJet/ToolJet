import React from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import _ from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useTranslation } from 'react-i18next';

export const SidebarDebuggerHeader = ({ darkMode, clearErrorLogs, setPinned, pinned }) => {
  const { t } = useTranslation();
  return (
    <HeaderSection darkMode={darkMode}>
      <HeaderSection.PanelHeader title={t('leftSidebar.Debugger.text', 'Debugger')}>
        <div className="d-flex justify-content-end" style={{ gap: '2px' }}>
          <ButtonSolid
            onClick={clearErrorLogs}
            leftIcon="trash"
            variant="tertiary"
            className="tj-text-xsm left-sidebar-header-btn"
            style={{ width: '76px', height: '28px' }}
            iconWidth="14"
            title={'Clear'}
            fill={`var(--icons-strong)`}
          >
            {t('widget.commonProperties.clear', 'Clear')}
          </ButtonSolid>
          <ButtonSolid
            title={`${pinned ? 'Unpin' : 'Pin'}`}
            onClick={() => setPinned(!pinned)}
            variant="tertiary"
            leftIcon={pinned ? 'unpin' : 'pin'}
            iconWidth="14"
            className="left-sidebar-header-btn"
            fill={`var(--slate12)`}
          ></ButtonSolid>
        </div>
      </HeaderSection.PanelHeader>
    </HeaderSection>
  );
};

export default SidebarDebuggerHeader;
