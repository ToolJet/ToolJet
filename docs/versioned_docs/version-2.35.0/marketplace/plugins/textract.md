---
id: marketplace-plugin-textract
title: Amazon Textract
---

ToolJet integrates with Amazon Textract to facilitate the extraction of text and data from various document types, such as scanned documents, forms, and tables. Supported document formats include PDF, JPEG/JPG, and PNG.

## Connection

To connect ToolJet with Amazon Textract, you will need the following credentials:
- **Access key**
- **Secret key**
- **Region**

:::caution
- Access to the S3 bucket is dependent on the permissions granted to the IAM role added for the connection.
- Only single page documents are supported. For multi-page PDFs, consider converting them to single-page formats with online tools.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/textract/credentials.png" alt="Amazon Textract Configuration" />

</div>

## Supported Queries

- **[Analyze Document](#analyze-document)**
- **[Analyze document stored in AWS S3](#analyze-document-stored-in-aws-s3)**

:::info
The data returned by the queries is in **JSON** format and may include additional information such as confidence scores and the location of the extracted content within the original document.
:::

### Analyze Document

This operation lets you analyze the document using the document data in **base64** format.

#### Required Parameters: 

- **Document**: Supply the document data in base64 format. File Picker component can be used here to pick the document from the local system and retrieve the base64 data dynamically using exposed variables. Example: **{{components.filepicker1.file[0].base64Data}}**.
- **Data Output**: Choose the desired data output types for the document analysis. Options include: 
  1. **Forms**: Extract key and value pairs from forms.
  2. **Tables**: Extract data from tables, including headers and cell content.
  3. **Queries**: Extract data from databases and other structured sources.
  4. **Signature Detection**: Identify and extract signatures.

### Analyze Document Stored in AWS S3

This operation let's you analyze the document stored in your AWS S3 buckets by providing the **bucket** and **object** name.

#### Required Parameters: 

- **Bucket**: Specify the S3 bucket containing the document.
- **Key**: Provide the name of the document (object) to be analyzed.
- **Data Output**: Select one or more type of data output of the document. Options include: 
  1. **Forms**: Extract key and value pairs from forms.
  2. **Tables**: Extract data from tables, including headers and cell content.
  3. **Queries**: Extract data from databases and other structured sources.
  4. **Signature Detection**: Identify and extract signatures.