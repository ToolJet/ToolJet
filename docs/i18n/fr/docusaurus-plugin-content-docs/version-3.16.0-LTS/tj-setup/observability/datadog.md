---
id: datadog
title: Datadog
---

ToolJet prend en charge l'observabilité basée sur OpenTelemetry (OTel). Lors de l'utilisation de Datadog, ToolJet ne fournit pas d'agent Datadog par défaut. Vous devez exécuter un agent Datadog en parallèle de ToolJet et configurer ToolJet pour qu'il exporte la télémétrie vers celui-ci. Ce guide explique comment configurer l'observabilité avec Datadog.

ToolJet n'envoie pas automatiquement la télémétrie à Datadog ; nous avons plutôt besoin d'un agent Datadog comme intermédiaire pour transmettre les données à Datadog.
C'est un processus en 3 étapes :
- ToolJet émet des traces et des métriques à l'aide d'OpenTelemetry
- L'agent Datadog reçoit les données OTLP localement
- L'agent transmet les données de manière sécurisée à Datadog

<img src="/img/tooljet-setup/observability/datadog/datadog-setup.png" className="img-full" alt="Datadog observability setup" />

## Configurer l'observabilité avec Datadog

### Étape 1 : Exécuter un agent Datadog
:::info
Pour un guide détaillé sur l'exécution de l'agent Datadog, consultez la [documentation officielle Datadog](https://docs.datadoghq.com/containers/docker).
:::
ToolJet exporte les données d'observabilité à l'aide d'OpenTelemetry et nécessite qu'un agent Datadog soit en cours d'exécution et accessible.
- Si vous n'utilisez pas Docker Compose pour exécuter ToolJet, exécutez l'agent Datadog à l'aide de toute méthode prise en charge (Docker, systemd, Kubernetes) comme décrit dans la [documentation Datadog](https://docs.datadoghq.com/agent).
- Si vous exécutez ToolJet avec Docker Compose, vous pouvez ajouter l'agent Datadog en tant que service dans votre **docker-compose.yml**.
```js
dd-agent:
  image: gcr.io/datadoghq/agent:7
  container_name: dd-agent
  restart: unless-stopped

  ports:
    - "4317:4317"   # OTLP gRPC
    - "4318:4318"   # OTLP HTTP
    - "8126:8126"   # Datadog APM (optional)

  environment:
    DD_SITE: us5.datadoghq.com
    DD_API_KEY: <your-datadog-api-key>

    # Enable OTLP receivers
    DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_HTTP_ENDPOINT: 0.0.0.0:4318
    DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_GRPC_ENDPOINT: 0.0.0.0:4317

    # Recommended
    DD_APM_ENABLED: "true"
    DD_LOG_LEVEL: info

  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - /proc:/host/proc:ro
    - /sys/fs/cgroup:/host/sys/fs/cgroup:ro
```

### Étape 2 : Configurer les variables d'environnement dans ToolJet

Configurez les variables d'environnement suivantes dans le fichier **.env** lors de l'exécution de ToolJet :
```js
# Enable OpenTelemetry in ToolJet
ENABLE_OTEL=true

# Service name as it appears in Datadog APM
OTEL_SERVICE_NAME=tooljet

# Datadog Agent OTLP endpoints
# Use the Datadog Agent hostname reachable from ToolJet
OTEL_EXPORTER_OTLP_TRACES=http://dd-agent:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=http://dd-agent:4318/v1/metrics

# Optional: enable verbose OpenTelemetry logs for troubleshooting
OTEL_LOG_LEVEL=debug
```
**Nom d'hôte de l'agent Datadog**

| Configuration de déploiement                          | Nom d'hôte de l'agent à utiliser |
|-------------------------------------------|------------------------|
| ToolJet et agent Datadog via Docker Compose | `dd-agent`             |
| Agent Datadog exécuté sur le même hôte      | `localhost`            |
| Agent Datadog exécuté sur une machine distante   | `<agent-hostname-or-ip>`|

:::note
Seul le nom d'hôte de l'agent Datadog change selon votre déploiement. Toutes les autres variables d'environnement restent identiques.
:::

Votre instance ToolJet commencera désormais à diffuser des traces et des métriques vers Datadog, qui peuvent être consultées dans Datadog APM.
