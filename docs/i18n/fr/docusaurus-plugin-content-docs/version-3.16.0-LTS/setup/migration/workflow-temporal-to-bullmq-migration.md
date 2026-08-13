---
id: workflow-temporal-to-bullmq-migration
title: Migration des workflows de Temporal vers BullMQ
slug: /setup/workflow-temporal-to-bullmq-migration/
sidebar_label: Migration des workflows - Temporal vers BullMQ
---

Ce guide vous aide à migrer votre système de planification de workflows ToolJet de l'architecture historique basée sur Temporal vers le nouveau système basé sur BullMQ.

:::note
Ce guide de migration s'applique à ToolJet version **v3.20.37-LTS et ultérieure**. Les versions antérieures à v3.20.37-LTS utilisaient un système de workflows basé sur Temporal.
:::

## Aperçu

ToolJet a remplacé Temporal par BullMQ pour la planification des workflows, simplifiant considérablement le déploiement tout en conservant toutes les fonctionnalités existantes. Ce changement élimine le besoin d'une infrastructure de serveur Temporal séparée et offre des capacités de surveillance intégrées.

## Pourquoi migrer ?

### Avantages des workflows basés sur BullMQ

- **Architecture simplifiée** : Plus besoin de déployer un serveur Temporal séparé
- **Infrastructure existante** : Exploite votre instance Redis existante
- **Meilleure gestion des ressources** : Modes de worker flexibles pour une mise à l'échelle optimisée
- **Visibilité améliorée** : Suivi en temps réel de l'état des jobs et capacités de nouvelle tentative

### Comparaison d'architecture

| Fonctionnalité | Temporal (ancien) | BullMQ (nouveau) |
|---------|---------------|--------------|
| Services externes | Serveur Temporal + Redis | Redis uniquement |
| Complexité de déploiement | Élevée (multi-service) | Faible (service unique) |
| Coût de l'infrastructure | Plus élevé | Plus faible |

## Fonctionnement

Le nouveau système de workflows basé sur BullMQ fonctionne comme suit :

1. **Planification des workflows** : Lorsque vous planifiez un workflow, il est stocké dans PostgreSQL et un job correspondant est créé dans Redis via BullMQ
2. **Files d'attente de jobs** : Deux files d'attente BullMQ gèrent les workflows :
   - `workflow-schedule-queue` : Gère les déclencheurs de workflows planifiés
   - `workflow-execution-queue` : Gère l'exécution des workflows
3. **Traitement par les workers** : Les instances ToolJet avec `WORKER=true` récupèrent les jobs de ces files d'attente et les exécutent
4. **Récupération des planifications** : Au démarrage, le Schedule Bootstrap Service charge automatiquement toutes les planifications actives depuis PostgreSQL et les recrée dans Redis, garantissant qu'aucun workflow n'est perdu lors des déploiements
5. **Mises à jour d'état** : Le frontend interroge les états d'exécution des workflows toutes les 3 secondes via des appels d'API par lot

## Étapes de migration

### 1. Examiner la configuration actuelle

Vérifiez votre déploiement actuel pour les configurations liées à Temporal :

**Variables d'environnement à supprimer :**
```bash
# Old Temporal variables - REMOVE THESE
ENABLE_WORKFLOW_SCHEDULING=true
WORKFLOW_WORKER=true
TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE=default
TEMPORAL_SERVER_ADDRESS=temporal:7233
```

**Services à supprimer :**
- Conteneurs/pods du serveur Temporal
- Conteneurs/pods du worker Temporal

### 2. Configurer Redis

:::warning
**Exigence de Redis externe** : Lors de l'exécution de conteneurs de worker séparés ou de plusieurs instances, une instance Redis externe avec état est **requise** pour la coordination des files d'attente de jobs. Le Redis intégré ne fonctionne que lorsque le serveur et le worker se trouvent dans la même instance de conteneur (déploiement à instance unique).
:::

**Exigences Redis :**
- **Persistance** : AOF (Append Only File) doit être activé
- **Politique de mémoire** : `maxmemory-policy` doit être défini sur `noeviction` (requis par BullMQ)
- **Version** : Redis 6.x ou supérieur (Redis 7.x recommandé)

