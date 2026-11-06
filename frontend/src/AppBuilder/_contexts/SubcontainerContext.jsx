import React, { createContext, useContext } from 'react';

const SubcontainerContext = createContext({ contextPath: [], inListviewRecord: false });

export const useSubcontainerContext = () => {
  return useContext(SubcontainerContext);
};

export default SubcontainerContext;
