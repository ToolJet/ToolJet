---
id: share-app
title: Partager l'application
---

Une fois l'application publiée, elle peut être partagée avec les utilisateurs finaux de plusieurs manières, notamment via une URL directe, via le tableau de bord ToolJet, ou en l'intégrant dans une autre application.

## Partager l'application via une URL

Une fois l'application publiée, elle peut être accédée via une URL, et le slug de l'URL peut être personnalisé. ToolJet propose également une option pour rendre l'application publique ou privée.

- **Application publique** : Permet à toute personne sur Internet d'accéder à l'application sans avoir à s'inscrire sur ToolJet.
- **Application privée** : Les applications privées sont réservées aux utilisateurs de l'espace de travail disposant des **[autorisations d'accès](/docs/user-management/role-based-access/access-control)** nécessaires.

La dernière version publiée de l'application est toujours accessible via la même URL, garantissant un point d'accès cohérent au fil des mises à jour.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/url.png" alt="Share Application Modal"/>

### Authentification pour les URL d'applications autonomes {#authentication-for-standalone-application-urls}

Lorsque les utilisateurs accèdent à une application via une URL autonome, l'ensemble de l'expérience reste dans le contexte de cette application, y compris la connexion, la déconnexion et l'expiration de session.

#### Connexion

Si un utilisateur n'est pas connecté, il verra une page de connexion spécifique à cette application. Par exemple, **« Sign in to [App Name] »** au lieu de la page de connexion générique de l'espace de travail. Après s'être connecté, il est directement dirigé vers l'application.

Toutes les configurations backend telles que les paramètres SSO sont héritées de l'espace de travail, aucune configuration supplémentaire n'est donc requise.

#### Déconnexion et expiration de session

Lorsqu'un utilisateur se déconnecte ou que sa session expire, il est redirigé vers la page de connexion de la même application plutôt que vers la page de connexion de l'espace de travail ou le tableau de bord de l'espace de travail. Cela garantit que les utilisateurs restent toujours dans le contexte de l'application.

:::info
Pour déclencher une déconnexion depuis votre application, utilisez l'action [Logout](/docs/actions/logout).
:::

## Accéder à l'application via le tableau de bord

Les utilisateurs peuvent lancer la version publiée de l'application depuis le tableau de bord. L'application peut également être masquée du tableau de bord pour les utilisateurs finaux. Consultez le guide **[Contrôle d'accès](/docs/user-management/role-based-access/access-control)** pour plus de détails.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/dashboard.png" alt="Access Application via Dashboard"/>

## Intégrer l'application

Les applications ToolJet peuvent être intégrées dans d'autres applications web à l'aide d'iframes. Pour intégrer une application, rendez l'application publique, après quoi ToolJet générera automatiquement un extrait de code iframe pour l'intégration.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/embed.png" alt="Embed application using Iframe"/>

