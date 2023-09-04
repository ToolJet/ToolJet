import React from 'react';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, ...rest }, ref) => {
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
        onClick={(event) => event.stopPropagation()}
        {...rest}
        style={{
          width: 16,
          height: 16,
        }}
      />
    </>
  );
});

export default IndeterminateCheckbox;
