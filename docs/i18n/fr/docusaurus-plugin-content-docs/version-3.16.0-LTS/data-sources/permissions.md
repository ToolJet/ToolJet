---
id: permissions
title: Autorisations des sources de données
---

Les Admins et Super Admins peuvent configurer diverses autorisations pour une source de données au sein d'un workspace. Pour plus de détails sur les autres autorisations et le contrôle d'accès, consultez le guide **[Access Control](/docs/user-management/role-based-access/access-control#data-sources)**.

## Autorisations

### Création et suppression des sources de données

| Autorisation | Description |
|:---|:---|
| **Create** | Ajouter de nouvelles sources de données et modifier celles existantes. Le bouton de suppression ne sera pas visible au survol de la source de données connectée. |
| **Delete** | Supprimer les sources de données connectées du workspace. Le bouton de suppression apparaîtra au survol de la source de données connectée. |
| **Create and Delete** | Ajouter de nouvelles sources de données et supprimer les sources de données connectées du workspace. |
| **Neither Create nor Delete** | Aucun accès à la page Data Sources depuis le Dashboard. Un message d'erreur (toast) apparaîtra en cas de tentative d'accès à la page Data Sources via l'URL. |

### Autorisations de la base de données ToolJet

| Autorisation | Description |
|:---|:---|
| **Create/Update/Delete** | Permet aux utilisateurs d'effectuer toutes les opérations d'écriture sur les tables de la base de données ToolJet, y compris la création, la mise à jour et la suppression d'enregistrements. |

<img style={{marginBottom:'15px'}} className = "screenshot-full img-l" src="/img/datasource-reference/overview/permissions-v2.png" alt="Data Sources: Overview" />

:::note
L'autorisation **Create/Update/Delete** peut être attribuée à n'importe quel groupe d'utilisateurs, y compris les groupes personnalisés. Les Admins et Super Admins du workspace peuvent configurer cette autorisation depuis **Workspace Settings > Groups**.
:::

### Configurer ou développer avec des sources de données

| Autorisation | Description |
|:---|:---|
| **Build with** | Se connecter aux sources de données autorisées pour leur groupe d'utilisateurs. Les utilisateurs ne peuvent pas mettre à jour les identifiants des sources de données autorisées. | 
| **Configure** | Les utilisateurs peuvent mettre à jour les identifiants des sources de données autorisées. |

<img className="screenshot-full img-m" src="/img/datasource-reference/overview/ds-granular.png" alt="Data Sources: Overview" />
