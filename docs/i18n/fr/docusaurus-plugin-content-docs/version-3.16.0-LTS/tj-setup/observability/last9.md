---
id: last9
title: Last9
---

Last9 est une plateforme d'observabilité qui fournit une analyse des métriques, des traces et des logs. ToolJet s'intègre à Last9 à l'aide d'OpenTelemetry en exportant les données de télémétrie directement vers les endpoints OTLP de Last9. Ce guide explique comment configurer l'observabilité avec Last9.

Pour utiliser OpenTelemetry avec Last9, l'endpoint OTLP requis doit être activé au niveau de l'organisation par l'équipe Last9. Accédez à Integrations > OpenTelemetry, cliquez sur *Connect*, et soumettez une demande via *Request OpenTelemetry Endpoint Setup*.


## Configurer l'observabilité avec Last9

### Étape 1 : Récupérer les identifiants depuis Last9
Accédez à Integrations > OpenTelemetry, cliquez sur *Connect* et copiez les valeurs suivantes :
- **Endpoint URL**
- **Auth Header**

### Étape 2 : Définir les variables d'environnement dans ToolJet
Définissez les variables d'environnement suivantes dans votre instance ToolJet pour activer OpenTelemetry.

Remplacez `<YOUR-LAST9-ENDPOINT>` et `<YOUR-LAST9-AUTH-HEADER>` par l'URL de l'endpoint et l'en-tête d'authentification obtenus à l'étape 1.
```js
ENABLE_OTEL=true
OTEL_SERVICE_NAME=tooljet

# Last9 Agent endpoints (container-to-container)
OTEL_EXPORTER_OTLP_TRACES=https://<YOUR-LAST9-ENDPOINT>/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://<YOUR-LAST9-ENDPOINT>/v1/metrics
OTEL_HEADER=<YOUR-LAST9-AUTH-HEADER>

# Optional but useful while debugging
OTEL_LOG_LEVEL=debug
```

Votre instance ToolJet commencera désormais à diffuser des traces et des métriques vers Last9.