**Exemple de configuration Redis :**
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

**Configuration Redis par plateforme :**

<details id="tj-dropdown">

<summary>Kubernetes (EKS, AKS, GKE, OpenShift)</summary>

Déployez Redis avec état :

```bash
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/redis-stateful.yaml
```

Cela crée :
- Un StatefulSet avec stockage persistant
- Un service headless
- Une ConfigMap avec une configuration prête pour la production
- Un secret pour l'authentification par mot de passe

Configurez les variables d'environnement :

```bash
REDIS_HOST=redis-service.default.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
```

</details>

<details id="tj-dropdown">

<summary>AWS ECS</summary>

Utilisez Amazon ElastiCache pour Redis :
1. Créez un cluster Redis avec :
   - Version du moteur : Redis 7.x
   - Type de nœud : cache.t3.medium ou supérieur
   - Basculement automatique activé

2. Configurez le groupe de paramètres :
   - Définissez **maxmemory-policy** sur **noeviction**
   - Définissez **appendonly** sur **yes**

3. Ajoutez les variables d'environnement :

```bash
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

</details>

<details id="tj-dropdown">

<summary>Azure Container Apps</summary>

Utilisez Azure Cache for Redis :
1. Créez une instance Redis (niveau Standard ou Premium)
2. Configurez les paramètres Redis pour AOF et la politique noeviction
3. Ajoutez les variables d'environnement :

```bash
REDIS_HOST=your-redis.redis.cache.windows.net
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true
```

</details>

<details id="tj-dropdown">

<summary>Google Cloud Run</summary>

Utilisez Google Cloud Memorystore pour Redis :
1. Créez une instance Redis avec :
   - Redis version 7.x
   - Haute disponibilité activée
2. Configurez les paramètres Redis via la CLI **gcloud**
3. Ajoutez les variables d'environnement :

```bash
REDIS_HOST=your-memorystore-ip
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

</details>

### 3. Mettre à jour les variables d'environnement

Ajoutez les nouvelles variables d'environnement de workflow BullMQ :

**Variables requises :**
```bash
# Worker Mode (required)
# Set to 'true' to enable job processing
WORKER=true

# Redis connection settings
REDIS_HOST=localhost         # Default: localhost
REDIS_PORT=6379              # Default: 6379
REDIS_USERNAME=              # Optional: Redis username (ACL)
REDIS_PASSWORD=              # Optional: Redis password
REDIS_DB=0                   # Optional: Redis database number (default: 0)
REDIS_TLS=false              # Optional: Enable TLS/SSL (set to 'true')
```

**Remarque :** Seuls `REDIS_HOST` et `REDIS_PORT` sont requis. L'authentification et le TLS sont facultatifs.

**Variables facultatives :**
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

### 4. Déployer la configuration mise à jour

Mettez à jour votre déploiement ToolJet avec la nouvelle configuration :

**Pour Kubernetes :**
```bash
# Update your deployment.yaml with new environment variables
kubectl apply -f deployment.yaml

# Restart pods to apply changes
kubectl rollout restart deployment/tooljet
```

**Pour Docker/Docker Compose :**
```bash
# Update your .env file or docker-compose.yml
docker-compose down
docker-compose up -d
```

**Pour AWS ECS :**
- Mettez à jour la définition de tâche avec les nouvelles variables d'environnement
- Créez une nouvelle révision et mettez à jour le service

**Pour Azure Container Apps :**
- Mettez à jour les variables d'environnement dans les paramètres de l'application conteneurisée
- Enregistrez et redémarrez

### 5. Supprimer l'infrastructure Temporal

Après avoir confirmé que la nouvelle configuration fonctionne :

**Pour Kubernetes :**
```bash
# Remove Temporal deployments
kubectl delete deployment temporal-server
kubectl delete deployment temporal-worker
kubectl delete service temporal-service
```

**Pour Docker Compose :**
```yaml
# Remove Temporal services from docker-compose.yml
# - temporal-server
# - temporal-worker
```

**Pour ECS :**
- Arrêtez et supprimez les définitions de tâches Temporal
- Supprimez les services Temporal

