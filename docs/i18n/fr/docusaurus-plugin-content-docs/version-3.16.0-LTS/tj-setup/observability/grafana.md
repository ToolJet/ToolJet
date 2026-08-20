---
id: grafana
title: Grafana
---

Grafana est une plateforme open-source d'observabilité et de visualisation permettant d'explorer les métriques, les traces et les logs. ToolJet s'intègre à Grafana à l'aide d'OpenTelemetry en exportant les données de télémétrie vers un OpenTelemetry Collector, qui les transmet ensuite aux backends de stockage pris en charge par Grafana. Ce guide explique comment configurer l'observabilité avec Grafana.

ToolJet n'envoie pas directement les données de télémétrie à Grafana. Il utilise plutôt OpenTelemetry pour exporter les traces et les métriques vers un OpenTelemetry Collector exécuté dans votre environnement. Le collecteur transmet ensuite ces données aux backends de stockage pris en charge par Grafana.

Le flux d'observabilité se compose des éléments suivants :
- ToolJet : génère des traces et des métriques à l'aide d'OpenTelemetry.
- OpenTelemetry Collector : reçoit et traite la télémétrie localement.
- Tempo : stocke les traces distribuées.
- Prometheus : stocke les métriques.
- Grafana : visualise les traces et les métriques via des dashboards et des vues Explore.

## Configurer l'observabilité avec Grafana

### Étape 1 : Configurer un OpenTelemetry Collector
Utilisez le fichier de configuration suivant pour exécuter un OpenTelemetry Collector qui transmet les données de télémétrie à Tempo et Prometheus.

```yaml
# otel-collector-config.yml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
        include_metadata: true

processors:
  batch:

exporters:
  # Export traces to Tempo
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

  # Export metrics for Prometheus to scrape
  prometheus:
    endpoint: "0.0.0.0:8889"

extensions:
  health_check:
  pprof:
    endpoint: :1888
  zpages:
    endpoint: :55679

service:
  extensions: [health_check, pprof, zpages]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/tempo]

    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
```

### Étape 2 : Exécuter la stack d'observabilité
Exécutez l'OpenTelemetry Collector ainsi que Tempo, Prometheus et Grafana en ajoutant les services suivants à votre `docker-compose.yml`.

**OpenTelemetry Collector**
```yaml
otel-collector:
  image: otel/opentelemetry-collector-contrib:latest
  container_name: otel-collector
  command: ["--config=/etc/otel-collector-config.yml"]
  volumes:
    - ./otel-collector-config.yml:/etc/otel-collector-config.yml
  ports:
    - "4317:4317"
    - "4318:4318"
    - "8889:8889"
```

**Tempo (stockage des traces)**
```yaml
tempo:
  image: grafana/tempo:latest
  container_name: tempo
  command: ["-config.file=/etc/tempo.yml"]
  ports:
    - "3200:3200"
  volumes:
    - ./tempo.yml:/etc/tempo.yml
```
**Prometheus (stockage des métriques)**
```js
prometheus:
  image: prom/prometheus:latest
  container_name: prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

**Grafana (visualisation)**
```js
grafana:
  image: grafana/grafana:latest
  container_name: grafana
  ports:
    - "3001:3000"
  environment:
    GF_SECURITY_ADMIN_USER: admin
    GF_SECURITY_ADMIN_PASSWORD: admin
    GF_USERS_ALLOW_SIGN_UP: "false"
  depends_on:
    - prometheus
    - tempo
```

### Étape 3 : Configurer les backends de traces et de métriques
Ces fichiers de configuration sont montés dans leurs conteneurs respectifs par Docker Compose. Si vous exécutez les services hors de Docker, placez ces fichiers selon votre gestionnaire de services ou votre configuration de déploiement.

#### Configurer Tempo (stockage des traces)

Créez un fichier `tempo.yml` avec la configuration suivante :
```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
        http:

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo
    wal:
      path: /tmp/tempo/wal
```

#### Configurer Prometheus (stockage des métriques)

Créez un fichier `prometheus.yml` avec la configuration suivante :

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "otel-collector"
    static_configs:
      - targets: ["otel-collector:8889"]
```

