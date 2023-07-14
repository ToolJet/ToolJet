import React from 'react';
import { capitalize, startCase } from 'lodash';
import moment from 'moment';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

function ErrorLogs({ errorProps, idx, darkMode }) {
  const [open, setOpen] = React.useState(false);

  const errorTitle = ` [${capitalize(errorProps.type)} ${errorProps.key}]`;
  const errorMessage =
    errorProps.type === 'component'
      ? `Invalid property detected: ${errorProps.message}.`
      : `${startCase(errorProps.type)} failed: ${errorProps.message ?? ''}`;

  const defaultStyles = {
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: 'inline-block',
    cursor: 'pointer',
  };

  return (
    <div className="tab-content debugger-content mb-1" key={`${errorProps.key}-${idx}`}>
      <p className="text-azure m-0 d-flex" onClick={() => setOpen((prev) => !prev)}>
        <span className="mx-1 position-absolute" style={defaultStyles}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1.02063 1L5.01032 5.01028L1.00003 8.99997"
              stroke={darkMode ? '#fff' : '#61656F'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="ps-3 w-100">
          <span className="d-flex justify-content-between align-items-center  text-truncate">
            <span className="text-truncate">{errorTitle}</span>
            <small className="text-muted text-right px-1">{moment(errorProps.timestamp).fromNow()}</small>
          </span>
          <span className="text-red mx-1">{errorMessage}</span>
        </span>
      </p>

      {open && (
        <JSONTreeViewer
          data={errorProps.error}
          useIcons={false}
          useIndentedBlock={true}
          enableCopyToClipboard={false}
          useActions={false}
          actionIdentifier="id"
          expandWithLabels={true}
          fontSize={'10px'}
        />
      )}
      <hr className="border-1 border-bottom bg-grey" />
    </div>
  );
}
export default ErrorLogs;
