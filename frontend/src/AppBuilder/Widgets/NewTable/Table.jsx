import React, { useEffect } from 'react';
import './_styles/table_component.scss';
// hooks for table properties and styles
import useTableStore from './_stores/tableStore';
import { useComponentName } from '@/_hooks/useComponentName';
// components
import Header from './_components/Header';
import Footer from './_components/Footer';

export const Table = ({
  id,
  component,
  width,
  height,
  properties,
  styles,
  darkMode,
  fireEvent,
  setExposedVariables,
}) => {
  const {
    initializeComponent,
    removeComponent,
    setTableProperties,
    setTableStyles,
    getTableStyles,
    getTableProperties,
  } = useTableStore();

  const { disabledState, visibility } = getTableProperties(id);
  const { borderRadius, boxShadow, borderColor } = getTableStyles(id);

  useEffect(() => {
    initializeComponent(id);
    return () => removeComponent(id);
  }, [id, initializeComponent, removeComponent]);

  useEffect(() => {
    setTableProperties(id, properties);
  }, [id, properties, setTableProperties]);

  useEffect(() => {
    setTableStyles(id, styles);
  }, [id, styles, setTableStyles]);

  const componentName = useComponentName(component?.component?.name);

  return (
    <div
      data-cy={`draggable-widget-${componentName}`}
      data-disabled={disabledState}
      className={`card jet-table table-component ${darkMode ? 'dark-theme' : 'light-theme'}`}
      style={{
        height: `${height}px`,
        display: visibility,
        borderRadius: borderRadius,
        boxShadow,
        borderColor: borderColor,
      }}
    >
      <Header id={id} darkMode={darkMode} fireEvent={fireEvent} setExposedVariables={setExposedVariables} />
      {/* {(displaySearchBox || showFilterButton) && (
      <Header
        tableDetails={tableDetails}
        displaySearchBox={displaySearchBox}
        showFilterButton={showFilterButton}
        loadingState={loadingState}
        hideFilters={hideFilters}
        showFilters={showFilters}
        darkMode={darkMode}
        fireEvent={fireEvent}
        setExposedVariables={setExposedVariables}
        component={component}
        state={state}
        setGlobalFilter={setGlobalFilter}
      />
    )} */}
      <Footer id={id} />
    </div>
  );
};
