# TypeSense
ToolJet can connect to your TypeSense deployment to read and write data.

## Supported operations
1. Create collection
2. Index document
3. Search documents
4. Get document
5. Update document

## Connection 
Please make sure the host/IP of the TypeSense deployment is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

ToolJet requires the following to connect to your TypeSense deployment: 
- Host
- Port
- API Key
- Protocol