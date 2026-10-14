import React from 'react';
import { QueryConfirmPopup } from './QueryConfirmPopup';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const Popups = ({ darkMode }) => {
  const queryConfirmationList = useStore((state) => state.dataQuery.queryConfirmationList, shallow);
  const onQueryConfirmOrCancel = useStore((state) => state.queryPanel.onQueryConfirmOrCancel);

  const first = queryConfirmationList?.[0];

  return (
    <div>
      <QueryConfirmPopup
        show={queryConfirmationList?.length > 0}
        message={first?.confirmationMessage || `Do you want to run this query - ${first?.queryName}?`}
        onConfirm={() => onQueryConfirmOrCancel(first, true)}
        onCancel={() => onQueryConfirmOrCancel(first)}
        darkMode={darkMode}
        dialogKey={first?.queryName}
      />
    </div>
  );
};
