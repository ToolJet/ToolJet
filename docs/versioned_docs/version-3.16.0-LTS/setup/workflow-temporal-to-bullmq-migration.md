---
id: workflow-temporal-to-bullmq-migration
title: Workflow Migration - Temporal to BullMQ
---

# Migrating Workflows from Temporal to BullMQ

This guide helps you migrate your ToolJet workflow scheduling system from the legacy Temporal-based architecture to the new BullMQ-based system.

## Overview

ToolJet has replaced Temporal with BullMQ for workflow scheduling, significantly simplifying deployment while maintaining all existing functionality. This change eliminates the need for separate Temporal server infrastructure and provides built-in monitoring capabilities.

## Why Migrate?

### Benefits of BullMQ-based Workflows

- **Simplified Architecture**: No need for separate Temporal server deployment
- **Built-in Monitoring**: Integrated Bull Board dashboard at `/jobs` for job monitoring
- **Existing Infrastructure**: Leverages your existing Redis instance
- **Better Resource Management**: Flexible worker modes for optimized scaling
- **Improved Visibility**: Real-time job status tracking and retry capabilities

### Architecture Comparison

| Feature | Temporal (Old) | BullMQ (New) |
|---------|---------------|--------------|
| External Services | Temporal Server + Redis | Redis only |
| Deployment Complexity | High (multi-service) | Low (single-service) |
| Monitoring Dashboard | None | Built-in Bull Board at `/jobs` |
| Infrastructure Cost | Higher | Lower |

## How It Works (High-Level)

The new BullMQ-based workflow system operates as follows:

1. **Workflow Scheduling**: When you schedule a workflow, it's stored in PostgreSQL and a corresponding job is created in Redis using BullMQ
2. **Job Queues**: Two BullMQ queues manage workflows:
   - `workflow-schedule-queue`: Handles scheduled workflow triggers
   - `workflow-execution-queue`: Manages workflow execution
3. **Worker Processing**: ToolJet instances with `WORKER=true` pick up jobs from these queues and execute them
4. **Schedule Recovery**: On startup, the Schedule Bootstrap Service automatically loads all active schedules from PostgreSQL and recreates them in Redis, ensuring no workflows are lost during deployments
5. **State Updates**: The frontend polls workflow execution states every 3 seconds via batch API calls
6. **Monitoring**: Access the Bull Board dashboard at `/jobs` to monitor job status, retry failed jobs, and view queue statistics

## Migration Steps

### 1. Review Current Setup

Check your current deployment for Temporal-related configurations:

**Environment Variables to Remove:**
```bash
# Old Temporal variables - REMOVE THESE
ENABLE_WORKFLOW_SCHEDULING=true
WORKFLOW_WORKER=true
TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE=default
TEMPORAL_SERVER_ADDRESS=temporal:7233
```

**Services to Remove:**
- Temporal server containers/pods
- Temporal worker containers/pods

### 2. Set Up External Redis

:::warning
**Critical**: You must use an external stateful Redis instance with proper persistence configuration. The built-in Redis is NOT suitable for production workflows.
:::

**Redis Requirements:**
- **Persistence**: AOF (Append Only File) must be enabled
- **Memory Policy**: `maxmemory-policy` must be set to `noeviction` (required by BullMQ)
- **Version**: Redis 6.x or higher (Redis 7.x recommended)

**Example Redis Configuration:**
```conf
# Persistence
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# Memory Management
maxmemory-policy noeviction

# RDB Snapshots
save 900 1
save 300 10
save 60 10000
```

**Redis Setup by Platform:**

<details id="tj-dropdown">

<summary>Kubernetes (EKS, AKS, GKE, OpenShift)</summary>

Deploy stateful Redis:

```bash
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/redis-stateful.yaml
```

This creates:
- StatefulSet with persistent storage
- Headless Service
- ConfigMap with production-ready configuration
- Secret for password authentication

Configure environment variables:

```bash
REDIS_HOST=redis-service.default.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
```

</details>

<details id="tj-dropdown">

<summary>AWS ECS</summary>

Use Amazon ElastiCache for Redis:
1. Create Redis cluster with:
   - Engine version: Redis 7.x
   - Node type: cache.t3.medium or higher
   - Automatic failover enabled

2. Configure parameter group:
   - Set `maxmemory-policy` to `noeviction`
   - Set `appendonly` to `yes`

