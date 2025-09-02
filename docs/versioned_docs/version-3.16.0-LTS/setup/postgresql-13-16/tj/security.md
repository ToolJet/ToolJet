<!-- removing this for now we might need to add this back later - 02/09/25 -->

---
id: security
title: Security and Support
---

## Security Considerations

### During Upgrade

- Database is temporarily accessible during restore process
- Ensure no unauthorized network access during upgrade
- All passwords remain unchanged in PostgreSQL 16

### After Upgrade

- Review and update security configurations
- Consider enabling additional PostgreSQL 16 security features
- Monitor for any unusual database activity

## Support and Recovery

### If You Need Help

1. **Check the logs**: All operations are logged with timestamps
2. **Review backups**: Multiple backup layers are created
3. **Use role fix mode**: For role-related issues post-upgrade
4. **Rollback option**: Complete instructions provided above

### Backup Retention

- **Keep database dumps**: For at least 30 days
- **Volume backups**: Can be removed after successful verification
- **Configuration backups**: Keep indefinitely
