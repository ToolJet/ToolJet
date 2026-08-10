---
id: azure-container
title: Déployer ToolJet sur Azure Container Apps
slug: /setup/azure-container/
sidebar_label: Azure Container Apps
---

:::info
Veuillez noter que vous devez configurer manuellement une **base de données PostgreSQL** à utiliser par ToolJet.

ToolJet fonctionne avec **Redis intégré** pour l'édition collaborative et les tâches en arrière-plan. Lors de l'exécution de **conteneurs worker séparés** ou d'une **configuration multi-pod**, une **instance Redis externe** est **requise** pour la coordination de la file d'attente des tâches.

:::warning
Pour utiliser les fonctionnalités de ToolJet AI dans votre déploiement, assurez-vous d'autoriser `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` dans vos paramètres réseau.
:::

## Déployer l'application ToolJet

1. Ouvrez le [tableau de bord Azure](https://portal.azure.com) et accédez à Container Apps, puis cliquez sur **Create container app**.
   <img className="screenshot-full img-full" src="/img/setup/azure-container/step1.png" alt="Deploying ToolJet on Azure container apps" />
2. Sélectionnez l'abonnement approprié et renseignez les informations de base telles que le nom du conteneur, puis cliquez sur le bouton **Create new environment** sous « Container Apps environment » pour configurer la configuration réseau.
   <img className="screenshot-full img-m" src="/img/setup/azure-container/step2.png" alt="Deploying ToolJet on Azure container apps" />
3. Configurez les paramètres de base comme indiqué dans la capture d'écran ci-dessous.
   <img className="screenshot-full img-l" src="/img/setup/azure-container/step3-1.png" alt="Deploying ToolJet on Azure container apps" />
4. Passez à l'onglet « Networking » pour la configuration détaillée comme indiqué dans la capture d'écran. Vous pouvez conserver les paramètres par défaut pour les configurations Workload Profiles et Monitoring.
   :::tip
   Le Container app, le serveur PostgreSQL et le serveur Redis doivent tous se trouver dans le même réseau virtuel (VNet).
   :::
   <img className="screenshot-full img-full" src="/img/setup/azure-container/step3-2.png" alt="Deploying ToolJet on Azure container apps" />
5. Cliquez sur le bouton **Create** en bas de la page.
6. Vous serez ensuite redirigé vers l'onglet Create Container App, décochez l'option **Use quickstart image** pour sélectionner manuellement la source de l'image. Veillez à indiquer le tag de l'image, puis saisissez `server/ee-entrypoint.sh, npm, run, start:prod` dans le champ « Arguments override ».
   <img className="screenshot-full img-m" src="/img/setup/azure-container/step3-v2.png" alt="Deploying ToolJet on Azure container apps" />
7. Sous « Environmental variables », veuillez ajouter les variables d'application ToolJet ci-dessous :

   ```env
   TOOLJET_HOST=<Endpoint url>
   LOCKBOX_MASTER_KEY=<generate using 'openssl rand -hex 32'>
   SECRET_KEY_BASE=<generate using 'openssl rand -hex 64'>

   PG_USER=<username>
   PG_HOST=<postgresql-instance-ip>
   PG_PASS=<password>
   PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
   ```

   Mettez à jour la variable d'environnement `TOOLJET_HOST` pour refléter l'hôte par défaut attribué par Azure Container Apps, si vous n'utilisez pas de domaine personnalisé. <br/>
   Si vous utilisez Azure Database for PostgreSQL - Flexible Server, ajoutez également :

   ```env
   PGSSLMODE = require
   ```

   Pour configurer [ToolJet Database](#tooljet-database), les **variables d'environnement suivantes sont obligatoires** et doivent être configurées :

   ```env
   TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
   TOOLJET_DB_HOST=<postgresql-database-host>
   TOOLJET_DB_USER=<username>
   TOOLJET_DB_PASS=<password>
   ```

   :::note
   Assurez-vous que `TOOLJET_DB` n'est pas identique à `PG_DB`. Les deux bases de données doivent avoir des noms uniques et ne pas être partagées.
   :::
   De plus, pour **PostgREST**, les **variables d'environnement obligatoires** suivantes doivent être définies dans le conteneur ToolJet :
   :::tip
   Si vous avez openssl installé, vous pouvez exécuter la
   commande `openssl rand -hex 32` pour générer la valeur de `PGRST_JWT_SECRET`.

   Si ce paramètre n'est pas spécifié, PostgREST refusera les demandes d'authentification.
   :::

   ```env
    PGRST_HOST=127.0.0.1:3002
    PGRST_JWT_SECRET=
   ```

   **Assurez-vous que ces configurations sont correctement mises en place avant de poursuivre le déploiement de ToolJet. Vérifiez que ces variables d'environnement sont définies dans le même environnement que le conteneur ToolJet.** <br/> <br/>
   **Remarque :** ces variables d'environnement sont données à titre général et pourraient changer à l'avenir. Vous pouvez également consulter les variables d'environnement [**ici**](/docs/setup/env-vars).
   <img className="screenshot-full img-full" src="/img/setup/azure-container/step4-v2.png" alt="Deploying ToolJet on Azure container apps" />

8. Dans l'onglet Ingress, configurez les paramètres Ingress et Authentication comme indiqué ci-dessous. Vous pouvez personnaliser les configurations de sécurité selon vos besoins. Assurez-vous que le port est défini sur 3000.
   <img className="screenshot-full img-full" src="/img/setup/azure-container/step4.png" alt="Deploying ToolJet on Azure container apps" />
9. Passez à l'onglet Review + create et attendez que le modèle soit vérifié et validé, comme indiqué dans la capture d'écran ci-dessous.
   <img className="screenshot-full img-l" src="/img/setup/azure-container/step5a-v2.png" alt="Deploying ToolJet on Azure container apps" />
10. Une fois le conteneur déployé, vous pouvez vérifier son statut sous la gestion des révisions.
    <img className="screenshot-full img-full" src="/img/setup/azure-container/step6.png" alt="Deploying ToolJet on Azure container apps" />

## Déployer le conteneur Postgrest

11. Pour activer la fonctionnalité PostgREST à côté de ToolJet, vous devez `create new container` au sein de votre configuration de déploiement. Ce conteneur exécutera PostgREST comme service sidecar, ce qui est essentiel pour permettre l'accès RESTful à votre base de données PostgreSQL.
    <img className="screenshot-full img-full" src="/img/setup/azure-container/step10a.png" alt="Deploying ToolJet on Azure container apps" />
    Sans cette configuration, vous pourriez rencontrer des erreurs de connexion `ERR ::1 ECONNREFUSED`

    Après avoir sélectionné `Create new container`, configurez le conteneur pour exécuter PostgREST en utilisant l'image et les variables d'environnement appropriées.

    Utilisez l'image officielle PostgREST : `postgrest/postgrest:v12.2.0`
    <img className="screenshot-full img-full" src="/img/setup/azure-container/step10b.png" alt="Deploying ToolJet on Azure container apps" />

    Dans la section `Environment variables`, assurez-vous que les variables suivantes sont définies dans le conteneur PostgREST :

    ```env
    PGRST_LOG_LEVEL=info
    PGRST_DB_PRE_CONFIG=postgrest.pre_config
    PGRST_SERVER_PORT=3002
    PGRST_DB_URI=
    PGRST_JWT_SECRET=
    ```

    La variable **`PGRST_DB_URI`** est **requise** pour PostgREST, qui expose la base de données en tant qu'API REST. Elle doit être explicitement définie pour un fonctionnement correct. Assurez-vous également que la valeur de `PGRST_JWT_SECRET` est identique dans les deux conteneurs.

    #### Format :

    ```env
    PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
    ```

    Une fois le nouveau conteneur créé et déployé, ToolJet peut interagir avec PostgREST, et vous pouvez accéder à l'application en utilisant l'URL affichée dans l'onglet Overview d'Azure Container Apps.

## ToolJet Database

Utilisez la base de données hébergée par ToolJet pour créer des applications plus rapidement et gérer vos données facilement. Vous pouvez en savoir plus sur cette fonctionnalité [ici](/docs/tooljet-db/tooljet-database).

## Workflows

Les workflows ToolJet permettent aux utilisateurs de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Cette fonctionnalité étend les capacités de ToolJet au-delà de la création d'outils internes sécurisés, permettant aux développeurs d'automatiser des processus métier complexes.

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

- **WORKER** (requis) : active le traitement des tâches. Définissez-la sur `true` pour activer la planification des workflows
- **TOOLJET_WORKFLOW_CONCURRENCY** (facultatif) : contrôle le nombre de tâches de workflow traitées simultanément par instance worker. La valeur par défaut est 5 si non spécifiée

:::warning
**Exigence Redis externe** : lors de l'exécution de conteneurs worker séparés ou de plusieurs instances, une instance Redis externe avec état est **requise** pour la coordination de la file d'attente des tâches. Le Redis intégré ne fonctionne que lorsque le serveur et le worker se trouvent dans la même instance de conteneur (déploiement à instance unique). Configurez la connexion Redis à l'aide des variables d'environnement suivantes :

- `REDIS_HOST=localhost` - Par défaut : localhost
- `REDIS_PORT=6379` - Par défaut : 6379
- `REDIS_USERNAME=` - Facultatif : nom d'utilisateur Redis (ACL)
- `REDIS_PASSWORD=` - Facultatif : mot de passe Redis
- `REDIS_DB=0` - Facultatif : numéro de base de données Redis (par défaut : 0)
- `REDIS_TLS=false` - Facultatif : activer TLS/SSL (définir sur 'true')
  :::

## Mise à niveau vers la dernière version LTS

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez démarrer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois avec une fin de vie d'au moins 18 mois. Pour connaître la dernière version LTS, consultez la page [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning Critique : sauvegardez votre instance PostgreSQL

Avant de commencer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données de l'application) - contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (base de données interne) - contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de procéder à la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord effectuer une mise à niveau vers cette version avant de passer à la dernière version LTS.
- **Exigence ToolJet 3.0+ :** le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [ToolJet 3.0 Migration Guide](/docs/setup/upgrade-to-v3/).

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