3. Add environment variables:

```bash
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

</details>

<details id="tj-dropdown">

<summary>Azure Container Apps</summary>

Use Azure Cache for Redis:
1. Create Redis instance (Standard or Premium tier)
2. Configure Redis settings for AOF and noeviction policy
3. Add environment variables:

```bash
REDIS_HOST=your-redis.redis.cache.windows.net
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true
```

</details>

<details id="tj-dropdown">

<summary>Google Cloud Run</summary>

Use Google Cloud Memorystore for Redis:
1. Create Redis instance with:
   - Redis version 7.x
   - High availability enabled
2. Configure Redis settings via `gcloud` CLI
3. Add environment variables:

```bash
REDIS_HOST=your-memorystore-ip
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

</details>

### 3. Update Environment Variables

Add the new BullMQ workflow environment variables:

**Required Variables:**
```bash
# Bull Board Dashboard Password (required for /jobs dashboard access)
TOOLJET_QUEUE_DASH_PASSWORD=admin

# Worker Mode (required)
# Set to 'true' to enable job processing
WORKER=true

# Redis Connection (required)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

**Optional Variables:**
```bash
# Workflow Processor Concurrency (optional)
# Number of workflow jobs processed concurrently per worker
# Default: 5
TOOLJET_WORKFLOW_CONCURRENCY=5

# Workflow Timeout (optional)
# Maximum execution time for a workflow in seconds
# Default: 60
WORKFLOW_TIMEOUT_SECONDS=60

# Redis Configuration (optional)
REDIS_USERNAME=          # Redis username (ACL)
REDIS_DB=0              # Redis database number (default: 0)
REDIS_TLS=false         # Enable TLS/SSL (set to 'true')
```

### 4. Deploy Updated Configuration

Update your ToolJet deployment with the new configuration:

**For Kubernetes:**
```bash
# Update your deployment.yaml with new environment variables
kubectl apply -f deployment.yaml

# Restart pods to apply changes
kubectl rollout restart deployment/tooljet
```

**For Docker/Docker Compose:**
```bash
# Update your .env file or docker-compose.yml
docker-compose down
docker-compose up -d
```

**For AWS ECS:**
- Update task definition with new environment variables
- Create new revision and update service

**For Azure Container Apps:**
- Update environment variables in container app settings
- Save and restart

### 5. Remove Temporal Infrastructure

After confirming the new setup works:

**For Kubernetes:**
```bash
# Remove Temporal deployments
kubectl delete deployment temporal-server
kubectl delete deployment temporal-worker
kubectl delete service temporal-service
```

**For Docker Compose:**
```yaml
# Remove Temporal services from docker-compose.yml
# - temporal-server
# - temporal-worker
```

**For ECS:**
- Stop and delete Temporal task definitions
- Remove Temporal services

### 6. Verify Migration

1. **Check Workflow Scheduling**: Create a new scheduled workflow in ToolJet
2. **Monitor Jobs**: Access the Bull Board dashboard at `https://your-tooljet-host/jobs`
   - Username: Use any value
   - Password: Value of `TOOLJET_QUEUE_DASH_PASSWORD`
3. **Verify Execution**: Trigger a workflow and confirm it executes successfully
4. **Check Logs**: Review application logs for any errors

## Scaling Workflows with Dedicated Workers

For production deployments with extensive workflow usage, it's recommended to deploy dedicated worker instances that only process jobs without serving HTTP traffic.

### Why Dedicated Workers?

- **Better Resource Allocation**: Separate compute resources for API and job processing
- **Independent Scaling**: Scale workers based on job queue depth
- **Improved Reliability**: HTTP server issues don't affect job processing
- **Cost Optimization**: Use different instance sizes for API vs workers

### Architecture

**Option 1: Dedicated Workers (Recommended for production)**
```
┌─────────────────┐         ┌─────────────────┐
│  ToolJet Web    │         │  ToolJet Worker │
│  (HTTP Server)  │         │  (Jobs Only)    │
│                 │         │                 │
│  WORKER=false   │         │  WORKER=true    │
│  Port: 3000     │         │  No Port        │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │    Redis    │
              │   (BullMQ)  │
              └─────────────┘
```

