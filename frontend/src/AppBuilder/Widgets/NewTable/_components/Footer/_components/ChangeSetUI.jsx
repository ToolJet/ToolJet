import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

export const ChangeSetUI = memo(({ width, handleChangesSaved, handleChangesDiscarded, id }) => {
  const onEvent = useStore((state) => state.eventsSlice.onEvent);
  const tableComponentEvents = useTableStore((state) => state.getTableComponentEvents(id), shallow);

  return (
    <>
      <ButtonSolid
        variant="ghostBlack"
        className={`tj-text-sm tw-font-medium !tw-text-[var(--cc-primary-text)]`}
        onClick={handleChangesDiscarded}
        data-cy={`table-button-discard-changes`}
        size="md"
        customStyles={{ minWidth: '32px', padding: width > 650 ? '6px 16px' : 0 }}
        leftIcon={width > 650 ? '' : 'IconX'}
        fill={'var(--cc-table-action-icon-color)'}
        iconWidth="16"
        isTablerIcon={true}
      >
        {width > 650 ? <span>Discard</span> : ''}
      </ButtonSolid>
      <ButtonSolid
        variant="primary"
        className={`tj-text-sm tw-font-medium`}
        onClick={() => {
          onEvent('onBulkUpdate', tableComponentEvents).then(() => {
            handleChangesSaved();
          });
        }}
        data-cy={`table-button-save-changes`}
        size="md"
        // isLoading={tableDetails.isSavingChanges ? true : false}
        customStyles={{
          minWidth: '32px',
          padding: width > 650 ? '6px 16px' : 0,
          backgroundColor: 'var(--cc-primary-brand)',
        }}
        leftIcon="IconDeviceFloppy"
        fill="var(--cc-surface1-surface)"
        iconWidth="16"
        isTablerIcon={true}
      >
        {width > 650 ? <span>Save changes</span> : ''}
      </ButtonSolid>
    </>
  );
});
