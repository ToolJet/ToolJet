---
id: marketplace-plugin-aws-lambda
title: AWS Lambda
---

ToolJet can connect to AWS Lambda to run serverless functions.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Connection

To connect to AWS Lambda plugin, you need to provide the following details:

- **Access Key ID**: The access key ID of the IAM user that has the required permissions to access AWS Lambda.
- **Secret Access Key**: The secret access key of the IAM user that has the required permissions to access AWS Lambda.
- **Region**: The region where the AWS Lambda is hosted.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/marketplace/plugins/lambda/connection.png" alt="aws lambda connection" />
</div>

</div>

<div style={{ paddingBottom:'24px'}}>

## Supported Operation

### Invoke Lambda Function

This query is used to invoke a Lambda function. The following parameters are required:

- **Function Name**: The name of the Lambda function to be invoked.
- **Payload**: The JSON payload to be sent to the Lambda function.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/lambda/query.png" alt="aws lambda querying" />
</div>

</div>