import React, { useEffect, useRef } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { computeAutoMobileLayout } from './Grid/gridUtils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import useConfirm from '@/_hooks/useConfirm';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { isEmpty } from 'lodash';

export default function AutoComputeMobileLayoutAlert({ currentLayout, darkMode, isCurrentVersionLocked }) {
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(), shallow);
  const isAutoMobileLayout = useStore((state) => state.getIsAutoMobileLayout(), shallow);
  const turnOffAutoComputeLayout = useStore((state) => state.turnOffAutoComputeLayout, shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);
  const lastComputedRef = useRef();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (currentLayout === 'mobile' && isAutoMobileLayout) {
      const updatedBoxes = computeAutoMobileLayout(currentPageComponents);
      if (!isEmpty(diff(lastComputedRef.current, updatedBoxes))) {
        lastComputedRef.current = updatedBoxes;
        setComponentLayout(updatedBoxes);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayout, currentPageComponents, isAutoMobileLayout]);

  const handleDisableAutoAlignment = async () => {
    const result = await confirm(
      'Once Auto Layout is disabled, you wont be able to turn if back on and the mobile layout won’t automatically align with desktop changes',
      'Turn off Auto Layout'
    );
    if (result) {
      turnOffAutoComputeLayout();
    }
  };

  if (currentLayout !== 'mobile' || !isAutoMobileLayout) {
    return '';
  }
  return (
    <>
      <ConfirmDialog confirmButtonText="Turn off" darkMode={darkMode} />
      <div
        style={{
          position: 'absolute',
          top: isCurrentVersionLocked ? '38px' : '0',
          right: '0',
          width: '300px',
          padding: 'var(--7, 16px)',
          background: 'var(--base)',
          margin: '10px',
          zIndex: '51', // So that it doesn't get overlapped by the page menu sidebar in mobile view (z-index 50)
        }}
        className="d-flex flex-row"
      >
        <div className="pe-2">
          <SolidIcon name="warning" fill="#E54D2E" />
        </div>
        <div style={{ fontSize: '12px', fontStyle: 'normal', fontWeight: '400', lineHeight: '20px' }}>
          You have to disable auto alignment to manually adjust mobile components. Once disabled, the mobile layout will
          not automatically align with desktop changes
          <ButtonSolid
            size="sm"
            variant="tertiary"
            onClick={handleDisableAutoAlignment}
            className="mt-2"
            data-cy="disable-auto-alignment-button"
          >
            Disable auto alignment
          </ButtonSolid>
        </div>
      </div>
    </>
  );
}
