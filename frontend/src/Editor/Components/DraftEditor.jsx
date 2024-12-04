/* eslint-disable react/no-string-refs */
import React from 'react';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, ContentState, convertFromHTML } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { stateToHTML } from 'draft-js-export-html';
import Loader from '@/ToolJetUI/Loader/Loader';
import DOMPurify from 'dompurify';

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = 'RichEditor-styleButton';
    if (this.props.active) {
      className += ' RichEditor-activeButton';
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const HEADINGS = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
];

const BLOCK_TYPES = [
  {
    label: <img src="assets/images/icons/rich-text-editor/blockquote.svg" style={{ height: '16px' }} />,
    style: 'blockquote',
  },
  {
    label: <img src="assets/images/icons/rich-text-editor/ul.svg" style={{ height: '16px' }} />,
    style: 'unordered-list-item',
  },
  {
    label: <img src="assets/images/icons/rich-text-editor/ol.svg" style={{ height: '16px' }} />,
    style: 'ordered-list-item',
  },
  {
    label: <img src="assets/images/icons/rich-text-editor/codeblock.svg" style={{ height: '16px' }} />,
    style: 'code-block',
  },
];

const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();

  return (
    <>
      <div className="dropmenu">
        <button className="dropdownbtn px-2" type="button">
          Heading
        </button>
        <div className="dropdown-content bg-white">
          {HEADINGS.map((type) => (
            <a className="dropitem m-0 p-0" key={type.label}>
              <StyleButton
                key={type.label}
                active={type.style === blockType}
                label={type.label}
                onToggle={props.onToggle}
                style={type.style}
              />
            </a>
          ))}
        </div>
      </div>
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </>
  );
};

var INLINE_STYLES = [
  {
    label: <img src="assets/images/icons/rich-text-editor/bold.svg" style={{ height: '16px' }} />,
    style: 'BOLD',
  },
  {
    label: <img src="assets/images/icons/rich-text-editor/italic.svg" style={{ height: '16px' }} />,
    style: 'ITALIC',
  },
  {
    label: <img src="assets/images/icons/rich-text-editor/underline.svg" style={{ height: '16px' }} />,
    style: 'UNDERLINE',
  },
];

const InlineStyleControls = (props) => {
  const currentStyle = props.editorState.getCurrentInlineStyle();

  return (
    <>
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </>
  );
};

class DraftEditor extends React.Component {
  constructor(props) {
    super(props);
    const blocksFromHTML = convertFromHTML(DOMPurify.sanitize(this.props.defaultValue));
    this.state = {
      editorState: EditorState.createWithContent(
        ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
      ),
    };

    this.editorContainerRef = React.createRef();
    this.controlsRef = React.createRef();

    this.focus = () => this.refs.editor.focus();
    this.onChange = (editorState) => {
      let html = stateToHTML(editorState.getCurrentContent());
      this.props.handleChange(html);
      this.setState({ editorState });
    };

    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }

  componentDidMount() {
    //For resizing the editor container based on the height of rich text editor controls
    this.resizeObserver = new ResizeObserver(() => {
      if (this.controlsRef.current && this.editorContainerRef.current) {
        const controlsHeight = this.controlsRef.current.offsetHeight;
        const editorHeight = this.props.height - 46 - controlsHeight;
        this.editorContainerRef.current.style.height = `${editorHeight}px`;
      }
    });

    if (this.controlsRef.current) {
      this.resizeObserver.observe(this.controlsRef.current);
    }

    const exposedVariables = {
      value: this.props.defaultValue,
      isDisabled: this.props.isDisabled,
      isVisible: this.props.isVisible,
      isLoading: this.props.isLoading,
      setValue: async (text) => {
        const blocksFromHTML = convertFromHTML(DOMPurify.sanitize(text));
        const newContentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );
        const newEditorState = EditorState.createWithContent(newContentState);
        const html = stateToHTML(newContentState);
        this.props.handleChange(html);
        this.setState({ editorState: newEditorState });
      },
      setDisable: async (value) => {
        this.props.setExposedVariable('isDisabled', value);
        this.props.setIsDisabled(value);
      },
      setVisibility: async (value) => {
        this.props.setExposedVariable('isVisible', value);
        this.props.setIsVisible(value);
      },
      setLoading: async (value) => {
        this.props.setExposedVariable('isLoading', value);
        this.props.setIsLoading(value);
      },
    };
    this.props.setExposedVariables(exposedVariables);
    this.props.isInitialRender.current = false;
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.defaultValue !== this.props.defaultValue) {
      const blocksFromHTML = convertFromHTML(DOMPurify.sanitize(this.props.defaultValue));
      const newContentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap);
      const newEditorState = EditorState.createWithContent(newContentState);
      const html = stateToHTML(newContentState);

      this.props.handleChange(html);

      this.setState({ editorState: newEditorState });
    }
  }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _mapKeyToEditorCommand(e) {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(e, this.state.editorState, 4 /* maxDepth */);
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }
    return getDefaultKeyBinding(e);
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle));
  }

  render() {
    const { editorState } = this.state;

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = 'RichEditor-editor';
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== 'unstyled') {
        className += ' RichEditor-hidePlaceholder';
      }
    }

    return this.props.isLoading ? (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <center>
          <Loader width="16" absolute={false} />
        </center>
      </div>
    ) : (
      <div className="RichEditor-root" style={{ overflowY: 'scroll', scrollbarWidth: 'none' }}>
        <div className="RichEditor-controls" ref={this.controlsRef}>
          <BlockStyleControls editorState={editorState} onToggle={this.toggleBlockType} />
          <InlineStyleControls editorState={editorState} onToggle={this.toggleInlineStyle} />
        </div>
        <div className={className} ref={this.editorContainerRef} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            placeholder={
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(this.props.placeholder || ''),
                }}
              />
            }
            ref="editor"
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}

export { DraftEditor };
