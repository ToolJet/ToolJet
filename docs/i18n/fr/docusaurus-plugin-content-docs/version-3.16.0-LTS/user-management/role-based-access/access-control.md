---
id: access-control
title: Access Control
---

ToolJet vous permet de gérer le contrôle d'accès en configurant des permissions telles que la création et la suppression. Le contrôle d'accès peut être appliqué à toutes vos ressources telles que les apps, les sources de données et les workflows. De plus, ToolJet prend en charge un contrôle d'accès granulaire, vous permettant de configurer des permissions pour des ressources individuelles afin d'assurer une gestion précise et sécurisée.

## Permissions

Les permissions suivantes peuvent être configurées pour les ressources indiquées :
| Ressource | Permission | Description |
|:---------|:-----------|:------------|
| **Apps** | Create | Permet aux utilisateurs du groupe de créer de nouvelles applications au sein du workspace. |
| | Delete | Permet aux utilisateurs du groupe de supprimer des applications du workspace. |
| | Promote | Permet aux utilisateurs du groupe de promouvoir les applications d'un environnement à un autre. |
| | Release | Permet aux utilisateurs du groupe de publier les applications depuis l'environnement de production. |
| **Data sources** | Create | Permet aux utilisateurs du groupe d'ajouter de nouvelles sources de données dans le workspace. |
| | Delete | Permet aux utilisateurs du groupe de supprimer des sources de données du workspace. |
| **Modules** | Create | Permet aux utilisateurs du groupe de créer de nouveaux modules au sein du workspace. Cela inclut le clonage et l'importation de modules. |
| | Delete | Permet aux utilisateurs du groupe de supprimer des modules du workspace. Cette action est bloquée si le module est utilisé dans une app. |
| **Folder** | Create/Delete | Permet aux utilisateurs du groupe de créer ou de supprimer des dossiers pour organiser les ressources. |
| **Workspace constants/variables** | Create/Update/Delete | Permet aux utilisateurs du groupe de définir, modifier ou supprimer des constantes et des variables utilisées à travers le workspace. |
| **Workflows** | Create | Permet aux utilisateurs du groupe de créer de nouveaux workflows au sein du workspace. |
| | Delete | Permet aux utilisateurs du groupe de supprimer des workflows du workspace. |

