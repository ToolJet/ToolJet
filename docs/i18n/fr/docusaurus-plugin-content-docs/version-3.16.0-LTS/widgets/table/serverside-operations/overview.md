---
id: overview
title: Overview
---

Ce guide explique comment effectuer des opérations côté serveur sur un composant table dans ToolJet. La plupart des bases de données prennent en charge les opérations côté serveur, mais l'implémentation spécifique peut varier selon la base de données. Ce guide utilise PostgreSQL comme source de données pour démontrer le processus.

<div style={{paddingTop:'24px'}}>

## Server Side v/s Client Side

Les opérations côté serveur désignent les tâches exécutées sur le serveur, telles que la récupération de données, le filtrage, le tri et la pagination. Les opérations côté serveur utilisent les ressources du serveur, traitant efficacement de grands ensembles de données et garantissant des temps de chargement plus rapides pour les utilisateurs. À l'inverse, les opérations côté client sont effectuées dans le navigateur ou l'application de l'utilisateur, ce qui peut entraîner des problèmes de performance avec de grands ensembles de données, car toutes les données sont d'abord récupérées puis traitées localement. Les opérations côté serveur offrent une meilleure scalabilité et de meilleures performances, en particulier pour les tâches gourmandes en ressources.

### Quand utiliser les opérations côté serveur ?

1. Gestion de grands ensembles de données
2. Sécurité et intégrité des données
3. Logique métier complexe

### Quand utiliser les opérations côté client ?

1. Interactivité en temps réel
2. Réduction de la charge serveur
3. Capacités hors ligne

</div>

<div style={{paddingTop:'24px'}}>

## Opérations prises en charge

Les opérations côté serveur suivantes peuvent être effectuées sur une Table dans ToolJet :

- [Search](/docs/widgets/table/serverside-operations/search/)
- [Sort](/docs/widgets/table/serverside-operations/sort/)
- [Filter](/docs/widgets/table/serverside-operations/filter/)
- [Pagination](/docs/widgets/table/serverside-operations/pagination/)

<img className="screenshot-full img-full" src="/img/widgets/table/serverside-operations/serverside-operations.png" alt="Serverside Operations Present for Table Component in ToolJet" />

</div>
