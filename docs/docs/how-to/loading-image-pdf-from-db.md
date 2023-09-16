---
id: loading-image-pdf-from-db
title: Upload and view images and PDFs using base64 string
---

In this guide, we will see how we can upload and view images and PDFs using the base64 string format. In the **[first part](#upload-files-to-the-database)**, we will use the **[Filepicker](/docs/widgets/file-picker)** component to upload files to the database. Then in the **[second part](#view-image-and-pdf-files)**, we will go through the process of displaying the uploaded images and PDFs from the database using **[Image](/docs/widgets/image)** and **[PDF](/docs/widgets/pdf)** components. 

<div style={{display: 'flex', justifyContent: 'space-between', alignItems:'center'}}>
  <div style={{flex: 1, padding: '0', alignment:'center'}}>
    <p style={{textAlign: 'left'}}>
    Before we begin part one, we need to create a table in the ToolJet Database.
    <br/>    
    <br/>    
    - Create a new table named <b>testDB</b>. 
    <br/>
    <br/>
    - The <b>id</b> field will be present by default to create a unique identifier for each record in our database table.
    <br/>    
    <br/>
    - Click on <b>Add more columns</b> and two more columns : pdf and image.
    <br/>    
    <br/>    
    - Select <b>varchar</b> as datatype for the pdf and image fields.
    <br/>
    <br/>
    Note that we are using the ToolJet Database for this guide; feel free to use other databases while applying the same principles.
    </p>

  </div>
  <div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/create-new-table.png" alt="New Table"  />
  </div>
</div>

<br/>

## Upload Files To The Database

Create a new application and name it *Load PDF And Images Example*. 

Drag and drop two **Filepicker** components in the canvas from the components library on the right. Next, we’ll go to the configuration of the first Filepicker component, and rename it to *imagePicker*.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/filepickers-rename.png" alt="Rename Filepickers"  />
</div>

<br/>

Similarly, rename the second Filepicker to *pdfPicker*. Let’s also change the **Accept file types** property to `{{"pdf/*"}}` - this allows us to restrict the Filepicker to only accept PDF files. Since the default value for the **Accept file types** property is `{{"image/*"}}`, we won’t change it for the *imagePicker* component. 

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-accepted-file-type.png" alt="Accepted File Type Settings"  />
</div>

<br/>

Click on the *imagePicker* component and select an image to upload. Similarly, upload a PDF using the *pdfPicker* component. 

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/filepickers-with-uploaded-files.png" alt="Uploaded Files"  />
</div>

After uploading, you will see the filenames displayed on their respective Filepicker components.

Next, we'll create a query to add a new row to our table, which will include the base64 strings of the files we upload using the Filepicker components. Click on the **+ Add** button in the query panel at the bottom, select **Tooljet Database** as the data source. For the Table name dropdown, select **testDB** and for the Operations dropdown, select **Create Row**. Rename this query to *uploadFiles*.

Under the **Columns** section, add two columns - **pdf** and **image**. We will now use the **exposed variables** of both Filepicker components to get the base64 strings of the files we uploaded earlier. 

Set the below value for the **pdf** column: 
```js
{{components.pdfPicker.file[0].base64Data}}
```
Similarly, for the **image** column:
```js
{{components.imagePicker.file[0].base64Data}}
```

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/add-files-query.png" alt="Add Files Query"  />
</div>

The `file` key holds an array of uploaded files. To access a specific file's data, use its index in the array. For example, if we set **Pick multiple files** property to true for the *pdfPicker* component and upload 3 files, we can access them like this:

```js
{{components.pdfPicker.file[0].base64Data}}  // First file
{{components.pdfPicker.file[1].base64Data}}  // Second file
{{components.pdfPicker.file[2].base64Data}}  // Third file
```

Drag and drop a **[Button](/docs/widgets/button)** component below the two Filepicker components and rename the component to *upload*. 

In the Button component's properties:
- Change the Button Text property to **Upload**.
- Click on **+ New event handler** to create a new event handler, keep the Event as **On click** and Action as **Run Query**. Select *uploadFiles* as Query.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/upload-button-properties.png" alt="Upload Button Properties"  />
</div>

We are now done with the upload flow. Now every time we select files in the Filepicker components and click on the *upload* button, the base64 strings of the related files will be pushed to the database. 

## View Image and PDF Files 

Now, let’s create another query to fetch the base64 strings of the uploaded files from the database and display them. Click on the **+Add** button in the query panel, select Tooljet Database as the data source, **testDB** as the Table name and **List rows** as Operations. Rename the query to *getFiles* and click on **Run** to fetch the data. Optionally, we can enable **Run this query on application load?** if we need to show images or PDFs as soon as the application starts.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/fetch-files-query.png" alt="Fetch Files Query"  />
</div>

Drag **[Image](/docs/widgets/image)**  and **[PDF](/docs/widgets/pdf)** components on the canvas from the components library. Rename the **Image** component to *displayImage* and the **PDF** component to *displayPDF*.

In the **URL** property of the **displayImage** component, enter:
```js
{{'data:image;base64,' + queries.getFiles.data[0].image}}
```

`'data:image/base64,'` specifies that the data should be interpreted as a base64-encoded image.
`queries.getFiles.data[0].image` fetches the base64-encoded image data from the first row in the data array returned by the getFiles query.

Let's apply the same logic for the **displayPDF** component and enter the below value in the **File URL** property:

```js
{{'data:pdf;base64,' + queries.getFiles.data[0].pdf}}
```
<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-with-fileURL.png" alt="PDF Component With File URL"  />
</div>

In both cases, the code constructs a Data URL to display the base64-encoded data as an image or PDF.

Here's what our final interface will look like:

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-image-view.png" alt="Final Preview"  />
</div>

:::info
You can also use transformations in the query response and concat `data:image/jpeg;base64,` to the base64 data.
:::