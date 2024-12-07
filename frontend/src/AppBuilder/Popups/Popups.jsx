import React from 'react';
import { Confirm } from '@/Editor/Viewer/Confirm';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const Popups = ({ darkMode }) => {
  const queryConfirmationList = useStore((state) => state.dataQuery.queryConfirmationList, shallow);
  const onQueryConfirmOrCancel = useStore((state) => state.queryPanel.onQueryConfirmOrCancel);

  return (
    <div>
      <Confirm
        show={queryConfirmationList?.length > 0}
        message={`Do you want to run this query - ${queryConfirmationList?.[0]?.queryName}?`}
        onConfirm={(queryConfirmationData) => onQueryConfirmOrCancel(queryConfirmationData, true)}
        onCancel={() => onQueryConfirmOrCancel(queryConfirmationList?.[0])}
        queryConfirmationData={queryConfirmationList?.[0]}
        darkMode={darkMode}
        key={queryConfirmationList?.[0]?.queryName}
      />
    </div>
  );
};
