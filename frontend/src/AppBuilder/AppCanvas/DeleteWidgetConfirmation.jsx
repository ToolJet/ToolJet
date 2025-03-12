import React from 'react';
import { ConfirmDialog } from '@/_components';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const DeleteWidgetConfirmation = ({ darkMode }) => {
  const showWidgetDeleteConfirmation = useStore((state) => state.showWidgetDeleteConfirmation, shallow);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation, shallow);
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);

  const handleConfirmDelete = () => {
    deleteComponents();
  };

  return (
    <ConfirmDialog
      show={showWidgetDeleteConfirmation}
      message={'Are you sure you want to delete this component?'}
      onConfirm={handleConfirmDelete}
      onCancel={() => setWidgetDeleteConfirmation(false)}
      darkMode={darkMode}
    />
  );
};
