import React, { createContext, useContext, useMemo } from 'react';

const FlexChildInspectorContext = createContext(null);

export const FlexChildInspectorProvider = ({ selectedComponentId, allComponents, widthSectionTitle, children }) => {
  const value = useMemo(() => {
    const parentId = allComponents?.[selectedComponentId]?.component?.parent;
    const parentType = parentId ? allComponents?.[parentId]?.component?.component : null;
    const isFlexContainerChild = parentType === 'FlexContainer';

    if (!isFlexContainerChild) return null;

    return {
      isFlexContainerChild,
      selectedComponentId,
      allComponents,
      widthSectionTitle,
    };
  }, [selectedComponentId, allComponents, widthSectionTitle]);

  return <FlexChildInspectorContext.Provider value={value}>{children}</FlexChildInspectorContext.Provider>;
};

export const useFlexChildInspectorContext = () => useContext(FlexChildInspectorContext);

export default FlexChildInspectorContext;
