// Contract used by the public Platform workspace-constant import fixtures.
const http = require('http');
const messages = {
  '/development': 'Development environment testing',
  '/staging': 'Staging environment testing',
  '/production': 'Production environment testing',
};
http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' || !Object.hasOwn(messages, pathname)) {
    res.writeHead(501);
    return res.end(JSON.stringify({ error: 'Fixture endpoint not defined' }));
  }
  if (req.headers.customheader !== 'key=value') {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Expected resolved customHeader: key=value' }));
  }
  res.writeHead(200);
  res.end(JSON.stringify({ message: messages[pathname] }));
}).listen(process.env.PORT || 4016);
