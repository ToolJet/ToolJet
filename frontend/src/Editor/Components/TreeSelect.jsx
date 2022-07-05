import React, { useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';

export const TreeSelect = function ({
  id,
  component,
  height,
  width,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  onComponentClick,
  darkMode,
  fireEvent,
  currentState,
}) {
  const [selectedValues, setSelectedValues] = useState([]);
  const [displayValues, setDisplayValues] = useState([]);

  const data = {
    countries: {
      India: {
        states: {
          Maharashtra: ['Pune', 'Mumbai'],
          Gujarat: ['Surat', 'Vadodara'],
          Rajasthan: ['Jaipur', 'Ajmer'],
        },
      },
      Portugal: {
        states: {
          Alentejo: ['Aveiro', 'Beja', 'Braga'],
          Beira: ['Faro', 'Guarda', 'Leiria'],
        },
      },
    },
  };

  const onChange = (selectedValue, state, path, currentPathArr) => {
    const newSelectedValues = JSON.parse(JSON.stringify(selectedValues));

    if (state) {
      newSelectedValues.push({ value: selectedValue, path, parent: currentPathArr[currentPathArr.length - 2] });
      const evalautedValue = eval(`data.${path}`);

      addChildren(evalautedValue, path, selectedValue, newSelectedValues, data);
    } else {
      newSelectedValues.splice(newSelectedValues.indexOf(selectedValue), 1);
      const evalautedValue = eval(`data.${path}`);

      removeChildren(evalautedValue, path, selectedValue, newSelectedValues);
    }

    setSelectedValues(newSelectedValues);
  };

  useEffect(() => {
    const newDisplayValues = [];
    selectedValues.forEach((val) => {
      newDisplayValues.push(val.value);
    });
    setDisplayValues(newDisplayValues);
  }, [selectedValues]);

  return (
    <div style={{ width, position: 'relative' }} className="">
      <OverlayTrigger
        trigger="click"
        rootClose={true}
        placement="bottom-end"
        // delay={{ show: 800, hide: 100 }}
        overlay={
          <div style={{ position: 'absolute', top: '10', width, background: 'white', padding: '1rem' }}>
            <JSONTreeViewer
              data={data}
              useIcons={false}
              useIndentedBlock={false}
              enableCopyToClipboard={false}
              useActions={false}
              actionIdentifier="id"
              expandWithLabels={false}
              showNodeType={false}
              hideArrayKeys={true}
              useInputSelector={true}
              inputSelectorType={'checkbox'}
              inputSelectorCallback={onChange}
              selectedNodes={selectedValues}
              treeType="treeSelectWidget"
              showOptionHovered={false}
              showOptionSelected={false}
            />
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0' }}>
          <strong>Select</strong>
          {displayValues.map((value, index) => (
            <span key={index} className="mx-1">
              {value}
            </span>
          ))}
        </div>
      </OverlayTrigger>
    </div>
  );
};

// !utils

const checkIfAllChildrenSelected = (selected, data) => {
  const parentCount = {};
  selected.map((item) => {
    if (item.parent in parentCount) {
      parentCount[item.parent] += 1;
    } else {
      parentCount[item.parent] = 1;
    }
  });

  return Object.keys(parentCount)
    .map((parent) => {
      const parentPath =
        selected
          .find((item) => console.log('checkIfAllChildrenSelected', item) && item?.parent === parent)
          ?.path?.split('[')[0] || '';
      if (parentPath) {
        const numberOfChildren = eval(`data.${parentPath}`).length;
        // console.log('checkIfAllChildrenSelected', parent, parentPath, numberOfChildren, parentCount);
        if (parentCount[parent] === numberOfChildren) {
          return { [parent]: true };
        }

        return { [parent]: false };
      }
    })
    .filter((item) => item !== undefined);
};

function updateSelectedParent(parentName, selected) {
  function toGetParent(path) {
    const x = path.split('.');
    return x[x.length - 2];
  }

  if (selected.length > 0) {
    const children = selected.filter((item) => item.parent === parentName);
    const parentPath = new Set(children.map((item) => item.path.split('[')[0]));
    const parentObj = {
      value: parentName,
      path: Array.from(parentPath)[0],
      parent: toGetParent(Array.from(parentPath)[0]),
    };

    return parentObj;
  }

  return undefined;
}

const addChildren = (evalValue, path, selectedValue, arr, data) => {
  if (Object.prototype.toString.call(evalValue).slice(8, -1) === 'Array') {
    evalValue.forEach((val, index) => {
      if (!arr.map((item) => item.path).includes(`${path}[${index}]`)) {
        arr.push({
          value: val,
          path: `${path}[${index}]`,
          parent: selectedValue,
        });
      }

      if (Object.prototype.toString.call(val).slice(8, -1) === 'Array') {
        addChildren(val, `${path}[${index}]`, val, arr);
      }

      if (Object.prototype.toString.call(val).slice(8, -1) === 'Object') {
        addChildren(val, `${path}[${index}]`, val, arr);
      }
    });
  }

  if (Object.prototype.toString.call(evalValue).slice(8, -1) === 'Object') {
    Object.keys(evalValue).forEach((key) => {
      if (!arr.map((item) => item.path).includes(`${path}.${key}`)) {
        arr.push({
          value: key,
          path: `${path}.${key}`,
          parent: selectedValue,
        });
      }

      if (Object.prototype.toString.call(evalValue[key]).slice(8, -1) === 'Array') {
        addChildren(evalValue[key], `${path}.${key}`, evalValue[key], arr);
      }
      if (Object.prototype.toString.call(evalValue[key]).slice(8, -1) === 'Object') {
        addChildren(evalValue[key], `${path}.${key}`, evalValue[key], arr);
      }
    });
  }

  const isAllChildChecked = checkIfAllChildrenSelected(arr, data);

  if (isAllChildChecked.length > 0) {
    isAllChildChecked.forEach((item) => {
      const parentNode = _.uniq(arr.map((val) => (item[val.parent] === true ? val.parent : null))).filter(
        (val) => val !== null
      )[0];
      if (parentNode) {
        const parentIndex = arr.findIndex((val) => val.value === parentNode);

        if (parentIndex === -1) {
          const parentObj = updateSelectedParent(parentNode, arr);

          if (
            Object.prototype.hasOwnProperty.call(parentObj, 'value') &&
            Object.prototype.hasOwnProperty.call(parentObj, 'path') &&
            Object.prototype.hasOwnProperty.call(parentObj, 'parent')
          ) {
            arr.push(parentObj);
          }
        }
      }
    });
  }
};

const removeChildren = (evalValue, path, selectedValue, arr) => {
  if (Object.prototype.toString.call(evalValue).slice(8, -1) === 'Array') {
    evalValue.forEach((val, index) => {
      arr.splice(arr.indexOf({ value: val, path: `${path}[${index}]`, parent: selectedValue }), 1);
      if (Object.prototype.toString.call(val).slice(8, -1) === 'Array') {
        removeChildren(val, `${path}[${index}]`, val, arr);
      }

      if (Object.prototype.toString.call(val).slice(8, -1) === 'Object') {
        removeChildren(val, `${path}[${index}]`, val, arr);
      }
    });
  }

  if (Object.prototype.toString.call(evalValue).slice(8, -1) === 'Object') {
    Object.keys(evalValue).forEach((key) => {
      arr.splice(arr.indexOf({ value: key, path: `${path}.${key}`, parent: selectedValue }), 1);
      if (Object.prototype.toString.call(evalValue[key]).slice(8, -1) === 'Array') {
        removeChildren(evalValue[key], `${path}.${key}`, evalValue[key], arr);
      }
      if (Object.prototype.toString.call(evalValue[key]).slice(8, -1) === 'Object') {
        removeChildren(evalValue[key], `${path}.${key}`, evalValue[key], arr);
      }
    });
  }
};