### 6. Vérifier la migration

1. **Vérifier la planification des workflows** : Créez un nouveau workflow planifié dans ToolJet
2. **Vérifier l'exécution** : Déclenchez un workflow et confirmez qu'il s'exécute avec succès
3. **Vérifier les journaux** : Examinez les journaux d'application pour détecter d'éventuelles erreurs

## Mise à l'échelle des workflows avec des workers dédiés

Pour les déploiements en production avec un usage intensif des workflows, il est recommandé de déployer des instances de worker dédiées qui traitent uniquement les jobs sans servir de trafic HTTP.

### Pourquoi des workers dédiés ?

- **Meilleure allocation des ressources** : Ressources de calcul séparées pour l'API et le traitement des jobs
- **Mise à l'échelle indépendante** : Faites évoluer les workers en fonction de la profondeur de la file d'attente
- **Fiabilité améliorée** : Les problèmes du serveur HTTP n'affectent pas le traitement des jobs
- **Optimisation des coûts** : Utilisez des tailles d'instance différentes pour l'API et les workers

### Architecture

```
            ┌─────────────────────────────────────────────────────────────┐
            │                    ToolJet Deployment                       │
            ├─────────────────────────────────────────────────────────────┤
            │                                                             │
            │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
            │  │ Web Server   │  │  Worker 1    │  │  Worker 2    │       │
            │  │              │  │              │  │              │       │
            │  │ WORKER=true  │  │ WORKER=true  │  │ WORKER=true  │       │
            │  │              │  │              │  │              │       │
            │  │ HTTP Requests│  │ Process Jobs │  │ Process Jobs │       │
            │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
            │         │                 │                 │               │
            │         └─────────────────┼─────────────────┘               │
            │                           │                                 │
            └───────────────────────────┼─────────────────────────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │  External Redis │
                               │   (Stateful)    │
                               │                 │
                               │  - Job Queue    │
                               │  - Persistence  │
                               └─────────────────┘
```

### Configuration de déploiement

#### Exemple Kubernetes

<details id="tj-dropdown">

<summary>Déploiement de l'application ToolJet (tooljet-deployment.yaml)</summary>
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

<summary>Déploiement du worker (tooljet-worker.yaml)</summary>
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

**Points clés :**
- **Application ToolJet** : Sert le trafic HTTP sur le port 3000, `WORKER` n'est pas défini (par défaut à false)
- **Worker** : Traite uniquement les jobs avec `WORKER=true`, aucun port exposé
- Les deux déploiements utilisent les mêmes secrets et la même configuration de base de données
- Le worker dispose d'une variable d'environnement supplémentaire spécifique aux workflows : `TOOLJET_WORKFLOW_CONCURRENCY`
- Mettez à jour `REDIS_HOST` pour qu'il pointe vers votre service Redis déployé

#### Exemple Docker Compose

<details id="tj-dropdown">

<summary>Configuration Docker Compose</summary>

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

**Points clés :**
- Service `tooljet` : Serveur web avec `WORKER` non défini (par défaut à false), sert le trafic HTTP sur le port 80
- Service `tooljet-worker-1` : Worker dédié avec `WORKER=true`, aucun port exposé
- Les deux services utilisent le même fichier `.env` pour la configuration partagée
- `env_file: .env` charge les variables d'environnement communes (identifiants de base de données, secrets, etc.)
- Les variables spécifiques à l'environnement sont définies directement dans la section `environment`
- Redis configuré avec la persistance AOF et la politique `noeviction`

#### Exemple AWS ECS

<details id="tj-dropdown">

<summary>Définitions de tâches ECS</summary>

**Définition de tâche du service web :**
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

