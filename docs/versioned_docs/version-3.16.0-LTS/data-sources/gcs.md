---
id: gcs
title: Google Cloud Storage
---

ToolJet can connect to GCS buckets and perform various operation on them.

## Connection

To establish a connection with the Google Cloud Storage data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to a GCS datasource:

- **JSON Private Key**

You can refer to the [Google Cloud Documentation](https://cloud.google.com/docs/authentication/getting-started) to get started.

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/connection-gcs-ux-v3.png"  alt="gcs connection" />

:::Info
**The Private key should look like this:**
```json
{
  "type": "service_account",
  "project_id": "datasource-350mn",
  "private_key_id": "e86d7f59d89d2b96c74be4d10b39d881dbc1ed",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1xW7ah6v8Qqqw\nDtWCHaZEA6O3naDD7nHVWUOJ4k8beT5xBqUUWprqzoRNUJxw6qKR49U2PsYNROdSg8nX7eDbwvvB9KFcb3N2bRxSM5UxRNkGqlMcHFSjelXI9I76NcVzDR8uJIibHFIxWySS4JJVkCt3i0y8of1PK/+i\nsKTuQGTb33mtaYXwQDOIc78SOyKM80pWo0SYyWoH1ZqGKUkzR4VMCx7uyf4\nluCbM3ZDEN9pZZOQgoTkkcpXt7Rg72G9FoFmvTNhAoGBAOC6s16g1f4h67pAiPvN\nN1tKIdb19+MTZyYptT/Du+hpJ5Y5sTu5Nv7GpdkLL0SG8T5XLZV+1RNT8MGV4GsA\nmSdsm4El39sdVqtTzYvEP+5ccSPWpcKYc5tpzVeJpdlK1OwkCShzD5pOLMBqvVlF\nX3DPmXj33a9RkDIa0UK5LuiH\n-----END PRIVATE KEY-----\n",
  "client_email": "gcs-adminsdk-n8ezk@datasource-350mn.iam.gserviceaccount.com",
  "client_id": "163394003008404340612",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-n8ezk%40datasource-350mn.iam.gserviceaccount.com"
}
```
:::

## Querying GCS

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **GCS** datasource added in previous step.
3. Select the Operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/app-builder/custom-code/transform-data)
:::

#### Supported operations

- **[Read file](#read-file)**
- **[Upload file](#uplodad-file)**
- **[List buckets](#list-buckets)**
- **[List files in a bucket](#list-files-in-a-bucket)**
- **[Signed url for download](#signed-url-for-download)**
- **[Signed url for upload](#signed-url-for-upload)**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/listops.png" alt="gcs list of operations" style={{marginBottom:'15px'}} />

### Read File

Reads the content of a file from GCS.

#### Required Parameter

- **Bucket**
- **File Name**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/read-query.png" alt="gcs read query" style={{marginBottom:'15px'}} />

### Uplodad File

Uploads a file to GCS.

#### Required Parameter

- **Bucket**
- **File name**
- **Upload data**

#### Optional Parameter

- **Content Type**
- **Encoding**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/upload-query.png" alt="gcs upload query" style={{marginBottom:'15px'}} />

#### Example:

```yaml
{
    'name' : 'Shruthi Jotsna'
}
```

### List Buckets

Retrieves a list of available buckets.

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/list-bucket-query.png" alt="gcs list query" style={{marginBottom:'15px'}} />

### List Files in a Bucket

Lists files within a specific GCS bucket.

#### Required Parameter

- **Bucket**

#### Optional Parameter

- **Prefix**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/list-files-query.png" alt="gcs list query" style={{marginBottom:'15px'}} />

### Signed URL for Download

Generates a signed URL for downloading a file.

#### Required Parameter

- **Bucket**
- **File Name**

#### Optional Parameter

- **Expires in**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/signed-download-query.png" alt="gcs url download query" style={{marginBottom:'15px'}} />

### Signed URL for Upload

Generates a signed URL for uploading a file.

#### Required Parameter

- **Bucket**
- **File name**

#### Optional Parameter

- **Expires in**
- **Content Type**

<img className="screenshot-full img-full" src="/img/datasource-reference/gcs/signed-upload-query.png" alt="gcs url upload query" style={{marginBottom:'15px'}} />