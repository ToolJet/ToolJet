import React from 'react';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import _ from 'lodash';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

export const LeftSidebarDebugger = ({ darkMode, errors, clearErrorLogs, setPinned, pinned }) => {
  const { t } = useTranslation();

  return (
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
        {errors.length === 0 && (
          <center className="p-2 text-muted">{t(`leftSidebar.Debugger.noErrors`, 'No errors found.')}</center>
        )}

        <div className="tab-content">
          {errors.map((error, index) => (
            <LeftSidebarDebugger.ErrorLogs key={index} errorProps={error} idx={index} darkMode={darkMode} />
          ))}
        </div>
      </div>
    </div>
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

LeftSidebarDebugger.ErrorLogs = ErrorLogsComponent;
