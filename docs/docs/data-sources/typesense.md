---
sidebar_position: 20
---

# TypeSense
ToolJet can connect to your TypeSense deployment to read and write data.

## Supported operations

:::tip
Documentation for each of these operations are available at https://typesense.org/docs/
:::

1. Create collection
2. Index document
3. Search documents
4. Get document
5. Update document
6. Delete document

:::tip
Make sure that you supply JSON strings instead of JavaScript objects for any document or schema that is being passed to the server, in any of the above operations.
:::

## Connection 
Please make sure the host/IP of the TypeSense deployment is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

ToolJet requires the following to connect to your TypeSense deployment: 
- Host
- Port
- API Key
- Protocol