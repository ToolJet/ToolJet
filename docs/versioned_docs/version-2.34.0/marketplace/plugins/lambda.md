---
id: marketplace-plugin-aws-lambda
title: AWS Lambda
---

ToolJet can connect to AWS Lambda to run serverless functions.

## Connection

To connect to AWS Lambda plugin, you need to provide the following details:

- **Access Key ID**: The access key ID of the IAM user that has the required permissions to access AWS Lambda.
- **Secret Access Key**: The secret access key of the IAM user that has the required permissions to access AWS Lambda.
- **Region**: The region where the AWS Lambda is hosted.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/lambda/awslambdaconfig.png" alt="ToolJet database" />
</div>

## Supported queries

### Invoke Lambda Function

This query is used to invoke a Lambda function. The following parameters are required:

- **Function Name**: The name of the Lambda function to be invoked.
- **Payload**: The JSON payload to be sent to the Lambda function.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/lambda/lambdaquery.png" alt="ToolJet database" />
</div>

