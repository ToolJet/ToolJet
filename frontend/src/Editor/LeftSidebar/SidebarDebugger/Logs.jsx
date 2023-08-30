import React from 'react';
import { capitalize, startCase } from 'lodash';
import moment from 'moment';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function Logs({ logProps, idx }) {
  const [open, setOpen] = React.useState(false);
  console.log('Debug debugger: open:', open);

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
    paddingTop: '8px',
  };

  return (
    <div className="tab-content debugger-content" key={`${logProps?.key}-${idx}`}>
      <p
        className="m-0 d-flex"
        onClick={(e) => {
          console.log('Debug debugger: setOpen:', e);
          setOpen((prev) => !prev);
        }}
        style={{ pointerEvents: logProps?.isQuerySuccessLog ? 'none' : 'default' }}
      >
        <span className={cx('position-absolute')} style={defaultStyles}>
          <SolidIcon name="cheveronright" width="16" />
        </span>
        <span className="w-100" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '20px' }}>
          <span className="d-flex justify-content-between align-items-center  text-truncate">
            <span className="text-truncate text-slate-12">{title}</span>
            <small className="text-slate-10 text-right">{moment(logProps?.timestamp).fromNow()}</small>
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
