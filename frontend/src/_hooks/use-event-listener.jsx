import React, { useState } from 'react';
import { useEventListener } from './use-event-listener';

export function useEventListener(eventName, handler, element = window) {
  const savedHandler = React.useRef();

  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  React.useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;
    const eventListener = (event) => savedHandler?.current(event);
    element.addEventListener(eventName, eventListener);
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

function ExampleComponent() {
  const [key, setKey] = useState('');

  const handleKeydown = (event) => {
    setKey(event.key);
  };

  useEventListener('keydown', handleKeydown);

  return (
    <div>
      <p>Press any key: {key}</p>
    </div>
  );
}

export default ExampleComponent;
