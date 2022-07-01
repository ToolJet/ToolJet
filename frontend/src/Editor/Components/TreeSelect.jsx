import React, { useState } from 'react';
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
  const data = {
    countries: {
      India: {
        states: {
          Maharashtra: ['Pune', 'Mumbai'],
          Gujarat: ['Surat', 'Vadodara'],
          Rajasthan: ['Jaipur', 'Ajmer'],
          locaton: {
            latitude: '18.5204',
            longitude: '73.8567',
            climate: ['cool', 'warm'],
          },
        },
      },
      Portugal: {
        states: {
          Alentejo: ['Aveiro', 'Beja', 'Braga'],
          Beira: ['Faro', 'Guarda', 'Leiria'],
        },
        location: {
          latitude: '40.636',
          longitude: '-8.65',
          climate: ['cool', 'warm'],
        },
      },
    },
  };

  const onChange = (selectedValue, state, path, currentPathArr) => {
    const newSelectedValues = JSON.parse(JSON.stringify(selectedValues));

    if (state) {
      newSelectedValues.push({ value: selectedValue, path, parent: currentPathArr[currentPathArr.length - 2] });
      const evalautedValue = eval(`data.${path}`);

      addChildren(evalautedValue, path, selectedValue, newSelectedValues);
    } else {
      newSelectedValues.splice(newSelectedValues.indexOf(selectedValue), 1);
      const evalautedValue = eval(`data.${path}`);

      removeChildren(evalautedValue, path, selectedValue, newSelectedValues);
    }

    setSelectedValues(newSelectedValues);
  };

  return (
    <div style={{ width, position: 'relative' }} className="">
      <OverlayTrigger
        trigger="click"
        rootClose={true}
        placement="bottom-end"
        delay={{ show: 800, hide: 100 }}
        overlay={
          <div style={{ position: 'absolute', top: '10', width, background: 'white', padding: '1rem' }}>
            <JSONTreeViewer
              data={data}
              useIcons={false}
              useIndentedBlock={false}
              enableCopyToClipboard={false}
              useActions={false}
              actionIdentifier="id"
              expandWithLabels={true}
              showNodeType={false}
              hideArrayKeys={true}
              useInputSelector={true}
              inputSelectorType={'checkbox'}
              inputSelectorCallback={onChange}
              selectedNodes={selectedValues}
              treeType="treeSelectWidget"
            />
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0' }}>
          <strong>Select</strong>
          {selectedValues.map((selectedValue) => (
            <span key={selectedValue.path} className="mx-1">
              {selectedValue.value}
            </span>
          ))}
        </div>
      </OverlayTrigger>
    </div>
  );
};

// !utils

const addChildren = (evalValue, path, selectedValue, arr) => {
  if (Object.prototype.toString.call(evalValue).slice(8, -1) === 'Array') {
    evalValue.forEach((val, index) => {
      arr.push({
        value: val,
        path: `${path}[${index}]`,
        parent: selectedValue,
      });
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
      arr.push({
        value: key,
        path: `${path}.${key}`,
        parent: selectedValue,
      });
      if (Object.prototype.toString.call(evalValue[key]).slice(8, -1) === 'Array') {
        addChildren(evalValue[key], `${path}.${key}`, evalValue[key], arr);
      }
      if (Object.prototype.toString.call(evalValue[key]).slice(8, -1) === 'Object') {
        addChildren(evalValue[key], `${path}.${key}`, evalValue[key], arr);
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
