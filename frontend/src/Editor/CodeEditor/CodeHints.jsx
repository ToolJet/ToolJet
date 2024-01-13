import React from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import SuggestionsList from './Suggestions';

const CodeHints = ({ children, ref, componentName, target, shouldShowSuggestions, hints }) => {
  return (
    <div ref={ref} className={`code-editor-container-${componentName}`}>
      {children}

      <Overlay show={shouldShowSuggestions} target={target} placement="bottom" container={ref} containerPadding={20}>
        <Popover
          id="popover-contained"
          style={{ width: '250px', maxWidth: '350px', maxHeight: '200px', overflowY: 'auto' }}
        >
          <Popover.Header>Suggestions</Popover.Header>
          <Popover.Body className="p-0">
            <div className={'tj-app-input-suggestions'}>
              <SuggestionsList hints={hints} />
            </div>
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  );
};

export default CodeHints;
