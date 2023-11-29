// useDebouncedArrowKeyPress.js
import { useEffect, useState } from 'react';

function useDebouncedArrowKeyPress(delay) {
  const [lastKeyPressTimestamp, setLastKeyPressTimestamp] = useState(0);

  useEffect(() => {
    let timer;

    function handleKeyPress(event) {
      if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight'
      ) {
        // Arrow key was pressed; debounce the update
        clearTimeout(timer);

        timer = setTimeout(() => {
          // Trigger the update only after the specified delay
          setLastKeyPressTimestamp(Date.now());
        }, delay);
      }
    }

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [delay]);

  return lastKeyPressTimestamp;
}

export default useDebouncedArrowKeyPress;
