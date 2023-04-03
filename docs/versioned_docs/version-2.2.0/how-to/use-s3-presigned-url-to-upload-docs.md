---
id: use-s3-presigned-url-to-upload-docs
title: Use S3 pre-signed URL to upload documents
---

# Use S3 pre-signed URL to upload documents

In this how-to guide, you'll learn how you can upload documents to S3 buckets using the **S3 pre-signed URL** from a ToolJet application. 

For this guide, We are going to use one of the existing templates on ToolJet: **S3 File explorer**

:::info using Templates
On ToolJet Dashboard, Click on the down arrow on the right of the **New App** button, from the dropdown choose the **Choose from template** option. 
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/uses3presignedurl/template.png" alt="Use S3 pre-signed URL to upload documents" width="700"/>

</div>  

- Once you've created a new app using the template, you'll be prompted to create a **new version** of the existing version. After creating a new version, you'll be able to make changes in the app.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/newversion.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Go to the **datasource manager** on the left-sidebar, you'll find that the **AWS S3 datasource** is already added. All you need to do is update the datasource **credentials**.

  :::tip
  Check the [AWS S3 datasource reference](/docs/data-sources/s3) to learn more about connnection and choosing your preferred authentication method.
  :::

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/s3connect.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Once the datasource is connected successfully, go to the query manager and **Run** the **getBuckets** query. The operation selected in the getBuckets query is **List Buckets** which will fetch an array of all the buckets.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/getbuckets.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Running the **getBuckets** query will load all the buckets in the dropdown in the app.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/dropdown.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Select a **bucket** from the dropdown and click on the **Fetch files** button to list all the files from the selected bucket on the table. The **Fetch files** button has the event handler added that triggers the **s32** query, the **s32** query uses the **List objects in a bucket** operation, and the bucket field in the query gets the value dynamically from the dropdown.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/fetchfiles.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- We will create two RunJS queries, for getting the data from the file picker and using selected file's `base64Data` to convert it into binary `Uint8 array`
  - Create a **runjs1** query and copy the following code:
  ```js
  const base64String = components.filepicker1.file[0].base64Data
  const decodedArray = new Uint8Array(atob(base64String).split('').map(c => c.charCodeAt(0)));
  const file = new Blob([decodedArray], { type: 'text/plain' });
  const fileName = 'hello.txt';
  const fileObj = new File([file], fileName);
  
  return fileObj
  ```

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/runjs1.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

  - Create another **runjs2** query and copy the following code:
  ```js
  const file = queries.runjs2.data
  const url = queries.s31.data.url

  fetch(url, {
    method: 'PUT',
    body: file,
    mode: 'cors',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  })
  .then(response => console.log('Upload successful!'))
  .catch(error => console.error('Error uploading file:', error));
  ```

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/runjs2.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Let's go to the **uploadToS3** query and update the field values:
  - **Operation**: Signed URL for upload
  - **Bucket**: `{{components.dropdown1.value}}` this will fetch the dynamic value from the dropdown
  - **Key**: `{{components.filepicker1.file[0].name}}` this will get the file name from the filepickers exposed variables
  - **Expires in:** This sets an expiration time of URL, by default its 3600(36 hours)
  - **Content Type**: `{{components.filepicker1.file[0].type}}` this will get the file type from the filepickers exposed variables

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/upload.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Scroll down the query manager, and add an event handler to the **uploadToS3** query. Select the **Query Success** event, **Run Query** as the action, and **runjs1** as the query to be triggered. **Save** the query.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/eventhandlerupload.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Let's go to the **runjs1** query and add the event handler to run a query on query success event, similar to how we did in the previous step. In the event handler, choose **runjs2** query. **Save** the query.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/eventhandlerrunjs2.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Now, let's go the final query **copySignedURL** that is connected to the table's action button. This query copy's the generated **Signed URL for download** onto the **clipboard**.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/copysigned.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Now that we have updated all the queries, and connected them through the event handlers. We can go ahead and pick a file from the file picker. Click on the file picker, select a file and then hit the **Upload file to S3** button.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/how-to/uses3presignedurl/uploadbutton.png" alt="Use S3 pre-signed URL to upload documents"/>

  </div>

- Once the button is clicked, the **uploadToS3** will triggered along with the **runjs1** and **runjs2** queries in sequence since we added them in the event handlers.

- You can go to the table and click on the **Copy signed URL** action button on the table, this will trigger the **copySignedURL** query and will copy the URL on the clipboard. You can go to another tab and paste the URL to open the file on the browser.

