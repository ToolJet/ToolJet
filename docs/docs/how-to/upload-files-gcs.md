# Upload files using GCS

ToolJet’s support uploading files, we are going to create an interface to upload PDFs to GCS

Before adding the new data source we will need to have a private key for our GCS bucket and it has the correct rights.

## Setting up Google Cloud Storage data source

1. From our application in tooljet go to  **left sidebar** to sources.
2. Add a new GCS source from the  **APIs list.**
3. Test the connection
4. Save it, we will use it later

<img class="screenshot-full" src="/img/how-to/upload-files-gcs/adding-account.png" alt="ToolJet - How To - Upload files using GCS" height="320"/>

## Adding a file picker

1. Drag a drop the file picker to your app
2. Configure the file picker to fit our needs
- Change the: **Accept file types** to `{{"application/pdf"}}` so we will only accept pdf files. In case we will like to accept any file type just **leave it in blank**
- Change the **Max file count** to one as we are only going to upload 1 file at a time.

:::info
 File types must be valid [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) type according to input element specification or a valid file extension.

 To accept any/all file type(s), set `Accept file types` to an empty value.
:::

#### Current config
<img class="screenshot-full" src="/img/how-to/upload-files-gcs/config-filepicker.png" alt="ToolJet - How To - Upload files using GCS" height="120"/>

#### Current result when opening the file picker
The pripierties  **Accpeted file typess** will filter wicth type of files can we upload
<img class="screenshot-full" src="/img/how-to/upload-files-gcs/result-filepicker.png" alt="ToolJet - How To - Upload files using GCS" height="120"/>

## Adding a query
1. Select the GCS datasource
2. Add the required parameters
- Bucket: `gs://test-1`
- File Name: `{{components.file1.file[0]['name']}}`
- Content Type: `{{components.file1.file[0]['type']}}`
- Upload data: `{{components.file1.file[0]['base64Data']}}`
- Enconding: `base64`
3. Save


## Launch the query
1. Add a button that will fire the query to upload the file
2. Go to properties of that button
3. Events->Add handler-> On click-> Run query -> Select the previously created query
4. Fire!
<img class="screenshot-full" src="/img/how-to/upload-files-gcs/final-result.png" alt="ToolJet - How To - Upload files using GCS" height="120"/>
