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
          <div style={{ position: 'absolute', top: '10', width, background: 'white' }}>
            <JSONTreeViewer
              data={data}
              useIcons={false}
              //   iconsList={iconsList}
              useIndentedBlock={true}
              enableCopyToClipboard={true}
              useActions={true}
              //   actionsList={callbackActions}
              //   currentState={appDefinition}
              actionIdentifier="id"
              expandWithLabels={false}
              // selectedComponent={selectedComponent}
              treeType="selectTree"
              //   parentPopoverState={popoverPinned}
              // updateParentState={updatePinnedParentState}
            />
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0' }}>{selectedValues}</div>
      </OverlayTrigger>
    </div>
  );
};
