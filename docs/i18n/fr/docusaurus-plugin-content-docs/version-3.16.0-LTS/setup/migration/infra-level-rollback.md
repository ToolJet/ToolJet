---
id: infra-level-rollback
title: Retour en arrière au niveau de l'infrastructure
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Le retour en arrière au niveau de l'infrastructure vous permet de revenir à une version précédente de votre déploiement ToolJet au niveau de l'infrastructure. Ceci n'est **pas recommandé pour un usage général** et ne devrait être envisagé que lorsque la version actuelle présente des changements majeurs ou des bugs bloquants.

:::warning Consultez d'abord l'équipe ToolJet
Le retour en arrière au niveau de l'infrastructure ne doit être utilisé qu'en **dernier recours**, après avoir consulté l'équipe ToolJet.
:::

### Étapes du retour en arrière

#### Étape 1 : Prendre un instantané (snapshot) de votre instance de base de données

Avant de commencer la mise à niveau, prenez un instantané de votre instance de base de données afin de pouvoir la restaurer si un retour en arrière s'avère nécessaire par la suite. Notez également la version depuis laquelle vous effectuez la mise à niveau, afin de savoir exactement à quelle version revenir si besoin.

:::info
Si votre base de données est déployée en tant que conteneur aux côtés de ToolJet plutôt qu'en tant que base de données externe, le processus d'instantané et de restauration sera différent. Contactez votre équipe d'infrastructure pour obtenir de l'aide à ce sujet.
:::

1. Accédez à **RDS Console** → **Databases**
2. Sélectionnez votre instance de base de données
3. Cliquez sur **Actions** → **Take snapshot**
   <img className="screenshot-full img-full" src="/img/setup/infra-level-rollback/take-snapshot-dropdown.png" alt="RDS Actions menu with Take snapshot option" />
4. Saisissez un nom d'instantané, par exemple : `pre-upgrade-snapshot-YYYYMMDD`
5. Cliquez sur **Take snapshot**
   <img className="screenshot-full img-full" src="/img/setup/infra-level-rollback/snapshot-created.png" alt="RDS snapshot successfully created" />

Si PG_DB et TOOLJET_DB sont hébergées sur des instances distinctes, répétez cette opération pour chaque instance.

#### Étape 2 : Revenir en arrière sur le déploiement ToolJet

<Tabs>
  <TabItem value="docker-compose" label="Docker Compose" default>

1. Ouvrez votre fichier `docker-compose.yaml` et mettez à jour la balise `image` du service `tooljet` (et `tooljet-worker-1`, si présent) avec la version précédente, par exemple :
   ```yaml
   image: tooljet/tooljet:v3.20.200-lts
   ```
   <img className="screenshot-full img-full" src="/img/setup/infra-level-rollback/rollback-compose-tag.png" alt="docker-compose.yaml with the image tag updated to a previous version" />
2. Récupérez l'ancienne image :
   ```bash
   docker-compose pull
   ```
3. Redémarrez le déploiement avec l'ancienne version :
   ```bash
   docker-compose up -d
   ```

  </TabItem>
  <TabItem value="kubernetes" label="Kubernetes">

1. Mettez à jour le champ `image` dans votre manifeste de déploiement avec la balise de la version précédente.
2. Appliquez le changement :
   ```bash
   kubectl apply -f deployment.yaml
   ```

  </TabItem>
</Tabs>

#### Étape 3 : Restaurer la base de données à partir de l'instantané

1. Accédez à **RDS Console** → **Snapshots**
2. Sélectionnez l'instantané pré-mise à niveau
3. Cliquez sur **Actions** → **Restore snapshot**
4. Configurez les paramètres de la nouvelle instance et cliquez sur **Restore DB instance**
5. Une fois disponible, faites pointer la configuration de base de données de votre déploiement ToolJet vers l'instance restaurée


## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
