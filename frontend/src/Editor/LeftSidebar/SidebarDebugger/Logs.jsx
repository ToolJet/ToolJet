import React from 'react';
import { capitalize, startCase } from 'lodash';
import moment from 'moment';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import { toast } from 'react-hot-toast';

function Logs({ logProps, idx }) {
  const [open, setOpen] = React.useState(false);
  let titleLogType = logProps?.type !== 'event' ? logProps?.type : '';
  if (titleLogType === 'transformations') {
    titleLogType = 'Transformation';
  }
  const title = logProps?.key;
  const message =
    logProps?.type === 'navToDisablePage'
      ? logProps?.message
      : logProps?.isQuerySuccessLog
      ? 'Completed'
      : logProps?.type === 'component'
      ? `Invalid property detected: ${logProps?.message}.`
      : logProps?.type === 'Custom Log'
      ? logProps?.description
      : `${startCase(logProps?.type)} failed: ${
          logProps?.description ||
          (isString(logProps?.message) && logProps?.message) ||
          (isString(logProps?.error?.description) && logProps?.error?.description) || //added string check since description can be an object. eg: runpy
          logProps?.error?.message
        }`;

  const defaultStyles = {
    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    transition: '0.2s all',
    display: logProps?.isQuerySuccessLog || logProps.type === 'navToDisablePage' ? 'none' : 'inline-block',
    cursor: 'pointer',
    top: '8px',
    pointerEvents: logProps?.isQuerySuccessLog || logProps.type === 'navToDisablePage' ? 'none' : 'default',
  };

  const setSelectedComponents = useStore.getState().setSelectedComponents;

  const handleSelectComponentOnEditor = (componentId) => {
    const selectedComponents = useStore.getState()?.selectedComponents;
    const isAlreadySelected = selectedComponents.find((component) => component.id === componentId);

    if (!isAlreadySelected) {
      const currentPageComponents = useStore.getState()?.getCurrentPageComponents();
      const component = currentPageComponents[componentId];

      component && setSelectedComponents([{ id: componentId, component }], false);
    }
  };

  const copyToClipboard = (data) => {
    const stringified = JSON.stringify(data, null, 2).replace(/\\/g, '');
    navigator.clipboard.writeText(stringified);
    return toast.success('Value copied to clipboard', { position: 'top-center' });
  };

  const callbackActions = [
    {
      for: 'all',
      actions: [
        { name: 'Copy value', dispatchAction: copyToClipboard, icon: false },
        { name: 'Select Widget', dispatchAction: handleSelectComponentOnEditor, icon: false, onSelect: true },
      ],
      enableForAllChildren: true,
      enableFor1stLevelChildren: true,
    },
  ];

  const renderNavToDisabledPageMessage = () => {
    return (
      <div className="d-flex">
        <span className={cx('text-tomato-9')}>{message}</span>
        <small className="text-slate-10 text-right  " style={{ width: '115px' }}>
          {moment(logProps?.timestamp).fromNow()}
        </small>
      </div>
    );
  };

  return (
    <div className="tab-content debugger-content" key={`${logProps?.key}-${idx}`}>
      <p
        className="m-0 d-flex"
        onClick={(e) => {
          logProps?.type !== 'Custom Log' && setOpen((prev) => !prev);
        }}
        style={{ pointerEvents: logProps?.isQuerySuccessLog ? 'none' : 'default', position: 'relative' }}
      >
        <span className={cx('position-absolute')} style={defaultStyles}>
          {logProps?.type !== 'Custom Log' && <SolidIcon name="rightarrrow" fill={`var(--icons-strong)`} width="16" />}
        </span>
        <span className="w-100" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '20px' }}>
          {logProps.type === 'navToDisablePage' ? (
            renderNavToDisabledPageMessage()
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between">
                <div className="error-target cursor-pointer">{logProps?.errorTarget}</div>
                <small className="text-slate-10 text-right ">{moment(logProps?.timestamp).fromNow()}</small>
              </div>
              {logProps?.type === 'Custom Log' && (
                <div className="error-target-custom-log cursor-pointer">
                  <SolidIcon name="code" fill={`var(--purple11)`} width="15" /> Custom Log
                </div>
              )}
              <div
                className={`d-flex justify-content-between align-items-center ${
                  !open && logProps?.type !== 'Custom Log' && 'text-truncate'
                }`}
              >
                <span
                  className={` cursor-pointer debugger-error-title font-weight-500 ${
                    !open && logProps?.type !== 'Custom Log' && 'text-truncate'
                  } ${logProps?.type == 'Custom Log' && logProps?.logLevel == 'error' && 'text-tomato-9'}`}
                >
                  <HighlightSecondWord text={title} />
                </span>
              </div>
              {logProps?.type == 'Custom Log' && <div className="font-weight-500">{message}</div>}
              <span
                className={cx('font-weight-500', {
                  'text-tomato-9': !logProps?.isQuerySuccessLog,
                  'color-light-green': logProps?.isQuerySuccessLog,
                })}
              >
                {logProps?.type !== 'Custom Log' && message}
              </span>
            </>
          )}
        </span>
      </p>

      {open && (
        <JSONTreeViewer
          data={logProps.error}
          useIcons={false}
          useIndentedBlock={true}
          enableCopyToClipboard={false}
          useActions={true}
          actionIdentifier="id"
          expandWithLabels={true}
          fontSize={'10px'}
          actionsList={callbackActions}
          treeType="debugger"
        />
      )}
      <hr className="border-1 border-bottom bg-grey" />
    </div>
  );
}

let isString = (value) => typeof value === 'string' || value instanceof String;

export default Logs;

const HighlightSecondWord = ({ text }) => {
  const processedText = text.split(/(\[.*?\])/).map((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const content = segment.slice(1, -1).split(' ');
      const firstWord = content[0];
      const secondWord = content[1];

      return (
        <span key={index}>
          [{firstWord} <b>{secondWord}</b>]
        </span>
      );
    }
    return segment;
  });

  return <span>{processedText}</span>;
};
