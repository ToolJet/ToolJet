---
id: environments
title: Multi-environnement
---

<PlanBadge type="enterprise" />

Les environnements pour les workflows aident à gérer les différentes étapes du développement des workflows, garantissant des transitions fluides entre le développement, les tests et la production. Ils isolent les modifications afin que les tests et le débogage puissent avoir lieu sans affecter les exécutions de workflow en direct.

Les workflows suivent le même modèle d'environnement que les applications dans ToolJet. Si vous êtes déjà familier avec le multi-environnement pour les applications, les mêmes concepts s'appliquent ici. Consultez le guide **[Multi-environnement](/docs/development-lifecycle/environment/self-hosted/multi-environment)** pour un aperçu général.

## Que sont les environnements ?

Un environnement dans ToolJet représente un espace de configuration distinct où les **workflows**, les **sources de données** et les **constantes** peuvent être définis et gérés indépendamment.

Par défaut, ToolJet fournit trois environnements :

- **Development** : Là où le développement du workflow et les tests initiaux ont lieu. Les développeurs peuvent créer, configurer et modifier les nœuds et la logique du workflow. Les modifications ici n'affectent pas les exécutions en direct.
- **Staging** : Agit comme un espace de préproduction où les workflows sont soumis à des tests approfondis avant le déploiement. Des équipes telles que l'assurance qualité et les chefs de produit utilisent cet environnement pour valider le comportement du workflow avant sa mise à disposition aux utilisateurs finaux.
- **Production** : L'environnement final et en direct où le workflow s'exécute activement et répond aux déclencheurs. Cet environnement est stable et optimisé pour la performance après des tests approfondis en Development et Staging.

## Cycle de vie du workflow à travers les environnements

Le cycle de vie du workflow implique la gestion des versions de workflow à travers le développement, la préproduction et la production. Vous créez et testez le workflow dans l'environnement de développement, le promouvez vers la préproduction pour validation, puis le promouvez vers la production pour la mise en service.

Les sources de données et les constantes peuvent être configurées séparément pour chaque environnement, et ToolJet utilisera automatiquement celles appropriées selon l'environnement cible.

- **Development** - Les développeurs créent et testent le workflow dans l'éditeur de workflow. Les nœuds et la logique peuvent être librement modifiés.
- **Staging** - L'équipe de test ou de produit valide les exigences et teste le workflow en utilisant les sources de données et constantes de préproduction. Les définitions de workflow ne peuvent pas être modifiées dans cet environnement.
- **Production** - Après des tests approfondis en préproduction, le workflow est promu en production. Une fois promu, vous pouvez publier la version pour en faire le workflow actif qui répond à tous les déclencheurs.

## Promouvoir une version de workflow

La promotion déplace une version de workflow enregistrée d'un environnement vers le suivant. Les versions ne peuvent être promues que séquentiellement ; vous ne pouvez pas ignorer d'environnements.

```
Development → Staging → Production
```

Pour promouvoir une version de workflow :

1. Assurez-vous que la version est enregistrée (pas en état de brouillon).
2. Cliquez sur le bouton **Promote** dans la barre d'outils de l'éditeur de workflow.
3. La version sera promue vers l'environnement suivant de la chaîne.

:::warning
Une fois qu'une version de workflow est promue au-delà du développement, sa définition est verrouillée et ne peut pas être modifiée. Pour apporter d'autres modifications, créez une nouvelle version brouillon à partir de la version promue.
:::

## Exécuter des workflows dans des environnements spécifiques

Lors du déclenchement d'un workflow via des webhooks, vous pouvez spécifier dans quel environnement l'exécuter à l'aide de paramètres de requête :

- **`environment`** : Le nom de l'environnement cible (par ex., `staging`, `production`).
- **`version`** : La version spécifique à exécuter.

Le système vérifie que la version spécifiée a été promue vers l'environnement cible avant d'autoriser l'exécution. Une version en développement ne peut pas être exécutée dans un contexte de production.

## Planifications de workflow et environnements

Les planifications de workflow sont liées à des environnements spécifiques. Lors de la création d'une planification, vous spécifiez dans quel environnement l'exécution planifiée doit s'exécuter. Cela garantit que les workflows planifiés utilisent les bonnes sources de données, constantes et version de workflow pour cet environnement.

## Comportement impacté par les permissions d'environnement

Chaque environnement a un impact différent sur votre workflow. Consultez le tableau suivant pour plus de détails.

| Action              | Development | Staging | Production |
| ------------------- | ----------- | ------- | ---------- |
| Modifier les versions       | Oui         | Non      | Non         |
| Renommer les versions     | Oui         | Non      | Non         |
| Supprimer les versions     | Oui         | Non      | Non         |
| Créer de nouvelles versions | Oui         | Non      | Non         |
| Promouvoir             | Oui         | Oui     | -          |

## Permission de promotion de workflow

Les administrateurs peuvent configurer la permission Promote depuis la page [Permissions](/docs/user-management/role-based-access/user-roles#permissions-for-user-roles). Cela désactive le bouton **Promote** pour les utilisateurs qui ne disposent pas de la permission requise, permettant uniquement aux rôles autorisés de promouvoir les workflows d'un environnement à l'autre.

:::info
Sans licence multi-environnement, toutes les versions de workflow restent dans l'environnement de développement. Les fonctionnalités de promotion et d'environnement deviennent disponibles avec le niveau de licence approprié.
:::