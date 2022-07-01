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
  const [selectedValues, setSelectedValues] = useState(['Manish']);
  const data = {
    countries: {
      India: {
        states: ['Maharashtra', 'Assam'],
      },
      Portugal: {
        states: {
          Alentejo: 'Alentejo',
          Beira: 'Beira',
        },
      },
    },
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
              useIndentedBlock={true}
              enableCopyToClipboard={false}
              useActions={false}
              actionIdentifier="id"
              expandWithLabels={true}
              showNodeType={false}
            />
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0' }}>{selectedValues}</div>
      </OverlayTrigger>
    </div>
  );
};