### Étape 4 : Configurer les variables d'environnement dans ToolJet
Définissez les variables d'environnement suivantes dans le fichier .env utilisé par ToolJet :
```js
ENABLE_OTEL=true
OTEL_SERVICE_NAME=tooljet
OTEL_EXPORTER_OTLP_TRACES=http://otel-collector:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=http://otel-collector:4318/v1/metrics

# Optional but useful while debugging
OTEL_LOG_LEVEL=debug
```

### Étape 5 : Configurer les sources de données dans Grafana
Une fois Grafana en cours d'exécution, ouvrez http://localhost:3001 et connectez-vous avec les identifiants admin.

Accédez à Connections > Data Sources, puis cliquez sur Add data source. Vous allez créer deux sources de données : une pour les métriques (Prometheus) et une pour les traces (Tempo).
    <img className="screenshot-full" src="/img/tooljet-setup/observability/grafana/grafana-add-datasources.png" alt="Grafana Data Source"/>

**1. Prometheus (métriques)**
- Sur la page Add data source, recherchez Prometheus et sélectionnez-le.
- Sous Connection, définissez l'**URL du serveur Prometheus** sur :
```js 
http://prometheus:9090
```
- Cliquez sur **Save and test**.

**2. Tempo (traces)**
- Retournez sur Add data source, recherchez Tempo, et sélectionnez-le.
- Sous Connection, définissez l'URL sur :
```js
http://tempo:3200
```
- Cliquez sur **Save and test**.

Votre instance ToolJet commencera désormais à diffuser des traces et des métriques vers Grafana.

## Utiliser les dashboards Grafana de ToolJet

Une fois l'observabilité configurée, ToolJet fournit deux dashboards Grafana préconstruits pour visualiser les métriques :

:::info
Ces dashboards nécessitent que Prometheus (métriques) et Tempo (traces) soient configurés comme décrit ci-dessus.
:::

### Dashboard de métriques par application

Téléchargez le dashboard :
```bash
curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-app-dashboard.json
```

Ce dashboard se concentre sur les métriques spécifiques aux applications et comprend :

- **Vue d'ensemble de l'application :** total des exécutions de requêtes, jauge de taux de succès, latence p95, nombre d'échecs
- **Performance des requêtes :** taux d'exécution par requête, percentiles de latence, répartition par source de données
- **Requêtes principales :** requêtes les plus exécutées, requêtes les plus lentes (p95), requêtes les plus échouées
- **Filtrage par environnement :** filtrer par nom d'application, environnement (production/staging/development) et mode (vue/édition)

Le dashboard extrait automatiquement le texte des requêtes et les noms d'environnement pour un débogage immédiat sans avoir à consulter les logs.

### Dashboard de métriques de la plateforme

Téléchargez le dashboard :
```bash
curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-platform-dashboard.json
```

Ce dashboard fournit une surveillance complète de la plateforme :

- **Santé du système :** temps de réponse P95, taux de requêtes, taux d'erreur, total des requêtes
- **Analytique API :** répartition du trafic, endpoints les plus sollicités, endpoints les plus lents
- **Tendances de performance :** analyse multi-percentile du temps de réponse (P50, P95, P99)
- **Codes de statut :** répartition des succès/erreurs au fil du temps
- **Performance de la base de données :** temps d'exécution des requêtes, santé des connexions
- **Métriques du runtime :** boucle d'événements Node.js, performance du GC, utilisation de la mémoire V8
- **Traçage distribué :** intégration avec Jaeger pour la visualisation des traces

### Importer les dashboards

Pour importer les dashboards Grafana :

1. Téléchargez les fichiers JSON des dashboards :
   ```bash
   # Download App-Based Metrics Dashboard
   curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-app-dashboard.json

   # Download Platform-Based Metrics Dashboard
   curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-platform-dashboard.json
   ```
2. Ouvrez Grafana et accédez à **Dashboards** > **Import**
3. Cliquez sur **Upload JSON file** et sélectionnez le fichier JSON du dashboard téléchargé
4. Sélectionnez votre source de données Prometheus
5. Cliquez sur **Import**

Les dashboards seront immédiatement disponibles avec des données en temps réel provenant de votre instance ToolJet.
