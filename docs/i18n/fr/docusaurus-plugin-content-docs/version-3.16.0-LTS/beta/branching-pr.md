---
id: branching-and-pr
title: Branches et pull requests
---

:::warning BETA
Les branches et les pull requests sont actuellement en beta et ne sont pas recommandées pour un usage en production.
:::

Le branching permet à plusieurs développeurs de travailler sur des copies isolées de la même application. Chaque développeur dispose de sa propre branche où les modifications restent séparées de l'application en production jusqu'à ce qu'elles soient explicitement fusionnées via une pull request. Cela permet de protéger la qualité de la production grâce à des revues de code obligatoires avant la mise en ligne des changements, et fournit un historique complet des modifications via l'intégration Git, rendant chaque modification traçable et réversible.

Vous pouvez tirer parti du branching lorsque :
- Plusieurs développeurs travaillent simultanément sur la même application.
- Vous avez besoin de workflows formels de revue et d'approbation avant que les changements n'atteignent la production.
- Le suivi des modifications et l'auditabilité sont des exigences organisationnelles.

## Comprendre les branches et les versions

### Branche master et sous-branches

Votre application dispose de deux types de branches :

- **Branche master** : la branche principale contenant votre application en production et son historique de développement linéaire. La branche master est verrouillée. Les changements ne peuvent y entrer que via des pull requests approuvées, jamais par des modifications directes.
- **Sous-branches** : des copies indépendantes créées à partir de la branche master, où vous effectuez des modifications librement. Chaque sous-branche est isolée jusqu'à sa fusion vers master.

### Les versions comme tags

Les versions n'existent que sur la branche master et agissent comme des tags marquant des points stables dans le développement de votre application. Lorsque vous enregistrez une version, ToolJet crée automatiquement un tag correspondant sur votre fournisseur Git, rendant chaque jalon traçable dans votre dépôt.

- **Version brouillon (Draft)** : l'état de travail actuel sur master. Un seul brouillon peut être actif à la fois. C'est là que les changements fusionnés arrivent avant d'être finalisés.
- **Version enregistrée (Saved)** : un jalon finalisé et verrouillé, automatiquement commité et taggé dans Git. Aucune modification supplémentaire n'est autorisée sur une version enregistrée.
- **Version publiée (Released)** : une version enregistrée qui a été promue à travers les environnements et déployée en production.

Les sous-branches n'ont pas de versions. Elles sont des copies de travail d'une version spécifique.

**Exemple** : vous créez une application et commencez à la construire sur une sous-branche. Après avoir fusionné vos modifications dans master, vous récupérez (pull) les changements vers *v1*. Lorsque vous l'enregistrez, ToolJet commite et crée un tag `<appname>/v1` dans Git. Vous promouvez ensuite _v1_ à travers les environnements de staging et de production. Plus tard, vous créez un nouveau brouillon _v2_ à partir de _v1_ pour poursuivre le développement. _v1_ reste verrouillée et taggée dans Git comme point de référence.

## Configurer le branching

Pour activer le branching, vous devez d'abord configurer Git Sync. Suivez le [guide Git Sync](/docs/development-lifecycle/gitsync/overview) pour le configurer. Une fois Git Sync configuré, le branching est activé par défaut (uniquement pendant la beta). Spécifiez le nom de votre branche par défaut (généralement « master » ou « main »). Celle-ci devient votre branche master où résident les applications en production.

:::warning
ToolJet ne prend en charge le branching **que via Git HTTPS**. SSH n'est pas encore pris en charge.
:::

## Utiliser Git Sync sur plusieurs instances

Si vous exécutez des instances ToolJet distinctes pour différents environnements (par exemple, une pour le développement, une autre pour le staging ou la production), vous pouvez les connecter au même dépôt Git. Git agit comme le pont entre les instances. Les changements enregistrés et taggés sur une instance peuvent être récupérés (pull) dans une autre.

Par exemple :
- **Instance de développement** : les développeurs créent des branches, construisent des fonctionnalités, commitent des changements et fusionnent des pull requests. Les versions enregistrées sont automatiquement taggées dans Git.
- **Instance de staging/production** : récupérez (pull) les versions enregistrées depuis Git pour les déployer et les publier. Aucun export ou import manuel n'est nécessaire.

