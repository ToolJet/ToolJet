---
id: loading-image-pdf-from-db
title: Upload And View Images and PDFs Using Base64 String
---

This guide shows how to upload and view images and PDFs using the base64 string format. 

## 1. Start by Creating a New Table In ToolJet Database

- Create a new table named *testDB*. 
- The `id` field will be present by default to create a unique identifier for each record in our database table.
- Click on **Add more columns** button and add two more columns: `pdf` and `image`.
- Select `varchar` as datatype for the pdf and image columns.

<i>While we are using the ToolJet Database for this guide; feel free to use other databases while applying the same principles.</i>

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
<img className="screenshot-full" src="/img/how-to/load-base64/create-new-table.png" alt="New Table"  />
</div>

## 2. Upload Files To The Database

- Create a new application and name it *Load PDF And Images Example*. 
- Drag and drop two **[Filepicker](/docs/widgets/file-picker)** components on the canvas from the components library on the right. 
- Rename the first Filepicker component to *imagePicker* and second Filepicker to *pdfPicker*.

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/filepickers-rename.png" alt="Rename Filepickers"  />
</div>

- For *pdfPicker*, change the **Accept file types** property to `{{"pdf/*"}}` - this ensures that the Filepicker only accepts PDF files. 

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-accepted-file-type.png" alt="Accepted File Type Settings"  />
</div>

- Retain the default `{{"image/*"}}` setting for the Accept file types property in the *imagePicker* component, as it's intended for image uploads.
- Click on the *imagePicker* component and select an image to upload. Similarly, upload a PDF using the *pdfPicker* component. 

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/filepickers-with-uploaded-files.png" alt="Uploaded Files"  />
</div>

- After uploading, you will see the filenames displayed on their respective Filepicker components.
- Click on the **+ Add** button in the query panel to create a new query, choose Tooljet Database as the data source, select `testDB` as Table name, and `Create Row` as Operations. Name this query *uploadFiles*.
- Under the Columns section, add two columns - `pdf` and `image`. 
- Set the below value for the `pdf` column: 
```js
{{components.pdfPicker.file[0].base64Data}}
```
- Similarly, for the `image` column:
```js
{{components.imagePicker.file[0].base64Data}}
```

<i>In the above query, we are using the <b>exposed variables</b> of both Filepicker components to get the base64 strings of the files we had uploaded earlier.</i>

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/add-files-query.png" alt="Add Files Query"  />
</div>

- Add a **[Button](/docs/widgets/button)** component below the Filepickers and rename it to *upload*.
- Set the Button's text to *Upload* and create a **New event handler** with the following settings: Event - `On click`, Action - `Run Query` and Query - `uploadFiles`.
- Click on the *upload* button to upload the files that we had selected in the Filepicker components earlier.

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/upload-button-properties.png" alt="Upload Button Properties"  />
</div>

The upload process is now complete. Whenever files are selected in the Filepicker components and the *upload* button is clicked, the base64 strings of these files will be automatically written to the database.

## 3. View Image and PDF Files 

- Create a query named *getFiles* to retrieve base64 strings from testDB: Click on **+ Add** button in the query panel, select Tooljet as Database, `testDB` as Table name, and `List rows` as Operations.
- Enable **Run this query on application load?** and click on the **Run** button to run the getFiles query.

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/fetch-files-query.png" alt="Fetch Files Query"  />
</div>

- Drag an **[Image](/docs/widgets/image)** and a **[PDF](/docs/widgets/pdf)** component on the canvas from the components library. Rename the **Image** component to *displayImage* and the **PDF** component to *displayPDF*.
- In the **URL** property of the **displayImage** component, enter:
```js
{{'data:image;base64,' + queries.getFiles.data[0].image}}
```

- Let's apply the same logic for the **displayPDF** component and enter the below value in the **File URL** property:

```js
{{'data:pdf;base64,' + queries.getFiles.data[0].pdf}}
```
<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-with-fileURL.png" alt="PDF Component With File URL"  />
</div>

<i>The provided code constructs a Data URL to display the base64-encoded data as an image or PDF.</i> 

<br/>
<br/>

Here's what our final interface will look like:

<div style={{ width: '100%', marginBottom:'15px', marginTop:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-image-view.png" alt="Final Preview"  />
</div>

<i>
You can also use transformations in the query response and concat `data:image/jpeg;base64,` to the base64 data.
</i>
<br/>
<br/>

Using the above logic, you can upload and view files in ToolJet using the base64 data.