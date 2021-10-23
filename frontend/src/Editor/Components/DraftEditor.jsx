/* eslint-disable react/no-string-refs */
import React from 'react';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { stateToHTML } from 'draft-js-export-html';

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

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  {
    label: <img src="/assets/images/icons/rich-text-editor/blockquote.svg" style={{ height: '16px' }} />,
    style: 'blockquote',
  },
  {
    label: <img src="/assets/images/icons/rich-text-editor/ul.svg" style={{ height: '16px' }} />,
    style: 'unordered-list-item',
  },
  {
    label: <img src="/assets/images/icons/rich-text-editor/ol.svg" style={{ height: '16px' }} />,
    style: 'ordered-list-item',
  },
  {
    label: <img src="/assets/images/icons/rich-text-editor/codeblock.svg" style={{ height: '16px' }} />,
    style: 'code-block',
  },
];

const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();

  return (
    <>
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
    label: <img src="/assets/images/icons/rich-text-editor/bold.svg" style={{ height: '16px' }} />,
    style: 'BOLD',
  },
  {
    label: <img src="/assets/images/icons/rich-text-editor/italic.svg" style={{ height: '16px' }} />,
    style: 'ITALIC',
  },
  {
    label: <img src="/assets/images/icons/rich-text-editor/underline.svg" style={{ height: '16px' }} />,
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
    this.state = { editorState: EditorState.createWithContent(ContentState.createFromText(this.props.defaultValue)) };

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

  componentDidUpdate(prevProps) {
    if (prevProps.defaultValue !== this.props.defaultValue) {
      const newContentState = ContentState.createFromText(this.props.defaultValue);
      const newEditorState = EditorState.createWithContent(newContentState);
      const newEditorStateWithFocus = EditorState.moveFocusToEnd(newEditorState);
      const html = stateToHTML(newContentState);

      this.props.handleChange(html);
      this.setState({ editorState: newEditorStateWithFocus });
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

    return (
      <div className="RichEditor-root">
        <div className="RichEditor-controls">
          <BlockStyleControls editorState={editorState} onToggle={this.toggleBlockType} />
          <InlineStyleControls editorState={editorState} onToggle={this.toggleInlineStyle} />
        </div>
        <div className={className} style={{height: `${this.props.height-60}px`}} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            placeholder={this.props.placeholder}
            ref="editor"
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}

export { DraftEditor };
