import * as http from 'http';
import { AddressInfo } from 'net';
import got from 'got';
import { cancelOnAbort, limitResponseSize } from '../lib/cancel-on-abort';

/** A server that accepts requests and never answers; resolves `closed` when the client goes away. */
const hangingServer = () => {
  let onClosed: () => void;
  const closed = new Promise<void>((resolve) => (onClosed = resolve));
  const server = http.createServer((req) => req.socket.on('close', () => onClosed()));
  return new Promise<{ url: string; closed: Promise<void>; stop: () => void }>((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/`,
        closed,
        stop: () => server.close(),
      })
    )
  );
};

describe('cancelOnAbort', () => {
  it('cancels an in-flight got request when the signal fires, closing its connection', async () => {
    const server = await hangingServer();
    const controller = new AbortController();
    try {
      const request = cancelOnAbort(got(server.url, { retry: 0 }), controller.signal);
      setTimeout(() => controller.abort(new Error('Step deadline reached')), 50);

      await expect(request).rejects.toMatchObject({ name: 'CancelError' });
      await server.closed;
    } finally {
      server.stop();
    }
  });

  it('cancels at once when the signal has already fired', async () => {
    const server = await hangingServer();
    const controller = new AbortController();
    controller.abort();
    try {
      await expect(cancelOnAbort(got(server.url, { retry: 0 }), controller.signal)).rejects.toMatchObject({
        name: 'CancelError',
      });
    } finally {
      server.stop();
    }
  });

  it('leaves a request without a signal untouched', async () => {
    const plain = Promise.resolve('done');

    expect(cancelOnAbort(plain)).toBe(plain);
    await expect(plain).resolves.toBe('done');
  });
});

describe('limitResponseSize', () => {
  it('stops reading a response past the cap and says why', async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      const chunk = 'x'.repeat(64 * 1024);
      let sent = 0;
      const write = () => {
        while (sent < 4 * 1024 * 1024) {
          sent += chunk.length;
          if (!res.write(chunk)) return res.once('drain', write);
        }
        res.end();
      };
      write();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    try {
      await expect(limitResponseSize(got(url, { retry: 0 }), 256 * 1024)).rejects.toMatchObject({
        name: 'ResponseTooLargeError',
        message: expect.stringContaining('262144 bytes'),
      });
      // Under the cap, the response comes through
      await expect(limitResponseSize(got(url, { retry: 0 }), 8 * 1024 * 1024)).resolves.toMatchObject({
        statusCode: 200,
      });
    } finally {
      server.closeAllConnections?.();
      server.close();
    }
  });
});
