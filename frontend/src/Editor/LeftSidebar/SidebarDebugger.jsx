import React, { useState } from 'react';
import Popover from '@/_ui/Popover';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import { LeftSidebarItem } from './SidebarItem';
import _ from 'lodash';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

export const LeftSidebarDebugger = ({
  darkMode,
  selectedSidebarItem,
  setSelectedSidebarItem,
  errors,
  debuggerActions,
  currentPageId,
  popoverContentHeight,
}) => {
  const { t } = useTranslation();
  const [pinned, setPinned] = useState(false);
  const [errorLogs, setErrorLogs] = React.useState([]);
  const [errorHistory, setErrorHistory] = React.useState({ appLevel: [], pageLevel: [] });
  const [unReadErrorCount, setUnReadErrorCount] = React.useState({ read: 0, unread: 0 });

  const clearErrorLogs = () => {
    setUnReadErrorCount(() => {
      return { read: 0, unread: 0 };
    });

    setErrorLogs(() => []);
    setErrorHistory(() => ({ appLevel: [], pageLevel: [] }));
  };

  React.useEffect(() => {
    if (currentPageId) {
      const olderPageErrorFromHistory = errorHistory.pageLevel[currentPageId] ?? [];
      const olderAppErrorFromHistory = errorHistory.appLevel ?? [];
      setErrorLogs(() => [...olderPageErrorFromHistory, ...olderAppErrorFromHistory]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

  React.useEffect(() => {
    const newError = _.flow([
      Object.entries,
      // eslint-disable-next-line no-unused-vars
      (arr) => arr.filter(([key, value]) => value.data?.status),
      Object.fromEntries,
    ])(errors);

    const newErrorLogs = debuggerActions.generateErrorLogs(newError);
    const newPageLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'page_level');
    const newAppLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'app_level');

    if (newErrorLogs) {
      setErrorLogs((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));

        return [...newAppLevelErrorLogs, ...newPageLevelErrorLogs, ...copy];
      });

      setErrorHistory((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));

        return {
          appLevel: [...newAppLevelErrorLogs, ...copy.appLevel],
          pageLevel: {
            [currentPageId]: [...newPageLevelErrorLogs, ...(copy.pageLevel[currentPageId] ?? [])],
          },
        };
      });
    }
    debuggerActions.flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ errors })]);

  React.useEffect(() => {
    const unReadErrors = open ? 0 : errorLogs.length - unReadErrorCount.read;
    setUnReadErrorCount((prev) => {
      if (open) {
        return { read: errorLogs.length, unread: 0 };
      }
      return { ...prev, unread: unReadErrors };
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLogs.length, open]);

  const popoverContent = (
    <div>
      <HeaderSection darkMode={darkMode}>
        <HeaderSection.PanelHeader title="Debugger">
          <div className="d-flex justify-content-end">
            <Button onClick={clearErrorLogs} darkMode={darkMode} size="sm" styles={{ width: '76px' }}>
              <Button.Content title={'Clear'} iconSrc={'assets/images/icons/clear.svg'} direction="left" />
            </Button>
            <Button
              title={`${pinned ? 'Unpin' : 'Pin'}`}
              onClick={() => setPinned(!pinned)}
              darkMode={darkMode}
              size="sm"
              styles={{ width: '28px', padding: 0 }}
            >
              <Button.Content
                iconSrc={`assets/images/icons/editor/left-sidebar/pinned${pinned ? 'off' : ''}.svg`}
                direction="left"
              />
            </Button>
          </div>
        </HeaderSection.PanelHeader>
      </HeaderSection>

      <div className="card-body mb-5">
        {errorLogs.length === 0 && (
          <center className="p-2 text-muted">{t(`leftSidebar.Debugger.noErrors`, 'No errors found.')}</center>
        )}

        <div className="tab-content">
          {errorLogs.map((error, index) => (
            <LeftSidebarDebugger.ErrorLogs key={index} errorProps={error} idx={index} darkMode={darkMode} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Popover
      handleToggle={(open) => {
        if (!open) setSelectedSidebarItem('');
      }}
      {...(pinned && { open: true })}
      popoverContentClassName="p-0 sidebar-h-100-popover"
      side="right"
      popoverContent={popoverContent}
      popoverContentHeight={popoverContentHeight}
    >
      <LeftSidebarItem
        icon="debugger"
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => setSelectedSidebarItem('debugger')}
        className={`left-sidebar-item  left-sidebar-layout`}
        badge={true}
        count={unReadErrorCount.unread}
        tip="Debugger"
      />
    </Popover>
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