Pour configurer l'accès en lecture ou en édition, veuillez consulter le **[Contrôle d'accès granulaire](#granular-access-control)**.

:::info
Si un utilisateur dispose de la permission de création et crée une ressource, cet utilisateur en devient le propriétaire et dispose par défaut de toutes les permissions associées. <br/>
Par exemple, si un utilisateur crée une source de données A, alors par défaut, il aura l'accès configuration et build pour la source de données A.
:::

### Configuration des permissions

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace Settings** > **Groups**. <br/>
    (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Sélectionnez le groupe pour lequel configurer les permissions.

4. Passez à l'onglet **Permissions** et configurez les permissions requises.
    <img className="screenshot-full img-full" src="/img/user-management/rbac/access-control/workflow_config.png" alt="Create Custom Group" />


## Contrôle d'accès granulaire {#granular-access-control}

Dans ToolJet, vous pouvez définir un contrôle d'accès de niveau granulaire pour les apps, les sources de données et les modules, en configurant des permissions telles que l'accès en lecture ou en édition, afin de gérer qui peut interagir avec les ressources de votre workspace. Vous pouvez appliquer les permissions soit à toutes les ressources (par exemple, toutes les apps ou toutes les sources de données), soit à des ressources spécifiques sélectionnées, offrant ainsi flexibilité et précision dans la gestion des accès. <br/>
Pour configurer le contrôle d'accès granulaire, vous devez créer des groupes personnalisés. Consultez le guide **[groupes personnalisés](/docs/user-management/role-based-access/custom-groups)** pour plus d'informations.

### Apps

- **Edit** : Accorde l'accès en édition aux apps sélectionnées. Avec cet accès, les utilisateurs peuvent construire ou modifier les apps pour lesquelles ils ont un accès accordé. Cette permission doit être attribuée aux builders ou développeurs.

- **View** : Avec l'accès View, les utilisateurs peuvent prévisualiser l'application dans les environnements de développement et de staging, et accéder à la version publiée dans l'environnement de production. Ce niveau d'accès ne permet pas aux utilisateurs de modifier l'application. Il est le plus adapté aux utilisateurs finaux, testeurs, ou consommateurs qui ont uniquement besoin de consulter ou d'utiliser l'app.

    :::note 
    Pour les utilisateurs finaux, l'accès en prévisualisation est spécifique à l'environnement. Par défaut, les utilisateurs finaux ne peuvent accéder qu'à l'app publiée (Released). Pour autoriser l'accès en prévisualisation dans Development ou Staging, l'environnement correspondant doit être explicitement sélectionné sous **Workspace settings > Groups > End-user > Granular access > Environment**.
    :::


- **Hide from dashboard** : Masque les apps sélectionnées du tableau de bord, les rendant accessibles uniquement via URL. Cette permission s'applique à la fois à l'accès **View** et **Edit** ; ainsi, si elle est activée pour un groupe, les utilisateurs disposant de l'accès Edit (builders) ne verront eux non plus pas l'app sur le tableau de bord, en plus des utilisateurs disposant de l'accès View. L'app reste accessible via son URL pour les deux.

- **Environment** : Grâce aux permissions de niveau environnement, l'accès à chaque environnement peut être restreint selon les groupes ou rôles d'utilisateurs. Par exemple, les membres d'un groupe personnalisé *Developer* peuvent se voir accorder l'accès uniquement à l'environnement *Development*. Vous pouvez appliquer ces permissions à des apps spécifiques ou à l'ensemble des apps.
    Consultez [cette documentation](/docs/development-lifecycle/environment/cloud/multi-environment#environment-access-permission) pour en savoir plus sur les permissions d'accès aux environnements.

- **All apps** : Fournit l'accès sélectionné (Edit ou View) à toutes les apps du workspace, y compris toute nouvelle app créée.

- **Custom** : Fournit l'accès sélectionné (Edit ou View) uniquement aux apps spécifiées.



    <img className="screenshot-full img-m" src="/img/user-management/rbac/access-control/app-permission-v2.png" alt="Create Custom Group" />

### Data Sources

- **Configure** : Les utilisateurs du groupe peuvent accéder et modifier les détails de configuration des sources de données sélectionnées. Cette permission doit être accordée aux utilisateurs admin qui doivent configurer la source de données.

- **Build with** : Les utilisateurs du groupe peuvent utiliser les sources de données sélectionnées dans les apps et workflows pour créer des requêtes. Cette permission doit être accordée aux builders ou développeurs qui créeront les requêtes pour les apps ou workflows.

- **All data sources** : Fournit l'accès sélectionné (Configure ou Build with) à toutes les sources de données du workspace, y compris toute nouvelle source de données créée.

- **Custom** : Fournit l'accès sélectionné (Configure ou Build with) uniquement aux sources de données spécifiées.

    <img className="screenshot-full img-m" src="/img/user-management/rbac/access-control/ds-permission.png" alt="Create Custom Group" />

### Modules

- **Edit** : Accorde l'accès pour ouvrir et modifier le module builder. Les utilisateurs disposant de cet accès peuvent construire, renommer et exporter le module. Cette permission doit être accordée aux builders ou développeurs qui possèdent ou maintiennent le module.

- **Build with** : Les utilisateurs du groupe peuvent utiliser les modules sélectionnés dans les apps qu'ils construisent. Les modules disposant uniquement de l'accès Build with sont affichés dans le tableau de bord dans un état verrouillé, en lecture seule, permettant aux builders de consulter les éléments internes du module (requêtes, composants, logique) pour le comprendre ou le déboguer, sans pouvoir y apporter de modifications.

    :::info
    Il n'existe pas de permission **View** distincte pour les modules. Les modules ne peuvent pas être accédés indépendamment d'une app ; les utilisateurs finaux héritent donc toujours de l'accès à un module via leur accès à l'app dans laquelle il est utilisé — aucune permission de module supplémentaire n'a besoin d'être configurée pour les utilisateurs finaux.
    :::

- **Hide from dashboard** : Masque les modules sélectionnés du tableau de bord et des résultats de recherche, les rendant accessibles uniquement via URL pour les utilisateurs disposant de l'accès Build with. Cela n'affecte pas la section **Module** du panneau de la bibliothèque de composants dans l'App Builder — les builders disposant de l'accès Build with peuvent toujours y trouver et ajouter un module masqué à leurs apps.

- **All modules** : Fournit l'accès sélectionné (Edit ou Build with) à tous les modules du workspace, y compris tout nouveau module créé.

- **Custom** : Fournit l'accès sélectionné (Edit ou Build with) uniquement aux modules spécifiés.

    :::note
    Si un module a déjà été ajouté à une app par un autre builder, tout builder disposant d'un accès à cette app peut modifier les propriétés et les styles du module, ainsi que le déplacer, le redimensionner ou le supprimer sur le canevas, même sans disposer de l'accès Edit ou Build with sur ce module. En revanche, il ne peut pas ouvrir le module builder pour consulter ou modifier sa logique interne.
    :::

### Workflows
- **Build** : Les utilisateurs de ce groupe peuvent construire ou modifier les workflows pour lesquels ils disposent d'un accès accordé.
- **Execute** : Les utilisateurs de ce groupe peuvent exécuter les workflows sélectionnés. Cet accès ne permet pas aux utilisateurs de modifier ou d'apporter des changements aux workflows.
- **All workflows** : Fournit l'accès sélectionné (Build ou Execute) à tous les workflows du workspace, y compris tout nouveau workflow créé.
- **Custom** : Fournit l'accès sélectionné (Build ou Execute) uniquement aux workflows spécifiés.

<img className="screenshot-full img-m" src="/img/user-management/rbac/access-control/workflow.png" alt="Create Custom Group" />

### Folders

:::warning BETA
Les permissions de dossier sont actuellement en beta et ne sont pas recommandées pour un usage en production.
:::

Les permissions au niveau des dossiers vous permettent de contrôler qui peut accéder et travailler sur des groupes d'applications à la fois. Par exemple, si votre workspace comporte des centaines d'apps organisées par équipe, vous pouvez accorder à chaque équipe l'accès approprié à son dossier plutôt que de définir des permissions pour chaque app individuellement. Tous les utilisateurs du groupe obtiennent automatiquement l'accès approprié à chaque app qu'il contient.

- **Edit Folder** : Les utilisateurs du groupe peuvent renommer le dossier et y ajouter ou en retirer des apps. Cet accès accorde également par défaut les permissions Edit Apps et View Apps pour toutes les apps du dossier.

- **Edit Apps** : Les utilisateurs du groupe peuvent modifier les apps au sein du dossier. Cet accès accorde également par défaut la permission View Apps pour toutes les apps du dossier.

- **View Apps** : Les utilisateurs du groupe peuvent consulter et lancer les apps au sein du dossier. Ils ne peuvent ni modifier les apps ni apporter de changements au dossier.

- **All folders** : Fournit l'accès sélectionné à tous les dossiers du workspace, y compris tout nouveau dossier créé.

- **Custom** : Fournit l'accès sélectionné uniquement aux dossiers spécifiés.

    :::info
    Les permissions de dossier s'appliquent à tous les environnements.
    :::

    <img className="screenshot-full img-m" src="/img/user-management/rbac/access-control/folder-permissions.png" alt="Folder Permissions" />

### Configuration des permissions d'accès granulaire

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace Settings** > **Groups**. <br/>
    (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Sélectionnez le groupe pour lequel configurer les permissions d'accès granulaire.

4. Passez à l'onglet **Granular access** et cliquez sur le bouton **+ Add permission**.

5. Sélectionnez la ressource (Apps/Data source/Modules) selon le besoin. Donnez un nom à la permission, configurez la permission requise et cliquez sur **Add** en bas de la fenêtre modale.

    <img className="screenshot-full" src="/img/user-management/rbac/access-control/select-resource.png" alt="Create Custom Group" />

