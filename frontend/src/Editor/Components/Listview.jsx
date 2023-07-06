import React, { useRef, useState, useEffect } from 'react';
import { SubContainer } from '../SubContainer';
import _ from 'lodash';
import { Pagination } from '@/_components/Pagination';

export const Listview = function Listview({
  id,
  component,
  width,
  height,
  containerProps,
  removeComponent,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  darkMode,
  dataCy,
}) {
  const fallbackProperties = { height: 100, showBorder: false, data: [] };
  const fallbackStyles = { visibility: true, disabledState: false };

  const {
    data,
    rowHeight,
    showBorder,
    rowsPerPage = 10,
    enablePagination = false,
    mode,
    columns,
  } = { ...fallbackProperties, ...properties };
  const { visibility, disabledState, borderRadius } = { ...fallbackStyles, ...styles };
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const borderColor = styles.borderColor ?? 'transparent';
  const rowPerPageValue = Number(rowsPerPage) ? +rowsPerPage || 10 : 10;

  const computedStyles = {
    backgroundColor,
    border: '1px solid',
    borderColor,
    height: enablePagination ? height - 54 : height,
    display: visibility ? 'flex' : 'none',
    borderRadius: borderRadius ?? 0,
  };

  const [selectedRowIndex, setSelectedRowIndex] = useState(undefined);
  function onRowClicked(index) {
    setSelectedRowIndex(index);
    setExposedVariable('selectedRowId', index);
    setExposedVariable('selectedRow', childrenData[index]);
    fireEvent('onRowClicked');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  const parentRef = useRef(null);

  const [childrenData, setChildrenData] = useState({});

  useEffect(() => {
    setExposedVariable('data', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExposedVariable('data', childrenData);
    if (selectedRowIndex != undefined) {
      setExposedVariable('selectedRowId', selectedRowIndex);
      setExposedVariable('selectedRow', childrenData[selectedRowIndex]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageChanged = (page) => {
    setCurrentPage(page);
  };

  const startIndexOfRowInThePage = currentPage === 1 ? 0 : currentPage * rowPerPageValue - rowPerPageValue;
  const endIndexOfRowInThePage = startIndexOfRowInThePage + rowPerPageValue;
  const filteredData = _.isArray(data)
    ? enablePagination
      ? data.slice(startIndexOfRowInThePage, endIndexOfRowInThePage)
      : data
    : [];

  return (
    <div
      data-disabled={disabledState}
      className="jet-listview flex-column w-100 position-relative"
      id={id}
      ref={parentRef}
      onClick={() => containerProps.onComponentClick(id, component)}
      style={computedStyles}
      data-cy={dataCy}
    >
      <div className={`row w-100 ${enablePagination && 'pagination-margin-bottom-last-child'}`}>
        {filteredData.map((listItem, index) => (
          <div
            className={`list-item ${mode == 'list' ? 'w-100' : `col-${12 / columns}`}  ${
              showBorder ? 'border-bottom' : ''
            }`}
            style={{ position: 'relative', height: `${rowHeight}px` }}
            key={index}
            data-cy={`${String(component.name).toLowerCase()}-row-${index}`}
            onClick={(event) => {
              event.stopPropagation();
              onRowClicked(index);
            }}
          >
            <SubContainer
              parentComponent={component}
              containerCanvasWidth={width}
              parent={`${id}`}
              parentName={component.name}
              {...containerProps}
              readOnly={index !== 0}
              customResolvables={{ listItem }}
              parentRef={parentRef}
              removeComponent={removeComponent}
              listViewItemOptions={{ index }}
              exposedVariables={childrenData[index]}
              onOptionChange={function ({ component, optionName, value }) {
                setChildrenData((prevData) => {
                  const changedData = { [component.name]: { [optionName]: value } };
                  const existingDataAtIndex = prevData[index] ?? {};
                  const newDataAtIndex = {
                    ...prevData[index],
                    [component.name]: { ...existingDataAtIndex[component.name], ...changedData[component.name] },
                  };
                  const newChildrenData = { ...prevData, [index]: newDataAtIndex };
                  return { ...prevData, ...newChildrenData };
                });
              }}
            />
          </div>
        ))}
      </div>
      {enablePagination && _.isArray(data) && (
        <div
          className="fixed-bottom position-fixed"
          style={{ border: '1px solid', borderColor, margin: '1px', borderTop: 0 }}
        >
          <div style={{ backgroundColor }}>
            <Pagination
              darkMode={darkMode}
              currentPage={currentPage}
              pageChanged={pageChanged}
              count={data?.length}
              itemsPerPage={rowPerPageValue}
            />
          </div>
        </div>
      )}
    </div>
  );
};
