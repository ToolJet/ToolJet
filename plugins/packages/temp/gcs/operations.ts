import { GetBucketsResponse, GetFilesResponse, GetSignedUrlResponse, Storage } from '@google-cloud/storage';
import * as stream from 'stream';

export async function listBuckets(client: Storage, _options: object): Promise<object> {
  const [buckets, ,]: GetBucketsResponse = await client.getBuckets({
    autoPaginate: false,
  });

  return { buckets: buckets.map((bucket) => bucket.name) };
}

export async function listFiles(client: Storage, options: object): Promise<object> {
  const [, , metadata]: GetFilesResponse = await client
    .bucket(options['bucket'])
    .getFiles({ prefix: options['prefix'], autoPaginate: false });

  return { files: metadata.items };
}

export async function getFile(client: Storage, options: object): Promise<object> {
  // Create a helper function to convert a ReadableStream to a string.
  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });

  const data = client.bucket(options['bucket']).file(options['file']).createReadStream();
  // Convert the ReadableStream to a string.
  const bodyContents = await streamToString(data);
  return { ...data, Body: bodyContents };
}

export async function uploadFile(client: Storage, options: object): Promise<object> {
  // Get a reference to the bucket
  const myBucket = client.bucket(options['bucket']);

  // Create a reference to a file object
  const file = myBucket.file(options['file']);

  // Create a pass through stream from a string
  const passthroughStream = new stream.PassThrough();
  passthroughStream.write(options['data']);
  passthroughStream.end();

  passthroughStream.pipe(
    file.createWriteStream({
      metadata: { contentType: options['contentType'] },
    })
  );
  return { success: true };
}

export async function signedUrlForGet(client: Storage, options: object): Promise<object> {
  const defaultExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
  const expiresIn = options['expiresIn'] ? Date.now() + options['expiresIn'] * 1000 : defaultExpiry;

  const [url]: GetSignedUrlResponse = await client.bucket(options['bucket']).file(options['file']).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: expiresIn,
  });

  return { url };
}

export async function signedUrlForPut(client: Storage, options: object): Promise<object> {
  const defaultExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
  const expiresIn = options['expiresIn'] ? Date.now() + options['expiresIn'] * 1000 : defaultExpiry;

  const [url]: GetSignedUrlResponse = await client
    .bucket(options['bucket'])
    .file(options['file'])
    .getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresIn,
      ...(options['contentType'] && { contentType: options['contentType'] }),
    });

  return { url };
}
