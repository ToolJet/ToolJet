---
id: best-practices
title: Best Practices and Additional Resources
---

## Post-Upgrade Checklist

- [ ] Database upgrade completed successfully to PostgreSQL 16
- [ ] `PGSSLMODE=require` environment variable configured
- [ ] SSL connections verified and working
- [ ] Application starts without SSL errors
- [ ] Database operations working correctly
- [ ] SSL connection verified in logs
- [ ] Performance testing completed
- [ ] Backup verification completed
- [ ] Monitoring and alerting updated
- [ ] Documentation updated with new configuration
- [ ] Team trained on new setup

## Security Best Practices

1. **Always require SSL connections**: Set `PGSSLMODE=require` for all Azure PostgreSQL connections
2. **Use Azure Key Vault**: Store database passwords and sensitive configuration in Azure Key Vault
3. **Enable Azure PostgreSQL audit logs**: Monitor database access and changes
4. **Network security**: Use private endpoints when possible for Azure PostgreSQL
5. **Regular security audits**: Monitor connection logs for SSL issues
6. **Backup encryption**: Ensure backups are encrypted (enabled by default in Azure)
7. **Use Azure AD authentication**: When supported, use Azure AD instead of passwords
8. **Implement proper RBAC**: Use Azure RBAC for resource management permissions

## Additional Resources

- [Azure Database for PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Azure PostgreSQL Flexible Server Major Version Upgrade](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-perform-major-version-upgrade)
- [Azure PostgreSQL SSL Configuration](https://docs.microsoft.com/en-us/azure/postgresql/concepts-ssl-connection-security)
- [ToolJet Environment Variables Documentation](https://docs.tooljet.com/docs/setup/env-vars/)
- [Azure Kubernetes Service Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Azure Container Instances Documentation](https://docs.microsoft.com/en-us/azure/container-instances/)
- [ToolJet Kubernetes AKS Setup](https://docs.tooljet.ai/docs/setup/kubernetes-aks)
- [ToolJet Azure Container Setup](https://docs.tooljet.ai/docs/setup/azure-container)

:::note
**Important Note**: The `PGSSLMODE=require` environment variable is mandatory for connecting to Azure Database for PostgreSQL Flexible Server. This ensures secure SSL/TLS encrypted connections are established and is a requirement for all Azure PostgreSQL databases.
:::