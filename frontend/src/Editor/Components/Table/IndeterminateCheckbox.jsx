import React from 'react';
import config from 'config';
import { Checkbox, FormControlLabel } from '@mui/material';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, label, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <>
      {config.UI_LIB === 'tooljet' && (
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
      )}
      {config.UI_LIB === 'mui' && (
        <FormControlLabel
          defaultChecked
          ref={resolvedRef}
          onClick={(event) => event.stopPropagation()}
          {...rest}
          control={<Checkbox />}
          label={label ?? ''}
          sx={{ minWidth: '100%', mx: '5px', pl: '5px' }}
        />
      )}
    </>
  );
});

export default IndeterminateCheckbox;
