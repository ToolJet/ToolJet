---
id: grpc
title: gRPC
---

<div className='badge badge--primary heading-badge'>Self-hosted only</div>

:::caution
only self-hosted deployments will have access to a gRPC datasource that is capable of handling unary requests and responses.
:::

- [Setup](#setup)
- [Querying gRPC](#querying-grpc)

## Setup

### Step 1: Upgrade ToolJet to the version 2.5 or above

Find instructions on how to do this in the setup guides located here: https://docs.tooljet.com/docs/setup/.

### Step 2: Add proto files

At the root, create a directory named "**protos**" and add a "**service.proto**" file inside it.


### Step 3: Mount Volumes

In the `docker-compose.yml` add

```bash
./protos:/app/protos
```

to the 2 volume sections for **plugins** and **server**


<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/proto1.png" alt="gRPC: datasource" width='500' />

</div>

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/proto2.png" alt="gRPC: datasource"  width='500'/>

</div>

### Step 4: Reboot the instance

```bash
docker-compose up -d
```

## Querying gRPC

After setting up your proto files, you should be able to establish a connection to gRPC by going to the [global datasource](/docs/data-sources/overview) page.

### Connect the gRPC datasource

ToolJet requires the following to connect to gRPC servers:

- **Server URL**
- **Authentication type** (None, Basic, Bearer, and API key)

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/connection.png" alt="gRPC: connection" />

</div>

Once you have added the gRPC from the global datasource page, you'll find it on the query panel of the application.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/grpcgds.png" alt="gRPC: connection" />

</div>

### Creating query

You can now query a particular RPC method of the added services.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/grpc/query.png" alt="gRPC: connection" />

</div>