**Option 2: All-in-One (Simpler for small deployments)**
```
┌─────────────────┐         ┌─────────────────┐
│  ToolJet Web    │         │  ToolJet Worker │
│  (HTTP Server)  │         │  (Jobs Only)    │
│                 │         │                 │
│  WORKER=true    │         │  WORKER=true    │
│  Port: 3000     │         │  No Port        │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │    Redis    │
              │   (BullMQ)  │
              └─────────────┘
```

- **Option 1**: Web server only handles HTTP requests (`WORKER=false`), dedicated workers process jobs
- **Option 2**: Web server handles both HTTP and jobs (`WORKER=true`), can still add dedicated workers for additional capacity

### Deployment Configuration

#### Kubernetes Example

<details id="tj-dropdown">

<summary>ToolJet App Deployment (tooljet-deployment.yaml)</summary>
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tooljet-deployment
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      component: tooljet
  template:
    metadata:
      labels:
        component: tooljet
    spec:
      imagePullSecrets:
        - name: docker-secret
      containers:
        - name: tooljet
          image: tooljet/tooljet:ee-lts-latest
          imagePullPolicy: Always
          args: ["npm", "run", "start:prod"]
          resources:
            limits:
              memory: "2000Mi"
              cpu: "2000m"
            requests:
              memory: "1000Mi"
              cpu: "1000m"
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet:
              port: 3000
              path: /api/health
            successThreshold: 1
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 6
          env:
            - name: PG_HOST
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_host
            - name: PG_USER
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_user
            - name: PG_PASS
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_password
            - name: PG_DB
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_db
            - name: LOCKBOX_MASTER_KEY
              valueFrom:
                secretKeyRef:
                  name: server
                  key: lockbox_key
            - name: SECRET_KEY_BASE
              valueFrom:
                secretKeyRef:
                  name: server
                  key: secret_key_base
            - name: TOOLJET_HOST
              valueFrom:
                secretKeyRef:
                  name: server
                  key: tj_host
            - name: REDIS_HOST
              value: redis-service.default.svc.cluster.local
            - name: REDIS_PORT
              value: "6379"
            - name: TOOLJET_DB
              value: "tooljet_db"
            - name: TOOLJET_DB_USER
              value: "replace_with_postgres_database_user"
            - name: TOOLJET_DB_HOST
              value: "replace_with_postgres_database_host"
            - name: TOOLJET_DB_PASS
              value: "replace_with_postgres_database_password"
            - name: PGRST_HOST
              value: localhost:3002
            - name: PGRST_SERVER_PORT
              value: "3002"
            - name: PGRST_JWT_SECRET
              value: "replace_jwt_secret_here"
            - name: PGRST_DB_PRE_CONFIG
              value: postgrest.pre_config
            - name: PGRST_DB_URI
              value: postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:port/tooljet_db
            - name: PGRST_LOG_LEVEL
              value: "info"
            - name: DEPLOYMENT_PLATFORM
              value: "k8s"
---
apiVersion: v1
kind: Service
metadata:
  name: tooljet-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    component: tooljet
```

</details>

<details id="tj-dropdown">

<summary>Worker Deployment (tooljet-worker.yaml)</summary>
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tooljet-worker
spec:
  replicas: 2  # Scale based on job queue depth
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      component: tooljet-worker
  template:
    metadata:
      labels:
        component: tooljet-worker
    spec:
      imagePullSecrets:
        - name: docker-secret
      containers:
        - name: tooljet-worker
          image: tooljet/tooljet:ee-lts-latest
          imagePullPolicy: Always
          args: ["npm", "run", "start:prod"]
          resources:
            limits:
              memory: "2000Mi"
              cpu: "2000m"
            requests:
              memory: "1000Mi"
              cpu: "1000m"
          # No ports - workers don't serve HTTP
          env:
            # Worker-specific environment variables
            - name: WORKER
              value: "true"
            - name: TOOLJET_QUEUE_DASH_PASSWORD
              value: "your-secure-password"
            - name: TOOLJET_WORKFLOW_CONCURRENCY
              value: "10"
            - name: REDIS_HOST
              value: redis-service.default.svc.cluster.local
            - name: REDIS_PORT
              value: "6379"
            # All other environment variables same as ToolJet app
            - name: PG_HOST
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_host
            - name: PG_USER
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_user
            - name: PG_PASS
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_password
            - name: PG_DB
              valueFrom:
                secretKeyRef:
                  name: server
                  key: pg_db
            - name: LOCKBOX_MASTER_KEY
              valueFrom:
                secretKeyRef:
                  name: server
                  key: lockbox_key
            - name: SECRET_KEY_BASE
              valueFrom:
                secretKeyRef:
                  name: server
                  key: secret_key_base
            - name: TOOLJET_HOST
              valueFrom:
                secretKeyRef:
                  name: server
                  key: tj_host
            - name: TOOLJET_DB
              value: "tooljet_db"
            - name: TOOLJET_DB_USER
              value: "replace_with_postgres_database_user"
            - name: TOOLJET_DB_HOST
              value: "replace_with_postgres_database_host"
            - name: TOOLJET_DB_PASS
              value: "replace_with_postgres_database_password"
            - name: PGRST_HOST
              value: localhost:3002
            - name: PGRST_SERVER_PORT
              value: "3002"
            - name: PGRST_JWT_SECRET
              value: "replace_jwt_secret_here"
            - name: PGRST_DB_PRE_CONFIG
              value: postgrest.pre_config
            - name: PGRST_DB_URI
              value: postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:port/tooljet_db
            - name: PGRST_LOG_LEVEL
              value: "info"
            - name: DEPLOYMENT_PLATFORM
              value: "k8s"
```

