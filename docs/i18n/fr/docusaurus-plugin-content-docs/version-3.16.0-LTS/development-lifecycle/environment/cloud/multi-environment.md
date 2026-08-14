---
id: multi-environment
title: Multi-Environnement
---

<PlanBadge type="team" />

Les environnements dans ToolJet aident à gérer les différentes étapes du développement d'applications, en garantissant des transitions fluides entre le développement, les tests et la production. Ce guide couvre ce que sont les environnements, leur objectif, et comment ils fonctionnent dans ToolJet.

Les environnements facilitent le développement et le déploiement d'applications sans perturber la production. Ils isolent les modifications, afin que les tests et le débogage puissent se dérouler sans affecter les utilisateurs en direct. Les équipes peuvent collaborer plus efficacement, car les différents environnements leur permettent de travailler de manière indépendante.

### Que sont les Environnements ?

Un environnement dans ToolJet représente un espace de configuration distinct où les **applications**, les **sources** **de** **données** et les **constantes** peuvent être définies et gérées.

Par défaut, ToolJet fournit trois environnements :

- **Développement** : L'environnement de Développement est l'endroit où se déroulent le développement de l'application et les tests initiaux. C'est un espace dédié permettant aux développeurs ToolJet de créer, configurer et expérimenter avec les fonctionnalités de l'application. Les modifications dans cet environnement n'affectent pas les utilisateurs en direct, permettant des mises à jour et un débogage fréquents.
- **Staging** : L'environnement de Staging agit comme un espace de pré-production où les applications subissent des tests approfondis avant le déploiement. Il ressemble étroitement à l'environnement de Production et permet de s'assurer que toutes les fonctionnalités, les performances et les aspects de sécurité fonctionnent comme prévu. Des équipes telles que la QA et les chefs de produit utilisent cet environnement pour valider et approuver les modifications avant de les publier aux utilisateurs finaux.
- **Production** : L'environnement de Production est la version finale et en direct de l'application avec laquelle les utilisateurs finaux interagissent. Cet environnement est stable et optimisé pour la performance après des tests approfondis dans les environnements de Développement et de Staging.

### Prise en Charge Multi-Environnement dans ToolJet

ToolJet propose une gestion des environnements à travers différents composants :

#### Applications

Chaque application dispose d'environnements de développement, de staging et de production. Les développeurs créent l'application dans l'environnement de développement puis la déplacent vers le staging pour les tests. Votre équipe de test peut examiner l'application en staging, et une fois qu'elle est minutieusement testée, vous pouvez la promouvoir en production et la publier auprès de vos utilisateurs finaux.

#### Sources de Données

Les sources de données peuvent être configurées séparément pour chaque environnement, permettant aux applications de se connecter à différentes bases de données ou API selon l'environnement. Cela garantit un accès sécurisé et structuré aux données pertinentes à chaque étape du développement.

#### Constantes

Les constantes telles que les clés API, les identifiants ou d'autres variables de configuration peuvent être définies de manière unique pour chaque environnement. Cela aide à maintenir la sécurité et à éviter les erreurs de configuration entre les différentes étapes de déploiement.

### Cycle de Vie de l'Application

Le cycle de vie de l'application dans ToolJet implique la gestion des applications à travers différents environnements : développement, staging et production. Vous pouvez créer l'application dans l'environnement de développement et la promouvoir vers le staging pour les tests. Après les tests, vous pouvez la promouvoir en production et publier l'application pour vos utilisateurs finaux.

Vous pouvez configurer les sources de données et les constantes pour chaque environnement, et ToolJet utilisera automatiquement celles qui correspondent à l'environnement cible.

- **Développement** – Les développeurs créent et testent l'application dans l'App Builder de ToolJet.
- **Staging** – L'équipe de test ou de produit valide les exigences et teste l'application avec les données de staging. Les applications et les requêtes ne peuvent pas être modifiées dans cet environnement.
- **Production** – Après des tests approfondis en staging, l'application est promue en production. Cela peut servir d'environnement de pré-publication où vous testez avec les données et constantes de production avant de publier l'application aux utilisateurs finaux. Consultez la documentation [Publication](/docs/development-lifecycle/release/release-rollback) pour en savoir plus.

<img className="screenshot-full img-l" src="/img/development-lifecycle/environments/cloud-env.png" alt="self-hosted-env-concept" />

## Permissions d'Environnement

### Permission d'Accès à l'Environnement {#environment-access-permission}

