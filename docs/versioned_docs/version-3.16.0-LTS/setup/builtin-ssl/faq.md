---
id: faq
title: Frequently Asked Questions
---

# Frequently Asked Questions

Common questions about built-in SSL.

<details id="tj-dropdown">
<summary>Can I use built-in SSL without a domain?</summary>

No. Let's Encrypt requires a valid domain name to issue certificates. If you don't have a domain:
- Use HTTP-only mode (deploy normally and don't enable SSL in the dashboard)
- Use a reverse proxy with self-signed certificates
- Use a service like ngrok for testing

</details>

<details id="tj-dropdown">
<summary>Can I use my own SSL certificate?</summary>

Currently, the built-in SSL only supports Let's Encrypt certificates. To use custom certificates:
- Use an external reverse proxy (nginx, Caddy, Traefik)
- Do not configure SSL via the ToolJet dashboard

</details>

<details id="tj-dropdown">
<summary>Does built-in SSL work with load balancers?</summary>

Yes, but consider:
- If your load balancer handles SSL termination, you may not need built-in SSL
- Simply don't configure SSL via the ToolJet dashboard, and let the load balancer handle HTTPS
- Configure load balancer to forward HTTP traffic to port `3000` (or your configured `PORT`)

</details>

<details id="tj-dropdown">
<summary>Can I run multiple ToolJet instances with built-in SSL?</summary>

Yes. Since SSL certificates are stored in the database, all replicas share the same certificate automatically. For multi-instance setups:
- Configure SSL via the dashboard on any one instance
- All instances share the certificate from the database
- For high-availability, consider using an external load balancer with SSL termination instead

</details>

<details id="tj-dropdown">
<summary>What happens during certificate renewal?</summary>

- Renewal happens automatically 30 days before expiry
- The application reloads the new certificate with no downtime
- Renewal failures are logged and can be retried manually

</details>

## Still Have Questions?

- Review the [Troubleshooting Guide](troubleshooting.md) for common issues
- Check the [Configuration Guide](configuration.md) for detailed setup information
- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
