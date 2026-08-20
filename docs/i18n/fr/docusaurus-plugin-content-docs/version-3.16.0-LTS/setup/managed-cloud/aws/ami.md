---
id: ami
title: Déployer ToolJet sur Amazon AMI
slug: /setup/ami/
sidebar_label: AMI
---

Vous pouvez déployer sans effort Amazon Elastic Compute Cloud Service (EC2) en utilisant un **modèle CloudFormation**. Ce modèle déploiera tous les services nécessaires pour exécuter ToolJet sur des instances AWS AMI.

:::info
Vous devez configurer manuellement une base de données PostgreSQL à utiliser par ToolJet. Nous recommandons d'utiliser une **base de données RDS PostgreSQL**. Vous pouvez trouver les prérequis système [ici](/docs/setup/system-requirements).

ToolJet s'exécute avec **Redis intégré** pour l'édition multi-utilisateur et les tâches en arrière-plan. Lors de l'utilisation de **conteneurs worker séparés** ou d'une **configuration multi-pod**, une **instance Redis externe** est **requise** pour la coordination des files d'attente de tâches.

:::warning
Pour utiliser les fonctionnalités ToolJet AI dans votre déploiement, assurez-vous d'ajouter `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` à la liste blanche de vos paramètres réseau.
:::

## Déployer avec CloudFormation

