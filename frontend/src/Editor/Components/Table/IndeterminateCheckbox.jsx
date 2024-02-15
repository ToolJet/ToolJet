import React from 'react';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, fireEvent, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <>
      <input
        data-cy={`checkbox-input`}
        type="checkbox"
        ref={resolvedRef}
        onClick={(event) => {
          if (fireEvent) {
            fireEvent('onRowClicked');
          }
          event.stopPropagation();
        }}
        {...rest}
        style={{
          width: 16,
          height: 16,
        }}
        onMouseDown={(e) => e.preventDefault()}
      />
    </>
  );
});

export default IndeterminateCheckbox;