L'administrateur peut configurer l'accès aux environnements pour les groupes d'utilisateurs ou les rôles depuis la page [Contrôle d'Accès Granulaire](/docs/user-management/role-based-access/access-control#granular-access-control).  
L'accès à l'environnement détermine l'environnement dans lequel l'utilisateur peut accéder à l'application, tandis que la permission d'application de l'utilisateur (Édition ou Vue) détermine ce qu'il peut faire à l'intérieur de cet environnement.

L'accès final est déterminé par les deux : la Permission d'Application (Édition/Vue) et l'Accès à l'Environnement.

| Environnement                 | Permission d'Édition                                                                                                                                      | Permission de Vue                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Environnement de Développement** | L'utilisateur peut visualiser et modifier l'application dans l'Environnement de Développement                                                                                    | L'utilisateur peut prévisualiser l'application dans l'Environnement de Développement mais ne peut pas modifier l'application |
| **Environnement de Staging**     | L'utilisateur peut accéder à l'application dans l'Environnement de Staging, exécuter des requêtes depuis le Panneau de Requêtes, et inspecter l'application à l'aide de l'outil Inspector de ToolJet | L'utilisateur peut uniquement prévisualiser l'application dans l'Environnement de Staging                                |
| **Environnement de Production**  | L'utilisateur peut accéder à l'application en Production, exécuter des requêtes depuis le Panneau de Requêtes, et inspecter l'application à l'aide de l'outil Inspector de ToolJet          | L'utilisateur peut uniquement prévisualiser l'application dans l'Environnement de Production                             |
| **Aucun Environnement**          | L'utilisateur peut ouvrir l'application dans n'importe quel environnement                                                                                                     | L'utilisateur peut prévisualiser l'application dans n'importe quel environnement                                         |

#### Priorité des Permissions

Un même groupe peut avoir plusieurs permissions attribuées pour une application et ses environnements. Dans ce cas, ToolJet combine ces permissions, et **la permission d'Édition a toujours priorité sur la permission de Vue**.

Cela signifie :

- Si un groupe accorde à la fois la permission de Vue et d'Édition pour une application, l'utilisateur obtient la permission d'Édition.
- Si un groupe accorde un accès en Édition dans au moins un environnement et un accès en Vue dans d'autres, l'utilisateur reçoit une permission de niveau Édition pour l'application globalement et peut accéder à tous les environnements attribués à ce groupe.
- Si aucun environnement n'est spécifié, la permission s'applique par défaut à tous les environnements.

#### Exemples

Les exemples suivants illustrent comment différentes combinaisons de permissions d'application, d'accès aux environnements et de rôles par défaut déterminent les permissions finales d'un utilisateur :

1. **Builder avec plusieurs permissions dans le même groupe**  
   Si un utilisateur reçoit à la fois les permissions de Vue et d'Édition pour une application au sein du même groupe, l'Édition a priorité. Si l'accès à l'environnement est explicitement limité au Staging, l'utilisateur peut ouvrir l'application en Staging et exécuter des requêtes, mais ne peut pas modifier l'interface ou les requêtes. Il n'aura pas accès au Développement ou à la Production.

2. **Builder avec des permissions se chevauchant entre plusieurs groupes**  
   Lorsqu'un utilisateur appartient à plusieurs groupes, ToolJet combine les permissions. L'Édition prime sur la Vue, et l'accès aux environnements devient l'union des environnements attribués entre les groupes. Si le Staging est le seul environnement spécifié, l'utilisateur peut ouvrir et exécuter des requêtes en Staging mais ne peut pas accéder aux autres environnements.

3. **Builder (rôle par défaut) sans environnement spécifié**  
   Si aucun accès à l'environnement n'est explicitement défini, la permission s'applique par défaut à tous les environnements. Un Builder avec la permission d'Édition peut modifier l'application en Développement et peut ouvrir et exécuter des requêtes en Staging et en Production, mais ne peut pas modifier l'interface ou les requêtes dans ces environnements.

4. **Utilisateur Final (rôle par défaut)**  
   Un Utilisateur Final dispose par défaut de la permission de Vue et ne peut accéder qu'à l'application de Production publiée. Il ne peut pas accéder au Développement ou au Staging à moins d'avoir explicitement reçu un accès de prévisualisation.

5. **Utilisateur Final avec accès de prévisualisation explicite**  
   Si un Utilisateur Final reçoit l'accès aux environnements de Développement et de Staging, il peut prévisualiser l'application dans ces environnements mais ne peut pas la modifier. Il n'aura pas accès à la Production à moins que l'application ne lui soit publiée.

### Permission de Promotion d'Application

L'administrateur peut configurer la permission de Promotion d'Application depuis la page [Permissions](/docs/user-management/role-based-access/user-roles#permissions-for-user-roles). Cela désactive le bouton **Promote** pour les utilisateurs ne disposant pas de la permission requise, permettant uniquement aux rôles autorisés, tels que les chefs d'équipe, de promouvoir l'application d'un environnement à un autre. Dans l'exemple ci-dessous, l'utilisateur n'a pas la permission d'effectuer une publication. Par conséquent, le bouton Release est désactivé et ne peut pas être utilisé.

<img className="screenshot-full img-m" src="/img/development-lifecycle/release/release/draft-version/disable-release.png" alt="Disable Release"/>

### Actions sur les Versions par Environnement

Chaque environnement a un impact différent sur votre application. Veuillez consulter le tableau suivant pour plus de détails.

| Action              | Développement              | Staging | Production |
| ------------------- | ------------------------ | ------- | ---------- |
| Modifier les versions       | ✅ (versions brouillon uniquement) | ❌      | ❌         |
| Renommer les versions     | ✅ (versions brouillon uniquement) | ❌      | ❌         |
| Supprimer les versions     | ✅                       | ✅      | ✅         |
| Créer de nouvelles versions | ✅                       | ✅      | ✅         |

Consultez le guide [Environment-Example](/docs/development-lifecycle/environment/self-hosted/example-configuration) pour découvrir le multi-environnement dans ToolJet à travers un exemple pratique.
