---
id: best-practices
title: Best Practices and Additional Resources
---

## Post-Upgrade Checklist

- [ ] Database upgrade completed successfully
- [ ] SSL certificate properly configured
- [ ] `NODE_EXTRA_CA_CERTS` environment variable set
- [ ] Application starts without SSL errors
- [ ] Database operations working correctly
- [ ] SSL connection verified in logs
- [ ] Performance testing completed
- [ ] Backup verification completed

## Security Best Practices

1. **Never disable SSL verification**: Avoid `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. **Use verify-full SSL mode**: Ensures complete certificate validation
3. **Keep certificates updated**: Monitor AWS for certificate updates
4. **Secure certificate storage**: Use proper permissions (644) and secure volumes
5. **Regular security audits**: Monitor connection logs for SSL issues

## Additional Resources

- [AWS RDS PostgreSQL 16.9 Release Notes](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/)
- [AWS RDS SSL/TLS Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
- [ToolJet Environment Variables Documentation](https://docs.tooljet.com/docs/setup/env-vars/)
- [Node.js TLS Configuration](https://nodejs.org/api/tls.html)

:::note
**Important Note**: The `NODE_EXTRA_CA_CERTS` environment variable is critical for resolving SSL certificate chain issues with PostgreSQL 16.9 on AWS RDS. This configuration must be properly set across all deployment methods to ensure secure database connections.
:::