Cela vous permet d'appliquer une séparation des environnements au niveau de l'infrastructure tout en maintenant toutes les instances synchronisées via un seul dépôt Git.

:::info
Pour décider si une configuration à instance unique ou multi-instances convient à votre organisation, consultez [Choisir la configuration de votre instance](/docs/tj-setup/instances#choosing-your-instance-setup).
:::

## Créer et gérer des branches

### Créer une nouvelle branche

1. Ouvrez votre application.
2. Cliquez sur le menu déroulant des branches dans la navigation supérieure.
3. Sélectionnez **+ Create New Branch**. <br/><br/>
    <img className="screenshot-full img-l" src="/img/development-lifecycle/branching/new-branch-modal.png" alt="Create new branch modal" /><br/><br/>
4. Saisissez un nom de branche descriptif. <br/><br/>
    <img className="screenshot-full img-s" src="/img/development-lifecycle/branching/branch-name-modal.png" alt="Branch name input" /><br/><br/>
5. Choisissez la version à partir de laquelle créer la branche (généralement le brouillon actuel).
6. Cliquez sur **Create Branch**.

Votre nouvelle branche est immédiatement disponible dans ToolJet et automatiquement synchronisée avec Git.

### Basculer entre les branches

1. Cliquez sur le menu déroulant des branches dans la navigation supérieure, puis cliquez sur **Switch Branch**. <br/><br/>
    <img className="screenshot-full img-l" src="/img/development-lifecycle/branching/switch-branch.png" alt="Switch branch dropdown" /><br/><br/>
2. Sélectionnez la branche vers laquelle basculer.
3. Toutes vos modifications s'appliquent désormais à la branche sélectionnée.

## Travailler avec les pull requests

Les pull requests permettent de faire passer les changements des sous-branches vers la branche master. Toute la gestion des pull requests se fait dans votre fournisseur Git (GitHub, GitLab, etc.).

### Commiter des changements dans Git

Vous ne pouvez commiter des changements que sur les sous-branches (master est verrouillée) :

1. Effectuez vos modifications dans ToolJet.
2. Cliquez sur le bouton **Commit** dans la navigation supérieure.
3. Ajoutez un message de commit décrivant vos modifications.

    <img className="screenshot-full img-s" src="/img/development-lifecycle/branching/commit-changes.png" alt="Commit changes modal" />
4. Cliquez sur **Commit Changes**.

Vos modifications sont commitées sur la branche actuelle dans Git.

### Récupérer des changements depuis Git

Pour récupérer (pull) des changements sur la branche master :

1. Assurez-vous d'être sur la branche master avec une version brouillon active.
2. Cliquez sur **Pull Commit**.
3. Le brouillon actuel sera remplacé par le contenu provenant de Git.

### Créer une pull request

Les pull requests sont créées et fusionnées dans votre fournisseur Git. Tous les changements doivent être commités dans Git pour maintenir votre application synchronisée.

1. **Commitez les modifications de votre branche** :
    Cliquez sur le bouton **Commit** dans la navigation supérieure, ajoutez un message de commit, puis cliquez sur **Commit Changes**.

    <img className="screenshot-full img-s" src="/img/development-lifecycle/branching/commit-changes.png" alt="Commit changes modal" />
2. **Créez une pull request** :
    Cliquez sur le nom de la branche dans la barre de navigation, puis cliquez sur **Create pull request**.

    <img className="screenshot-full img-m" src="/img/development-lifecycle/branching/pr-button.png" alt="Create pull request button" />
   Vous serez redirigé vers votre fournisseur Git où certains champs seront pré-remplis. Modifiez-les si nécessaire ou créez directement la PR.
3. **Révisez et fusionnez** :
    Ajoutez des relecteurs et une description, soumettez pour révision, traitez les retours ou les conflits éventuels, puis demandez à l'approbateur de fusionner la pull request.
4. **Récupérez les changements fusionnés dans master** :
    Basculez vers la branche master, créez une version brouillon, puis cliquez sur **Pull Commit**. Les changements fusionnés remplacent le brouillon actuel.

## Scénarios courants

### Créer votre première version publiée

**Scénario** : vous avez construit une nouvelle application et devez publier la version 1.

1. Créez votre application (la branche master et le brouillon v1 sont créés automatiquement).
2. Créez une sous-branche à partir du brouillon v1 (par exemple, _developer/initial-build_).
3. Développez votre application sur la branche.
4. Commitez vos modifications dans Git.
5. Dans Git : créez une pull request, obtenez l'approbation, puis fusionnez vers master.
6. Dans ToolJet : récupérez (pull) depuis Git vers la branche master.
7. Enregistrez le brouillon v1 en tant que version v1 (commit automatique dans Git).
8. Promouvez v1 vers le staging pour les tests.
9. Promouvez v1 vers la production.
10. Publiez v1.

### Développement en parallèle

**Scénario** : deux développeurs doivent travailler sur des fonctionnalités différentes en même temps.

1. Le développeur A crée la branche _johnson/inventory_ à partir du master actuel.
2. Le développeur B crée la branche _taylor/search_ à partir du master actuel.
3. Les deux développeurs travaillent indépendamment et commitent leurs modifications.
4. Dans Git :
    - Les deux créent des pull requests vers master.
    - Résolvez les conflits de fusion éventuels.
    - Le manager approuve et fusionne les deux PR vers master.
5. Dans ToolJet :
    - Créez le brouillon v2 à partir de v1 (si aucun brouillon actif n'existe).
    - Récupérez (pull) les changements depuis Git vers le brouillon v2.
    - Enregistrez v2 en tant que version.
    - Promouvez et publiez v2.

## Créer et enregistrer des versions

### Créer des versions brouillon

Les versions brouillon ne peuvent être créées que sur la branche master. Un seul brouillon peut être actif à la fois.

1. Basculez vers la branche master.
2. Cliquez sur le menu déroulant des versions et sélectionnez **Create Draft**.
3. Sélectionnez la version à partir de laquelle créer le brouillon.
4. Cliquez sur **Create**.

### Enregistrer des versions

Lorsque vous enregistrez un brouillon, il devient un jalon verrouillé :

1. Basculez vers la branche master avec un brouillon actif.
2. Cliquez sur **Save Version**.
3. Saisissez un numéro de version (par exemple, v2, v2.1).
4. Cliquez sur **Save**.

La version est automatiquement commitée dans Git. Une fois enregistrée, aucun nouveau commit n'est autorisé sur cette version. Les versions enregistrées représentent des jalons terminés.

<!-- ### Closing Branches
Branches can only be closed in your Git provider, not in ToolJet:
1. In Git: Close the branch (merged or unmerged)
2. In ToolJet: Pull from Git or refresh to sync status
3. Closed branches appear with closed status
4. No further edits allowed on closed branches

### Importing Applications with Branching

When importing an application from Git with branching enabled:
1. Navigate to Create New → Import from Git
2. Select your repository
3. Choose the application
4. Click Import

All open branches from Git are imported into ToolJet with branching structure intact. -->

<!-- ## Important Notes -->

<!-- ### Auto-Commit Behavior
- Branching Enabled: Auto-commit on save is required and cannot be disabled
- Branching Disabled: Auto-commit can be toggled on or off 

When auto-commit is enabled, saving a draft version automatically pushes it to Git. -->

## Autorisations sur les branches

| Action | Branche master | Sous-branche |
|--------|---------------|------------|
| Modifications directes | ❌ Uniquement via PR | ✅ Oui |
| Push vers Git | ❌ Non nécessaire | ✅ Oui | 
| Pull depuis Git | ✅ Brouillon uniquement | ✅ Branches ouvertes | 
| Renommer | ❌ Git uniquement | ❌ Git uniquement | 
| Fermer | ❌ Jamais | ❌ Git uniquement |


<!-- ### Conflict Resolution

All merge conflicts must be resolved in Git or your CLI before merging:
1. Pull request shows conflicts in Git
2. Resolve conflicts using Git tools or command line
3. Commit resolved changes
4. Complete the merge in Git
5. Pull merged result into ToolJet -->

<!-- ### Best Practices

**Branch Naming**: Use descriptive names with developer identifier
- ✅ nechal/inventory-feature
- ✅ taylor/search-fix
- ❌ test-branch
- ❌ updates

**Commit Messages**: Write clear, action-oriented messages
- ✅ "Add inventory filtering to dashboard"
- ✅ "Fix search query timeout issue"
- ❌ "updates"
- ❌ "changes" -->
