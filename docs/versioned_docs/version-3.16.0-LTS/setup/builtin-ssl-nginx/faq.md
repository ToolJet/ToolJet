---
id: faq
title: Frequently Asked Questions
---

# Frequently Asked Questions

Common questions about built-in SSL and nginx.

<details id="tj-dropdown">
<summary>Can I use built-in SSL without a domain?</summary>

No. Let's Encrypt requires a valid domain name to issue certificates. If you don't have a domain:
- Use HTTP-only mode (set **ENABLE_BUILTIN_NGINX=true** but don't enable SSL)
- Use a reverse proxy with self-signed certificates
- Use a service like ngrok for testing

</details>

<details id="tj-dropdown">
<summary>Can I use my own SSL certificate?</summary>

Currently, the built-in SSL only supports Let's Encrypt certificates. To use custom certificates:
- Use an external reverse proxy (nginx, Caddy, Traefik)
- Set **ENABLE_BUILTIN_NGINX=false**

</details>

<details id="tj-dropdown">
<summary>Does built-in nginx work with load balancers?</summary>

Yes, but consider:
- If your load balancer handles SSL termination, you may not need built-in SSL
- Use HTTP-only mode: set **ENABLE_BUILTIN_NGINX=true** but don't enable SSL
- Configure load balancer to forward HTTP traffic to port 80

</details>

<details id="tj-dropdown">
<summary>Can I run multiple ToolJet instances with built-in SSL?</summary>

The current implementation is designed for single-instance deployments. For multi-instance setups:
- Use an external load balancer with SSL termination
- Set **ENABLE_BUILTIN_NGINX=false** on all instances
- Let the load balancer handle HTTPS

</details>

<details id="tj-dropdown">
<summary>What happens during certificate renewal?</summary>

- Renewal happens automatically 30 days before expiry
- nginx reloads gracefully (no downtime)
- Renewal failures are logged and can be retried manually

</details>

## Still Have Questions?

- Review the [Troubleshooting Guide](troubleshooting.md) for common issues
- Check the [Configuration Guide](configuration.md) for detailed setup information
- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
