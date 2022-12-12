import * as stream from 'stream';
export async function listBuckets(client, _options) {
  const [buckets, ,] = await client.getBuckets({
    autoPaginate: false,
  });
  return { buckets: buckets.map((bucket) => bucket.name) };
}
export async function listFiles(client, options) {
  const [, , metadata] = await client
    .bucket(options['bucket'])
    .getFiles({ prefix: options['prefix'], autoPaginate: false });
  return { files: metadata.items };
}
export async function getFile(client, options) {
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
  return Object.assign(Object.assign({}, data), { Body: bodyContents });
}
export async function uploadFile(client, options) {
  // Get a reference to the bucket
  const myBucket = client.bucket(options['bucket']);
  // Create a reference to a file object
  const file = myBucket.file(options['file']);
  // Create a pass through stream from a string
  const passthroughStream = new stream.PassThrough();
  passthroughStream.end(Buffer.from(options['data'], options['encoding'] || 'utf8'));
  passthroughStream.pipe(
    file.createWriteStream({
      metadata: { contentType: options['contentType'] },
    })
  );
  return { success: true };
}
export async function signedUrlForGet(client, options) {
  const defaultExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
  const expiresIn = options['expiresIn'] ? Date.now() + options['expiresIn'] * 1000 : defaultExpiry;
  const [url] = await client.bucket(options['bucket']).file(options['file']).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: expiresIn,
  });
  return { url };
}
export async function signedUrlForPut(client, options) {
  const defaultExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
  const expiresIn = options['expiresIn'] ? Date.now() + options['expiresIn'] * 1000 : defaultExpiry;
  const [url] = await client
    .bucket(options['bucket'])
    .file(options['file'])
    .getSignedUrl(
      Object.assign(
        { version: 'v4', action: 'write', expires: expiresIn },
        options['contentType'] && { contentType: options['contentType'] }
      )
    );
  return { url };
}
