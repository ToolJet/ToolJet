import { QueryOptions } from './types';

export async function listContainers(client: any): Promise<string[]> {
  const options = {
    includeDeleted: false,
    includeMetadata: true,
    includeSystem: true,
    prefix: '',
  };
  const containers: string[] = [];
  for await (const containerItem of client.listContainers(options)) {
    containers.push(containerItem.name);
  }
  return containers;
}

function getContainerClient(client, containerName: string) {
  return client.getContainerClient(containerName);
}

function getBlobClient(containerClient, blobName: string) {
  return containerClient.getBlockBlobClient(blobName);
}

export async function listBlobs(client, options: QueryOptions): Promise<{ result: any[]; continuationToken: string }> {
  const { containerName, continuationToken, offset, prefix } = options;
  const listOptions = {
    includeMetadata: true,
    includeSnapshots: false,
    includeTags: true,
    includeVersions: false,
    prefix: prefix,
  };

  const containerClient = getContainerClient(client, containerName);

  const paginationConfig = {
    maxPageSize: parseInt(offset),
    ...(continuationToken && { continuationToken }),
  };

  const iterator = containerClient.listBlobsFlat(listOptions).byPage(paginationConfig);
  const response = (await iterator.next()).value;

  const blobs = { result: [], continuationToken: response.continuationToken };

  for (const blob of response.segment.blobItems) {
    const blobClient = getBlobClient(containerClient, blob.name);
    blobs.result.push({ ...blob, url: blobClient.url });
  }

  return blobs;
}

export async function uploadBlob(client, options: QueryOptions): Promise<string> {
  const containerClient = getContainerClient(client, options.containerName);

  const blockBlobClient = getBlobClient(containerClient, options.blobName);
  const blobOptions = {
    blobHTTPHeaders: {
      blobContentType: options.contentType,
      blobContentEncoding: options.encoding,
    },
  };
  const file = new Buffer(options.data);
  const uploadBlobResponse = await blockBlobClient.uploadData(file, blobOptions);

  return `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`;
}

export async function readBlob(client, options) {
  async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  const containerClient = getContainerClient(client, options.containerName);
  const blobClient = await containerClient.getBlobClient(options.blobName);

  const downloadResponse = await blobClient.download();
  const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);

  return downloaded.toString();
}

export async function deleteBlob(client, options) {
  const containerClient = getContainerClient(client, options.containerName);

  // include: Delete the base blob and all of its snapshots.
  // only: Delete only the blob's snapshots and not the blob itself.
  const deleteOptions = {
    deleteSnapshots: 'include',
  };

  const blockBlobClient = await containerClient.getBlockBlobClient(options.blobName);
  await blockBlobClient.delete(deleteOptions);
  return `deleted blob ${options.blobName}`;
}
