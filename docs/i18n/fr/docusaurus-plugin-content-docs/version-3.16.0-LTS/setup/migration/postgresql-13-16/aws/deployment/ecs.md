---
id: ecs
title: ECS
slug: /setup/postgresql-13-16/aws/deployment/ecs/
---

### Étape 1 : Télécharger le certificat vers les instances de conteneurs ECS

#### Utilisation d'AWS CLI (SSM)

```bash
# Copy certificate to ECS container instances
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["mkdir -p /opt/ssl-certs","wget -O /opt/ssl-certs/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem","chmod 644 /opt/ssl-certs/global-bundle.pem"]' \
  --targets "Key=tag:aws:autoscaling:groupName,Values=your-ecs-asg"
```

#### Utilisation de la console AWS (SSM Run Command)

1. Accédez à **AWS Systems Manager Console** → **Run Command**
2. Cliquez sur **Run command**
3. Sélectionnez le document **AWS-RunShellScript**
4. Dans **Command parameters**, saisissez :
   ```bash
   mkdir -p /opt/ssl-certs
   wget -O /opt/ssl-certs/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   chmod 644 /opt/ssl-certs/global-bundle.pem
   ```
5. Dans la section **Targets** :
   - Choisissez **Specify instance tags**
   - Clé de tag : `aws:autoscaling:groupName`
   - Valeur de tag : `your-ecs-asg`
6. Cliquez sur **Run**
7. Attendez que l'exécution de la commande se termine sur toutes les instances

### Étape 2 : Mettre à jour la définition de tâche ECS

#### Utilisation d'AWS CLI

Créez un nouveau fichier de définition de tâche `tooljet-task-updated.json` :

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

Enregistrez la définition de tâche mise à jour :

```bash
aws ecs register-task-definition --cli-input-json file://tooljet-task-updated.json
```

#### Utilisation de la console AWS

1. Accédez à **ECS Console** → **Task Definitions**
2. Sélectionnez votre définition de tâche ToolJet
3. Cliquez sur **Create new revision**
4. Faites défiler jusqu'à **Container definitions** et cliquez sur votre conteneur ToolJet
5. Dans la section **Environment**, ajoutez/mettez à jour les variables d'environnement :
   - `PG_HOST` : `your-rds-endpoint.region.rds.amazonaws.com`
   - `PGSSLMODE` : `require`
   - `NODE_EXTRA_CA_CERTS` : `/certs/global-bundle.pem`
6. Dans la section **Storage and Logging** :
   - **Mount points** : Ajoutez un point de montage
     - Volume source : `ssl-certs`
     - Chemin du conteneur : `/certs`
     - Lecture seule : ✅ Cochée
7. Faites défiler jusqu'à la section **Volumes** en bas de page :
   - Cliquez sur **Add volume**
   - **Name** : `ssl-certs`
   - **Volume type** : **Bind mount**
   - **Source path** : `/opt/ssl-certs`
8. Cliquez sur **Update** puis **Create**

### Étape 3 : Alternative - Utiliser EFS pour le stockage des certificats

#### Utilisation d'AWS CLI

Mettez à jour votre définition de tâche pour utiliser EFS :

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

#### Utilisation de la console AWS

1. Créez d'abord un système de fichiers EFS et téléchargez le certificat :
   - Allez dans **EFS Console** → **Create file system**
   - Téléchargez `global-bundle.pem` dans le répertoire `/ssl-certs/` sur EFS
2. Dans votre définition de tâche ECS (Étape 2 ci-dessus) :
   - Dans la section **Volumes**, au lieu de **Bind mount** :
     - **Volume type** : **EFS**
     - **Name** : `ssl-certs`
     - **File system ID** : `fs-xxxxxxxxx`
     - **Root directory** : `/ssl-certs`

### Étape 4 : Mettre à jour le service ECS

#### Utilisation d'AWS CLI

```bash
aws ecs update-service \
  --cluster your-cluster-name \
  --service tooljet-service \
  --task-definition tooljet-task:latest \
  --force-new-deployment
```

#### Utilisation de la console AWS

1. Accédez à **ECS Console** → **Clusters**
2. Sélectionnez votre cluster
3. Cliquez sur l'onglet **Services**
4. Sélectionnez votre service ToolJet
5. Cliquez sur **Update**
6. Dans l'étape **Configure service** :
   - **Task Definition** : Sélectionnez la dernière révision que vous venez de créer
   - **Force new deployment** : ✅ Cochée
7. Cliquez sur **Skip to review**
8. Cliquez sur **Update Service**
9. Attendez que le déploiement se termine

### Étape 5 : Vérifier la configuration

**Vérifiez le statut du service :**

```bash
# Via CLI
aws ecs describe-services --cluster your-cluster-name --services tooljet-service

# Via Console: Go to ECS Console → Clusters → Your Cluster → Services → ToolJet Service
# Check that "Running count" matches "Desired count"
```

**Vérifiez le montage du certificat SSL :**

```bash
# Connect to running container and verify certificate
aws ecs execute-command \
  --cluster your-cluster-name \
  --task your-task-id \
  --container tooljet \
  --command "ls -la /certs/"
```

**Référence** : [Documentation de configuration ECS de ToolJet](https://docs.tooljet.com/docs/setup/ecs)
