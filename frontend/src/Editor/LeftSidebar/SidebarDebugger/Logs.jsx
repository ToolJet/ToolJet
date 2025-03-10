import React from 'react';
import { capitalize, startCase } from 'lodash';
import moment from 'moment';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useEditorActions, useEditorStore } from '@/_stores/editorStore';

function Logs({ logProps, idx }) {
  const [open, setOpen] = React.useState(false);
  let titleLogType = logProps?.type !== 'event' ? logProps?.type : '';
  if (titleLogType === 'transformations') {
    titleLogType = 'query';
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
          logProps?.error?.message.trim()
        }`;

  const defaultStyles = {
    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    transition: '0.2s all',
    display: logProps?.isQuerySuccessLog || logProps.type === 'navToDisablePage' ? 'none' : 'inline-block',
    cursor: 'pointer',
    top: '8px',
    pointerEvents: logProps?.isQuerySuccessLog || logProps.type === 'navToDisablePage' ? 'none' : 'default',
  };

  const { setSelectedComponents } = useEditorActions();

  const handleSelectComponentOnEditor = (componentId) => {
    const isAlreadySelected = useEditorStore
      .getState()
      ?.selectedComponents.find((component) => component.id === componentId);

    if (!isAlreadySelected) {
      const currentPageId = useEditorStore.getState()?.currentPageId;
      const currentPageComponents = useEditorStore.getState()?.appDefinition[currentPageId]?.components;
      const component = currentPageComponents?.find((comp) => comp.id === componentId);

      setSelectedComponents([{ id: componentId, component }], false);
    }
  };

  const callbackActions = [
    {
      for: 'all',
      actions: [{ name: 'Select Widget', dispatchAction: handleSelectComponentOnEditor, icon: false, onSelect: true }],
      enableForAllChildren: true,
      enableFor1stLevelChildren: true,
    },
  ];

  const renderNavToDisabledPageMessage = () => {
    const text = message.split(logProps.page);
    return (
      <div className="d-flex">
        <span className={cx('mx-1 text-tomato-9')}>
          {text[0]}
          <small className="text-slate-12" style={{ fontSize: '14px' }}>{`'${logProps.page}'`}</small>
          {text[1]}
        </span>
        <small className="text-slate-10 text-right px-1 " style={{ width: '115px' }}>
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
          setOpen((prev) => !prev);
        }}
        style={{ pointerEvents: logProps?.isQuerySuccessLog ? 'none' : 'default', position: 'relative' }}
      >
        <span className={cx('position-absolute')} style={defaultStyles}>
          <SolidIcon name="rightarrrow" fill={`var(--icons-strong)`} width="16" />
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
              <div className={`d-flex justify-content-between align-items-center ${!open && 'text-truncate'}`}>
                <span
                  className={` cursor-pointer debugger-error-title ${!open && 'text-truncate'} ${
                    logProps?.errorTarget == 'Custom Log' && logProps?.logLevel == 'error' && 'text-tomato-9'
                  }`}
                >
                  <HighlightSecondWord text={title} />
                </span>
              </div>
              <span
                className={cx('mx-1', {
                  'text-tomato-9': !logProps?.isQuerySuccessLog,
                  'color-light-green': logProps?.isQuerySuccessLog,
                })}
              >
                {message}
                {logProps?.error?.lineNumber ? `, Line ${logProps.error.lineNumber}` : ''}
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
