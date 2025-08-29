---
id: post-upgrade
title: Post-Upgrade Maintenance
---

## Immediate Tasks (First 24 Hours)
- [ ] Monitor application performance
- [ ] Check all ToolJet features work correctly
- [ ] Verify all user workspaces are accessible
- [ ] Monitor error logs for any issues
- [ ] Test database-intensive operations

## Ongoing Monitoring
```bash
# Check PostgreSQL performance
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Monitor disk usage
du -sh postgres_data

# Check for errors
docker-compose logs postgres | grep ERROR
docker-compose logs tooljet | grep ERROR
```

## Cleanup After Successful Upgrade

⚠️ **Only perform cleanup after 1-2 weeks of stable operation:**

```bash
# Remove old PostgreSQL 13 data (saves significant disk space)
rm -rf postgres_data_old_pg13_TIMESTAMP

# Remove volume backup (keep database dumps)
rm -rf backups/postgres_data_backup_TIMESTAMP

# Remove compose backup
rm docker-compose.yml.bak.TIMESTAMP

# Keep database dumps for long-term backup
ls -la backups/
```
