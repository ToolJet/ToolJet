---
id: s3-custom-endpoints
title: Use custom endpoint for s3 hosts
---

In this how-to guide, we will see how we can connect to different **S3 compatible object storages** using the custom endpoint. In this guide, we are using Minio since it is an S3-compatible object storage. 

- Go to the ToolJet dashboard, and create a new application
- On the left-sidebar, go to the **Sources** and add a new AWS S3 datasource
- Now the connection modal will pop-up
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/s3-custom/connection.png" alt="Custom Endpoint - S3 hosts" width="500" />

    </div>
- To get the **Credentials** which is **Access Key** and **Secret Key**, you'll need to go to the Minio console to generate the keys
- Enable the **Custom Endpoint** toggle switch, and enter the custom host URL i.e where your Minio server API is exposed 
- Once entered the details, you can click on the **Test Connection** button to check the connection