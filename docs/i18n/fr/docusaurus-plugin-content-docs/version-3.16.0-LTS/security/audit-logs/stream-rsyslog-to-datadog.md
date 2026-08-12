---
id: stream-audit-to-datadog
title: Diffuser les journaux d'audit vers Datadog
---

<br/>

Ce guide explique comment configurer ToolJet pour diffuser les journaux d'audit de Rsyslog vers Datadog afin d'assurer une **gestion centralisée des journaux**, une **surveillance** et une **analyse**. Cette intégration permet une visibilité en temps réel sur les activités des utilisateurs, les modifications de ressources et les événements système, vous aidant à maintenir la sécurité, la conformité et la vigilance opérationnelle sur l'ensemble de votre infrastructure.

Quand diffuser les journaux d'audit ToolJet vers Datadog :

- **Déploiements multi-serveurs** : Centralisez les journaux des environnements de production, de préproduction et de développement
- **Surveillance de sécurité** : Corrélez les actions des utilisateurs avec les métriques d'infrastructure pour détecter les anomalies
- **Exigences de conformité** : Maintenez des pistes d'audit infalsifiables avec une conservation à long terme
- **Réponse aux incidents** : Recherchez et analysez rapidement les journaux lors d'incidents de sécurité ou opérationnels

## Prérequis

Avant de configurer l'intégration Datadog, assurez-vous d'avoir :

