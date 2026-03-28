---
id: use-s3-signed-url-to-upload-docs
title: Use S3 Signed URL to Upload Documents
---
<div style={{paddingBottom:'24px'}}>

In this guide, we will walk through uploading documents to AWS S3 buckets using the **S3 signed URL** from a ToolJet application. This also gives tips on how signed URLs work, security considerations, and client-side upload examples.

For this guide, we are going to use one of the existing templates on ToolJet: **S3 File explorer**

</div>
<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Create an App Using Templates

- On ToolJet Dashboard, click on the ellipses on the right of the **Create new app** button, from the dropdown choose the **Choose from template** option. Select **AWS S3 file explorer** and click on the **Create application from template**.

<div style={{textAlign: 'left'}}>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/template-v2.png" alt="Use S3 pre-signed URL to upload documents: Choose template" width="700"/>

</div>  

- Go to the **Data sources** on the left-sidebar; you'll find that the **AWS S3 data source** has already been added. All you need to do is update the data source credentials.

:::tip
Check the [AWS S3 data source reference](/docs/data-sources/s3) to learn more about connnection and choosing your preferred authentication method.
:::

<div style={{textAlign: 'left'}}>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/how-to/uses3presignedurl/connection-v3.png" alt="S3 add datasource"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Get the Buckets

- Once the data source is connected successfully, go to the query manager and **Run** the *getBuckets* query. The operation selected in the *getBuckets* query is **List buckets**, which will fetch an array of all the buckets.

  <div style={{textAlign: 'center'}}>

  <img style={{  marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/list-bucket-v3.png" alt="Use S3 pre-signed URL to upload documents: getBuckets query"/>

  </div>

- Running the *getBuckets* query will load all the buckets in the app's left table.



  <div style={{textAlign: 'center'}}>

  <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/dropdown-v3.png" alt="Use S3 pre-signed URL to upload documents: loading buckets"/>

  </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Get the Objects Inside the Bucket

- To fetch the data inside a bucket, select the bucket from the buckets table, go to the query manager and choose the *getObjects* query. Choose the relevant data source in the **Data Source** section, and for the **Operation** parameter, choose `List objects in a bucket` option from the dropdown. Replace the **Bucket** parameter with, `{{components.table2.selectedRow.Name}}` and click on the **Run** to list all the files from the selected bucket on the table.



  <div style={{textAlign: 'center'}}>

  <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/get-signed-url-v3.png" alt="Use S3 pre-signed URL to upload documents: list objects in a bucket"/>

  </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Get the Signed URL for Downlaod

The object owner can optionally share objects with others by creating a presigned URL, using their own security credentials, to grant time-limited permission to download the objects. For creating a presigned URL, in the query panel replace the parameters with the following:

- **Data Source**: Use the relevant data source.
- **Operation**: Choose `Signed url for download` from the dropdown.
- **Bucket**: `{{components.table2.selectedRow.Name}}` to select the buckets dynamically.
- **Key**: `{{components.table3.selectedRow.Key}}`, this will get the file name from the filepickers exposed variables.
- **Expires in**: This sets an expiration time of URL, by default its `3600` seconds (1 hour).

After setting up the parameters, click **Run** to run the query, and the URL can be accessed as shown in the screenshot.

  <div style={{textAlign: 'center'}}>

  <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/fetch-files-v3.png" alt="S3 get signed URL"/>

  </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Upload Objects to the Bucket 

The `Upload Object` operation allows users to select a bucket and then upload their chosen data into that bucket. To upload objects in a bucket, follow the steps below:

- In the query panel navigate to *uploadObject* query.
- Choose your relevant data source in the **Data Source** section.
- In the **Operation** section, choose `Upload Object` from the dropdown.
- In the **Bucket** section, copy the code: `{{components.table2.selectedRow.Name}}`, to choose a bucket dynamically.
- In the **Key** section, copy the code: `{{components.textinput2.value}}`.
- In the **Content Type** section, copy: `{{components.filepicker1.file[0].type}}`.
- In the **Upload data** section, copy: `{{components.filepicker1.file[0].dataURL}}`.

To make sure the image is uploaded successfully, we can create a new event from the **Events** section.
- Under the `Events` section, click on **New event handler**.
- From the `Event` dropdown, choose `Query Success`.
- From the `Action` dropdown, choose `Show Alert`.
- The `Message` can be of your choice, in this example lets write the message as: `Image uploaded successfully`.

Once the query has been created, choose the desired bucket, click on the **Upload file** button in the app, and upload your desired file to your bucket.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Upload Objects via Custom S3 Presigned URLs

This method uploads files **directly from the client** to S3 using a **temporary signed URL**.

**When to use this method:**
- You want better performance for large files
- You need temporary upload access
- You don’t want files to pass through ToolJet servers
- You want to expose upload capability to external clients

```javascript
const file = components.filepicker1.file[0];

await fetch(presignedUrlQuery.data.url, {
  method: "PUT",
  headers: {
    "Content-Type": file.type,
  },
  body: file.blob,
});

return "Upload successful";
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/presigned-url-s3.png" alt="S3 get signed URL"/>

## Access the Signed URL

After uploading the file to your bucket, in the files table, click on the **Copy signed URL** button from the **Actions** section of the table, which will copy the URL on the clipboard. You can go to another tab and paste the URL to open the file on the browser.

  <div style={{textAlign: 'center'}}>

  <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/uses3presignedurl/signed-url-v3.png" alt="S3 access signed URL"/>

  </div>

</div>