import React, { useEffect, useState, useRef, useContext } from 'react';
import { useSpring, config, animated } from 'react-spring';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/theme/duotone-light.css';
import 'codemirror/theme/monokai.css';
import { onBeforeChange, handleChange } from './utils';
import { resolveReferences, hasCircularDependency, handleCircularStructureToJSON } from '@/_helpers/utils';
import useHeight from '@/_hooks/use-height-transition';
import usePortal from '@/_hooks/use-portal';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import { Select } from './Elements/Select';
import { Toggle } from './Elements/Toggle';
import { AlignButtons } from './Elements/AlignButtons';
import { TypeMapping } from './TypeMapping';
import { Number } from './Elements/Number';
import { BoxShadow } from './Elements/BoxShadow';
import FxButton from './Elements/FxButton';
import { ToolTip } from '../Inspector/Elements/Components/ToolTip';
import { toast } from 'react-hot-toast';
import { EditorContext } from '@/Editor/Context/EditorContextWrapper';
import { camelCase } from 'lodash';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { Alert } from '@/_ui/Alert/Alert';

const AllElements = {
  Color,
  Json,
  Toggle,
  Select,
  AlignButtons,
  Number,
  BoxShadow,
};

export function CodeHinter({
  initialValue,
  onChange,
  currentState,
  mode,
  theme,
  lineNumbers,
  placeholder,
  ignoreBraces,
  enablePreview,
  height,
  minHeight,
  lineWrapping,
  componentName = null,
  usePortalEditor = true,
  className,
  width = '',
  paramName,
  paramLabel,
  type,
  fieldMeta,
  onFxPress,
  fxActive,
  component,
  popOverCallback,
  cyLabel = '',
  callgpt = () => null,
  isCopilotEnabled = false,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const options = {
    lineNumbers: lineNumbers ?? false,
    lineWrapping: lineWrapping ?? true,
    singleLine: true,
    mode: mode || 'handlebars',
    tabSize: 2,
    theme: theme ? theme : darkMode ? 'monokai' : 'default',
    readOnly: false,
    highlightSelectionMatches: true,
    placeholder,
  };

  const [realState, setRealState] = useState(currentState);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [isFocused, setFocused] = useState(false);
  const [heightRef, currentHeight] = useHeight();
  const isPreviewFocused = useRef(false);
  const wrapperRef = useRef(null);

  // Todo: Remove this when workspace variables are deprecated
  const isWorkspaceVariable =
    typeof currentValue === 'string' && (currentValue.includes('%%client') || currentValue.includes('%%server'));

  const slideInStyles = useSpring({
    config: { ...config.stiff },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? currentHeight + (isWorkspaceVariable ? 30 : 0) : 0,
    },
  });
  const { t } = useTranslation();

  const { variablesExposedForPreview } = useContext(EditorContext);

  const prevCountRef = useRef(false);

  useEffect(() => {
    setRealState(currentState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        return;
      }
      if (wrapperRef.current && isFocused && !wrapperRef.current.contains(event.target) && prevCountRef.current) {
        isPreviewFocused.current = false;
        setFocused(false);
        prevCountRef.current = false;
      } else if (isFocused) {
        prevCountRef.current = true;
      } else if (!isFocused && prevCountRef.current) prevCountRef.current = false;
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef, isFocused, isPreviewFocused, currentValue, prevCountRef, isOpen]);

  function valueChanged(editor, onChange, ignoreBraces) {
    if (editor.getValue()?.trim() !== currentValue) {
      handleChange(editor, onChange, ignoreBraces, realState, componentName);
      setCurrentValue(editor.getValue()?.trim());
    }
  }

  const getPreviewContent = (content, type) => {
    try {
      switch (type) {
        case 'object':
          return JSON.stringify(content);
        case 'boolean':
          return content.toString();
        default:
          return content;
      }
    } catch (e) {
      return undefined;
    }
  };

  const focusPreview = () => (isPreviewFocused.current = true);
  const unFocusPreview = () => (isPreviewFocused.current = false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getCustomResolvables = () => {
    if (variablesExposedForPreview.hasOwnProperty(component?.id)) {
      if (component?.component?.component === 'Table' && fieldMeta?.name) {
        return {
          ...variablesExposedForPreview[component?.id],
          cellValue: variablesExposedForPreview[component?.id]?.rowData?.[fieldMeta?.name],
          rowData: { ...variablesExposedForPreview[component?.id]?.rowData },
        };
      }
      return variablesExposedForPreview[component.id];
    }
    return {};
  };

  const getPreview = () => {
    if (!enablePreview) return;
    const customResolvables = getCustomResolvables();
    const [preview, error] = resolveReferences(currentValue, realState, null, customResolvables, true, true);
    const themeCls = darkMode ? 'bg-dark  py-1' : 'bg-light  py-1';

    if (error) {
      const err = String(error);
      const errorMessage = err.includes('.run()') ? `${err} in ${componentName.split('::')[0]}'s field` : err;
      return (
        <animated.div className={isOpen ? themeCls : null} style={{ ...slideInStyles, overflow: 'hidden' }}>
          <div ref={heightRef} className="dynamic-variable-preview bg-red-lt px-1 py-1">
            <div>
              <div className="heading my-1">
                <span>Error</span>
              </div>
              {errorMessage}
            </div>
          </div>
        </animated.div>
      );
    }

    let previewType = typeof preview;
    let previewContent = preview;

    if (hasCircularDependency(preview)) {
      previewContent = JSON.stringify(preview, handleCircularStructureToJSON());
      previewType = typeof previewContent;
    }
    const content = getPreviewContent(previewContent, previewType);

    return (
      <animated.div
        className={isOpen ? themeCls : null}
        style={{ ...slideInStyles, overflow: 'hidden' }}
        onMouseEnter={() => focusPreview()}
        onMouseLeave={() => unFocusPreview()}
      >
        <div ref={heightRef} className="dynamic-variable-preview bg-green-lt px-1 py-1">
          <div>
            <div className="d-flex my-1">
              <div className="flex-grow-1" style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                {previewType}
              </div>
              {isFocused && (
                <div className="preview-icons">
                  <CodeHinter.PopupIcon callback={() => copyToClipboard(content)} icon="copy" tip="Copy to clipboard" />
                </div>
              )}
            </div>
            {content}
          </div>
        </div>
        {/* Todo: Remove this when workspace variables are deprecated */}
        {enablePreview && <CodeHinter.DepericatedAlerForWorkspaceVariable text={'Deprecating soon'} />}
      </animated.div>
    );
  };
  enablePreview = enablePreview ?? true;

  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = () => {
    const changeOpen = (newOpen) => {
      setIsOpen(newOpen);
      if (typeof popOverCallback === 'function') popOverCallback(newOpen);
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

  const defaultClassName =
    className === 'query-hinter' || className === 'custom-component' || undefined ? '' : 'code-hinter';

  const ElementToRender = AllElements[TypeMapping[type]];

  const [forceCodeBox, setForceCodeBox] = useState(fxActive);
  const codeShow = (type ?? 'code') === 'code' || forceCodeBox;
  cyLabel = paramLabel ? paramLabel.toLowerCase().trim().replace(/\s+/g, '-') : cyLabel;
  return (
    <div ref={wrapperRef} className={cx({ 'codeShow-active': codeShow })}>
      {/* Todo: Remove this when workspace variables are deprecated */}
      {!enablePreview && (
        <CodeHinter.DepericatedAlerForWorkspaceVariable text={' Workspace variable deprecating soon'} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {paramLabel && (
          <div className={`mb-2 field ${options.className}`} data-cy={`${cyLabel}-widget-parameter-label`}>
            <ToolTip
              label={t(`widget.commonProperties.${camelCase(paramLabel)}`, paramLabel)}
              meta={fieldMeta}
              labelClass={`form-label ${darkMode && 'color-whitish-darkmode'}`}
            />
          </div>
        )}
        <div className={`col-auto ${(type ?? 'code') === 'code' ? 'd-none' : ''} `}>
          <div style={{ width: width, display: codeShow ? 'flex' : 'none', marginTop: '-1px' }}>
            <FxButton
              active={true}
              onPress={() => {
                setForceCodeBox(false);
                onFxPress(false);
              }}
              dataCy={cyLabel}
            />
          </div>
        </div>
      </div>
      <div
        className={`row${height === '150px' || height === '300px' ? ' tablr-gutter-x-0' : ''} custom-row`}
        style={{ width: width, display: codeShow ? 'flex' : 'none' }}
      >
        <div className={`col code-hinter-col`} style={{ marginBottom: '0.5rem' }}>
          <div className="code-hinter-wrapper" style={{ width: '100%', backgroundColor: darkMode && '#272822' }}>
            <div
              className={`${defaultClassName} ${className || 'codehinter-default-input'}`}
              key={componentName}
              style={{
                height: height || 'auto',
                minHeight,
                maxHeight: '320px',
                overflow: 'auto',
                fontSize: ' .875rem',
              }}
              data-cy={`${cyLabel}-input-field`}
            >
              {usePortalEditor && (
                <CodeHinter.PopupIcon
                  callback={handleToggle}
                  icon="portal-open"
                  tip="Pop out code editor into a new window"
                  transformation={componentName === 'transformation'}
                />
              )}
              <CodeHinter.Portal
                isCopilotEnabled={isCopilotEnabled}
                isOpen={isOpen}
                callback={setIsOpen}
                componentName={componentName}
                key={componentName}
                customComponent={getPreview}
                forceUpdate={forceUpdate}
                optionalProps={{ styles: { height: 300 }, cls: className }}
                darkMode={darkMode}
                selectors={{ className: 'preview-block-portal' }}
                dragResizePortal={true}
                callgpt={callgpt}
              >
                <CodeMirror
                  value={typeof initialValue === 'string' ? initialValue : ''}
                  realState={realState}
                  scrollbarStyle={null}
                  height={'100%'}
                  onFocus={() => setFocused(true)}
                  onBlur={(editor, e) => {
                    e.stopPropagation();
                    const value = editor.getValue()?.trimEnd();
                    onChange(value);
                    if (!isPreviewFocused.current) {
                      setFocused(false);
                    }
                  }}
                  onChange={(editor) => valueChanged(editor, onChange, ignoreBraces)}
                  onBeforeChange={(editor, change) => onBeforeChange(editor, change, ignoreBraces)}
                  options={options}
                  viewportMargin={Infinity}
                />
              </CodeHinter.Portal>
            </div>
            {enablePreview && !isOpen && getPreview()}
          </div>
        </div>
      </div>
      {!codeShow && (
        <div style={{ display: !codeShow ? 'block' : 'none' }}>
          <ElementToRender
            value={resolveReferences(initialValue, realState)}
            onChange={(value) => {
              if (value !== currentValue) {
                onChange(value);
                setCurrentValue(value);
              }
            }}
            paramName={paramName}
            paramLabel={paramLabel}
            forceCodeBox={() => {
              setForceCodeBox(true);
              onFxPress(true);
            }}
            meta={fieldMeta}
            cyLabel={cyLabel}
          />
        </div>
      )}
    </div>
  );
}

const PopupIcon = ({ callback, icon, tip, transformation = false }) => {
  const size = transformation ? 20 : 12;

  return (
    <div className="d-flex justify-content-end" style={{ position: 'relative' }}>
      <OverlayTrigger
        trigger={['hover', 'focus']}
        placement="top"
        delay={{ show: 800, hide: 100 }}
        overlay={<Tooltip id="button-tooltip">{tip}</Tooltip>}
      >
        <img
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

const Portal = ({ children, ...restProps }) => {
  const renderPortal = usePortal({ children, ...restProps });

  return <React.Fragment>{renderPortal}</React.Fragment>;
};

const DepericatedAlerForWorkspaceVariable = ({ text }) => {
  return (
    <Alert
      svg="tj-info-warnning"
      cls="codehinter workspace-variables-alert-banner p-1 mb-0"
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

CodeHinter.PopupIcon = PopupIcon;
CodeHinter.Portal = Portal;
CodeHinter.DepericatedAlerForWorkspaceVariable = DepericatedAlerForWorkspaceVariable;