**Définition de tâche du service worker :**
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
        {"name": "TOOLJET_WORKFLOW_CONCURRENCY", "value": "10"},
        {"name": "REDIS_HOST", "value": "your-elasticache-endpoint"}
      ]
    }
  ]
}
```

</details>

### Considérations sur la mise à l'échelle des workers

**Quand mettre à l'échelle les workers :**
- Profondeur de la file d'attente constamment > 100 jobs
- La latence de traitement des jobs augmente
- Les workflows expirent

**Stratégies de mise à l'échelle :**
- **Horizontale** : Ajoutez plus de répliques de worker
- **Verticale** : Augmentez `TOOLJET_WORKFLOW_CONCURRENCY`
- **Hybride** : Combinez les deux approches

**Métriques de surveillance :**
- Temps de complétion des jobs
- Nombre de jobs échoués
- Utilisation de la mémoire Redis
- Journaux d'application

## Surveillance et dépannage

### Problèmes courants

#### Les workflows ne s'exécutent pas

**Symptômes :** Workflows planifiés mais non exécutés

**Solutions :**
1. Vérifiez que `WORKER=true` est défini sur au moins une instance
2. Vérifiez la connexion Redis :
   ```bash
   # From ToolJet container
   redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
   ```
3. Vérifiez les journaux du worker pour détecter les erreurs
4. Vérifiez `maxmemory-policy noeviction` dans Redis

#### Échecs répétés des jobs

**Symptômes :** Les jobs de workflow échouent de manière répétée

**Solutions :**
1. Vérifiez les journaux d'application pour les messages d'erreur
2. Vérifiez les configurations des nœuds de workflow
3. Vérifiez l'utilisation de la mémoire Redis (elle pourrait être pleine)
4. Vérifiez le paramètre `WORKFLOW_TIMEOUT_SECONDS`

#### Planifications perdues après un redémarrage

**Symptômes :** Les workflows planifiés ne se déclenchent pas après un redémarrage

**Solutions :**
1. Vérifiez les journaux du Schedule Bootstrap Service
2. Vérifiez que la persistance Redis (AOF) fonctionne
3. Confirmez que la connexion PostgreSQL est stable
4. Vérifiez que Redis dispose de suffisamment de mémoire

## FAQ

<details id="tj-dropdown">

<summary>Dois-je recréer mes workflows ?</summary>

Non. Toutes les définitions de workflows et planifications existantes sont stockées dans PostgreSQL et continueront de fonctionner avec le nouveau système BullMQ. Le Schedule Bootstrap Service les charge automatiquement au démarrage.

</details>

<details id="tj-dropdown">

<summary>Puis-je utiliser le Redis intégré pour les workflows ?</summary>

Oui, mais uniquement pour les **déploiements à instance unique** où le serveur et le worker se trouvent dans le même conteneur. Lors de l'exécution de conteneurs de worker séparés ou de plusieurs instances, une instance Redis externe avec une persistance appropriée (AOF) et **maxmemory-policy noeviction** est **requise** pour la coordination des files d'attente de jobs.

</details>

<details id="tj-dropdown">

<summary>Que se passe-t-il pour les workflows en cours pendant la migration ?</summary>

Les workflows en cours dans l'ancien système Temporal ne seront pas migrés. Terminez-les ou annulez-les avant la migration. Les nouvelles planifications se déclencheront normalement dans le système BullMQ.

</details>

<details id="tj-dropdown">

<summary>Puis-je exécuter Temporal et BullMQ simultanément ?</summary>

Non. ToolJet ne prend en charge qu'un seul moteur de workflow à la fois. Choisissez soit Temporal (historique), soit BullMQ (recommandé).

</details>

<details id="tj-dropdown">

<summary>Comment surveiller les performances des workflows ?</summary>

Surveillez les performances des workflows en utilisant :
- Les journaux d'application pour les détails d'exécution des jobs
- Les métriques Redis pour la profondeur de la file d'attente et le taux de traitement
- L'historique d'exécution des workflows dans l'interface ToolJet
- Les requêtes de base de données pour les taux de succès/échec des jobs

</details>

<details id="tj-dropdown">

<summary>Quelle version de Redis est requise ?</summary>

Redis 6.x ou supérieur est requis. Redis 7.x est recommandé pour de meilleures performances et fonctionnalités.

</details>

## Assistance

Si vous rencontrez des problèmes pendant la migration :

- **Communauté** : Rejoignez notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- **E-mail** : hello@tooljet.com
- **Issues GitHub** : [Signaler des bugs](https://github.com/ToolJet/ToolJet/issues)
