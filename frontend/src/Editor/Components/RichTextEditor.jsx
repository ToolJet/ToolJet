import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export const RichTextEditor = function RichTextEditor({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged
}) {
  console.log('currentState', currentState);

  return (
    <div style={{ width: `${width}px`, height: `${height}px` }} onClick={() => onComponentClick(id, component)}>
      <CKEditor
        editor={ClassicEditor}
        data="<p>Hello from CKEditor 5!</p>"
        config={{
          height: '300',
          toolbar: [
            'bold',
            'italic',
            'link',
            'undo',
            'redo',
            'numberedList',
            'bulletedList',
            'link',
            'blockQuote',
            'insertTable'
          ]
        }}
        onReady={(editor) => {
          // You can store the "editor" and use when it is needed.
          console.log('Editor is ready to use!', editor);
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          console.log({ event, editor, data });
          onComponentOptionChanged(component, 'value', data);
        }}
        onBlur={(event, editor) => {
          console.log('Blur.', editor);
        }}
        onFocus={(event, editor) => {
          console.log('Focus.', editor);
        }}
      />
    </div>
  );
};
