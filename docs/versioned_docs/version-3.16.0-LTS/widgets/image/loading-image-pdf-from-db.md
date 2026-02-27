---
id: loading-image-pdf-from-db
title: Upload And View Images Using Base64 String
---
<div style={{paddingBottom:'15px'}}>

This guide shows how to upload and view images using the base64 string format in your ToolJet application. 

</div>

## 1. Create a New Table In ToolJet Database

- Create a new table named **test_db**. 

- The `id` field will be present by default to create a unique identifier for each record in our database table.

- Click on **Add more columns** button and add this column: `image` and select `varchar` as datatype.

<i>While we are using the ToolJet Database for this guide; feel free to use other databases while applying the same principles.</i>

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/create-table.png" alt="Create New Table in TJDB"  />

## 2. Upload File To The Database

- Create a new application and name it **Upload Images Example**. 

- Drag and drop a **[Filepicker](/docs/widgets/file-picker)** component on the canvas from the components library on the right. 

- Rename the filepicker component to **image_picker**.

- Retain the default `{{"image/*"}}` or select file type as "Image files" setting for the Accept file types property in the **image_picker** component, as it's intended for image uploads.

- Click on the **image_picker** component and select an image to upload.

- After uploading, you will see the filename displayed on the filepicker component.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/image-file-upload.png" alt="Uploaded Files using a filepicker"  />

- Click on the **+ Add** button in the query panel to create a new query, choose ToolJet Database as the data source, select `test_db` as Table name, and `Create Row` as Operations. Name this query **upload_files**.

- Under the Columns section, add this column `image` and set the value given below : 

```js
{{components.image_picker.file[0].base64Data}}
```

<i>In the above query, we are using the **exposed variables** of the filepicker component to get the base64 string of the file we had uploaded earlier.</i>

<img style={{ marginTop: '15px', marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/upload-query.png" alt="Add Files Query"  />

- Add a **[Button](/docs/widgets/button)** component below the filepicker and rename it to **upload**.

- Set the Button's text to **Upload** and create a **New event handler** with the following settings: 
Event - `On click`, Action - `Run Query` and Query - `upload_files`.

- Now, Click on the **Upload** button to upload the files that we had selected in the Filepicker component earlier.

<img style={{ marginBottom:'15px' }}  className="screenshot-full img-full" src="/img/how-to/load-base64/image-event-handler.png" alt="Upload Button Properties"  />

The upload process is now complete. Whenever a file is selected in the Filepicker component and the upload button is clicked, the base64 string of the file will be automatically written to the database.

## 3. View Image File 

- Create a query named **get_files** to retrieve base64 strings from test_db : Click on **+ Add** button in the query panel, select ToolJet as Database, `test_db` as Table name, and `List rows` as Operations.

- Enable **Run this query on application load** from settings.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/get-query.png" alt="Fetch Files Query"  />

- Drag an **[Image](/docs/widgets/image)** component onto the canvas from the components library. Rename the **Image** component to **display_image**.

- In the **URL** property of the **display_image** component, enter the following:
```js
{{'data:image;base64,' + queries.get_files.data[0].image}}
```

<i>The provided code constructs a Data URL to display the base64-encoded data as an image.</i> 

<img style={{ marginTop: '15px', marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/load-base64/display-image.png" alt="Final Preview"  />
