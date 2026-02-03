---
id: security
title: Security Considerations
---

# Security Considerations

Important security information when using built-in SSL and nginx.

## Certificate Storage

- Certificates are **encrypted** and stored in the PostgreSQL database
- Certificates are **automatically restored** on container restart
- Backup your database to preserve SSL certificates

## Rate Limits

Let's Encrypt has rate limits:
- **50 certificates per domain per week**
- **5 duplicate certificates per week**

Avoid repeatedly acquiring certificates. The automatic renewal process respects these limits.

## Production Recommendations

1. **Use a real domain**: Let's Encrypt only issues certificates for valid domains
2. **Backup database regularly**: Certificates are stored in the database
3. **Monitor certificate expiry**: Check dashboard for expiration dates
4. **Keep ToolJet updated**: Ensures latest security patches

## Best Practices

- Enable SSL for all production deployments with public access
- Use HTTP-only mode only for internal deployments or development environments
- Regularly review your [configuration](configuration.md) for security updates
- Monitor nginx logs for suspicious activity

## Additional Resources

- [Configuration Guide](configuration.md) - SSL configuration options
- [Troubleshooting Guide](troubleshooting.md) - Common security-related issues
- [FAQ](faq.md) - Frequently asked security questions
