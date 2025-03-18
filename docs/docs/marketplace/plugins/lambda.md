---
id: marketplace-plugin-aws-lambda
title: AWS Lambda
---

ToolJet integrates with AWS Lambda to run serverless functions.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Connection

To connect to AWS Lambda plugin, you need to provide the following details:

- **Access Key ID**: The access key ID of the IAM user that has the required permissions to access AWS Lambda.
- **Secret Access Key**: The secret access key of the IAM user that has the required permissions to access AWS Lambda.
- **Region**: The region where the AWS Lambda is hosted.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/lambda/aws-lambda-config-v2.png" alt="AWS Lambda Query" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Supported Operations

### Invoke Lambda Function

This query is used to invoke a Lambda function.

#### Required Parameters
- **Function Name**: The name of the Lambda function to be invoked.

#### Optional Parameters
- **Payload**: The JSON payload to be sent to the Lambda function.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/lambda/lambda-query-v2.png" alt="ToolJet database" />
</div>

</div>

<details>
<summary>**Example Values**</summary>

```yaml 
Function Name: testAwslambdaPlugin
Payload: //{"key":"value"}
```

</details>

<details>
<summary>**Response Example**</summary>

```json
    "statusCode":200,
    "body:"{"message":"lambda triggered","event":{}}"
```
</details>