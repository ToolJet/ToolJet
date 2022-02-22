
# Smtp

Smtp plugin for connect **SMTP servers** to your tooljet application.

## Connection

A smtp server can connect with following credentails
- **Host**
- **Port**
- **User**
- **Password**

Fill above fields and test your connection is `ok` or `not`

## Send Email

For sending your emails, You should provide these details.

  Properties :
  - **From Address** `required`
  - **From name** 
  - **To Address** `required`
  - **Subject**

#### Send email with `raw text`
You can send email with raw text by filling **Text** Field.

#### Send email with `HTML`
Smtp servers also provide a feature for sending email with HTML content. So through filling **HTML** field You can also send them.

#### Send email with `Attachments`
As normal email, Tooljet provides an option to send email with attachments. You can pass an array of `{{ name: 'filename.jpg', dataURL: '......' }}` object to **Attachments** Field to accomplish this.
