---
id: marketplace-plugin-textract
title: Amazon Textract
---

ToolJet can connect to Amazon Textract to extract text and data from scanned documents, forms, and tables. Textract can process documents of various formats, including PDF, JPEG/JPG, and PNG.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/textract/textract.gif" alt="Marketplace: Amazon Textract" />

</div>

:::note
Before following this guide, it is recommended to check the following doc: **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::


## Connection

For connecting to Amazon Textract, following credentials are required:
- **Access key**
- **Secret key**
- **Region**

:::caution
- Access to the S3 bucket is dependent on the permissions granted to the IAM role added for the connection.
- Only single page documents are supported. if there is a multipage PDF you can convert it to single page using available online tools.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/textract/creds.png" alt="Marketplace: Amazon Textract" />

</div>

## Supported queries

- **[Analyze Document](#analyze-document)**
- **[Analyze document stored in AWS S3](#analyze-document-stored-in-aws-s3)**

:::info
The data returned by the queries is in **JSON** format and may include additional information such as confidence scores and the location of the extracted content within the original document.
:::

### Analyze Document

This operation let's you to analyze the document by providing the document data in **base64** format.

#### Required parameters: 

- **Document**: Provide the document data in base64 scheme. Components like filepicker can be used to pick the document from local system and retrieve the base64 data dynamically using exposed variables. ex: **{{components.filepicker1.file[0].base64Data}}**
- **Data Output**: Select one or more type of data output of the document. The 4 types of data outputs are: 
  1. **Forms**: Extracted data and text from forms, including field keys and values.
  2. **Tables**: Extracted table data, including column and row headers and cell contents.
  3. **Queries**: Extracted data from databases and other structured data sources.
  4. **Signature Detection**: Identification and extraction of signatures and signature blocks from documents.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/textract/doc.png" alt="Marketplace: Amazon Textract" />

</div>

### Analyze document stored in AWS S3

This operation let's you to analyze the document stored in your AWS S3 buckets by providing the **bucket** and **object** name.

#### Required parameters: 

- **Bucket**: Name of the S3 bucket that has the document stored
- **Key**: Object name(document name) that needs to be extracted
- **Data Output**: Select one or more type of data output of the document. The 4 types of data outputs are: 
  1. **Forms**: Extracted data and text from forms, including field keys and values.
  2. **Tables**: Extracted table data, including column and row headers and cell contents.
  3. **Queries**: Extracted data from databases and other structured data sources.
  4. **Signature Detection**: Identification and extraction of signatures and signature blocks from documents.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/textract/s3.png" alt="Marketplace: Amazon Textract" />

</div>