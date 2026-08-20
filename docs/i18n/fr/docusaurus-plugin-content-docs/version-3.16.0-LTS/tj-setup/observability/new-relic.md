---
id: new-relic
title: New Relic
---

ToolJet prend en charge l'observabilité basée sur OpenTelemetry (OTel). Lors de l'utilisation de New Relic, ToolJet exporte la télémétrie à l'aide d'OpenTelemetry vers un OpenTelemetry Collector. Le collecteur est responsable de la transmission de ces données à New Relic à l'aide des API d'ingestion compatibles OTLP de New Relic. Ce guide explique comment configurer l'observabilité avec New Relic.

ToolJet n'envoie pas directement les données de télémétrie à New Relic. Il utilise plutôt OpenTelemetry pour exporter les traces et les métriques vers un OpenTelemetry Collector exécuté dans votre environnement. Le collecteur transmet ensuite ces données à New Relic à l'aide des endpoints d'ingestion OTLP de New Relic.

Le flux d'observabilité se compose de trois éléments :

1. **ToolJet** : génère des traces et des métriques à l'aide d'OpenTelemetry.
2. **OpenTelemetry Collector** : reçoit cette télémétrie localement et la traite.
3. **New Relic** : ingère la télémétrie traitée et la rend disponible dans les vues APM et métriques.

    <img className="img-full" src="/img/tooljet-setup/observability/new-relic/new-relic-setup.png" alt="New Relic Setup"/>

## Configurer l'observabilité avec New Relic

### Obtenir la clé de licence New Relic
Pour obtenir une clé de licence New Relic :
- Connectez-vous à New Relic.
- Accédez à Your Profile > API Keys
- Cliquez sur **Create a Key**.
- Créez une nouvelle clé avec le type de clé défini sur : **Ingest - Licence**. Enregistrez la clé pour une utilisation future.<br /><br />
  <img className="screenshot-full" src="/img/tooljet-setup/observability/new-relic/new-relic-licence-key.png" alt="New Relic Licence Key"/>

### Étape 1 : Configurer un OpenTelemetry Collector
Utilisez le fichier de configuration suivant pour exécuter un OpenTelemetry Collector qui transmet les données de télémétrie à New Relic :

```js
// otel-collector-config.yml
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
  otlphttp/newrelic:
    endpoint: <new_relic-endpoint>:4318
    headers:
      api-key: <your-new_relic-licence-key>

extensions:
  health_check:
  pprof:
    endpoint: :1888
  zpages:
    endpoint: :55679


service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp/newrelic]

    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp/newrelic]
```
**Endpoints OTLP de New Relic**

Utilisez l'endpoint correspondant à votre région New Relic :  
Région US : `https://otlp.nr-data.net `  
Région EU : `https://otlp.eu01.nr-data.net  `

Par exemple : `https://otlp.nr-data.net:4318`

:::info Note
Consultez la [documentation officielle New Relic](https://docs.newrelic.com/docs/opentelemetry/best-practices/opentelemetry-otlp/#configure-endpoint-port-protocol) pour les détails des endpoints spécifiques à chaque région.
:::

### Étape 2 : Exécuter l'OpenTelemetry Collector
Ajoutez le service suivant à votre fichier Docker Compose ToolJet pour exécuter l'OpenTelemetry Collector :
```js
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
:::info NOTE
Si vous n'exécutez pas ToolJet avec Docker ou Docker Compose, vous pouvez héberger l'OpenTelemetry Collector indépendamment et configurer ToolJet pour qu'il pointe vers l'endpoint du collecteur.
:::

### Étape 3 : Configurer les variables d'environnement dans ToolJet
Configurez les variables d'environnement suivantes dans le fichier **.env** lors de l'exécution de ToolJet :

```js
ENABLE_OTEL=true
OTEL_SERVICE_NAME=tooljet

# OTel Collector endpoints
OTEL_EXPORTER_OTLP_TRACES=http://otel-collector:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=http://otel-collector:4318/v1/metrics

# Optional but useful while debugging
OTEL_LOG_LEVEL=debug
```

Votre instance ToolJet commencera désormais à diffuser des traces et des métriques vers New Relic, qui peuvent être consultées dans New Relic APM.
