import React, { useRef, useCallback } from 'react';
import { capitalize, startCase } from 'lodash';
import moment from 'moment';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useEditorActions, useEditorStore } from '@/_stores/editorStore';
import useDebugger from './useDebugger'; // Import the useDebugger hook
function Logs({ logProps, idx, switchPage }) {
  const [open, setOpen] = React.useState(false);
  let titleLogType = logProps?.type !== 'event' ? logProps?.type : '';
  // need to change the titleLogType to query for transformations because if transformation fails, it is eventually a query failure
  if (titleLogType === 'transformations') {
    titleLogType = 'query';
  }
  const childRef = useRef(null);
  const currentPageId = useEditorStore.getState().currentPageId;
  const title = `[${capitalize(titleLogType)}${titleLogType ? ' ' : ''}${logProps?.key}]`;
  const message =
    logProps?.type === 'navToDisablePage'
      ? logProps?.message
      : logProps?.isQuerySuccessLog
      ? 'Completed'
      : logProps?.type === 'component'
      ? `Invalid property detected: ${logProps?.message}.`
      : `${startCase(logProps?.type)} failed: ${
          logProps?.description ||
          logProps?.message ||
          (isString(logProps?.error?.description) && logProps?.error?.description) || //added string check since description can be an object. eg: runpy
          logProps?.error?.message
        }`;

  const defaultStyles = {
    transform: open ? 'rotate(-180deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: logProps?.isQuerySuccessLog || logProps.type === 'navToDisablePage' ? 'none' : 'inline-block',
    cursor: 'pointer',
    top: '8px',
    pointerEvents: logProps?.isQuerySuccessLog || logProps.type === 'navToDisablePage' ? 'none' : 'default',
  };

  const { setSelectedComponents } = useEditorActions();
  const { handleErrorClick, selectedError } = useDebugger({}); // Initialize the useDebugger hook and extract handleErrorClick

  console.log('selectedError---', selectedError);

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

  const onSelect = useCallback((data, currentNode, path) => {
    if (!childRef.current) return;

    const actions = childRef.current
      .getOnSelectLabelDispatchActions(currentNode, path)
      ?.filter((action) => action.onSelect);

    actions.forEach((action) => {
      action.dispatchAction(data, currentNode);
    });
  }, []);

  const handleClick = useCallback(async () => {
    handleErrorClick(logProps);

    if (logProps?.page?.id && logProps?.page?.id !== currentPageId && logProps.type === 'component') {
      try {
        await switchPage(logProps.page.id);
      } catch (error) {
        console.error('Error switching page:', error);
      }
    }

    switch (logProps.type) {
      case 'component':
        onSelect(logProps.error.componentId, 'componentId', ['componentId']);
        break;
      case 'query':
        onSelect(logProps.id, 'queries', ['queries']);
        break;
      default:
        console.warn(`Unhandled logProps type: ${logProps.type}`);
        onSelect(logProps.error.componentId, 'componentId', ['componentId']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logProps, currentPageId, onSelect]);

  return (
    <div className="tab-content debugger-content" key={`${logProps?.key}-${idx}`}>
      <p
        className="m-0 d-flex"
        style={{ pointerEvents: logProps?.isQuerySuccessLog ? 'none' : 'default', position: 'relative' }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={cx('position-absolute')} style={defaultStyles}>
          <SolidIcon name="downarrow" fill={`var(--icons-strong)`} width="16" />
        </span>
        <span className="w-100" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '20px' }}>
          {logProps.type === 'navToDisablePage' ? (
            renderNavToDisabledPageMessage()
          ) : (
            <>
              <span className="d-flex justify-content-between align-items-center text-truncate">
                <span
                  className="text-truncate text-slate-12 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent dropdown toggle
                    handleClick();
                  }}
                >
                  {title}
                </span>
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
          ref={childRef}
        />
      )}
      <hr className="border-1 border-bottom bg-grey" />
    </div>
  );
}

let isString = (value) => typeof value === 'string' || value instanceof String;

export default Logs;
