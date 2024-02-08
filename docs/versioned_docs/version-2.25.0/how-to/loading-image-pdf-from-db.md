---
id: loading-image-pdf-from-db
title: Loading image/PDF from base64 string
---

In this how-to guide we will see how we can load an image or PDF file using the base64 string available on the database. In this how-to, we have used the postgres database which already has the base64 strings for the image or the PDF files available.

- Let's drag a **filepicker** component onto the canvas, and pick one image and one pdf file
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/load-base64/filepicker.png" alt="Loading image from base64 string" width="700" />

    </div>

- Now, create a query for inserting an image from the filepicker. As you can see in the screenshot below, we are using the **exposed variable** of the filepicker component to retrieve the **base64** data of the uploaded files.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/load-base64/insert.png" alt="Loading image from base64 string" width="500"/>

    </div>

- Create another query for returning the data from the database and we will use this base64 data returned in this query to display on the image and pdf components.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/load-base64/get.png" alt="Loading image from base64 string" width="500"/>

    </div>

- Drag the image and a PDF component on the canvas. Edit the property of the PDF component and in the **file URL** enter:
    ```js
    {{'data:image/png;base64,' + queries.get.data[7].pdf}}
    ```
    Similarly for the image component:
    ```js
    {{'data:image/jpeg;base64,' + queries.get.data[7].image}}
    ```
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/load-base64/pdf.png" alt="Loading image from base64 string" />

    </div>

:::info
You can also use transformations in the query response and concat `data:image/jpeg;base64,` to the base64 data.
:::