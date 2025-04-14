#!/bin/bash
set -e

# Install grpcurl if not already installed
if ! command -v grpcurl &> /dev/null; then
    echo "grpcurl not found, installing..."
    apt update && apt install -y curl \
    && curl -sSL https://github.com/fullstorydev/grpcurl/releases/download/v1.8.0/grpcurl_1.8.0_linux_x86_64.tar.gz | tar -xzv -C /usr/local/bin grpcurl
fi

# Start Redis
service redis-server start

# Start Postgres
service postgresql start

# Start Temporal Server (SQLite configuration)
echo "Starting Temporal Server..."
/usr/bin/temporal-server -r / -c /etc/temporal/ -e temporal-server start &

# Export the PORT variable to be used by the application
export PORT=${PORT:-80}

# Start Supervisor
/usr/bin/supervisord -n &

# Wait for Temporal Server to be ready
echo "Waiting for Temporal Server to be ready..."
sleep 10

# Check if namespace already exists
echo "Checking if Temporal namespace exists..."
if grpcurl -plaintext localhost:7233 temporal.api.workflowservice.v1.WorkflowService/ListNamespaces | grep -q '"name": "default"'; then
    echo "Namespace 'default' already exists."
else
    # Register the namespace if it doesn't exist
    echo "Registering Temporal namespace..."
    grpcurl -plaintext -d '{
        "namespace": "default",
        "description": "Default namespace",
        "workflowExecutionRetentionPeriod": "259200s"
    }' localhost:7233 temporal.api.workflowservice.v1.WorkflowService/RegisterNamespace
fi

# Run the worker process (last step)
echo "Starting worker process..."
npm run worker:prod
