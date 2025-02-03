import React, { useRef, useState } from 'react';
import Moveable from 'react-moveable';

export const withMoveable = (WrappedComponent, targetRef) => {
  return function MoveableWrapper({ isEditing, ...props }) {
    const [size, setSize] = useState({ height: 200 }); // Default height
    const targetRef = useRef(null);
    const moveableRef = useRef(null);

    const onResize = ({ height }) => {
      setSize({ height });
    };

    return (
      <div className="hellooooo" style={{ height: size.height, width: '100%', position: 'relative' }}>
        <WrappedComponent {...props} />

        {isEditing && (
          <Moveable
            ref={moveableRef}
            target={targetRef.current}
            resizable
            keepRatio={false}
            throttleResize={1}
            onResize={({ target, height, width, drag }) => {
              onResize({ height });
              target.style.height = `${height}px`; // Apply new height

              target.style.width = `${width}px`;
              target.style.height = `${height}px`;
              target.style.transform = drag.transform;
            }}
            onResizeEnd={(e) => {
              const lastEvent = e.lastEvent;

              if (lastEvent) {
                console.log(lastEvent.drag.transform);
              }
            }}
            renderDirections={['top', 'bottom']} // Allow vertical resizing only
            edge={true}
          />
        )}
      </div>
    );
  };
};
