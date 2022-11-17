import React from 'react';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, className = '', ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      resolvedRef.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [resolvedRef, indeterminate]);

  return (
    <>
      <input type="checkbox" ref={resolvedRef} className={className + ' cursor-pointer'} {...rest} />
    </>
  );
});

export default IndeterminateCheckbox;
