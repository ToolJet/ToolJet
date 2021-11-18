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
import Portal from '../../_components/Portal';

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
    <CodeHinter.Container
      darkMode={theme}
      isOpen={isOpen}
      callback={setIsOpen}
      enablePreview={enablePreview}
      getPreview={getPreview}
    >
      <div
        className={` code-hinter ${className || 'codehinter-default-input'}`}
        key={suggestions.length}
        style={{ height: height || 'auto', minHeight, maxHeight: '320px', overflow: 'auto', zIndex: 1 }}
      >
        <CodeMirror
          value={initialValue}
          realState={realState}
          scrollbarStyle={null}
          height={height}
          onFocus={() => setFocused(true)}
          onBlur={(editor) => {
            const value = editor.getValue();
            onChange(value);
            setFocused(false);
          }}
          onChange={(editor) => valueChanged(editor, onChange, suggestions, ignoreBraces)}
          onBeforeChange={(editor, change) => onBeforeChange(editor, change, ignoreBraces)}
          options={options}
        />
      </div>
    </CodeHinter.Container>
  );
}

const Container = ({ children, darkMode, isOpen, callback, enablePreview, getPreview }) => {
  console.log('darkMode ==>', darkMode);
  const handleClose = () => {
    callback(false);
  };
  return (
    <div className="code-hinter-container">
      {children}

      <div className="d-flex justify-content-end">
        <OverlayTrigger
          trigger={['hover', 'focus']}
          placement="top"
          delay={{ show: 800, hide: 100 }}
          overlay={<Tooltip id="button-tooltip">{'Pop out code editor into a new window'}</Tooltip>}
        >
          <img
            className="svg-icon float m-2 popup-btn"
            src="/assets/images/icons/pop.svg"
            width="16"
            height="16"
            onClick={(e) => {
              e.stopPropagation();
              callback(true);
            }}
          />
        </OverlayTrigger>
      </div>
      {enablePreview && !isOpen && getPreview()}
      <CodeHinter.PopUpHinter component={children} open={isOpen} onClose={handleClose} preview={getPreview} />
    </div>
  );
};

const PopUpHinter = ({ component, open, onClose, preview }) => {
  const handleClose = (e) => {
    e.stopPropagation();
    console.log('open || close', open);
    onClose();
  };

  React.useEffect(() => {
    if (open) {
      document.querySelector('#app').setAttribute('inert', 'true');
    }

    return () => {
      document.querySelector('#app').removeAttribute('inert');
    };
  }, [open, onClose]);

  return (
    <React.Fragment>
      {open && (
        <Portal className="modal-portal-wrapper">
          <div className="modal-dialog modal-portal-wrapper" role="document">
            <div className="modal-content" style={{ background: 'tranparent' }}>
              <div style={{ height: '24px', padding: '0px' }} className="modal-header">
                <p className="modal-title mx-3">component</p>
                <button
                  onClick={handleClose}
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-0">
                <div className="editor">{component}</div>
                <div className="preview">{preview()}</div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </React.Fragment>
  );
};

CodeHinter.Container = Container;
CodeHinter.PopUpHinter = PopUpHinter;
