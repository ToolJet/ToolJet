
# openapi

ToolJet has a datasource for generate REST API operations from OpenAPI Specs. 

## Connection
- Connections can generate from OpenAPI Specifications. Currently supports Basic, API Key, Bearer, Oauth2

- Also supports specifications with multiple authentications
  
  [Read more](https://swagger.io/docs/specification/authentication/) 

## Querying OpenAPI
- Operations will be generate from specs and each one will be different from other 

### Common fields
- Host (Base URL)
  
  Some specs can have one or more base urls/ servers and specific operations may have seperate Base URL. So you can select URL from host select

- Operation
