---
id: http-proxy
title: Connecting via HTTP proxy
---

The server will connect to the internet via the configured HTTP proxy when the below environment variable is set.

| Variable               | Description                           |
| :--------------------- | :------------------------------------ |
| TOOLJET_HTTP_PROXY     | Used for both HTTP and HTTPS requests |

*If you have any questions, feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*


<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Package Information

We use the [global-agent](https://www.npmjs.com/package/global-agent) package to manage HTTP proxies.

This package allows you to configure global HTTP/HTTPS proxies for your Node.js application. It is particularly useful when you need to route all outgoing HTTP and HTTPS requests through a proxy server. This can be beneficial for scenarios such as bypassing network restrictions, logging, or adding an extra layer of security.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## URL Format

The environment variable format follows the standard host and port notation:
```
http://127.0.0.1:8080
```

</div>
