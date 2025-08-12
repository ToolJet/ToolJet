---
id: best-practices
title: Best Practices and Additional Resources
---

## Post-Upgrade Checklist

- [ ] Database upgrade completed successfully to PostgreSQL 16
- [ ] SSL certificate properly configured and accessible
- [ ] SSL connections verified
- [ ] Application starts without SSL errors
- [ ] Database operations working correctly
- [ ] SSL connection verified in logs
- [ ] Performance testing completed
- [ ] Backup verification completed
- [ ] Monitoring and alerting updated
- [ ] Documentation updated with new configuration
- [ ] Team trained on new setup

## Security Best Practices

1. **Never disable SSL verification**: Avoid `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. **Use Cloud SQL Proxy when possible**: Automatically handles encryption and authentication
3. **Secure certificate storage**: Use Google Secret Manager for certificates
4. **Enable Cloud SQL audit logs**: Monitor database access and changes
5. **Use IAM database authentication**: When supported, use IAM instead of passwords
6. **Regular security audits**: Monitor connection logs for SSL issues
7. **Network security**: Use Private IP for Cloud SQL when possible
8. **Backup encryption**: Ensure backups are encrypted

## Performance Optimization

### Cloud SQL Performance Settings

```bash
# Optimize Cloud SQL instance for PostgreSQL 16
gcloud sql instances patch your-instance-id \
  --database-flags=shared_preload_libraries=pg_stat_statements \
  --database-flags=log_statement=all \
  --database-flags=log_min_duration_statement=1000
```

### Monitoring and Alerting

```bash
# Set up monitoring for Cloud SQL
gcloud alpha monitoring policies create --policy-from-file=cloudsql-policy.yaml
```

Example monitoring policy (`cloudsql-policy.yaml`):
```yaml
displayName: "Cloud SQL PostgreSQL Monitoring"
conditions:
- displayName: "High CPU Utilization"
  conditionThreshold:
    filter: 'resource.type="cloudsql_database" AND metric.type="cloudsql.googleapis.com/database/cpu/utilization"'
    comparison: COMPARISON_GT
    thresholdValue: 0.8
    duration: 300s
```

## Additional Resources

- [Google Cloud SQL PostgreSQL Documentation](https://cloud.google.com/sql/docs/postgres)
- [Cloud SQL SSL/TLS Documentation](https://cloud.google.com/sql/docs/postgres/configure-ssl-instance)
- [Google Cloud SQL Proxy Documentation](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [ToolJet Environment Variables Documentation](https://docs.tooljet.com/docs/setup/env-vars/)
- [GKE Workload Identity Documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Cloud Run Security Documentation](https://cloud.google.com/run/docs/securing/service-identity)

:::note
**Important Note**: The SSL certificate configuration is critical for secure connections to Cloud SQL PostgreSQL 16. Consider using Cloud SQL Proxy for simplified and secure database connections without manual SSL certificate management.
:::