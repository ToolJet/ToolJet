import React, { useEffect, useMemo, useState } from 'react';
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
import { getSuggestionKeys, onBeforeChange, handleChange } from './utils';
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
import FxButton from './Elements/FxButton';
import { ToolTip } from '../Inspector/Elements/Components/ToolTip';

const AllElements = {
  Color,
  Json,
  Toggle,
  Select,
  AlignButtons,
  Number,
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
  const slideInStyles = useSpring({
    config: { ...config.stiff },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? currentHeight : 0,
    },
  });
  useEffect(() => {
    setRealState(currentState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  let suggestions = useMemo(() => {
    return getSuggestionKeys(realState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realState.components, realState.queries]);

  function valueChanged(editor, onChange, suggestions, ignoreBraces) {
    handleChange(editor, onChange, suggestions, ignoreBraces);
    setCurrentValue(editor.getValue()?.trim());
  }

  const getPreviewContent = (content, type) => {
    switch (type) {
      case 'object':
        return JSON.stringify(content);
      case 'boolean':
        return content.toString();
      default:
        return content;
    }
  };

  const getPreview = () => {
    if (!enablePreview) return;
    const [preview, error] = resolveReferences(currentValue, realState, null, {}, true);
    const themeCls = darkMode ? 'bg-dark  py-1' : 'bg-light  py-1';

    if (error) {
      return (
        <animated.div className={isOpen ? themeCls : null} style={{ ...slideInStyles, overflow: 'hidden' }}>
          <div ref={heightRef} className="dynamic-variable-preview bg-red-lt px-1 py-1">
            <div>
              <div className="heading my-1">
                <span>Error</span>
              </div>
              {error.toString()}
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
      <animated.div className={isOpen ? themeCls : null} style={{ ...slideInStyles, overflow: 'hidden' }}>
        <div ref={heightRef} className="dynamic-variable-preview bg-green-lt px-1 py-1">
          <div>
            <div className="heading my-1">
              <span>{previewType}</span>
            </div>
            {content}
          </div>
        </div>
      </animated.div>
    );
  };
  enablePreview = enablePreview ?? true;

  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
    }

    return new Promise((resolve) => {
      const element = document.getElementsByClassName('portal-container');
      if (element) {
        const checkPortalExits = element[0]?.classList.contains(componentName);

        if (checkPortalExits === false) {
          const parent = element[0].parentNode;
          parent.removeChild(element[0]);
        }

        setIsOpen(false);
        resolve();
      }
    }).then(() => {
      setIsOpen(true);
      forceUpdate();
    });
  };
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const defaultClassName =
    className === 'query-hinter' || className === 'custom-component' || undefined ? '' : 'code-hinter';

  const ElementToRender = AllElements[TypeMapping[type]];

  const [forceCodeBox, setForceCodeBox] = useState(fxActive);
  const codeShow = (type ?? 'code') === 'code' || forceCodeBox;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {paramLabel && (
          <div className={`mb-2 field ${options.className}`} data-cy="accordion-components">
            <ToolTip label={paramLabel} meta={fieldMeta} />
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
            />
          </div>
        </div>
      </div>
      <div
        className={`row${height === '150px' || height === '300px' ? ' tablr-gutter-x-0' : ''}`}
        style={{ width: width, display: codeShow ? 'flex' : 'none' }}
      >
        <div className={`col code-hinter-col`} style={{ marginBottom: '0.5rem' }}>
          <div className="code-hinter-wrapper" style={{ width: '100%', backgroundColor: darkMode && '#272822' }}>
            <div
              className={`${defaultClassName} ${className || 'codehinter-default-input'}`}
              key={suggestions.length}
              style={{
                height: height || 'auto',
                minHeight,
                maxHeight: '320px',
                overflow: 'auto',
                fontSize: ' .875rem',
              }}
              data-cy="accordion-input"
            >
              {usePortalEditor && <CodeHinter.PopupIcon callback={handleToggle} />}
              <CodeHinter.Portal
                isOpen={isOpen}
                callback={setIsOpen}
                componentName={componentName}
                key={suggestions.length}
                customComponent={getPreview}
                forceUpdate={forceUpdate}
                optionalProps={{ styles: { height: 300 }, cls: className }}
                darkMode={darkMode}
                selectors={{ className: 'preview-block-portal' }}
              >
                <CodeMirror
                  value={typeof initialValue === 'string' ? initialValue : ''}
                  realState={realState}
                  scrollbarStyle={null}
                  height={'100%'}
                  onFocus={() => setFocused(true)}
                  onBlur={(editor) => {
                    const value = editor.getValue();
                    onChange(value);
                    setFocused(false);
                  }}
                  onChange={(editor) => valueChanged(editor, onChange, suggestions, ignoreBraces)}
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
            onChange={onChange}
            paramName={paramName}
            paramLabel={paramLabel}
            forceCodeBox={() => {
              setForceCodeBox(true);
              onFxPress(true);
            }}
            meta={fieldMeta}
          />
        </div>
      )}
    </>
  );
}

const PopupIcon = ({ callback }) => {
  return (
    <div className="d-flex justify-content-end" style={{ position: 'relative' }}>
      <OverlayTrigger
        trigger={['hover', 'focus']}
        placement="top"
        delay={{ show: 800, hide: 100 }}
        overlay={<Tooltip id="button-tooltip">{'Pop out code editor into a new window'}</Tooltip>}
      >
        <img
          className="svg-icon m-2 popup-btn"
          src="/assets/images/icons/portal-open.svg"
          width="12"
          height="12"
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

CodeHinter.PopupIcon = PopupIcon;
CodeHinter.Portal = Portal;
