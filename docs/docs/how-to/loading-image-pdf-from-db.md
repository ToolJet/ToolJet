---
id: loading-image-pdf-from-db
title: Upload and view images and PDFs using base64 string
---

In this guide, we will first see how we can upload and view images and PDFs using the base64 string format. In the **[first part](#part-one)**, we will use the the **[Filepicker](/docs/widgets/file-picker.md)** component to upload files to the database. Then in the **[second part](#part-two)**, we will go through the process of displaying the uploaded images and PDFs from the database using **[Image](/docs/widgets/image.md)** and **[PDF](/docs/widgets/pdf.md)** components. 

<div style={{display: 'flex', justifyContent: 'space-between', alignItems:'center'}}>
  <div style={{flex: 1, padding: '0', alignment:'center'}}>
    <p style={{textAlign: 'left'}}>
    Before we begin part one, we need to create a table in ToolJet Database.
    <br/>    
    <br/>    
    - Create a new table named "testDB" with three fields - id, pdf and image. 
    <br/>
    <br/>
    - The "id" field is auto-generated as the primary key. 
    <br/>    
    <br/>
    - Select "varchar" as datatype for the pdf and image fields.
    <br/>
    <br/>
    Note that we are using a table from the ToolJet Database for this guide, but you can apply the same principals to other databases. 
</p>
  </div>
  <div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/create-new-table.png" alt="New Table"  />
  </div>
</div>

<br/>

## PART ONE

Create a new application and name it *Load PDF And Images Example*. 

Drag and drop two **Filepicker** components in the canvas from the components library on the right. Next we’ll go to the properties of the first Filepicker component, and rename it to *imagePicker*.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/filepickers-rename.png" alt="Rename Filepickers"  />
</div>

<br/>

Similarly, rename the second Filepicker to *pdfPicker*. Let’s also change the **Accept file type** property to {{"pdf/\*"}} - this allows us to restrict the Filepicker to only accept pdf files. Since the default value for the **Accept file type** property is {{"image/\*"}}, we won’t change the **Accept file type** property for the *imagePicker* component. 

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-accepted-file-type.png" alt="Accepted File Type Settings"  />
</div>

<br/>

Click on the *imagepicker* component and select an image to upload. Similarly, upload a pdf using the *pdfpicker* component. 

Next we’ll create a query to insert a new row to our table. Click on the **+ Add** button in the query panel at the bottom, select Tooljet Database as the Datasource. For the "Table name" dropdown, select "testDB" and for the "Operations" dropdown, select "Create Row". Rename this query to *uploadFiles*.

Under the Columns section, add two columns - "pdf" and "image". We will now use the **exposed variables** of both the Filepicker components to get the base64 strings of the files we uploaded earlier. 

Set the value for the pdf: 
```js
{{components.pdfPicker.file[0].base64Data}}
```
Similarly for the image component:
```js
{{components.imagePicker.file[0].base64Data}}
```

Click on **Create** in the query panel. Your query should now resemble the below screenshot.
<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/add-files-query.png" alt="Add Files Query"  />
</div>

<br/>

Drag and drop a **[Button](/docs//widgets/button.md)** component below the two Filepicker components and rename the component to *upload*. 

In the button properties:
- Change the Button Text property to "Upload".
- Add an event handler, keep the event as "On click" and action as "Run Query". Select *uploadFiles* as Query.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/upload-button-properties.png" alt="Upload Button Properties"  />
</div>

We are now done with the upload flow. Now every time we select files in the Filepicker components and click on the *upload* button, the base64 strings of the related files will be pushed to the database. 

## PART TWO

Now let’s create another query to fetch the base64 strings of the uploaded files. Click on the **+Add** button in the query panel, select Tooljet Database as the Datasource, "testDB" as the table and "List rows" as operations. Scroll down  in the query panel and enable "Run this query on application load?". Click on "Create", and then click on "Run". Rename the query to *files*.

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/fetch-files-query.png" alt="Upload Button Properties"  />
</div>
<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/fetch-files-load-checkmark.png" alt="Upload Button Properties"  />
</div>

Drag an **Image** and **PDF** component on the canvas. 

In the **URL** property of the Image component, enter:
```js
{{'data:image;base64,' + queries.files.data[0].image}}
```

Similar, enter the below value for in the **File URL** property of the PDF component
```js
{{'data:pdf;base64,' + queries.files.data[0].pdf}}
```

Here's how our final interface will look like:

<div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/how-to/load-base64/pdf-image-view.png" alt="Upload Button Properties"  />
</div>

You can also configure a Filepicker component to accept multiple files. You can access each file using their respective indexes. In our example, if we were accepting 3 files in the *pdfPicker*, we would've accessed the individual files through their indexes as shown below:

```js
{{components.pdfPicker.file[0].base64Data}} 
{{components.pdfPicker.file[1].base64Data}} 
{{components.pdfPicker.file[2].base64Data}} 
```

:::info
You can also use transformations in the query response and concat `data:image/jpeg;base64,` to the base64 data.
:::