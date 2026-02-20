---
id: pass-values-in-rest-api
title: Pass Values in a REST API Query
---

This guide gives you an overview of how you can pass values in a REST API Query using raw JSON and key-value pairs, enabling real-time data fetching, updates, and user-driven workflows.

<div style={{paddingTop:'24px'}}>

## Raw JSON

In the following JSON code, the **`${}`** syntax is used for JavaScript string interpolation within template literals (also called template strings). This allows dynamic values from JavaScript variables or expressions to be injected directly into the string.

```javascript
{
  {
    `{
     "contents": [{
       "parts": [{
         "text": "Generate the following content for this image in markdown format:
            content type: ${components.typeOfContentInput.value},
            additional info: ${components.additionalInfoInput.value}"
        },
        {
            "inline_data": {
              "mime_type":"image/jpeg",
              "data": "${components.imageUploader.file[0].base64Data}"
            }
          },],
      },],
    }`;
  }
}
```

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/pass-values-in-rest-api/raw-2.png" alt="Passing Values Using Raw JSON" />
</div>

</div>

<div style={{paddingTop:'24px'}}>

## Supported Ways to Pass Values

ToolJet supports passing values into REST API queries in multiple ways:

| Method | Description | Example |
|--------|--------------|--------------|
| Headers | Authentication or metadata | Authorization: Bearer `{{globals.token}}` |
| Params | filters, search, and pagination | `?tone={{components.tone.value}}` |
| Body   | sending structured or complex data | `{ "prompt": {{components.prompt.value}} }` |
| Cookies | send session-related data | `{{globals.sessionId}}` |

## Entering Key Value Pairs

In this example, simple key-value pairs are entered in the provided input fields. Here, the values can simply be passed using double curly braces as is typically done in ToolJet. Take note of the status key. A string is combined with another value that is referred using double curly braces.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/pass-values-in-rest-api/key-value-2.png" alt="Passing Values Using The Key Value Inputs" />
</div>

</div>

To see REST API queries in action, check out the following tutorials:

1. **[Gemini AI Content Generator](https://blog.tooljet.com/build-an-ai-content-generator-using-gemini-api-and-tooljet-in-10-minutes/)**
2. **[Open AI Audio Transcriber](https://blog.tooljet.com/building-an-audio-transcriber-and-analyzer-using-tooljet-and-openai/)**
