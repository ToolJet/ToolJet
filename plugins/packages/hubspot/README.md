# HubSpot Plugin for ToolJet

This plugin enables ToolJet to connect to HubSpot CRM via the HubSpot API.

## Features

- **API Key Authentication**: Secure connection using HubSpot API keys
- **Full API Access**: Access all HubSpot API endpoints
- **Error Handling**: Comprehensive error handling for common API issues
- **Connection Testing**: Built-in connection testing functionality

## Setup

1. **Get a HubSpot API Key**:
   - Go to your HubSpot account
   - Navigate to Settings → Integrations → API Key
   - Generate a new API key or use an existing one

2. **Configure in ToolJet**:
   - Add a new HubSpot datasource
   - Enter your API key in the configuration

## Usage

The HubSpot plugin supports flexible API calls:

- **Endpoint**: Specify the HubSpot API endpoint (e.g., `/contacts/v1/contact`)
- **Method**: HTTP method (GET, POST, PUT, DELETE, etc.)
- **Headers**: Additional headers if needed
- **Parameters**: Query parameters
- **Body**: Request body for POST/PUT requests

## Common HubSpot API Endpoints

- **Contacts**: `/contacts/v1/contact`
- **Companies**: `/companies/v2/companies`
- **Deals**: `/deals/v1/deal`
- **Tickets**: `/crm/v3/objects/tickets`
- **Properties**: `/crm/v3/properties/{objectType}`

## Documentation

For more information about HubSpot API endpoints and usage, refer to:
- [HubSpot API Documentation](https://developers.hubspot.com/docs/api/overview)
- [ToolJet Plugin Development Guide](https://docs.tooljet.com/docs/contributing-guide/tutorials/creating-a-plugin)