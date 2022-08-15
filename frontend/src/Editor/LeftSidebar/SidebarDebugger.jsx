import React from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import ReactJson from 'react-json-view';
import _ from 'lodash';
import moment from 'moment';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

export const LeftSidebarDebugger = ({ darkMode, errors, debuggerActions }) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);
  const [currrentTab, setCurrentTab] = React.useState(1);
  const [errorLogs, setErrorLogs] = React.useState([]);
  const [unReadErrorCount, setUnReadErrorCount] = React.useState({ read: 0, unread: 0 });

  const switchCurrentTab = (tab) => {
    setCurrentTab(tab);
  };

  const clearErrorLogs = () => {
    setUnReadErrorCount(() => {
      return { read: 0, unread: 0 };
    });

    setErrorLogs(() => []);
  };

  const createErrorLogs = (errors) => {
    const errorsArr = [];
    Object.entries(errors).forEach(([key, value]) => {
      const error = {};
      const generalProps = {
        timestamp: moment(),
      };

      const $type =
        value.type === 'query' && (value.kind === 'restapi' || value.kind === 'runjs') ? value.kind : value.type;

      // console.log('createErrorLogs [[type]]', $type);

      switch ($type) {
        case 'restapi':
          generalProps.kind = value.kind;
          generalProps.message = value.data.message;
          generalProps.description = value.data.description;
          error.substitutedVariables = value.options;
          error.request = value.data.data.requestObject;
          error.response = value.data.data.responseObject;

          break;

        case 'runjs':
          generalProps.kind = value.kind;
          error.message = value.data.data.message;
          error.description = value.data.data.description;

          break;

        case 'query':
          generalProps.kind = value.kind;
          error.message = value.data.message;
          error.description = value.data.description;
          error.substitutedVariables = value.options;
          break;

        case 'transformations':
          generalProps.message = value.data.message;
          error.data = value.data.data;
          break;

        case 'component':
          generalProps.message = value.data.message;
          generalProps.property = key.split('- ')[1];
          error.resolvedProperties = value.resolvedProperties;
          error.effectiveProperties = value.effectiveProperties;
          break;

        default:
          break;
      }
      errorsArr.push({
        key,
        type: value.type,
        error,
        ...generalProps,
      });
    });
    return errorsArr;
  };

  React.useEffect(() => {
    const newError = _.flow([
      Object.entries,
      // eslint-disable-next-line no-unused-vars
      (arr) => arr.filter(([key, value]) => value.data?.status),
      Object.fromEntries,
    ])(errors);

    const err = createErrorLogs(newError);

    if (err) {
      setErrorLogs((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));

        return [...err, ...copy];
      });
    }
    debuggerActions.flush();
  }, [JSON.stringify(errors)]);

  // React.useEffect(() => {
  //   setErrorLogs((prev) => {
  //     let copy = JSON.parse(JSON.stringify(prev));
  //     copy = copy.filter((val) => Object.keys(val).length !== 0);

  //     const newError = _.flow([
  //       Object.entries,
  //       // eslint-disable-next-line no-unused-vars
  //       (arr) => arr.filter(([key, value]) => value.data?.status),
  //       Object.fromEntries,
  //     ])(errors);

  //     const errorData = [];
  //     Object.entries(newError).forEach(([key, value]) => {
  //       const variableNames = {
  //         options: '',
  //         response: '',
  //         request: '',
  //         resolvedProperties: '',
  //         effectiveProperties: '',
  //       };

  //       switch (value.type) {
  //         case 'query':
  //           variableNames.options = 'substitutedVariables';
  //           variableNames.response = 'response';
  //           if (value.kind === 'restapi') {
  //             variableNames.request = 'request';
  //           }
  //           break;

  //         case 'transformations':
  //           variableNames.response = 'data';
  //           break;

  //         case 'component':
  //           variableNames.resolvedProperties = 'resolvedProperties';
  //           variableNames.effectiveProperties = 'propertiesAfterUsingDefaults';
  //           break;

  //         default:
  //           'options';
  //       }
  //       errorData.push({
  //         type: value.type,
  //         key: key,
  //         kind: value.kind,
  //         message: value.data.message,
  //         description: value.data.description,
  //         options: { name: variableNames.options, data: value.options },
  //         resolvedProperties: value.resolvedProperties,
  //         effectiveProperties: value.effectiveProperties,
  //         response: {
  //           name: variableNames.response,
  //           data: value.kind === 'restapi' ? value.data.data.responseObject : value.data.data,
  //         },
  //         request: { name: variableNames.request, data: value.data?.data?.requestObject ?? {} },
  //         timestamp: moment(),
  //       });
  //     });

  //     console.log('Debugger', errorData);

  //     const newData = [...errorData, ...copy];
  //     return newData;
  //   });
  //   debuggerActions.flush();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [JSON.stringify(errors)]);

  React.useEffect(() => {
    if (open === false && errorLogs.length !== unReadErrorCount.read) {
      const unReadErrors = errorLogs.length - unReadErrorCount.read;
      setUnReadErrorCount((prev) => {
        let copy = JSON.parse(JSON.stringify(prev));
        copy.unread = unReadErrors;
        return copy;
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
    } else {
      setUnReadErrorCount((prev) => {
        let copy = JSON.parse(JSON.stringify(prev));
        copy.read = errorLogs.length;
        copy.unread = 0;
        return copy;
      });
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
        // style={{ minWidth: '350px', minHeight: '108px', resize: 'horizontal', maxWidth: '50%' }}
        style={{ resize: 'horizontal', maxWidth: '60%', minWidth: '422px' }}
      >
        <div className="row-header">
          <div className="nav-header">
            <ul className="nav nav-tabs d-flex justify-content-between" data-bs-toggle="tabs">
              <li className="nav-item">
                <a onClick={() => switchCurrentTab(1)} className={currrentTab === 1 ? 'nav-link active' : 'nav-link'}>
                  Errors
                </a>
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

        {currrentTab === 1 && (
          <div className="card-body">
            {errorLogs.length === 0 && <center className="p-2 text-muted">No errors found.</center>}

            <div className="tab-content">
              {errorLogs.map((error, index) => (
                <LeftSidebarDebugger.ErrorLogs key={index} errorProps={error} idx={index} darkMode={darkMode} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

function ErrorLogsComponent({ errorProps, idx, darkMode }) {
  const [open, setOpen] = React.useState(false);

  const errorTitle = ` [${_.capitalize(errorProps.type)} ${errorProps.key}]`;
  const errorDescription = errorProps.description;
  const errorMessage =
    errorProps.type === 'component'
      ? `Invalid property detected: ${errorProps.message}.`
      : `${_.startCase(errorProps.type)} failed: ${errorProps.message ?? ''}`;

  console.log('finalError', errorProps.timestamp);
  const defaultStyles = {
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: 'inline-block',
    cursor: 'pointer',
  };

  return (
    <div className="tab-content debugger-content mb-1" key={`${errorProps.key}-${idx}`}>
      <p className="text-azure m-0 " onClick={() => setOpen((prev) => !prev)}>
        <span className="json-tree-node-icon" style={defaultStyles}>
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

      {/* <ReactJson
        src={finalError}
        theme={darkMode ? 'shapeshifter' : 'rjv-default'}
        name={errorTitle}
        style={{ fontSize: '0.7rem', paddingLeft: '0.17rem' }}
        enableClipboard={false}
        displayDataTypes={false}
        collapsed={1}
        displayObjectSize={false}
        quotesOnKeys={false}
        sortKeys={false}
      /> */}
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
