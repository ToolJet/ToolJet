---
id: observability-otel
title: Vue d'ensemble de l'observabilité
sidebar_label: Vue d'ensemble
---

ToolJet prend en charge OpenTelemetry (OTEL) pour une observabilité complète, vous permettant de surveiller la performance des applications, de suivre les exécutions de requêtes, et d'analyser la santé des services et de l'infrastructure de ToolJet grâce aux métriques. OpenTelemetry offre un moyen standardisé et indépendant des fournisseurs de collecter des données d'observabilité, permettant à ToolJet de s'intégrer avec n'importe quel outil de surveillance tiers compatible OTEL tel que [Datadog](/docs/tj-setup/observability/datadog), [New Relic](/docs/tj-setup/observability/new-relic), et [Grafana](/docs/tj-setup/observability/grafana).

**Catégories de métriques**

1. **Métriques basées sur l'application** - Surveillez la performance et la fiabilité des applications ToolJet individuelles. Ces métriques incluent des labels détaillés tels que `app_name`, `query_name`, `environment`, `query_text`, et `query_mode` (SQL/GUI) pour une analyse fine.
      - **Exécutions de requêtes :** suivez le total des exécutions de requêtes par application
      - **Durée des requêtes :** mesurez les temps d'exécution des requêtes avec des buckets d'histogramme
      - **Échecs de requêtes :** surveillez les requêtes échouées avec catégorisation des erreurs
      - **Taux de succès :** pourcentages de taux de succès au niveau de l'application
      - **Utilisation de l'application :** suivez les événements d'accès et d'interaction avec l'application <br/> <br/>
    <img className="screenshot-full img-full" src="/img/tooljet-setup/observability/setup/app-based-metrics.png" alt="App Based Metrics"/>

2. **Métriques basées sur la plateforme** - Surveillez la santé et la performance globales de votre instance ToolJet :
      - **Métriques du serveur HTTP :** taux de requêtes, temps de réponse, codes de statut
      - **Performance de l'API :** latence et débit spécifiques aux endpoints
      - **Opérations de base de données :** temps d'exécution des requêtes et santé des connexions
      - **Runtime Node.js :** délais de la boucle d'événements, garbage collection, utilisation de la mémoire
      - **Mémoire V8 :** utilisation du tas et suivi de la mémoire externe <br/> <br/>
    <img className="screenshot-full img-full" src="/img/tooljet-setup/observability/setup/platform-metrics.png" alt="Platform Metrics"/>

## Configuration

Activez OpenTelemetry en définissant les variables d'environnement suivantes dans votre déploiement ToolJet :

#### Variables requises

```js
# Enable OpenTelemetry metrics collection
ENABLE_OTEL=true

# OTLP Endpoint Configuration
OTEL_EXPORTER_OTLP_TRACES=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=http://localhost:4318/v1/metrics

# Service Identification
OTEL_SERVICE_NAME=tooljet
```

#### Variables optionnelles

```js
# Authentication (if required by your OTEL collector)
OTEL_HEADER=<your-api-key>

# Advanced Configuration
OTEL_LOG_LEVEL=debug                          # Enable debug logging for OTEL
OTEL_ACTIVE_USER_WINDOW_MINUTES=5             # Activity window for concurrent user tracking (default: 5)
OTEL_MAX_TRACKED_USERS=10000                  # Maximum tracked users/sessions (default: 10000)

# WARNING: High Cardinality - Only enable for debugging
OTEL_INCLUDE_QUERY_TEXT=false                 # Include actual query text in metrics (default: false)
                                              # Creates HIGH CARDINALITY - use OTEL Collector to drop in production

```

Pour une liste complète des variables d'environnement OpenTelemetry, consultez la [documentation OpenTelemetry](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/).

## Configurer un OTEL Collector local

Certaines plateformes d'observabilité nécessitent un OpenTelemetry Collector comme intermédiaire. Dans ce cas, vous pouvez déployer le Collector en parallèle de ToolJet. ToolJet envoie les données de télémétrie au Collector, qui les transmet ensuite à votre plateforme d'observabilité selon sa configuration.  
Cette configuration Docker Compose peut être utilisée pour déployer un OpenTelemetry Collector en parallèle de ToolJet.

```yaml
# docker-compose.yml excerpt
otel-collector:
  image: otel/opentelemetry-collector-contrib:latest
  command: ["--config=/etc/otel-collector-config.yaml"]
  volumes:
    - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
  ports:
    - "4318:4318"     # OTLP HTTP receiver
    - "8889:8889"     # Prometheus exporter
```

<!-- ### Grafana Cloud

Configure ToolJet to send metrics directly to Grafana Cloud:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/metrics
OTEL_HEADER=Authorization=Basic <base64-encoded-credentials>
OTEL_SERVICE_NAME=tooljet-production
```

### Datadog

Send metrics to Datadog using the OTLP endpoint:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://api.datadoghq.com/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://api.datadoghq.com/v1/metrics
OTEL_HEADER=dd-api-key=<your-datadog-api-key>
OTEL_SERVICE_NAME=tooljet
```

### New Relic