</details>

**Key Points:**
- **ToolJet App**: Serves HTTP traffic on port 3000, `WORKER` is unset (defaults to false)
- **Worker**: Only processes jobs with `WORKER=true`, no ports exposed
- Both deployments use the same secrets and database configuration
- Worker has additional workflow-specific env vars: `TOOLJET_QUEUE_DASH_PASSWORD` and `TOOLJET_WORKFLOW_CONCURRENCY`
- Update `REDIS_HOST` to point to your deployed Redis service

#### Docker Compose Example

<details id="tj-dropdown">

<summary>Docker Compose Configuration</summary>

```yaml
version: '3.8'

services:
  tooljet:
    tty: true
    stdin_open: true
    container_name: Tooljet-app
    image: tooljet/tooljet:ee-lts-latest
    platform: linux/amd64
    restart: always
    env_file: .env
    ports:
      - 80:80
    depends_on:
      - postgres
      - redis
    environment:
      SERVE_CLIENT: "true"
      PORT: "80"
    command: npm run start:prod

  tooljet-worker-1:
    tty: true
    stdin_open: true
    platform: linux/amd64
    container_name: tooljet-worker-1
    image: tooljet/tooljet:ee-lts-latest
    restart: always
    env_file: .env
    depends_on:
      - postgres
      - redis
    environment:
      WORKER: "true"
      TOOLJET_QUEUE_DASH_PASSWORD: admin
      TOOLJET_WORKFLOW_CONCURRENCY: 10
      REDIS_HOST: redis
      REDIS_PORT: 6379
    command: npm run start:prod

  redis:
    image: redis:7
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory-policy noeviction

volumes:
  redis-data:
```

</details>

**Key Points:**
- `tooljet` service: Web server with `WORKER` unset (defaults to false), serves HTTP on port 80
- `tooljet-worker-1` service: Dedicated worker with `WORKER=true`, no ports exposed
- Both services use the same `.env` file for shared configuration
- `env_file: .env` loads common environment variables (database credentials, secrets, etc.)
- Environment-specific variables are set directly in the `environment` section
- Redis configured with AOF persistence and `noeviction` policy

#### AWS ECS Example

<details id="tj-dropdown">

<summary>ECS Task Definitions</summary>

**Web Service Task Definition:**
```json
{
  "family": "tooljet-web",
  "containerDefinitions": [
    {
      "name": "tooljet",
      "image": "tooljet/tooljet:ee-lts-latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "WORKER", "value": "false"},
        {"name": "REDIS_HOST", "value": "your-elasticache-endpoint"}
      ]
    }
  ]
}
```

**Worker Service Task Definition:**
```json
{
  "family": "tooljet-worker",
  "containerDefinitions": [
    {
      "name": "tooljet-worker",
      "image": "tooljet/tooljet:ee-lts-latest",
      "portMappings": [],  // No ports needed
      "environment": [
        {"name": "WORKER", "value": "true"},
        {"name": "TOOLJET_QUEUE_DASH_PASSWORD", "value": "your-password"},
        {"name": "TOOLJET_WORKFLOW_CONCURRENCY", "value": "10"},
        {"name": "REDIS_HOST", "value": "your-elasticache-endpoint"}
      ]
    }
  ]
}
```

