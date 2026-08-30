---
id: connection-method
title: Choisissez votre méthode de connexion
---

Lorsque vous connectez votre application ToolJet à un dépôt Git, vous avez le choix entre deux méthodes de connexion : SSH et HTTPS. Chaque méthode présente ses propres avantages et considérations qui peuvent la rendre plus adaptée à votre entreprise.


Le tableau ci-dessous propose une comparaison entre les méthodes de connexion SSH et HTTPS pour vous aider à choisir celle qui convient le mieux à vos besoins :

| Fonctionnalité | HTTPS | SSH |
|---------|-----|-------|
| **Type de connexion** |  Connexion Git individuelle (nous ne prenons actuellement en charge que [GitHub](/docs/development-lifecycle/gitsync/connect-to-git-repo/github-config) et [GitLab](/docs/development-lifecycle/gitsync/connect-to-git-repo/gitlab-config))  | Connexion unique qui fonctionne avec n'importe quel fournisseur Git. (Exemple : [GitHub](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#github), [Gitea](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#gitea), [GitLab](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#gitlab), etc.)  |
| **Blocage de port** | Aucun problème de blocage de port  | Peut rencontrer des problèmes de blocage de port dus au pare-feu  |
| **Configuration des branches** | Peut être configurée directement depuis l'interface ToolJet | Peut être configurée directement depuis l'interface ToolJet |
| **Branche par défaut** | main | main |

ToolJet vous permet de configurer plusieurs dépôts Git. Cependant, une seule configuration peut être active à un moment donné pour un espace de travail. Lors du passage d'une configuration à une autre, la configuration précédemment active sera automatiquement désactivée.

Choisissez la méthode de connexion qui correspond le mieux à vos exigences de sécurité, à votre environnement réseau et à la façon dont vous préférez gérer vos applications ToolJet avec Git.
