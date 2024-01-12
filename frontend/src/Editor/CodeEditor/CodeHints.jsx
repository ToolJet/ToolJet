import React, { useEffect, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SuggestionsList from './Suggestions';

const CodeHints = ({ children, isFocused, setFocus, currentValue }) => {
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);

  useEffect(() => {
    if (isFocused && currentValue.startsWith('{{')) {
      setShouldShowSuggestions(true);
    }

    if (!isFocused) {
      setShouldShowSuggestions(false);
    }
  }, [currentValue, isFocused]);

  return (
    <OverlayTrigger
      placement={'left'}
      rootClose={true}
      overlay={CodeHints.OverLayContent}
      onHide={() => setFocus(false)}
      show={shouldShowSuggestions}
    >
      {children}
    </OverlayTrigger>
  );
};

const OverLayContent = ({ darkMode }) => {
  return (
    <Popover
      id="popover-basic"
      style={{ width: '350px', maxWidth: '350px' }}
      className={`${darkMode && 'dark-theme'} shadow`}
      data-cy="popover-card"
    >
      <Popover.Header>Suggestions</Popover.Header>
      <Popover.Body
        className="p-0"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={'tj-app-input-suggestions'}>
          <SuggestionsList />
        </div>
      </Popover.Body>
    </Popover>
  );
};

CodeHints.OverLayContent = OverLayContent;

export default CodeHints;
