---
id: openapi
title: OpenAPI
---

# OpenAPI

ToolJet has a data source for generating REST API operations from OpenAPI Specs.

## Connection
- Connections are generated from OpenAPI specifications. Currently supports Basic Auth, API Key, Bearer Token, OAuth 2.0

- Also supports specifications with multiple authentications
  
  [Read more](https://swagger.io/docs/specification/authentication/) 

## Querying OpenAPI
- Operations will be generated from specifications and each one will be different from other  

### Common fields
- Host (Base URL)
  
  Some specs can have one or more base URLs/servers and specific operations may have separate Base URLs. So you can select the URL from the host select

- Operation