Configure for New Relic OTLP endpoint:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://otlp.nr-data.net:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://otlp.nr-data.net:4318/v1/metrics
OTEL_HEADER=api-key=<your-newrelic-license-key>
OTEL_SERVICE_NAME=tooljet
``` -->

<!-- ## Grafana Dashboards

ToolJet provides two pre-built Grafana dashboards for visualizing metrics:

### Per-App Metrics Dashboard

Download the dashboard:
```bash
curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-app-dashboard.json
```

This dashboard focuses on application-specific metrics and includes:

- **App Overview:** Total query executions, success rate gauge, p95 latency, failure counts
- **Query Performance:** Execution rates by query, latency percentiles, data source breakdown
- **Top Queries:** Most executed queries, slowest queries (p95), most failed queries
- **Environment Filtering:** Filter by app name, environment (production/staging/development), and mode (view/edit)

The dashboard automatically extracts query text and environment names for immediate debugging without consulting logs.

### Platform Metrics Dashboard

Download the dashboard:
```bash
curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-platform-dashboard.json
```

This dashboard provides comprehensive platform monitoring:

- **System Health:** P95 response time, request rate, error rate, total requests
- **API Analytics:** Traffic distribution, top endpoints by hits, slowest endpoints
- **Performance Trends:** Multi-percentile response time analysis (P50, P95, P99)
- **Status Codes:** Success/error distribution over time
- **Database Performance:** Query execution times, connection health
- **Runtime Metrics:** Node.js event loop, GC performance, V8 memory usage
- **Distributed Tracing:** Integration with Jaeger for trace viewing

### Importing Dashboards

To import the Grafana dashboards:

1. Download the dashboard JSON files:
   ```bash
   # Download App-Based Metrics Dashboard
   curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-app-dashboard.json

   # Download Platform-Based Metrics Dashboard
   curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-platform-dashboard.json
   ```
2. Open Grafana and navigate to **Dashboards** → **Import**
3. Click **Upload JSON file** and select the downloaded dashboard JSON file
4. Select your Prometheus data source
5. Click **Import**

The dashboards will be immediately available with real-time data from your ToolJet instance. -->

## Considérations pour la production

### Avertissement sur la cardinalité élevée

Les métriques basées sur l'application peuvent inclure de manière optionnelle un label `query_text` contenant le contenu réel de la requête SQL ou autre. **Par défaut, cette option est désactivée** afin d'éviter les problèmes de cardinalité élevée.

#### Activer le texte des requêtes (débogage uniquement)

Pour activer le texte des requêtes dans les métriques à des fins de débogage :

```bash
OTEL_INCLUDE_QUERY_TEXT=true
```

:::warning
L'activation de `query_text` crée des **séries temporelles à cardinalité élevée** qui peuvent impacter significativement le stockage Prometheus et les performances des requêtes. N'activez cette option que temporairement pour déboguer des problèmes de requêtes spécifiques.
:::

#### Meilleures pratiques pour la production

Si vous devez activer `query_text` en production :

1. **Utilisez un OTEL Collector** pour supprimer le label avant que les métriques n'atteignent Prometheus :

```yaml
# otel-collector-config.yaml
processors:
  attributes:
    actions:
      - key: query_text
        action: delete

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [attributes]
      exporters: [prometheus]
```

2. **Alternative : hacher le texte de la requête** pour réduire la cardinalité :

```yaml
processors:
  transform:
    metric_statements:
      - context: datapoint
        statements:
          - set(attributes["query_text"], SHA256(attributes["query_text"]))
```

### Impact sur les performances

La collecte de métriques OpenTelemetry a un impact minimal sur les performances :

- La collecte des métriques est asynchrone et non bloquante
- Les buckets d'histogramme sont préconfigurés pour des performances optimales
- Les jauges observables (comme les taux de succès) sont mises à jour à intervalle de 15 minutes

### Échantillonnage et filtrage

Pour les déploiements à volume élevé, envisagez :

- **Filtrage des environnements :** ne collectez les métriques que des environnements de production
- **Échantillonnage des requêtes :** utilisez l'échantillonnage de l'OTEL Collector pour les requêtes à haute fréquence
- **Agrégation :** pré-agrégez les métriques au niveau du collecteur avant le stockage

## Dépannage

### Les métriques n'apparaissent pas

1. Vérifiez que `ENABLE_OTEL=true` est défini
2. Vérifiez que l'endpoint du collecteur OTEL est accessible :
   ```bash
   curl http://localhost:4318/v1/metrics
   curl http://localhost:4318/v1/traces
   ```
3. Consultez les logs du serveur ToolJet pour détecter des erreurs de connexion OTEL
4. Vérifiez la configuration du collecteur OTEL et les cibles de scraping Prometheus

### Utilisation élevée de la mémoire

Si vous constatez une utilisation élevée de la mémoire :

1. Supprimez les labels à cardinalité élevée comme `query_text` à l'aide des processeurs de l'OTEL Collector
2. Réduisez le nombre de buckets d'histogramme si nécessaire
3. Mettez en place un filtrage des métriques au niveau du collecteur
4. Envisagez d'utiliser le remote write pour décharger le stockage

### Labels ou métriques manquants

Assurez-vous d'utiliser ToolJet version 3.16.0-LTS ou supérieure, qui inclut l'implémentation OTEL complète avec les métriques basées sur l'application et sur la plateforme.

## Ressources supplémentaires

- [Documentation OpenTelemetry](https://opentelemetry.io/docs/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Intégration OTLP de Grafana](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/otlp/)
- [Récepteur OTLP de Prometheus](https://prometheus.io/docs/prometheus/latest/feature_flags/#otlp-receiver)
