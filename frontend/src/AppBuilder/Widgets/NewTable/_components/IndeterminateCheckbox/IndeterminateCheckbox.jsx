import React from 'react';

export const IndeterminateCheckbox = React.forwardRef(({ indeterminate, fireEvent, isCell = false, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <div className={`d-flex flex-column align-items-center ${isCell ? 'justify-content-center h-100' : ''}`}>
      <input
        data-cy={`checkbox-input`}
        type="checkbox"
        ref={resolvedRef}
        onClick={(event) => {
          event.stopPropagation();
          if (fireEvent) {
            //! This is a hack to make sure the event is fired after exposed values are updated
            setTimeout(() => {
              fireEvent('onRowClicked');
            }, 0);
          }
        }}
        {...rest}
        style={{
          width: 16,
          height: 16,
        }}
        onMouseDown={(e) => e.preventDefault()}
      />
    </div>
  );
});
