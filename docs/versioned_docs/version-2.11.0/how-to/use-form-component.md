---
id: use-form-component
title: Use form component
---

In this how-to guide, we will be building a simple application that will leverage the form component for adding a record into the database. For this guide, we will be using Google Sheet datasource to read and write data.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-form/final.png" alt="how-to use form" />

</div>

- Let's connect to the datasource i.e. Google Sheets and give the `Read and Write` permission.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/read.png" alt="how-to use form" />

    </div>
- Now, drag a table on the canvas and add the form component next to it.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/table1.png" alt="how-to use form" />

    </div>

- Currently, the table component is populated with the sample data that it has by default. Let's create a **new query** from the query panel and choose the **Google Sheet** datasource. 
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/query.png" alt="how-to use form" />

    </div>

- The query will read the data from the database and we will use the returned data to populate the table. Go to the **table** property and in the table data value enter **{{queries.queryname.data}}** where queryname is the name of the query that we created in previous step.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/populate.png" alt="how-to use form" />

    </div>

- let's go to the form and add the components inside it required for adding a record into the database.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/form1.png" alt="how-to use form" />

    </div>

- Since our database record has five fields **Id**, **Title**, **Price**, **Category** and **Image** we will add the components in the form for the same. The form already comes with a Submit button so we don't have to add that. For Id, Title, and Image we will use text-input, for Price we will use number-input and for category we can use dropdown components.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/form2.png" alt="how-to use form" />

    </div>

- Before editing the form properties, let's make a few changes in the components that we have added inside it. First edit the property of the **number input** and set the default value, maximum and minimum value, and then edit the **dropdown** component and set the option values and option labels.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/categ.png" alt="how-to use form" />

    </div>

- Now, we can edit the properties of the form component. Go to its properties, in **Button To Submit Form** select the button1 that was already there on the form. Go to event handler, and for **On submit** event we will **run the query** that will get the data from the form and will store into the database.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-form/event.png" alt="how-to use form" />

    </div>

- Let's create a query that will get the data from the form and add a record in the sheet. Create a new google sheeet query and from the operation choose **Append data to a spreadsheet**
    ```js
    [ 
        {
            "id":"{{components.form1.data.textinput1.value}}",
            "title":"{{components.form1.data.textinput2.value}}",
            "price":"{{components.form1.data.numberinput1.value}}",
            "category":"{{components.form1.data.dropdown1.value}}",
            "image":"{{components.form1.data.textinput4.value}}"
        } 
    ]
    ```

- Once done, save the query and add it to the Form's event handler.

- Now, this application can be used to load the data from the Google Sheet and the form can be used to append more records to the sheet.

:::tip
- Make sure to enable **Run query on page load?** option of the **read** query to populate the table everytime the app is loaded
- You can also add a event handler on the **append** query to run the **read** query when **append** is successful, this will update the table data when the append is done
- Learn more about the connecting Google sheet datasource and the CRUD **operations** available [here](/docs/data-sources/google.sheets).
:::
