---
id: ecs
title: ECS
---

## Step 1: Upload Certificate to ECS Container Instances

### Using AWS CLI (SSM)

```bash
# Copy certificate to ECS container instances
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["mkdir -p /opt/ssl-certs","wget -O /opt/ssl-certs/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem","chmod 644 /opt/ssl-certs/global-bundle.pem"]' \
  --targets "Key=tag:aws:autoscaling:groupName,Values=your-ecs-asg"
```

### Using AWS Console (SSM Run Command)

1. Navigate to **AWS Systems Manager Console** → **Run Command**
2. Click **Run command**
3. Select **AWS-RunShellScript** document
4. In **Command parameters**, enter:
   ```bash
   mkdir -p /opt/ssl-certs
   wget -O /opt/ssl-certs/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   chmod 644 /opt/ssl-certs/global-bundle.pem
   ```
5. In **Targets** section:
   - Choose **Specify instance tags**
   - Tag key: `aws:autoscaling:groupName`
   - Tag value: `your-ecs-asg`
6. Click **Run**
7. Wait for command execution to complete on all instances

## Step 2: Update ECS Task Definition

### Using AWS CLI

Create a new task definition file `tooljet-task-updated.json`:
```json
{
  "family": "tooljet-task",
  "taskDefinition": {
    "containerDefinitions": [
      {
        "name": "tooljet",
        "environment": [
          {
            "name": "PG_HOST",
            "value": "your-rds-endpoint.region.rds.amazonaws.com"
          },
          {
            "name": "PGSSLMODE",
            "value": "require"
          },
          {
            "name": "NODE_EXTRA_CA_CERTS",
            "value": "/certs/global-bundle.pem"
          }
        ],
        "mountPoints": [
          {
            "sourceVolume": "ssl-certs",
            "containerPath": "/certs",
            "readOnly": true
          }
        ]
      }
    ],
    "volumes": [
      {
        "name": "ssl-certs",
        "host": {
          "sourcePath": "/opt/ssl-certs"
        }
      }
    ]
  }
}
```

Register the updated task definition:
```bash
aws ecs register-task-definition --cli-input-json file://tooljet-task-updated.json
```

### Using AWS Console

1. Navigate to **ECS Console** → **Task Definitions**
2. Select your ToolJet task definition
3. Click **Create new revision**
4. Scroll to **Container definitions** and click on your ToolJet container
5. In **Environment** section, add/update environment variables:
   - `PG_HOST`: `your-rds-endpoint.region.rds.amazonaws.com`
   - `PGSSLMODE`: `require`
   - `NODE_EXTRA_CA_CERTS`: `/certs/global-bundle.pem`
6. In **Storage and Logging** section:
   - **Mount points**: Add mount point
     - Source volume: `ssl-certs`
     - Container path: `/certs`
     - Read only: ✅ Checked
7. Scroll to **Volumes** section at the bottom:
   - Click **Add volume**
   - **Name**: `ssl-certs`
   - **Volume type**: **Bind mount**
   - **Source path**: `/opt/ssl-certs`
8. Click **Update** then **Create**

## Step 3: Alternative - Using EFS for Certificate Storage

### Using AWS CLI

Update your task definition to use EFS:
```json
{
  "volumes": [
    {
      "name": "ssl-certs",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxxxxxx",
        "rootDirectory": "/ssl-certs"
      }
    }
  ]
}
```

### Using AWS Console

1. First, create EFS file system and upload certificate:
   - Go to **EFS Console** → **Create file system**
   - Upload `global-bundle.pem` to `/ssl-certs/` directory in EFS
2. In your ECS task definition (Step 2 above):
   - In **Volumes** section, instead of **Bind mount**:
     - **Volume type**: **EFS**
     - **Name**: `ssl-certs`
     - **File system ID**: `fs-xxxxxxxxx`
     - **Root directory**: `/ssl-certs`

## Step 4: Update ECS Service

### Using AWS CLI

```bash
aws ecs update-service \
  --cluster your-cluster-name \
  --service tooljet-service \
  --task-definition tooljet-task:latest \
  --force-new-deployment
```

### Using AWS Console

1. Navigate to **ECS Console** → **Clusters**
2. Select your cluster
3. Click on the **Services** tab
4. Select your ToolJet service
5. Click **Update**
6. In **Configure service** step:
   - **Task Definition**: Select the latest revision you just created
   - **Force new deployment**: ✅ Checked
7. Click **Skip to review**
8. Click **Update Service**
9. Wait for deployment to complete

## Step 5: Verify Configuration

**Check service status:**

```bash
# Via CLI
aws ecs describe-services --cluster your-cluster-name --services tooljet-service

# Via Console: Go to ECS Console → Clusters → Your Cluster → Services → ToolJet Service
# Check that "Running count" matches "Desired count"
```

**Verify SSL certificate mount:**
```bash
# Connect to running container and verify certificate
aws ecs execute-command \
  --cluster your-cluster-name \
  --task your-task-id \
  --container tooljet \
  --command "ls -la /certs/"
```

**Reference**: [ToolJet ECS Setup Documentation](https://docs.tooljet.ai/docs/setup/ecs)