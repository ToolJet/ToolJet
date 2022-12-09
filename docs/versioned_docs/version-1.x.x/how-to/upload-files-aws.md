---
id: upload-files-aws
title: Upload files on AWS S3 bucket
---

# Upload and download files on AWS S3 bucket

This guide will help you in quickly building a basic UI for uploading or downloading files from AWS S3 buckets.

Before building the UI, check out the **[docs for AWS S3 data source](/docs/data-sources/s3)** to learn about setting up AWS S3 and adding the data source. 

Once you have successfully added the AWS data source, build a basic UI using the following widgets:
- **Dropdown**: For selecting a bucket in S3 storage.
- **Table**: For listing all the objects inside the selected bucket in dropdown.
- **Text Input**: For getting a path for the file that is to be uploaded.
- **File picker**: For uploading the file.
- **Button**: This will be used to fire the upload query.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files on AWS S3 bucket](/img/how-to/upload-files-aws/ui.png)

</div>

## Queries

We'll create the following queries:

1. **getBuckets**
2. **listObjects**
3. **uploadToS3**
4. **download**

### getBuckets

This query will fetch the list of all the buckets in your S3. Just create a new query, select AWS S3 data source, and choose **List buckets** operation. Name the query **getBuckets** and click **Save**.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files on AWS S3 bucket](/img/how-to/upload-files-aws/getBuckets.png)

</div>

Now, let's edit the properties of **dropdown** widget.

- **Label**: Set the label as Bucket.
- **Option values**: Set option values as `{{queries.getBuckets.data.Buckets.map(bucket => bucket['Name'])}}`. We're mapping the data returned by the query as the returned data is array of abjects.
- **Option label**: Set option values as `{{queries.getBuckets.data.Buckets.map(bucket => bucket['Name'])}}`. This will display the same option label as option values.

You can later add an event handler for running the **listObject** query whenever an option is selected from the dropdown.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files on AWS S3 bucket](/img/how-to/upload-files-aws/dropdown.png)

</div>

### listObjects

This query will list all the objects inside the selected Bucket in dropdown. Select **List objects in a bucket** operation, enter `{{components.dropdown1.value}}` in the Bucket field - this will dynamically get the field value from the selected option in dropdown.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files on AWS S3 bucket](/img/how-to/upload-files-aws/listObjects.png)

</div>

Edit the properties of **table** widget:
- **Table data**: `{{queries.listObjects.data['Contents']}}`
- **Add Columns**:
  - **Key**: Set the **Column Name** to `Key` and **Key** to `Key`
  - **Last Modified**: Set the **Column Name** to `Last Modified` and **Key** to `LastModified`
  - **Size**: Set the **Column Name** to `Size` and **Key** to `Size`
- Add a **Action button**: Set button text to **Copy signed URL**, Add a handler to this button for On Click event and Action to Copy to clipboard, in the text field enter `{{queries.download.data.url}}` - this will get the download url from the **download** query that we will create next.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files on AWS S3 bucket](/img/how-to/upload-files-aws/table.png)

</div>

### download

Create a new query and select **Signed URL for download** operation. In the Bucket field, enter `{{components.dropdown1.value}}` and in Key enter `{{components.table1.selectedRow.Key}}`.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files on AWS S3 bucket](/img/how-to/upload-files-aws/download.png)

</div>

Edit the **properties** of the table, add a Event handler for running the `download` query for `Row clicked` event. This will generate a signed url for download every time a row is clicked on the table.

### uploadToS3

Create a new query, select the **Upload object** operation. Enter the following values in their respective fields:
- **Bucket**: `{{components.dropdown1.value}}`
- **Key**:  {{ components.textinput1.value + '/' +components.filepicker1.file[0].name}}`
- **Content type**: `{{components.filepicker1.file[0].type}}`
- **Upload data**: `{{components.filepicker1.file[0].base64Data}}`
- **Encoding**: `base64`

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files on AWS S3 bucket](/img/how-to/upload-files-aws/uploadToS3.png)

</div>

#### Configure the file picker:

Click on the widget handle to edit the file picker properties: 

- Change the **Accept file types** to `{{"application/pdf"}}` for the picker to accept only pdf files or `{{"image/*"}}` for the picker to accept only image files . In the screenshot below, we have set the accepted file type property to `{{"application/pdf"}}` so it will allow to select only pdf files:

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files using GCS](/img/how-to/upload-files-gcs/result-filepicker.png)

</div>

- Change the **Max file count** to `{{1}}` as we are only going to upload 1 file at a time.

- Select a pdf file and hold it in the file picker.

:::info
 File types must be valid **[MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)** type according to input element specification or a valid file extension.

 To accept any/all file type(s), set `Accept file types` to an empty value.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Upload files using GCS](/img/how-to/upload-files-gcs/config-filepicker.png)

</div>

Final steps, go to the **Advanced** tab of the **uploadToS3** query and add a query to run **listObjects** query so that whenever a file is uploaded the tabled is refreshed.