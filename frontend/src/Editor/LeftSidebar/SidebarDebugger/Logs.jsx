import React from 'react';
import { capitalize, startCase } from 'lodash';
import moment from 'moment';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import cx from 'classnames';

function Logs({ logProps, idx, darkMode }) {
  const [open, setOpen] = React.useState(false);

  const title = ` [${capitalize(logProps?.type)} ${logProps?.key}]`;
  const message = logProps?.isQuerySuccessLog
    ? 'Completed'
    : logProps?.type === 'component'
    ? `Invalid property detected: ${logProps?.message}.`
    : `${startCase(logProps?.type)} failed: ${logProps?.message ?? ''}`;

  const defaultStyles = {
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: logProps?.isQuerySuccessLog ? 'none' : 'inline-block',
    cursor: 'pointer',
    pointerEvents: logProps?.isQuerySuccessLog ? 'none' : 'default',
  };

  return (
    <div className="tab-content debugger-content mb-1" key={`${logProps?.key}-${idx}`}>
      <p
        className="m-0 d-flex"
        onClick={() => setOpen((prev) => !prev)}
        style={{ pointerEvents: logProps?.isQuerySuccessLog ? 'none' : 'default' }}
      >
        <span className={cx('mx-1 position-absolute')} style={defaultStyles}>
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
            <span className="text-truncate text-slate-12">{title}</span>
            <small className="text-slate-10 text-right px-1 ">{moment(logProps?.timestamp).fromNow()}</small>
          </span>
          <span
            className={cx('mx-1', {
              'text-tomato-9': !logProps?.isQuerySuccessLog,
              'color-light-green': logProps?.isQuerySuccessLog,
            })}
          >
            {message}
          </span>
        </span>
      </p>

      {open && (
        <JSONTreeViewer
          data={logProps.error}
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

export default Logs;
