import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import Dropdown from 'react-bootstrap/Dropdown';

/**
 *! Expected hint data structure
 * {hint: string, type: primitive type, icon: svg url}
 */

function SuggestionsList({ hints, updateValueFromHint }) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useHotkeys(
    'up, down, enter, esc',
    (key) => {
      if (key.code === 'ArrowDown') {
        const nextIndex = Math.min(hints.length - 1, focusedIndex + 1);

        setFocusedIndex(nextIndex);
      }

      if (key.code === 'ArrowUp') {
        const prevIndex = Math.max(0, focusedIndex - 1);
        setFocusedIndex(prevIndex);
      }

      if (key.code === 'Enter') {
        const selectedHint = hints[focusedIndex];
        updateValueFromHint(selectedHint);
      }
    },
    { scopes: 'codehinter' }
  );

  return (
    <>
      {hints.map((suggestion, index) => {
        return (
          <Dropdown.Item
            key={index}
            active={index === focusedIndex}
            eventKey={index}
            as="li"
            onClick={() => updateValueFromHint(suggestion)}
            className="suggest-list-item d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div>{suggestion}</div>
            </div>
            {/* <code>{suggestion.type}</code> */}
          </Dropdown.Item>
        );
      })}
    </>
  );
}

export default SuggestionsList;
