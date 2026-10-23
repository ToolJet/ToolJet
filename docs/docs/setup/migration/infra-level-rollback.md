---
id: infra-level-rollback
title: Infra Level Rollback
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Infra level rollback allows you to revert your ToolJet deployment to a previous version at the infrastructure level. This is **not recommended for general use** and should only be considered when the current version has breaking changes or bugs that block usage.

:::warning Consult ToolJet Team First
Infra level rollback should only be used as a **last resort**, after consulting with the ToolJet team.
:::

### Rollback Steps

#### Step 1: Take a Snapshot of Your Database Instance

Before starting the upgrade, take a snapshot of your database instance so that it can be restored if a rollback is needed later. Also note down the version you are upgrading from, so you know exactly which version to roll back to if needed.

:::info
If your database is deployed as a container alongside ToolJet rather than as an external database, the snapshot and restore process will look different. Reach out to your infrastructure team for help with this.
:::

1. Navigate to **RDS Console** → **Databases**
2. Select your database instance
3. Click **Actions** → **Take snapshot**
   <img className="screenshot-full img-full" src="/img/setup/infra-level-rollback/take-snapshot-dropdown.png" alt="RDS Actions menu with Take snapshot option" />
4. Enter a snapshot name, for example: `pre-upgrade-snapshot-YYYYMMDD`
5. Click **Take snapshot**
   <img className="screenshot-full img-full" src="/img/setup/infra-level-rollback/snapshot-created.png" alt="RDS snapshot successfully created" />

If PG_DB and TOOLJET_DB are hosted on separate instances, repeat this for each instance.

#### Step 2: Roll Back the ToolJet Deployment

<Tabs>
  <TabItem value="docker-compose" label="Docker Compose" default>

1. Open your `docker-compose.yaml` file and update the `image` tag for the `tooljet` (and `tooljet-worker-1`, if present) service to the previous version, for example:
   ```yaml
   image: tooljet/tooljet:v3.20.200-lts
   ```
   <img className="screenshot-full img-full" src="/img/setup/infra-level-rollback/rollback-compose-tag.png" alt="docker-compose.yaml with the image tag updated to a previous version" />
2. Pull the older image:
   ```bash
   docker-compose pull
   ```
3. Restart the deployment on the older version:
   ```bash
   docker-compose up -d
   ```

  </TabItem>
  <TabItem value="kubernetes" label="Kubernetes">

1. Update the `image` field in your deployment manifest to the previous version's tag.
2. Apply the change:
   ```bash
   kubectl apply -f deployment.yaml
   ```

  </TabItem>
</Tabs>

#### Step 3: Restore the Database from the Snapshot

1. Navigate to **RDS Console** → **Snapshots**
2. Select the pre-upgrade snapshot
3. Click **Actions** → **Restore snapshot**
4. Configure the new instance settings and click **Restore DB instance**
5. Once available, point your ToolJet deployment's database configuration to the restored instance


## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