1. **ToolJet avec rsyslog activé** - Suivez le **[guide de configuration Rsyslog](/docs/security/audit-logs/setup-rsyslog)** pour activer la génération de fichiers journaux
2. **Un compte Datadog** - Inscrivez-vous sur [https://www.datadoghq.com/](https://www.datadoghq.com/)
3. **Une clé API Datadog** - Obtenez-la depuis [Datadog Organization Settings](https://app.datadoghq.com/organization-settings/api-keys)
4. **Une configuration Docker Compose** - Ce guide utilise Docker Compose pour le déploiement

## Aperçu de l'architecture

1. **ToolJet** écrit les journaux d'audit dans `/home/appuser/rsyslog/` à l'intérieur du conteneur
2. **Un volume Docker** partage le répertoire rsyslog entre les conteneurs ToolJet et Datadog Agent
3. **Datadog Agent** surveille les fichiers journaux et les diffuse vers la plateforme cloud de Datadog
4. **Datadog** analyse, indexe et affiche les journaux dans le Logs Explorer

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   ToolJet   │─────>│ Docker Volume│<─────│   Datadog   │
│  Container  │      │ (rsyslog/)   │      │    Agent    │
└─────────────┘      └──────────────┘      └──────┬──────┘
                                                  │
                                                  ▼
                                            ┌─────────────┐
                                            │  Datadog    │
                                            │   Cloud     │
                                            └─────────────┘
```

## Étapes de configuration

### Étape 1 : Configurer les variables d'environnement

Ajoutez les variables d'environnement suivantes à votre fichier `.env` :

```bash
# Enable rsyslog (if not already enabled)
LOG_FILE_PATH='rsyslog'

# Datadog Configuration
DD_API_KEY=your_datadog_api_key_here
DD_SITE=datadoghq.com
```

:::info
Remplacez `your_datadog_api_key_here` par votre véritable clé API Datadog provenant de [https://app.datadoghq.com/organization-settings/api-keys](https://app.datadoghq.com/organization-settings/api-keys)
:::

:::tip Site Datadog
La valeur `DD_SITE` dépend de votre région Datadog :

- US1 : `datadoghq.com` (par défaut)
- US3 : `us3.datadoghq.com`
- US5 : `us5.datadoghq.com`
- EU : `datadoghq.eu`
- AP1 : `ap1.datadoghq.com`
  :::

### Étape 2 : Créer la configuration de l'agent Datadog

Créez un fichier nommé `datadog-agent-config.yml` dans votre répertoire de déploiement ToolJet :

```yaml
logs_enabled: true
logs_config:
  container_collect_all: false

# ToolJet audit log configuration
log_processing_rules:
  - type: multi_line
    name: json_logs
    pattern: ^\{
```

Cette configuration :

- Active la collecte des journaux dans l'agent Datadog
- Désactive la collecte automatique depuis tous les conteneurs (nous ciblerons des journaux spécifiques)
- Configure le traitement multiligne pour les journaux au format JSON

### Étape 3 : Créer la configuration de collecte des journaux ToolJet

Créez un fichier nommé `datadog-tooljet-logs.yaml` dans votre répertoire de déploiement ToolJet :

```yaml
logs:
  - type: file
    path: /var/log/tooljet/rsyslog/tooljet_log/*/audit.log
    service: tooljet
    source: tooljet-audit
    sourcecategory: audit
    tags:
      - env:production
      - application:tooljet
      - log_type:audit
    # Parse JSON logs
    log_processing_rules:
      - type: exclude_at_match
        name: exclude_empty_logs
        pattern: "^\\s*$"
```

Cette configuration :

- **path** : Surveille tous les fichiers audit.log à l'aide d'un motif générique correspondant aux journaux rotatés quotidiennement
- **service** : Étiquette les journaux avec `service:tooljet` pour le filtrage dans Datadog
- **source** : Identifie les journaux comme `tooljet-audit` pour les pipelines d'analyse
- **tags** : Ajoute des étiquettes personnalisées pour l'organisation et le filtrage
- **log_processing_rules** : Exclut les lignes de journal vides

**Personnaliser les étiquettes**

Modifiez la section `tags` pour correspondre à votre environnement :

```yaml
tags:
  - env:staging # or development, production
  - application:tooljet
  - team:platform
  - region:us-east-1
```

### Étape 4 : Mettre à jour la configuration Docker Compose

Mettez à jour votre fichier `docker-compose.yml` pour inclure l'agent Datadog et le volume partagé :

#### Ajouter un volume partagé au service ToolJet

```yaml
services:
  tooljet:
    # ... existing configuration ...
    volumes:
      - tooljet-logs:/home/appuser/rsyslog
```

#### Ajouter le service Datadog Agent

```yaml
datadog-agent:
  container_name: datadog-agent
  image: gcr.io/datadoghq/agent:7
  restart: always
  environment:
    - DD_API_KEY=${DD_API_KEY}
    - DD_SITE=${DD_SITE:-datadoghq.com}
    - DD_LOGS_ENABLED=true
    - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=false
    - DD_PROCESS_AGENT_ENABLED=true
    - DD_DOCKER_LABELS_AS_TAGS={"*":"%%label%%"}
    - DD_TAGS=env:production application:tooljet
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - /proc/:/host/proc/:ro
    - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
    - tooljet-logs:/var/log/tooljet/rsyslog:ro
    - ./datadog-agent-config.yml:/etc/datadog-agent/datadog.yaml:ro
    - ./datadog-tooljet-logs.yaml:/etc/datadog-agent/conf.d/tooljet.d/conf.yaml:ro
```

#### Définir le volume partagé

```yaml
volumes:
  tooljet-logs:
  # ... other volumes ...
```

Exemple complet de docker-compose.yml

```bash
name: ToolJet

services:
  tooljet:
    container_name: Tooljet-app
    image: tooljet/tooljet:latest
    restart: always
    env_file: .env
    ports:
      - 80:80
    environment:
      SERVE_CLIENT: "true"
      PORT: "80"
    command: npm run start:prod
    volumes:
      - tooljet-logs:/home/appuser/rsyslog

  datadog-agent:
    container_name: datadog-agent
    image: gcr.io/datadoghq/agent:7
    restart: always
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=${DD_SITE:-datadoghq.com}
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=false
      - DD_PROCESS_AGENT_ENABLED=true
      - DD_DOCKER_LABELS_AS_TAGS={"*":"%%label%%"}
      - DD_TAGS=env:production application:tooljet
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
      - tooljet-logs:/var/log/tooljet/rsyslog:ro
      - ./datadog-agent-config.yml:/etc/datadog-agent/datadog.yaml:ro
      - ./datadog-tooljet-logs.yaml:/etc/datadog-agent/conf.d/tooljet.d/conf.yaml:ro

  postgres:
    container_name: postgres
    image: postgres:13
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - 5432:5432

volumes:
  tooljet-logs:
```

### Étape 5 : Déployer la configuration

1. **Arrêter les conteneurs existants** :
   ```bash
   docker-compose down
   ```
2. **Démarrer la pile mise à jour** :
   ```bash
   docker-compose up -d
   ```
3. **Vérifier que les conteneurs sont en cours d'exécution** :
   ```bash
   docker ps
   ```
   Vous devriez voir les conteneurs `Tooljet-app` et `datadog-agent` en cours d'exécution.

### Étape 6 : Vérifier l'intégration

#### Vérifier l'état de l'agent Datadog

Exécutez la commande suivante pour vérifier que l'agent collecte les journaux :

```bash
docker exec datadog-agent agent status
```

Recherchez la section **Logs Agent** dans la sortie :

```
Logs Agent
==========
  ...
  Integrations
  ============

  tooljet
  -------
    - Type: file
      Path: /var/log/tooljet/rsyslog/tooljet_log/*/audit.log
      Service: tooljet
      Source: tooljet-audit
      Status: OK
        1 files tailed out of 1 files matching
```

:::info
Si le statut affiche "OK" et que des fichiers sont suivis, l'intégration fonctionne correctement.
:::

#### Vérifier les journaux de l'agent Datadog

Consultez les journaux de l'agent Datadog pour résoudre tout problème :

```bash
docker logs datadog-agent --tail 50
```

#### Générer des journaux d'audit de test

Effectuez des actions dans ToolJet pour générer des journaux d'audit :

- Créer ou supprimer une application
- Modifier des sources de données
- Mettre à jour des permissions d'utilisateur
- Modifier les paramètres de l'organisation

### Étape 7 : Consulter les journaux dans Datadog

1. Accédez au **[Datadog Logs Explorer](https://app.datadoghq.com/logs)**

2. Utilisez les filtres suivants pour trouver vos journaux ToolJet :
   - `service:tooljet`
   - `source:tooljet-audit`
   - `env:production`

## Structure et champs des journaux

Les journaux d'audit ToolJet contiennent les champs structurés suivants :

| Champ                              | Description                   | Exemple                                  |
| ---------------------------------- | ----------------------------- | ---------------------------------------- |
| `level`                            | Niveau de gravité du journal            | `info`, `warn`, `error`                  |
| `message`                          | Message de journal lisible par un humain    | `PERFORM APP_CREATE OF MyApp`            |
| `timestamp`                        | Moment où l'événement s'est produit       | `2025-10-21 11:27:44`                    |
| `auditLog.userId`                  | Utilisateur ayant effectué l'action | `a59e1ec7-d015-47b9-8ef8-e5d3f4e5f8d4`   |
| `auditLog.resourceId`              | ID de la ressource concernée   | `95031c39-9d19-425d-b70c-3436c2805773`   |
| `auditLog.resourceType`            | Type de ressource              | `APP`, `DATA_SOURCE`, `USER`             |
| `auditLog.actionType`              | Action effectuée              | `APP_CREATE`, `APP_DELETE`, `APP_UPDATE` |
| `auditLog.resourceName`            | Nom de la ressource          | `MyApplication`                          |
| `auditLog.ipAddress`               | Adresse IP du client             | `::ffff:192.168.65.1`                    |
| `auditLog.organizationId`          | ID de l'organisation               | `e9de636b-e611-4b90-95f0-0fe20b540924`   |
| `auditLog.metadata.userAgent`      | Informations sur le navigateur/client    | `Mozilla/5.0...`                         |
| `auditLog.metadata.tooljetVersion` | Version de ToolJet               | `3.16.33-ee-lts`                         |
| `auditLog.metadata.transactionId`  | Identifiant de transaction unique | `732440597788045`                        |
| `auditLog.metadata.route`          | Point de terminaison API appelé           | `[POST] /api/apps`                       |

**Exemple d'entrée de journal d'audit**

```json
{
  "level": "info",
  "message": "PERFORM APP_CREATE OF MyApp APP FOR ORGANIZATION e9de636b-e611-4b90-95f0-0fe20b540924",
  "timestamp": "2025-10-21 11:27:44",
  "auditLog": {
    "userId": "a59e1ec7-d015-47b9-8ef8-e5d3f4e5f8d4",
    "resourceId": "95031c39-9d19-425d-b70c-3436c2805773",
    "resourceType": "APP",
    "actionType": "APP_CREATE",
    "resourceName": "MyApp",
    "ipAddress": "::ffff:192.168.65.1",
    "metadata": {
      "instance_level": false,
      "workspace_level": true,
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
      "tooljetVersion": "3.16.33-ee-lts",
      "transactionId": "732440597788045",
      "totalDuration": 150,
      "route": "[POST] /api/apps"
    },
    "resourceData": {},
    "organizationId": "e9de636b-e611-4b90-95f0-0fe20b540924"
  },
  "label": "APP"
}
```

## Ressources associées

- **[Configurer Rsyslog](/docs/security/audit-logs/setup-rsyslog)** - Configurer la génération de journaux d'audit
- **[Documentation Datadog](https://docs.datadoghq.com/)** - Guides officiels Datadog
- **[Configuration de l'agent Datadog](https://docs.datadoghq.com/agent/guide/agent-configuration-files/)** - Configuration détaillée de l'agent
- **[Collecte de journaux](https://docs.datadoghq.com/logs/log_collection/)** - Guide de collecte de journaux Datadog
