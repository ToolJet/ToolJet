import React from 'react';
import PropTypes from 'prop-types';
import { useResolveStore } from '@/_stores/resolverStore';
import { shallow } from 'zustand/shallow';
import './styles.scss';
import SingleLineCodeEditor from './SingleLineCodeEditor';
import MultiLineCodeEditor from './MultiLineCodeEditor';
import usePortal from '@/_hooks/use-portal';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { isNumber } from 'lodash';
import { Alert } from '@/_ui/Alert/Alert';
import TJDBCodeEditor from './TJDBHinter';

const CODE_EDITOR_TYPE = {
  fxEditor: SingleLineCodeEditor.EditorBridge,
  basic: SingleLineCodeEditor,
  multiline: MultiLineCodeEditor,
  extendedSingleLine: SingleLineCodeEditor,
  tjdbHinter: TJDBCodeEditor,
};

const CodeHinter = ({ type = 'basic', initialValue, componentName, disabled, renderCopilot, ...restProps }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const [isOpen, setIsOpen] = React.useState(false);

  const handleTogglePopupExapand = () => {
    const changeOpen = (newOpen) => {
      setIsOpen(newOpen);
      if (typeof restProps?.popOverCallback === 'function') restProps?.popOverCallback(newOpen);
    };

    if (!isOpen) {
      changeOpen(true);
    }

    return new Promise((resolve) => {
      const element = document.getElementsByClassName('portal-container');
      if (element) {
        const checkPortalExits = element[0]?.classList.contains(componentName);

        if (checkPortalExits === false) {
          const parent = element[0].parentNode;
          parent.removeChild(element[0]);
        }

        changeOpen(false);
        resolve();
      }
    }).then(() => {
      changeOpen(true);
      forceUpdate();
    });
  };
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const RenderCodeEditor = CODE_EDITOR_TYPE[type];

  return (
    <RenderCodeEditor
      renderCopilot={renderCopilot}
      type={type}
      initialValue={initialValue}
      darkMode={darkMode}
      portalProps={{
        isOpen,
        setIsOpen,
        handleTogglePopupExapand,
        forceUpdate,
      }}
      componentName={componentName}
      disabled={disabled}
      {...restProps}
    />
  );
};

const Portal = ({ children, ...restProps }) => {
  const renderPortal = usePortal({ children, ...restProps });

  return <React.Fragment>{renderPortal}</React.Fragment>;
};

const PopupIcon = ({ callback, icon, tip, position, isMultiEditor = false, isQueryManager = false }) => {
  const size = 16;
  const topRef = isNumber(position?.height) ? Math.floor(position?.height) - 30 : 32;
  let top = isMultiEditor ? 270 : topRef > 32 ? topRef : 0;
  // for query manager we allow the height of query manager to be dynamic, so we need to render the popup icon at the bottom of code editor
  const renderAtBottom = isQueryManager && (isMultiEditor || topRef > 32);

  return (
    <div
      className="d-flex justify-content-end w-100 position-absolute codehinter-popup-icon"
      style={renderAtBottom ? { bottom: '30px' } : { top: top }}
    >
      <OverlayTrigger
        trigger={['hover', 'focus']}
        placement="top"
        delay={{ show: 800, hide: 100 }}
        overlay={<Tooltip id="button-tooltip">{tip}</Tooltip>}
      >
        <img
          style={{ zIndex: 10000 }}
          className="svg-icon m-2 popup-btn"
          src={`assets/images/icons/${icon}.svg`}
          width={size}
          height={size}
          onClick={(e) => {
            e.stopPropagation();
            callback();
          }}
        />
      </OverlayTrigger>
    </div>
  );
};

const DepericatedAlertForWorkspaceVariable = ({ text }) => {
  return (
    <Alert
      svg="tj-info-warning"
      cls="codehinter workspace-variables-alert-banner p-1 mb-0 mt-2"
      data-cy={``}
      imgHeight={18}
      imgWidth={18}
    >
      <div className="d-flex align-items-center">
        <div class="">{text}</div>
      </div>
    </Alert>
  );
};

CodeHinter.Portal = Portal;
CodeHinter.PopupIcon = PopupIcon;
CodeHinter.DepericatedAlert = DepericatedAlertForWorkspaceVariable;

CodeHinter.propTypes = {
  type: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default CodeHinter;