Pour déployer tous les services en une seule fois, utilisez le modèle CloudFormation suivant :

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/EC2-cloudformation.yml
```

## Déployer avec Terraform

Utilisez ce script terraform pour démarrer rapidement une VM.

- Déployer sur [AWS EC2 en utilisant AMI](https://github.com/ToolJet/ToolJet/tree/develop/terraform/AMI_EC2)

## Déployer ToolJet {#deploying-tooljet}

Suivez les étapes ci-dessous pour déployer manuellement ToolJet sur des instances AWS AMI.

1. Configurez une base de données PostgreSQL et assurez-vous qu'elle est accessible depuis l'instance EC2.
2. Connectez-vous à votre console de gestion AWS et accédez à la page de gestion EC2.
3. Dans la section **Images**, cliquez sur le bouton **AMIs**.
4. Trouvez la [version de ToolJet](/docs/setup/choose-your-tooljet) que vous souhaitez déployer. Ensuite, depuis la page de recherche AMI, sélectionnez le type de recherche « Public Images » et saisissez la version souhaitée `AMI Name : tooljet_vX.X.X-lts.ubuntu_jammy` dans la barre de recherche.

   :::info Région AMI
   Les AMI de ToolJet sont publiées dans la région **us-west-1 (N. California)**. Si vous souhaitez déployer dans une région différente, vous pouvez copier l'AMI vers votre région préférée en utilisant l'une des méthodes ci-dessous.
   :::

   **Copier l'AMI vers une autre région :**

   **Option A : Utiliser la console AWS**
   - Allez dans **EC2 → AMIs** dans us-west-1
   - Trouvez l'AMI ToolJet → **Actions → Copy AMI**
   - Sélectionnez votre région cible et cliquez sur **Copy AMI**

   **Option B : Utiliser AWS CLI**

   ```bash
   aws ec2 copy-image \
     --source-region us-west-1 \
     --source-image-id <ami-id> \
     --region <your-preferred-region> \
     --name "ToolJet-<version>"
   ```

   Le processus de copie prend 2 à 5 minutes. Une fois terminé, l'AMI sera disponible dans la région sélectionnée.

5. Sélectionnez l'AMI de ToolJet et démarrez une instance EC2. <br/>
   **Configuration du groupe de sécurité :** Il est recommandé de créer un nouveau groupe de sécurité. Configurez les règles entrantes suivantes pour autoriser le trafic :

   ```
   SSH Access (for server management):
   - Protocol: TCP
   - Port: 22
   - Source: Your IP address (for security)

   HTTP Access (for ToolJet web interface):
   - Protocol: TCP
   - Port: 80
   - Source: 0.0.0.0/0 (public access)

   HTTPS Access (for secure ToolJet web interface):
   - Protocol: TCP
   - Port: 443
   - Source: 0.0.0.0/0 (public access)
   ```

   :::tip
   Pour les déploiements en production, il est recommandé de restreindre l'accès SSH (port 22) à votre adresse IP spécifique ou à la plage réseau de votre entreprise plutôt que d'autoriser un accès public.
   :::

6. Une fois l'instance démarrée, connectez-vous en SSH à l'instance en exécutant `ssh -i <path_to_pem_file> ubuntu@<public_ip_of_the_instance>`.
7. Passez au répertoire de l'application en exécutant `cd ~/app`. <br/> Modifiez le contenu du fichier `.env`. ( Ex : `vim .env` )
   **Configurez toutes les variables d'environnement requises :** <br/>
   Le modèle de fichier `.env` par défaut : <br/>

   ```bash
   # Application Configuration
   TOOLJET_HOST=                # <Endpoint url>
   LOCKBOX_MASTER_KEY=          # Generate: openssl rand -hex 32
   SECRET_KEY_BASE=             # Generate: openssl rand -hex 64

   # Database 1: Application Database (PG_DB)
   # Stores ToolJet's core application data including users, apps, and configurations
   PG_DB=tooljet_production
   PG_USER=
   PG_HOST=
   PG_PASS=

   # Database 2: Internal Database (TOOLJET_DB)
   # Stores ToolJet's internal metadata and tables created within ToolJet Database feature
   TOOLJET_DB=tooljet_db        # Must be different from PG_DB
   TOOLJET_DB_HOST=
   TOOLJET_DB_USER=
   TOOLJET_DB_PASS=

   # PostgREST Configuration (Required)
   PGRST_HOST=localhost:3001
   PGRST_LOG_LEVEL=info
   PGRST_JWT_SECRET=            # Generate: openssl rand -hex 32
   PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
   ```

   :::warning Critique
   `TOOLJET_DB` et `PG_DB` doivent être des **noms de base de données différents**. Utiliser la même base de données pour les deux entraînera un échec du déploiement.
   :::
   <details id="tj-dropdown">
   <summary>Pourquoi ToolJet nécessite-t-il deux bases de données ?</summary>

   ToolJet nécessite **deux noms de base de données distincts** pour un fonctionnement optimal :
   - **PG_DB (Base de données applicative)** : Stocke les données principales de l'application ToolJet, y compris les comptes utilisateurs, les définitions d'application, les permissions et les configurations
   - **TOOLJET_DB (Base de données interne)** : Stocke les données de la fonctionnalité ToolJet Database, y compris les métadonnées internes et les tables créées par les utilisateurs au sein de la fonctionnalité ToolJet Database <br/> <br/>
     Cette séparation garantit l'isolation des données et une performance optimale, à la fois pour les opérations applicatives et pour les tables de base de données créées par les utilisateurs. <br/> <br/>
     **Flexibilité de déploiement :**
   - **Même instance PostgreSQL** (recommandé pour la plupart des cas d'usage) : Créez les deux bases de données au sein d'un seul serveur PostgreSQL
   - **Instances PostgreSQL séparées** (optionnel, pour la scalabilité) : Hébergez chaque base de données sur des serveurs PostgreSQL différents selon vos exigences de performance et d'isolation
   </details>

   #### Configuration SSL pour AWS RDS PostgreSQL

   :::warning Important
   Lors de la connexion à PostgreSQL 16.9 sur AWS RDS avec SSL activé, vous devez configurer les certificats SSL. La variable d'environnement `NODE_EXTRA_CA_CERTS` est essentielle pour résoudre les problèmes de chaîne de certificats SSL et pour se connecter à des points de terminaison HTTPS auto-signés.
   :::
   Pour les connexions AWS RDS PostgreSQL, téléchargez d'abord le paquet de certificats :

   ```bash
   # Create directory and download certificate
   sudo mkdir -p /home/ubuntu/certs/
   cd /home/ubuntu/certs/
   sudo wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   sudo chmod 644 /home/ubuntu/certs/global-bundle.pem
   ```

   Ajoutez ensuite ces variables à votre fichier `.env` :

   ```bash
   PG_HOST=your-rds-endpoint.region.rds.amazonaws.com
   PGSSLMODE=require
   NODE_EXTRA_CA_CERTS=/home/ubuntu/certs/global-bundle.pem
   ```

8. La variable d'environnement `TOOLJET_HOST` détermine où vous pouvez accéder au client ToolJet. Il peut s'agir soit de l'adresse IPv4 publique de votre instance, soit d'un domaine personnalisé que vous souhaitez utiliser. <br/>
   Exemples : <br/>
   `TOOLJET_HOST=http://12.34.56.78` ou <br/>
   `TOOLJET_HOST=https://yourdomain.com` ou <br/>
   `TOOLJET_HOST=https://tooljet.yourdomain.com`
   :::info
   1. Nous utilisons un plugin [lets encrypt](https://letsencrypt.org/) au-dessus de nginx pour créer des certificats TLS à la volée.
   2. Assurez-vous que `TOOLJET_HOST` commence par `http://` ou `https://`
      :::
9. Une fois le fichier `.env` configuré, exécutez `./setup_app`. Ce script installera toutes les dépendances de ToolJet puis démarrera les services requis.
10. Si vous avez défini un domaine personnalisé pour `TOOLJET_HOST`, ajoutez une entrée `A record` dans vos paramètres DNS pour pointer vers l'adresse IP de l'instance EC2.
11. Vous avez terminé, le client ToolJet sera désormais accessible à la valeur que vous avez définie dans `TOOLJET_HOST`.

## Workflows

ToolJet Workflows permet aux utilisateurs de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Cette fonctionnalité étend les capacités de ToolJet au-delà de la création d'outils internes sécurisés, permettant aux développeurs d'automatiser des processus métier complexes.

:::info
Pour les utilisateurs migrant depuis les workflows basés sur Temporal, veuillez consulter le [guide de migration des workflows](/docs/setup/workflow-temporal-to-bullmq-migration/).
:::

### Activer la planification des workflows

Pour activer la planification des workflows, définissez les variables d'environnement suivantes :

```bash
# Worker Mode (required)
# Set to 'true' to enable job processing
# Set to 'false' or unset for HTTP-only mode (scaled deployments)
WORKER=true

# Workflow Processor Concurrency (optional)
# Number of workflow jobs processed concurrently per worker
# Default: 5
TOOLJET_WORKFLOW_CONCURRENCY=5
```

**Détails des variables d'environnement :**

- **WORKER** (requis) : Active le traitement des tâches. Définissez sur `true` pour activer la planification des workflows
- **TOOLJET_WORKFLOW_CONCURRENCY** (optionnel) : Contrôle le nombre de tâches de workflow traitées simultanément par instance worker. La valeur par défaut est 5 si non spécifiée

:::warning
**Exigence Redis externe** : Lors de l'exécution de conteneurs worker séparés ou de plusieurs instances, une instance Redis externe à état persistant est **requise** pour la coordination des files d'attente de tâches. Le Redis intégré ne fonctionne que lorsque le serveur et le worker se trouvent dans la même instance de conteneur (déploiement à instance unique). Configurez la connexion Redis en utilisant les variables d'environnement suivantes :

- **REDIS_HOST=localhost** - Par défaut : localhost
- **REDIS_PORT=6379** - Par défaut : 6379
- **REDIS_USERNAME=** - Optionnel : nom d'utilisateur Redis (ACL)
- **REDIS_PASSWORD=** - Optionnel : mot de passe Redis
- **REDIS_DB=0** - Optionnel : numéro de base de données Redis (par défaut : 0)
- **REDIS_TLS=false** - Optionnel : activer TLS/SSL (définir sur 'true')
  :::

**Remarque** : Après avoir mis à jour le fichier `.env`, redémarrez le serveur en utilisant `./setup_app`.

**Pour plus de variables d'environnement, consultez notre [documentation sur les variables d'environnement](/docs/setup/env-vars).**

