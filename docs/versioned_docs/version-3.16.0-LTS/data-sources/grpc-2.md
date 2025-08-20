---
id: grpcv2
title: gRPC 2.0
---

:::info New gRPC 2.0
This documentation covers the new **gRPC 2.0** data source with enhanced features including server reflection and OAuth2 authentication. The [legacy gRPC](/docs/data-sources/grpc) data source is still available but is deprecated.
:::

## What's New in gRPC 2.0

The new gRPC 2.0 data source provides significant improvements over the legacy version:
- **Server Reflection Support**: Dynamically discover services and methods without proto files
- **Proto File URL Import**: Import proto files from remote URLs
- **Enhanced Authentication**: Full OAuth2 support, improved basic/bearer authentication
- **SSL/TLS Configuration**: Comprehensive certificate management
- **Custom Metadata Headers**: Support for API keys and custom authentication
- **Cloud-Ready**: No local file system dependencies

## Pre-Requisite: Upgrade ToolJet to Version 2.5 or Above

Find instructions on how to do this in the setup guides located here: [ToolJet Setup](/docs/setup/try-tooljet).

:::note
Unlike the legacy gRPC data source, gRPC 2.0 **does not require** adding proto files to your server or mounting volumes. The new version supports:
- **Server Reflection**: Automatically discover services from your gRPC server
- **Proto File URLs**: Import proto files directly from remote URLs

:::tip Migration from Legacy gRPC
If you're upgrading from the legacy gRPC data source, you no longer need to:
- Create a `/protos` directory
- Mount volumes in docker-compose.yml
- Restart your ToolJet instance for proto file changes
:::

## Proto File Configuration

gRPC 2.0 offers two methods for defining your service schema:

### Server Reflection (Recommended)

Server reflection allows ToolJet to automatically discover all available services and methods from your gRPC server. This is the most flexible approach as it adapts to schema changes without requiring updates in ToolJet.

**Prerequisites for Server Reflection:**
- Your gRPC server must have reflection enabled
- The server must be accessible from your ToolJet instance

**Enabling Reflection on Your gRPC Server:**

For Go servers:

```go
import "google.golang.org/grpc/reflection"
s := grpc.NewServer()
// Register your services...
reflection.Register(s)
```

For Node.js servers:
```javascript
const reflection = require('@grpc/reflection');
reflection.loadSync(server);
```

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/server-reflection.png" alt="gRPC 2.0: connection configuration" />

### Proto File URL Import

If server reflection is not available or you prefer to use a specific proto file, you can import it directly from a URL.

**Supported URL formats:**

- `https://example.com/api.proto`
- `https://raw.githubusercontent.com/user/repo/main/api.proto`
- Any publicly accessible HTTPS URL serving a `.proto` file

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/proto.png" alt="gRPC 2.0: connection configuration" />

## Connecting to gRPC 2.0
After configuring your proto schema, establish a connection by going to the [data source](/docs/data-sources/overview) page.

### Connection Configuration
ToolJet gRPC 2.0 requires the following configuration:

#### Basic Settings
- **Server URL**: Your gRPC server endpoint (e.g., `grpcb.in:9001` or `https://api.example.com:443`)
- **Proto Files**: Choose between "Server Reflection" or "Import Proto File URL"
- **Custom Metadata**: Key-value pairs for custom headers (optional)

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/config.png" alt="gRPC 2.0: connection configuration" />

#### Authentication Options

gRPC 2.0 supports comprehensive authentication methods:

- **None (Default)**
    - No authentication required
- **Basic Authentication**
    - Username and password
    - Automatically adds authentication metadata to requests
- **Bearer Token**
    - Token-based authentication
    - Supports custom header prefixes
-**OAuth2 (New)**
    - Full OAuth2 flow support
    - Authorization Code, Client Credentials grant types
    - Custom OAuth parameters and scopes
    - Automatic token refresh
- **API Key via Metadata**
    - Use custom metadata headers for API key authentication
    - Support for multiple header formats

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/oauth.png" alt="gRPC 2.0: connection configuration" />

#### SSL/TLS Configuration

Enhanced security options for encrypted connections:

- **SSL/TLS Toggle**
    - Enable/disable SSL encryption
- **Certificate Types:**
    - **None**: No certificate validation
    - **CA Certificate**: Verify server with custom CA
    - **Client Certificate**: Mutual TLS with client certificates
- **Certificate Management:**
    - Secure storage of certificates
    - Support for PEM format certificates
    - Separate fields for CA cert, client cert, and private key

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/ssl.png" alt="gRPC 2.0: connection configuration" />

## Custom Metadata Headers

gRPC 2.0 supports custom metadata headers for flexible authentication and request customization:

**Use Cases:**
    - API key authentication (`x-api-key: your-api-key`)
    - Custom authorization headers
    - Request tracking headers
    - Service-specific metadata

**Configuration:**
    - Key-value pair interface similar to REST API headers
    - Support for encrypted values
    - Dynamic values using ToolJet variables

## Creating Queries

Once configured, the gRPC 2.0 data source will be available in your application's query panel.

### Service and Method Selection

1. With **Server Reflection**:
    1. Select your gRPC 2.0 data source
    2. Choose from automatically discovered services
    3. Select available methods for the chosen service
    4. Method parameters are dynamically generated based on the proto schema

2. With **Proto File URL**:
    1. Import completes automatically after URL validation
    2. Services and methods populate from the imported proto file
    3. Parameter forms are generated from the proto definitions

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/service.png" alt="gRPC 2.0: query interface" />

### Request Configuration

- **Method Parameters:**
    - Auto-generated forms based on proto message types
    - Support for nested objects and repeated fields
    - JSON or form-based input modes
- **Request Metadata:**
    - Override connection-level metadata for specific requests
    - Add request-specific headers
- **Advanced Options:**
    - Request timeout configuration
    - Custom deadline settings

## Migration from Legacy gRPC

If you're currently using the legacy gRPC data source, here's how to migrate:

### Key Differences

| Feature | Legacy gRPC | gRPC 2.0 |
|---------|-------------|----------|
| Proto Files | Local file system | Server Reflection + URL Import |
| Authentication | Basic, Bearer, API Key | Basic, Bearer, OAuth2, Custom Metadata |
| SSL/TLS | Limited | Full certificate management |
| Setup | Manual file mounting | Zero configuration |
| Schema Updates | Server restart required | Automatic with reflection |

### Migration Steps
1. **Create New gRPC 2.0 Data Source**
   - Add gRPC 2.0 from the global data sources page
   - Configure with the same server URL
2. **Choose Proto Method**
   - **If your server supports reflection**: Select "Server Reflection"
   - **If using proto files**: Upload to a public URL and use "Import Proto File URL"
3. **Update Authentication**
   - Basic and Bearer tokens work the same way
   - API keys should be configured as custom metadata headers
   - OAuth2 setup
4. **Update Queries**
   - Recreate queries using the new data source
   - Test functionality with the new interface
5. **Remove Legacy Setup** (Optional)
   - Remove the `/protos` directory
   - Remove volume mounts from docker-compose.yml
   - Remove legacy gRPC data source

:::note 
Legacy Support
The legacy gRPC data source remains available but is deprecated. New projects should use gRPC 2.0, and existing projects are encouraged to migrate.
:::
