---
id: upload-files-gcs
title: Upload Files Using GCS
---

This guide demonstrates how to configure file upload and download operations using the Google Cloud Storage (GCS) data source in ToolJet. Learn how to use upload, handle file inputs directly from your applications.

Before adding the new data source we will need to have a private key for our GCS bucket and make sure the key has the appropriate rights.

## Setting up Google Cloud Storage Data Source

1. Go to the data source manager on the left-sidebar and click on the `+` button.

2. Add a new GCS data source from the  **APIs** section in modal that pops up.

3. Enter the **JSON private key for service account** and test the connection.

4. Click on **Save** to add the data source.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/adding-account.png" alt="gcs data source connection" />

## Adding a File Picker

1. Drag and drop the **file picker** widget on the canvas.

2. Configure the file picker: Change the **Accept file types** to `{{"application/pdf"}}` for the picker to accept only pdf files. In the screenshot below, we have set the accepted file type property to `{{"application/pdf"}}` so it will allow to select only pdf files.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/filepicker-ui.png" alt="gcs UI component" />

3. In the properties section, disable the **Allow picking multiple files** to avoid conflicts.

4. Select a pdf file and hold it in the file picker.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/file-picks.png" alt="gcs file picker ui" />

:::info
 File types must be valid **[MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)** type according to input element specification or a valid file extension.

 To accept any/all file type(s), set `Accept file types` to an empty value.
:::

## Creating a Query

1. Click on the `+` button of the query manager at the bottom panel of the editor and select the GCS data source.

2. Create a query called `upload_objects`.

3. Select **Upload file** operation and enter the required parameters:

- Bucket: `gs://test-1`
- File Name: `{{components.file1.file[0]['name']}}`
- Content Type: `{{components.file1.file[0]['type']}}`
- Upload data: `{{components.file1.file[0]['base64Data']}}`
- Encoding: `base64`

4. Click on **Save** to create the query.

## Running the Query

1. Add a **button** that will fire the query to upload the file.

2. Edit the properties of the button and add an **event handler** to the action **Run the query** on the event **On-Click** .

3. Click on **Button** to execute the upload query, this will upload the pdf file that you selected earlier through the file picker and will upload it on the GCS.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/upload-files-gcs/gcs-query.png" alt="gcs upload query" />