## Mise à niveau vers la dernière version LTS {#upgrading-to-the-latest-lts-version}

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez commencer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

**Processus de mise à niveau AMI :** Comme ToolJet est déployé à l'aide d'une AMI (Amazon Machine Image), la mise à niveau vers une nouvelle version LTS nécessite le lancement d'une nouvelle instance EC2 avec l'AMI mise à jour plutôt qu'une mise à niveau sur place.

De nouvelles versions LTS sont publiées tous les 3 à 5 mois avec une fin de vie d'au moins 18 mois. Pour vérifier la dernière version LTS, consultez la page [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning
**Critique : Sauvegardez votre instance PostgreSQL**

Avant de commencer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (Base de données applicative) - Contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (Base de données interne) - Contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de procéder à la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord effectuer une mise à niveau vers cette version avant de passer à la dernière version LTS.
- **Exigence ToolJet 3.0+ :** Le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [guide de migration vers ToolJet 3.0](/docs/setup/upgrade-to-v3/).

## Étapes de mise à niveau

#### 1. Copier le fichier `.env` depuis l'ancienne instance

- Avant d'arrêter l'ancienne instance EC2, copiez le fichier `.env`.
- Conservez-le en lieu sûr, car il contient la configuration spécifique à l'environnement.

#### 2. Arrêter l'ancienne instance EC2

- Arrêtez l'ancienne instance EC2 pour éviter les conflits.
- Assurez-vous que l'instance reste **arrêtée** pendant tout le processus de nouveau déploiement.

#### 3. Lancer une nouvelle instance EC2 avec la dernière AMI

- Ouvrez le tableau de bord AWS **AMI** dans la région **us-east-1 (N. Virginia)**.
- Repérez la **dernière AMI ToolJet**. Si vous devez déployer dans une région différente, copiez d'abord l'AMI (voir [Informations sur la région AMI](#deploying-tooljet) à l'étape 4 ci-dessus).
- Lancez une nouvelle instance EC2 avec cette AMI.
- Configurez les **règles de groupe de sécurité** requises.

#### 4. Transférer le fichier `.env` vers la nouvelle instance

- Téléchargez le fichier `.env` précédemment sauvegardé.
- Placez-le dans le répertoire approprié sur la nouvelle instance EC2.

#### 5. Démarrer l'application

- Connectez-vous en SSH à la nouvelle instance EC2.
- Accédez au répertoire de l'application et exécutez le script de configuration :

```bash
cd ~/app
./setup_app
```

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
