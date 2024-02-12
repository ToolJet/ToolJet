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
import { useCurrentState } from '@/_stores/currentStateStore';
import ClientServerSwitch from './Elements/ClientServerSwitch';
import { CodeHinterContext } from './CodeHinterContext';
import Switch from './Elements/Switch';
import Checkbox from './Elements/Checkbox';
import Slider from './Elements/Slider';
import { Input } from './Elements/Input';
import { Icon } from './Elements/Icon';
import { Visibility } from './Elements/Visibility';
import { NumberInput } from './Elements/NumberInput';
import { validateProperty } from '../component-properties-validation';

const HIDDEN_CODE_HINTER_LABELS = ['Table data', 'Column data', 'Text Format', 'TextComponentTextInput'];

const AllElements = {
  Color,
  Json,
  Toggle,
  Select,
  AlignButtons,
  Number,
  BoxShadow,
  ClientServerSwitch,
  Slider,
  Switch,
  Input,
  Checkbox,
  Icon,
  Visibility,
  NumberInput,
};

export function CodeHinter({
  initialValue,
  onChange,
  onVisibilityChange,
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
  currentState: _currentState,
  isIcon = false,
  inspectorTab,
  staticText,
}) {
  const context = useContext(CodeHinterContext);

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
  const currentState = useCurrentState();
  const [realState, setRealState] = useState({ ...currentState, ..._currentState, ...context });

  const [currentValue, setCurrentValue] = useState('');

  const [prevCurrentValue, setPrevCurrentValue] = useState(null);
  const [resolvedValue, setResolvedValue] = useState(null);
  const [resolvingError, setResolvingError] = useState(null);

  const [isFocused, setFocused] = useState(false);
  const [heightRef, currentHeight] = useHeight();
  const isPreviewFocused = useRef(false);
  const [isPropertyHovered, setPropertyHovered] = useState(false);
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

  function getPropertyDefinition(paramName, component) {
    if (component?.properties?.hasOwnProperty(`${paramName}`)) {
      return component.properties?.[paramName];
    } else if (component?.styles?.hasOwnProperty(`${paramName}`)) {
      return component?.styles?.[paramName];
    } else if (component?.general?.hasOwnProperty(`${paramName}`)) {
      return component?.general?.[paramName];
    } else if (component?.generalStyles?.hasOwnProperty(`${paramName}`)) {
      return component?.generalStyles?.[paramName];
    } else {
      return {};
    }
  }

  const checkTypeErrorInRunTime = (preview) => {
    const propertyDefinition = getPropertyDefinition(paramName, component?.component);
    const resolvedProperty = Object.keys(component?.component?.definition || {}).reduce((accumulator, currentKey) => {
      if (
        component?.component?.definition?.[currentKey]?.hasOwnProperty(paramName) ||
        (paramName === 'tooltip' &&
          currentKey === 'general' &&
          !component?.component?.definition?.[currentKey]?.hasOwnProperty(paramName))
        //added second condition because initilly general is empty object and hence it was not going inside if statement and thus codehinter was always receiving undefined for initial render and thus showing error message in the preview
      ) {
        accumulator[`${paramName}`] = resolveReferences(preview, currentState);
      }
      return accumulator;
    }, {});
    const [_valid, errorMessages] = validateProperty(resolvedProperty, propertyDefinition, paramName);
    return [_valid, errorMessages];
  };

  const getPreviewAndErrorFromValue = (value) => {
    const customResolvables = getCustomResolvables();
    const [preview, error] = resolveReferences(value, realState, null, customResolvables, true, true);
    return [preview, error];
  };

  useEffect(() => {
    setCurrentValue(initialValue);
    const [preview, error] = getPreviewAndErrorFromValue(initialValue);
    const [_valid] = checkTypeErrorInRunTime(preview);
    if (!_valid || error) setResolvingError(true);
    return () => {
      setPrevCurrentValue(null);
      setResolvedValue(null);
      setResolvingError(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const newState = { ...currentState, ..._currentState, ...context };
    setRealState(newState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([currentState.components, _currentState, context])]);

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

  const updatePreview = () => {
    let globalPreviewCopy = null;
    let globalErrorCopy = null;
    const [preview, error] = getPreviewAndErrorFromValue(currentValue);
    setPrevCurrentValue(currentValue);

    const [_valid, errorMessages] = checkTypeErrorInRunTime(preview);

    setPrevCurrentValue(currentValue);
    if (error || !_valid || typeof preview === 'function') {
      globalPreviewCopy = null;
      globalErrorCopy = error || errorMessages?.[errorMessages?.length - 1];
      setResolvingError(error || errorMessages?.[errorMessages?.length - 1]);
      setResolvedValue(null);
    } else {
      globalPreviewCopy = preview;
      globalErrorCopy = null;
      setResolvingError(null);
      setResolvedValue(preview);
    }

    return [globalPreviewCopy, globalErrorCopy];
  };

  useEffect(() => {
    let [globalPreviewCopy, globalErrorCopy] = enablePreview ? updatePreview() : [null, null];

    return () => {
      if (enablePreview) {
        setPrevCurrentValue(null);
        setResolvedValue(globalPreviewCopy);
        setResolvingError(globalErrorCopy);
      }
    };
  }, [JSON.stringify({ currentValue, realState, isFocused, context })]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [JSON.stringify({ currentValue, realState, isFocused, context })]);

  function valueChanged(editor, onChange, ignoreBraces) {
    if (editor.getValue()?.trim() !== currentValue) {
      handleChange(editor, onChange, ignoreBraces, realState, componentName, getCustomResolvables());
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
    const themeCls = darkMode ? 'bg-dark  py-1' : 'bg-light  py-1';
    const preview = resolvedValue;
    const error = resolvingError;

    if (resolvingError !== null && resolvedValue === null && error) {
      const err = String(error);
      const errorMessage = err.includes('.run()')
        ? `${err} in ${componentName ? componentName.split('::')[0] + "'s" : 'fx'} field`
        : err;
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
                <div className="preview-icons position-relative">
                  <CodeHinter.PopupIcon callback={() => copyToClipboard(content)} icon="copy" tip="Copy to clipboard" />
                </div>
              )}
            </div>
            {content}
          </div>
        </div>
        {/* Todo: Remove this when workspace variables are deprecated */}
        {enablePreview && isWorkspaceVariable && (
          <CodeHinter.DepericatedAlertForWorkspaceVariable text={'Deprecating soon'} />
        )}
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

  const fxBtn = () => (
    <div className="col-auto pt-0 fx-common">
      {!['Type', 'selectRowOnCellEdit', 'Select row on cell edit', ' ', 'Padding', 'Width'].includes(paramLabel) && ( //add some key if these extends
        <FxButton
          active={codeShow}
          onPress={() => {
            if (codeShow) {
              setForceCodeBox(false);
              onFxPress(false);
            } else {
              setForceCodeBox(true);
              onFxPress(true);
            }
          }}
          dataCy={cyLabel}
        />
      )}
    </div>
  );

  const _renderFxBtn = () => {
    if (inspectorTab === 'styles') {
      return isPropertyHovered || codeShow ? fxBtn() : null;
    } else {
      return fxBtn();
    }
  };

  const onFocusHandler = () => {
    setFocused(true);
    updatePreview();
  };

  return (
    <div
      ref={wrapperRef}
      className={cx({ 'codeShow-active': codeShow, 'd-flex': paramLabel == 'Tooltip' })}
      onMouseEnter={() => setPropertyHovered(true)}
      onMouseLeave={() => setPropertyHovered(false)}
    >
      <div
        className={cx('d-flex justify-content-between', { 'w-full': fieldMeta?.fullWidth })}
        style={{
          marginRight: paramLabel == 'Tooltip' && '40px',
          alignItems: paramLabel == 'Tooltip' ? 'flex-start' : 'center',
        }}
      >
        {paramLabel && !HIDDEN_CODE_HINTER_LABELS.includes(paramLabel) && (
          <div className={`field ${options.className}`} data-cy={`${cyLabel}-widget-parameter-label`}>
            <ToolTip
              label={t(`widget.commonProperties.${camelCase(paramLabel)}`, paramLabel)}
              meta={fieldMeta}
              labelClass={`tj-text-xsm color-slate12 ${codeShow ? 'label-hinter-margin' : 'mb-0'} ${
                darkMode && 'color-whitish-darkmode'
              }`}
            />
          </div>
        )}
        <div className={cx(`${(type ?? 'code') === 'code' ? 'd-none' : ''}`, { 'w-full': fieldMeta?.fullWidth })}>
          <div
            style={{ width: width, marginBottom: codeShow ? '0.5rem' : '0px' }}
            className={cx('d-flex align-items-center', { 'w-full': fieldMeta?.fullWidth })}
          >
            {!fieldMeta?.isFxNotRequired && _renderFxBtn()}
            {!codeShow && (
              <ElementToRender
                value={resolveReferences(initialValue, realState)}
                onChange={(value) => {
                  if (value !== currentValue) {
                    onChange(value);
                    setCurrentValue(value);
                  }
                }}
                onVisibilityChange={(value) => {
                  if (value !== currentValue) {
                    onVisibilityChange(value);
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
                isIcon={isIcon}
                staticText={staticText}
                component={component}
              />
            )}
          </div>
        </div>
      </div>
      <div
        className={`row${height === '150px' || height === '300px' ? ' tablr-gutter-x-0' : ''} custom-row`}
        style={{ width: paramLabel == 'Tooltip' ? '100%' : width, display: codeShow ? 'flex' : 'none' }}
      >
        <div className={`col code-hinter-col`}>
          <div className="d-flex">
            <div className="code-hinter-wrapper position-relative" style={{ width: '100%' }}>
              <div
                className={`${defaultClassName} ${className || 'codehinter-default-input'} ${
                  paramName && resolvingError && 'border-danger'
                }`}
                key={componentName}
                style={{
                  height: height || 'auto',
                  minHeight,
                  maxHeight: '320px',
                  overflow: 'auto',
                  fontSize: ' .875rem',
                  maxWidth: paramLabel == 'Tooltip' && '190px',
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
                    onFocus={onFocusHandler}
                    onBlur={(editor, e) => {
                      e?.stopPropagation();
                      const value = editor?.getValue()?.trimEnd();
                      onChange(value);
                      if (!isPreviewFocused?.current) {
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
      </div>
    </div>
  );
}

const PopupIcon = ({ callback, icon, tip, transformation = false }) => {
  const size = transformation ? 20 : 12;

  return (
    <div className="d-flex justify-content-end w-100 position-absolute" style={{ top: 0 }}>
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

const DepericatedAlertForWorkspaceVariable = ({ text }) => {
  return (
    <Alert
      svg="tj-info-warning"
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
CodeHinter.DepericatedAlertForWorkspaceVariable = DepericatedAlertForWorkspaceVariable;
