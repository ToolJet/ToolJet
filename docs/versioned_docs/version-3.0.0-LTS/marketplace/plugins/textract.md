---
id: marketplace-plugin-textract
title: Amazon Textract
---

ToolJet integrates with Amazon Textract to facilitate the extraction of text and data from various document types, such as scanned documents, forms, and tables. Supported document formats include PDF, JPEG/JPG, and PNG.

## Connection

To connect ToolJet with Amazon Textract, you will need the following credentials:
- **Access key:** The access key of the user you want to use to connect to the Amazon Textract.
- **Secret key:** The secret key of the user you want to use to connect to the Amazon Textract.
- **Region:** The region where the Amazon Textract is hosted.

:::caution
- Access to the S3 bucket is dependent on the permissions granted to the IAM role added for the connection.
- Only single page documents are supported. For multi-page PDFs, consider converting them to single-page formats with online tools.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/textract/textract-config-v2.png" alt="Amazon Textract Configuration" />

</div>

## Supported Operations

:::info
The data returned by the queries is in **JSON** format and may include additional information such as confidence scores and the location of the extracted content within the original document.
:::

### Analyze Document

This operation lets you analyze the document using the document data in **base64** format.

#### Required Parameters: 

- **Document**: Supply the document data in base64 format. File Picker component can be used here to pick the document from the local system and retrieve the base64 data dynamically using exposed variables. Example: `{{components.file_picker.file[0].base64Data}}`.

#### Optional Parameters: 

- **Data Output**: Choose the desired data output types for the document analysis. Options include: 
  1. **Forms**: Extract key and value pairs from the forms.
  2. **Tables**: Extract data from tables, including headers and cell content.
  3. **Queries**: Extract data from databases and other structured sources.
  4. **Signature Detection**: Identify and extract signatures.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/textract/analyze-document.png" alt="Analyze Document Textract" />
</div>

<details>
<summary>**Example Values**</summary>

```yaml 
Document: JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgPj4KZW5kb2JqCjUgMCBvYmoKPDwgL0xlbmd0aCAxMjUgPj4Kc3RyZWFtCkJUIC9GMSAxMiBUZiAxMDAgNzAwIFRkICgoSGVsbG8sIEFtYXpvbiBUZXh0cmFjdCEpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDExIDAwMDAwIG4gCjAwMDAwMDAwNTQgMDAwMDAgbgAKMDAwMDAwMDEwMyAwMDAwMCBuIAowMDAwMDAwMTcyIDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKMjIzCiUlRU9G
Data output: //Forms | Tables| Queries | Signature Detection
```

</details>

<details>
<summary>**Response Example**</summary>

```json
  "$metadata": {} 4 keys
    "httpStatusCode":200
    "requestId":"9e16a4db-3c85-4bbb-8b8c-ba2884b089aa"
    "attempts":1
    "totalRetryDelay":0
  "AnalyzeDocumentModelVersion":"1.0"
  "Blocks":[] 1 item
  "DocumentMetadata":{} 1 key

```
</details>

### Analyze Document Stored in AWS S3

This operation let's you analyze the document stored in your AWS S3 buckets by providing the **bucket** and **object** name.

#### Required Parameters: 

- **Bucket**: Specify the S3 bucket containing the document.
- **Key**: Provide the name of the document (object) to be analyzed.

#### Optional Parameters: 

- **Data Output**: Select one or more type of data output of the document. Options include: 
  1. **Forms**: Extract key and value pairs from forms.
  2. **Tables**: Extract data from tables, including headers and cell content.
  3. **Queries**: Extract data from databases and other structured sources.
  4. **Signature Detection**: Identify and extract signatures.


<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/textract/analyze-document-stored.png" alt="Analyze Document Stored in AWS S3 Textract" />
</div>

<details>
<summary>**Example Values**</summary>

```yaml 
Bucket: reimbursement-receipt-files
Key: reimbursement_receipt_1718364944018.png
Data output: //Forms | Tables| Queries | Signature Detection
```

</details>

<details>
<summary>**Response Example**</summary>

```json
  "$metadata": {} 4 keys
    "httpStatusCode":200
    "requestId":"c6d81be0-ea09-4f7c-9b48-27d9c82c113d"
    "attempts":1
    "totalRetryDelay":0
  "AnalyzeDocumentModelVersion":"1.0"
  "Blocks":[] 1 item
  "DocumentMetadata":{} 1 key

```
</details>