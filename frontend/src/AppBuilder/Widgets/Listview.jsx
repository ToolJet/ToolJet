import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
// import { SubContainer } from '../SubContainer';
import { Pagination } from '@/_components/Pagination';
import { removeFunctionObjects } from '@/_helpers/appUtils';
import _ from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const Listview = function Listview({
  id,
  width,
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariables,
  darkMode,
  dataCy,
}) {
  const getComponentNameFromId = useStore((state) => state.getComponentNameFromId, shallow);
  const childComponents = useStore((state) => state.getChildComponents(id), shallow);
  const updateCustomResolvables = useStore((state) => state.updateCustomResolvables, shallow);
  const fallbackProperties = { height: 100, showBorder: false, data: [] };
  const fallbackStyles = { visibility: true, disabledState: false };

  const prevFilteredDataRef = useRef([]);
  const prevChildComponents = useRef({});

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

  const computeCanvasBackgroundColor = useMemo(() => {
    return {
      backgroundColor: computedStyles.backgroundColor,
      maxWidth: mode === 'grid' ? '100%' : undefined,
    };
  }, [computedStyles.backgroundColor, mode]);

  const [selectedRowIndex, setSelectedRowIndex] = useState(undefined);
  const [positiveColumns, setPositiveColumns] = useState(columns);
  const parentRef = useRef(null);
  const [childrenData, setChildrenData] = useState({});
  const onOptionChange = useCallback(
    (optionName, value, componentId, index) => {
      setChildrenData((prevData) => {
        const componentName = getComponentNameFromId(componentId);
        const changedData = { [componentName]: { [optionName]: value } };
        const existingDataAtIndex = prevData[index] ?? {};
        const newDataAtIndex = {
          ...prevData[index],
          [componentName]: {
            ...existingDataAtIndex[componentName],
            ...changedData[componentName],
            id: componentId,
          },
        };
        const newChildrenData = { ...prevData, [index]: newDataAtIndex };
        return { ...prevData, ...newChildrenData };
      });
    },
    [getComponentNameFromId, setChildrenData]
  );

  const onOptionsChange = useCallback(
    (exposedVariables, componentId, index) => {
      setChildrenData((prevData) => {
        const componentName = getComponentNameFromId(componentId);
        const existingDataAtIndex = prevData[index] ?? {};
        const changedData = {};
        Object.keys(exposedVariables).forEach((key) => {
          changedData[componentName] = { ...changedData[componentName], [key]: exposedVariables[key] };
        });
        const newDataAtIndex = {
          ...prevData[index],
          [componentName]: {
            ...existingDataAtIndex[componentName],
            ...changedData[componentName],
            id: componentId,
          },
        };
        const newChildrenData = { ...prevData, [index]: newDataAtIndex };
        return { ...prevData, ...newChildrenData };
      });
    },
    [getComponentNameFromId, setChildrenData]
  );

  function onRecordOrRowClicked(index) {
    setSelectedRowIndex(index);
    const exposedVariables = {
      selectedRecordId: index,
      selectedRecord: childrenData[index],
      selectedRowId: index,
      selectedRow: childrenData[index],
    };
    setExposedVariables(exposedVariables);
    fireEvent('onRecordClicked');
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
    if (selectedRowIndex != undefined) {
      exposedVariables.selectedRecordId = selectedRowIndex;
      exposedVariables.selectedRecord = childrenData[selectedRowIndex];
      exposedVariables.selectedRowId = selectedRowIndex;
      exposedVariables.selectedRow = childrenData[selectedRowIndex];
    }
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData]);

  function filterComponents() {
    if (!childrenData || childrenData.length === 0) {
      return [];
    }
    const componentNamesSet = new Set(
      Object.values(childComponents ?? {}).map((component) => component.component.component.name)
    );
    const filteredData = deepClone(childrenData);
    if (filteredData?.[0]) {
      // update the name of the component in the data
      Object.keys(filteredData?.[0]).forEach((item) => {
        const { id } = _.get(filteredData?.[0], item, {});
        const oldName = item;
        const newName = _.get(childComponents, `${id}.component.component.name`, '');
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

  // Check if the previous filtered data is different from the current filtered data
  if (
    Object.keys(diff(filteredData, prevFilteredDataRef.current)).length > 0 ||
    Object.keys(childComponents).length !== Object.keys(prevChildComponents.current).length
  ) {
    prevFilteredDataRef.current = filteredData;
    const firstPrevElement = Object.keys(prevChildComponents.current) || {};
    const firstCurrentElement = Object.keys(childComponents) || {};
    const elementIdToBeDeleted = firstPrevElement.filter((key) => !firstCurrentElement.includes(key));
    const childData = childrenData?.[1] || {};
    const elementNameToBeDeleted = [];
    elementIdToBeDeleted.forEach((key) => {
      Object.keys(childData).forEach((ele) => {
        if (childData[ele]?.id === key) {
          elementNameToBeDeleted.push(ele);
        }
      });
    });
    setChildrenData((prevData) => {
      const newChildrenData = deepClone(prevData);
      elementNameToBeDeleted.forEach((name) => {
        Object.keys(newChildrenData).forEach((index) => {
          if (newChildrenData?.[index]?.[name]) delete newChildrenData[index][name];
        });
      });
      return newChildrenData;
    });

    prevChildComponents.current = childComponents;

    // Adding listItem as key value pair to the customResolvables
    const listItems = filteredData.map((listItem) => {
      return {
        listItem,
      };
    });
    // Update the customResolvables with the new listItems
    if (listItems.length > 0) updateCustomResolvables(id, listItems, 'listItem');
  }

  return (
    <div
      data-disabled={disabledState}
      className="jet-listview flex-column w-100 position-relative"
      id={id}
      ref={parentRef}
      style={computedStyles}
      //   onClick={() => containerProps.onComponentClick(id, component)}
      data-cy={dataCy}
    >
      <div className={`row w-100 m-0 ${enablePagination && 'pagination-margin-bottom-last-child'}`}>
        {filteredData.map((listItem, index) => (
          <div
            className={`list-item ${mode == 'list' && 'w-100'}`}
            style={{
              position: 'relative',
              height: `${rowHeight}px`,
              width: `${100 / positiveColumns}%`,
              ...(showBorder && mode == 'list' && { borderBottom: `1px solid var(--cc-default-border)` }),
            }}
            key={index}
            // data-cy={`${String(component.name).toLowerCase()}-row-${index}`}
            onClickCapture={(event) => {
              onRecordOrRowClicked(index);
            }}
          >
            <SubContainer
              index={index}
              id={id}
              key={`${id}-${index}`}
              canvasHeight={rowHeight}
              canvasWidth={width}
              onOptionChange={onOptionChange}
              onOptionsChange={onOptionsChange}
              styles={computeCanvasBackgroundColor}
              columns={positiveColumns}
              listViewMode={mode}
              darkMode={darkMode}
              componentType="Listview"
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