</details>

### Worker Scaling Considerations

**When to scale workers:**
- Queue depth consistently > 100 jobs
- Job processing latency increases
- Workflows timing out

**Scaling strategies:**
- **Horizontal**: Add more worker replicas
- **Vertical**: Increase `TOOLJET_WORKFLOW_CONCURRENCY`
- **Hybrid**: Combine both approaches

**Monitoring metrics:**
- Queue depth in Bull Board (`/jobs`)
- Job completion time
- Failed job count
- Redis memory usage

## Monitoring and Troubleshooting

### Bull Board Dashboard

Access the monitoring dashboard at `https://your-tooljet-host/jobs`:

**Features:**
- View job status (waiting, active, completed, failed)
- Retry failed jobs manually
- Monitor queue statistics
- View job details and execution logs

**Authentication:**
- Username: Any value
- Password: Value of `TOOLJET_QUEUE_DASH_PASSWORD` environment variable

### Common Issues

#### Workflows Not Executing

**Symptoms:** Workflows scheduled but not running

**Solutions:**
1. Check `WORKER=true` is set in at least one instance
2. Verify Redis connection:
   ```bash
   # From ToolJet container
   redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
   ```
3. Check worker logs for errors
4. Verify `maxmemory-policy noeviction` in Redis

#### Jobs Failing Repeatedly

**Symptoms:** Jobs show as failed in Bull Board

**Solutions:**
1. Check application logs for error messages
2. Verify workflow node configurations
3. Check Redis memory usage (may be full)
4. Review `WORKFLOW_TIMEOUT_SECONDS` setting

#### Dashboard Not Accessible

**Symptoms:** `/jobs` returns 401 Unauthorized

**Solutions:**
1. Verify `TOOLJET_QUEUE_DASH_PASSWORD` is set
2. Check you're using correct password
3. Ensure at least one instance has `WORKER=true`

#### Schedules Lost After Restart

**Symptoms:** Scheduled workflows don't trigger after restart

**Solutions:**
1. Check Schedule Bootstrap Service logs
2. Verify Redis persistence (AOF) is working
3. Confirm PostgreSQL connection is stable
4. Check Redis has sufficient memory

### Health Checks

Monitor these endpoints:

- **Application Health**: `GET /api/health`
- **Bull Board**: `GET /jobs` (requires auth)

## Rollback Plan

If you encounter critical issues, you can rollback to Temporal:

1. **Redeploy Temporal infrastructure** using your previous configuration
2. **Restore old environment variables**:
   ```bash
   ENABLE_WORKFLOW_SCHEDULING=true
   WORKFLOW_WORKER=true
   TEMPORAL_SERVER_ADDRESS=temporal:7233
   ```
3. **Remove BullMQ variables**:
   ```bash
   # Remove these
   TOOLJET_QUEUE_DASH_PASSWORD
   WORKER
   ```
4. **Restart ToolJet instances**

:::note
Active workflow schedules are stored in PostgreSQL and will be preserved during rollback. However, in-flight job executions may be lost.
:::

## FAQ

### Do I need to recreate my workflows?

No. All existing workflow definitions and schedules are stored in PostgreSQL and will continue to work with the new BullMQ system. The Schedule Bootstrap Service automatically loads them on startup.

### Can I use the built-in Redis for workflows?

No. The built-in Redis is for development only. Production workflows require an external Redis instance with proper persistence (AOF) and `maxmemory-policy noeviction`.

### What happens to in-flight workflows during migration?

In-flight workflows in the old Temporal system will not be migrated. Complete or cancel them before migration. New schedules will trigger normally in the BullMQ system.

### Can I run both Temporal and BullMQ simultaneously?

No. ToolJet only supports one workflow engine at a time. Choose either Temporal (legacy) or BullMQ (recommended).

### How do I monitor workflow performance?

Use the Bull Board dashboard at `/jobs` to monitor:
- Queue depth and processing rate
- Job success/failure rates
- Individual job execution details
- Retry attempts

### What Redis version is required?

Redis 6.x or higher is required. Redis 7.x is recommended for best performance and features.

## Support

If you encounter issues during migration:

- **Community**: Join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- **Email**: hello@tooljet.com
- **GitHub Issues**: [Report bugs](https://github.com/ToolJet/ToolJet/issues)
