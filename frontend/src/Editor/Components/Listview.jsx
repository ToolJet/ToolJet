import React, { useRef, useState, useEffect } from 'react';
import { SubContainer } from '../SubContainer';
import { Pagination } from '@/_components/Pagination';
import { removeFunctionObjects } from '@/_helpers/appUtils';
import _ from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

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
  setExposedVariables,
  darkMode,
  dataCy,
  childComponents,
}) {
  const fallbackProperties = { height: 100, showBorder: false, data: [] };
  const fallbackStyles = { visibility: true, disabledState: false };

  const {
    data,
    rowHeight,
    showBorder,
    rowsPerPage = 10,
    enablePagination = false,
    mode = 'list',
    columns = 1,
  } = { ...fallbackProperties, ...properties };
  const { visibility, disabledState, borderRadius, boxShadow } = { ...fallbackStyles, ...styles };
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
    boxShadow,
  };
  const [selectedRowIndex, setSelectedRowIndex] = useState(undefined);
  const [positiveColumns, setPositiveColumns] = useState(columns);
  const parentRef = useRef(null);
  const [childrenData, setChildrenData] = useState({});

  function onRecordClicked(index) {
    setSelectedRowIndex(index);
    const exposedVariables = {
      selectedRecordId: index,
      selectedRecord: childrenData[index],
    };
    setExposedVariables(exposedVariables);
    fireEvent('onRecordClicked');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }
  function onRowClicked(index) {
    setSelectedRowIndex(index);
    const exposedVariables = {
      selectedRowId: index,
      selectedRow: childrenData[index],
    };
    setExposedVariables(exposedVariables);
    fireEvent('onRowClicked');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  useEffect(() => {
    if (columns < 1) {
      setPositiveColumns(1);
    } else setPositiveColumns(columns);
  }, [columns]);

  useEffect(() => {
    const childrenDataClone = deepClone(childrenData);
    const exposedVariables = {
      data: removeFunctionObjects(childrenDataClone),
      children: childrenData,
    };
    setExposedVariables(exposedVariables);
    if (selectedRowIndex != undefined) {
      const exposedVariables = {
        selectedRowId: selectedRowIndex,
        selectedRow: childrenData[selectedRowIndex],
      };
      setExposedVariables(exposedVariables);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData, childComponents]);

  function filterComponents() {
    if (!childrenData || childrenData.length === 0) {
      return [];
    }

    const componentNamesSet = new Set(
      Object.values(childComponents ?? {}).map((component) => component.component.name)
    );
    const filteredData = deepClone(childrenData);
    if (filteredData?.[0]) {
      // update the name of the component in the data
      Object.keys(filteredData?.[0]).forEach((item) => {
        const { id } = _.get(filteredData?.[0], item, {});
        const oldName = item;
        const newName = _.get(childComponents, `${id}.component.name`, '');
        if (oldName !== newName) {
          _.set(filteredData[0], newName, _.get(filteredData[0], oldName));
          _.unset(filteredData[0], oldName);
        }
      });
      Object.keys(filteredData?.[0]).forEach((item) => {
        if (!componentNamesSet?.has(item)) {
          for (const key in filteredData) {
            delete filteredData[key][item];
          }
        }
      });
    }

    return filteredData;
  }

  useEffect(() => {
    const data = filterComponents(childComponents, childrenData);
    if (!_.isEqual(data, childrenData)) setChildrenData(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childComponents, childrenData]);

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
      <div className={`row w-100 m-0 ${enablePagination && 'pagination-margin-bottom-last-child'}`}>
        {filteredData.map((listItem, index) => (
          <div
            className={`list-item ${mode == 'list' && 'w-100'}  ${showBorder && mode == 'list' ? 'border-bottom' : ''}`}
            style={{ position: 'relative', height: `${rowHeight}px`, width: `${100 / positiveColumns}%` }}
            key={index}
            data-cy={`${String(component.name).toLowerCase()}-row-${index}`}
            onClick={(event) => {
              onRecordClicked(index);
              onRowClicked(index);
            }}
          >
            <SubContainer
              columns={positiveColumns}
              listmode={mode}
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
              onOptionChange={function ({ component, optionName, value, componentId }) {
                setChildrenData((prevData) => {
                  const changedData = { [component.name]: { [optionName]: value } };
                  const existingDataAtIndex = prevData[index] ?? {};
                  const newDataAtIndex = {
                    ...prevData[index],
                    [component.name]: {
                      ...existingDataAtIndex[component.name],
                      ...changedData[component.name],
                      id: componentId,
                    },
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
          style={{ border: '1px solid', borderColor, margin: '1px', borderTop: 0, left: '1px', right: '1px' }}
        >
          <div style={{ backgroundColor }}>
            {data?.length > 0 ? (
              <Pagination
                darkMode={darkMode}
                currentPage={currentPage}
                pageChanged={pageChanged}
                count={data?.length}
                itemsPerPage={rowPerPageValue}
              />
            ) : (
              <div style={{ height: '61px' }}></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
