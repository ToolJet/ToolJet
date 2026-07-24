import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const IndeterminateCheckbox = React.forwardRef(({ indeterminate, fireEvent, isCell = false, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <div
      className={`table-selector-checkbox d-flex flex-column align-items-center ${
        isCell ? 'justify-content-center h-100' : ''
      }`}
    >
      <input
        data-cy={`checkbox-input`}
        type="checkbox"
        ref={resolvedRef}
        onClick={(event) => {
          if (fireEvent) {
            //! This is a hack to make sure the event is fired after exposed values are updated
            setTimeout(() => {
              fireEvent('onRowClicked');
            }, 0);
          }
        }}
        {...rest}
        style={{
          width: '18px',
          height: '18px',
        }}
        onMouseDown={(e) => e.preventDefault()}
      />
      <SolidIcon name={'tickv3'} width="14px" fill="var(--icon-inverse)" className="table-selector-checkbox-icon" />
    </div>
  );
});
