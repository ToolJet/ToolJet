import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

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
  // console.log(component, currentState);
  const [selectedValues, setSelectedValues] = useState([]);
  const data = {
    countries: {
      India: {
        states: ['Maharashtra', 'Assam'],
      },
      Portugal: {
        states: {
          Alentejo: ['Aveiro', 'Beja', 'Braga'],
          Beira: ['Faro', 'Guarda', 'Leiria'],
        },
      },
    },
  };

  const onChange = (selectedValue, path, state) => {
    const newSelectedValues = [...selectedValues];

    if (state) {
      newSelectedValues.push(selectedValue);
    } else {
      newSelectedValues.splice(newSelectedValues.indexOf(selectedValue), 1);
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
              customComponent={CustomComponent}
              hideArrayKeys={true}
              useInputSelector={true}
              inputSelectorType={'checkbox'}
              inputSelectorCallback={onChange}
            />
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0' }}>
          <span>Select</span>
          <span className="mx-2">{selectedValues}</span>
        </div>
      </OverlayTrigger>
    </div>
  );
};

const CustomComponent = ({ data, type, ...restProps }) => {
  return <p>{String(data)}</p>;
};
