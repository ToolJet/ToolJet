import React from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, label, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <FormControlLabel
      defaultChecked
      ref={resolvedRef}
      onClick={(event) => event.stopPropagation()}
      {...rest}
      control={<Checkbox />}
      label={label ?? ''}
      sx={{ minWidth: '100%', mx: '5px', pl: '5px' }}
    />
  );
});

export default IndeterminateCheckbox;
