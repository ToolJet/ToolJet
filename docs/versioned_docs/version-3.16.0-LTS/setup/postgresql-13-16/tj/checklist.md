---
id: checklist
title: Script Command and Final Checklist 
---

## Script Command Reference

```bash
# Full upgrade
./upgrade_postgres_13_to_16.sh

# Fix roles only
./upgrade_postgres_13_to_16.sh --fix-roles
./upgrade_postgres_13_to_16.sh -f

# Show help
./upgrade_postgres_13_to_16.sh --help
./upgrade_postgres_13_to_16.sh -h
```

## Final Checklist

Before running the script:
- [ ] **Full system backup completed**
- [ ] **Downtime window scheduled**
- [ ] **All users notified**
- [ ] **Sufficient disk space available**
- [ ] **Docker and containers are healthy**
- [ ] **Script permissions set correctly**
- [ ] **Emergency rollback plan understood**

:::note
This upgrade is **reversible** with the comprehensive backups created by the script. However, proper preparation and understanding of the process is crucial for success.
:::