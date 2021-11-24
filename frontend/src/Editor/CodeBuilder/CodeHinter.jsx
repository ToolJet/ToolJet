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
import { resolveReferences } from '@/_helpers/utils';
import useHeight from '@/_hooks/use-height-transition';
import Portal from './Portal';

export function CodeHinter({
  initialValue,
  onChange,
  currentState,
  mode,
  theme,
  lineNumbers,
  className,
  placeholder,
  ignoreBraces,
  enablePreview,
  height,
  minHeight,
  lineWrapping,
  componentName = null,
}) {
  const options = {
    lineNumbers: lineNumbers,
    lineWrapping: lineWrapping,
    singleLine: true,
    mode: mode || 'handlebars',
    tabSize: 2,
    theme: theme || 'default',
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
    setCurrentValue(editor.getValue());
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
    const [preview, error] = resolveReferences(currentValue, realState, null, {}, true);

    if (error) {
      return (
        <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
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

    const previewType = typeof preview;
    const content = getPreviewContent(preview, previewType);

    return (
      <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
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

  return (
    <div className="code-hinter-wrapper" style={{ width: '100%' }}>
      <CodeHinter.PopupIcon callback={setIsOpen} />
      <div
        className={`code-hinter ${className || 'codehinter-default-input'}`}
        key={suggestions.length}
        style={{ height: height || 'auto', minHeight, maxHeight: '320px', overflow: 'auto' }}
      >
        <CodeHinter.HinterContainer
          name={componentName}
          isOpen={isOpen}
          callback={setIsOpen}
          preview={getPreview}
          enablePreview={enablePreview}
          height={height || 'auto'}
        >
          <CodeMirror
            value={initialValue}
            realState={realState}
            scrollbarStyle={null}
            height={height || 'auto'}
            onFocus={() => setFocused(true)}
            onBlur={(editor) => {
              const value = editor.getValue();
              onChange(value);
              setFocused(false);
            }}
            onChange={(editor) => valueChanged(editor, onChange, suggestions, ignoreBraces)}
            onBeforeChange={(editor, change) => onBeforeChange(editor, change, ignoreBraces)}
            options={options}
            lineWrapping={true}
            viewportMargin={Infinity}
          />
        </CodeHinter.HinterContainer>
      </div>

      {enablePreview && !isOpen && getPreview()}
    </div>
  );
}

const HinterContainer = ({ children, name, isOpen, callback, preview, height }) => {
  return (
    <React.Fragment>
      {children}
      <CodeHinter.CodeHinterPortal
        codeEditor={children}
        open={isOpen}
        callback={callback}
        name={name}
        codePreview={preview}
        height={height}
      />
    </React.Fragment>
  );
};

const PopupIcon = ({ callback }) => {
  return (
    <div className="d-flex justify-content-end">
      <OverlayTrigger
        trigger={['hover', 'focus']}
        placement="top"
        delay={{ show: 800, hide: 100 }}
        overlay={<Tooltip id="button-tooltip">{'Pop out code editor into a new window'}</Tooltip>}
      >
        <img
          className="svg-icon float m-2 popup-btn"
          src="/assets/images/icons/expand.svg"
          width="12"
          height="12"
          onClick={(e) => {
            e.stopPropagation();
            callback(true);
          }}
        />
      </OverlayTrigger>
    </div>
  );
};

const CodeHinterPortal = ({ codeEditor, open, callback, name, codePreview, height }) => {
  const handleClose = (e) => {
    e.stopPropagation();
    callback(false);
  };

  React.useEffect(() => {
    if (open) {
      document.querySelector('#app').setAttribute('inert', 'true');
    }

    return () => {
      document.querySelector('#app').removeAttribute('inert');
    };
  }, [open]);

  const PortalHinterPreview = () => {
    return (
      <>
        <div className="editor">{codeEditor}</div>
        <div className="preview">{codePreview()}</div>
      </>
    );
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const portalStyle = {
    background: 'transparent',
    backgroundColor: darkMode ? '#232E3C' : '#fff',
  };

  return (
    <React.Fragment>
      {open && (
        <Portal className="modal-portal-wrapper">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ ...portalStyle, borderRadius: '0px' }}>
              <div className="portal-header d-flex" style={{ ...portalStyle }}>
                <div className=" w-100">
                  <code className="mx-3 text-info">{name}</code>
                </div>

                <span
                  className={`btn btn-light mx-2 flex-shrink-1`}
                  onClick={handleClose}
                  data-tip="Hide query editor"
                  data-class="py-1 px-2"
                >
                  <img
                    style={{ transform: 'rotate(-90deg)' }}
                    src="/assets/images/icons/portal-close.svg"
                    width="12"
                    height="12"
                  />
                </span>
              </div>
              <div
                className="modal-body p-0"
                style={{ background: 'transparent', backgroundColor: darkMode ? '#272822' : '#fff', height }}
              >
                {/* <div className="editor">{codeEditor}</div>
                <div className="preview">{codePreview()}</div> */}
                <PortalHinterPreview />
              </div>
            </div>
          </div>
        </Portal>
      )}
    </React.Fragment>
  );
};
CodeHinter.HinterContainer = HinterContainer;
CodeHinter.PopupIcon = PopupIcon;
CodeHinter.CodeHinterPortal = CodeHinterPortal;
