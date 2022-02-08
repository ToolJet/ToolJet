# Filepicker

Filepicker widget allows the user to drag and drop files or upload files by browsing the filesystem and selecting one or more files in a directory.

<img class="screenshot-full" src="/img/widgets/filepicker/filepicker.gif" alt="ToolJet - Widget Reference - Filepicker " height="420"/>

:::info
 File types must be a valid [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) type according to input element specification or a valid file extension.

 To accept any/all file type(s), set `Accept file types` to an empty value.
:::

<img class="screenshot-full" src="/img/widgets/filepicker/file-types.gif" alt="ToolJet - Widget Reference - Filepicker file types " height="420"/>

:::tip
[MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) type determination is not reliable across platforms. CSV files, for example, are reported as text/plain under macOS but as application/vnd.ms-excel under Windows.
:::

## Event: On file selected

On file selected event can be triggered when one or more files are selected.


## Properties

| properties      | description |
| ----------- | ----------- |
| Use Drop zone | creates a drag & drop zone. Files can be dragged and dropped to the "drag & drop" zone. |
| Use File Picker | On clicking it invokes the default OS file prompt.|
| Pick mulitple files | Allows drag and drop (or selection from the file dialog) of multiple files. `Pick multiple files` is disabled by default. |
| Max file count | The maximum accepted number of files The default value is `2`.|
| Accept file types| By providing types, you can make the dropzone accept specific file types and reject the others. |
| Max size limit| Maximum file size (in bytes).|
| Min size limit| Minimum file size (in bytes).|

:::tip
Files can be accepted or rejected based on the file types, maximum file count, maximum file size (in bytes) and minimum file size (in bytes).
If `Pick mulitple files` is set to false and additional files are dropped, all files besides the first will be rejected. 
Any file that does not have a size in the range of `Max size limit` and `Min size limit` will be rejected.
:::

## Options

| options      | description |
| ----------- | ----------- |
| Parse content | parse the selected files, supports **CSV** files. |
| File type | If **Parse content** is enabled, options to auto-detect files and parse content or parse selected file types. |


:::info
If the **Parse content** option is toggled on, it only parses the next file that is selected, not the already selected one.
:::
