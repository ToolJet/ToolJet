import React from 'react';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, label, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <input
      data-cy={`checkbox-input`}
      type="checkbox"
      ref={resolvedRef}
      style={{
        width: 15,
        height: 15,
        marginTop: 8,
        marginLeft: 10,
      }}
      onClick={(event) => event.stopPropagation()}
      {...rest}
    />
  );
});

export default IndeterminateCheckbox;
