---
id: loading-image-pdf-from-db
title: Upload and view images and PDFs using base64 string
---

This guide shows how to upload and view images and PDFs using the base64 string format. The **[first part](#upload-files-to-the-database)** covers how to use the **[Filepicker](/docs/widgets/file-picker)** component to upload files to the database. The **[second part](#view-image-and-pdf-files)** is about the process of displaying the uploaded images and PDFs from the database using **[Image](/docs/widgets/image)** and **[PDF](/docs/widgets/pdf)** components. 


## 1. Start by Creating a New Table In ToolJet Database

- Create a new table named testDB. 
- The id field will be present by default to create a unique identifier for each record in our database table.
- Click on **Add more columns** button and two more columns: pdf and image.
- Select `varchar` as datatype for the pdf and image fields.

<i>While we are using the ToolJet Database for this guide; feel free to use other databases while applying the same principles.</i>

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
<img className="screenshot-full" src="/img/how-to/load-base64/create-new-table.png" alt="New Table"  />
</div>


<br/>

## 2. Upload Files To The Database

- Create a new application and name it *Load PDF And Images Example*. 
- Drag and drop two **Filepicker** components on the canvas from the components library on the right. 
- Rename the first Filepicker component to *imagePicker* and second Filepicker to *pdfPicker*.

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/filepickers-rename.png" alt="Rename Filepickers"  />
</div>

- Change the **Accept file types** property to `{{"pdf/*"}}` - this allows us to restrict the Filepicker to only accept PDF files. 
- The default value for the **Accept file types** property is `{{"image/*"}}`. Leave it as it is as we want to use this component to uplaod an image.

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-accepted-file-type.png" alt="Accepted File Type Settings"  />
</div>

- Click on the *imagePicker* component and select an image to upload. Similarly, upload a PDF using the *pdfPicker* component. 

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/filepickers-with-uploaded-files.png" alt="Uploaded Files"  />
</div>

- After uploading, you will see the filenames displayed on their respective Filepicker components.

- Create a query to insert a new row with the base64 strings of uploaded files into testDB. Click + Add in the query panel, choose Tooljet Database as the data source, select testDB for Table name, and Create Row for Operations. Name this query uploadFiles

- Under the **Columns** section, add two columns - **pdf** and **image**. 

- Set the below value for the **pdf** column: 
```js
{{components.pdfPicker.file[0].base64Data}}
```

- Similarly, for the **image** column:
```js
{{components.imagePicker.file[0].base64Data}}
```

<i>In the above code, we are usign the <b>exposed variables</b> of both Filepicker components to get the base64 strings of the files we had uploaded earlier.</i>

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/add-files-query.png" alt="Add Files Query"  />
</div>

<!-- The `file` key holds an array of uploaded files. To access a specific file's data, use its index in the array. For example, if we set **Pick multiple files** property to true for the *pdfPicker* component and upload 3 files, we can access them like this:

```js
{{components.pdfPicker.file[0].base64Data}}  // First file
{{components.pdfPicker.file[1].base64Data}}  // Second file
{{components.pdfPicker.file[2].base64Data}}  // Third file
``` -->

<!-- Drag and drop a **[Button](/docs/widgets/button)** component below the two Filepicker components and rename the component to *upload*. 

In the Button component's properties:
- Change the Button Text property to **Upload**.
- Click on **+ New event handler** to create a new event handler, keep the Event as **On click** and Action as **Run Query**. Select *uploadFiles* as Query. -->

- Add a **[Button](/docs/widgets/button)** component below the Filepickers and rename it to upload.
- Set the Button's text to "Upload" and create a new event handler: Event - On click, Action - Run Query, Query - uploadFiles.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/upload-button-properties.png" alt="Upload Button Properties"  />
</div>

We are now done with the upload flow. Now every time we select files in the Filepicker components and click on the *upload* button, the base64 strings of the related files will be pushed to the database. 

## View Image and PDF Files 

- Create a query named getFiles to retrieve base64 strings from testDB: Click on **+Add** button in the query panel, select Tooljet as Database, `testDB` as Table name, and `List rows` as Operations.
- Enable **Run this query on application load?** and click on the **Run** button to run the getFiles query.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/fetch-files-query.png" alt="Fetch Files Query"  />
</div>

- Drag an **[Image](/docs/widgets/image)** and a **[PDF](/docs/widgets/pdf)** component on the canvas from the components library. Rename the **Image** component to *displayImage* and the **PDF** component to *displayPDF*.

- In the **URL** property of the **displayImage** component, enter:
```js
{{'data:image;base64,' + queries.getFiles.data[0].image}}
```
<!-- <i>'data:image/base64,' specifies that the data should be interpreted as a base64-encoded image.
`queries.getFiles.data[0].image` fetches the base64-encoded image data from the first row in the data array returned by the getFiles query.</i> -->

- Let's apply the same logic for the **displayPDF** component and enter the below value in the **File URL** property:

```js
{{'data:pdf;base64,' + queries.getFiles.data[0].pdf}}
```
<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-with-fileURL.png" alt="PDF Component With File URL"  />
</div>

<i>The provided code constructs a Data URL to display the base64-encoded data as an image or PDF.</i> 

<br/>
<br/>

Here's what our final interface will look like:

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-image-view.png" alt="Final Preview"  />
</div>

:::info
You can also use transformations in the query response and concat `data:image/jpeg;base64,` to the base64 data.
:::