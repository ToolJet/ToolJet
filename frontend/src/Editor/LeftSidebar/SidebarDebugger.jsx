import React from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import _ from 'lodash';
import moment from 'moment';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

export const LeftSidebarDebugger = ({ darkMode, errors, debuggerActions }) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);
  const [errorLogs, setErrorLogs] = React.useState([]);
  const [unReadErrorCount, setUnReadErrorCount] = React.useState({ read: 0, unread: 0 });

  const clearErrorLogs = () => {
    setUnReadErrorCount(() => {
      return { read: 0, unread: 0 };
    });

    setErrorLogs(() => []);
  };

  React.useEffect(() => {
    const newError = _.flow([
      Object.entries,
      // eslint-disable-next-line no-unused-vars
      (arr) => arr.filter(([key, value]) => value.data?.status),
      Object.fromEntries,
    ])(errors);

    const newErrorLogs = debuggerActions.generateErrorLogs(newError);

    if (newErrorLogs) {
      setErrorLogs((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));

        return [...newErrorLogs, ...copy];
      });
    }
    debuggerActions.flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(errors)]);

  React.useEffect(() => {
    const unReadErrors = open ? 0 : errorLogs.length - unReadErrorCount.read;
    setUnReadErrorCount((prev) => {
      if (open) {
        return { read: errorLogs.length, unread: 0 };
      }
      return { ...prev, unread: unReadErrors };
    });

    if (popoverPinned) {
      setTimeout(() => {
        setUnReadErrorCount((prev) => {
          let copy = JSON.parse(JSON.stringify(prev));
          copy.read = errorLogs.length;
          copy.unread = 0;

          return copy;
        });
      }, 900);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLogs.length, open]);

  return (
    <>
      <LeftSidebarItem
        tip="Debugger"
        {...trigger}
        icon="debugger"
        className={`left-sidebar-item  left-sidebar-layout ${open && 'active'}`}
        badge={true}
        count={unReadErrorCount.unread}
        text={'Debugger'}
      />
      <div
        {...content}
        className={`card popover debugger-popover ${open || popoverPinned ? 'show' : 'hide'}`}
        style={{ resize: 'horizontal', maxWidth: '60%', minWidth: '422px' }}
      >
        <div className="row-header">
          <div className="nav-header">
            <ul className="nav nav-tabs d-flex justify-content-between" data-bs-toggle="tabs">
              <li className="nav-item">
                <a className="nav-link active">Errors</a>
              </li>
              <li className="btn-group">
                {errorLogs.length > 0 && (
                  <button
                    onClick={clearErrorLogs}
                    type="button"
                    className="btn btn-light btn-sm m-1 py-1"
                    aria-label="clear button"
                  >
                    <span className="text-muted">clear</span>
                  </button>
                )}
                <SidebarPinnedButton
                  darkMode={darkMode}
                  component={'Debugger'}
                  state={popoverPinned}
                  updateState={updatePopoverPinnedState}
                />
              </li>
            </ul>
          </div>
        </div>

        <div className="card-body">
          {errorLogs.length === 0 && <center className="p-2 text-muted">No errors found.</center>}

          <div className="tab-content">
            {errorLogs.map((error, index) => (
              <LeftSidebarDebugger.ErrorLogs key={index} errorProps={error} idx={index} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

function ErrorLogsComponent({ errorProps, idx, darkMode }) {
  const [open, setOpen] = React.useState(false);

  const errorTitle = ` [${_.capitalize(errorProps.type)} ${errorProps.key}]`;
  const errorMessage =
    errorProps.type === 'component'
      ? `Invalid property detected: ${errorProps.message}.`
      : `${_.startCase(errorProps.type)} failed: ${errorProps.message ?? ''}`;

  const defaultStyles = {
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: 'inline-block',
    cursor: 'pointer',
  };

  return (
    <div className="tab-content debugger-content mb-1" key={`${errorProps.key}-${idx}`}>
      <p className="text-azure m-0 " onClick={() => setOpen((prev) => !prev)}>
        <span className="mx-1" style={defaultStyles}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1.02063 1L5.01032 5.01028L1.00003 8.99997"
              stroke={darkMode ? '#fff' : '#61656F'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span>{errorTitle}</span>
        <span className="text-red mx-1">{errorMessage}</span>
        <small className="text-muted px-1">{moment(errorProps.timestamp).fromNow()}</small>
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

LeftSidebarDebugger.ErrorLogs = ErrorLogsComponent;
