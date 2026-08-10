---
id: upgrade-to-v3.16
title: Guide de migration vers ToolJet 3.16
slug: /setup/upgrade-to-v3.16/
---

ToolJet 3.16 introduit un ensemble de **nouvelles fonctionnalités et de mises à jour de la plateforme**. Tous les changements sont **non-disruptifs (non-breaking)**, mais certains peuvent nécessiter de légers ajustements de mise en page. Ce guide résume toutes les mises à jour clés.

:::tip Avant la mise à niveau
Nous vous recommandons de consulter ce guide et de tester dans un environnement de préproduction pour évaluer les différences d'interface. Pour les utilisateurs auto-hébergés, assurez-vous que les changements du fichier `.env` sont appliqués pour la conservation des journaux d'audit.
:::

## Mises à jour suggérées (sévérité moyenne)

### Changements dans l'App Builder

Ce sont des améliorations de mise en page ou d'ergonomie qui peuvent nécessiter des ajustements selon la configuration de votre application.

| Zone                                 | Changement                                                                                                                                                                                                                              |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| En-tête de l'application             | L'option **Hide app header** a été dépréciée et est désormais incluse dans les fonctionnalités Page & Navigation. Si vous aviez précédemment masqué l'en-tête de l'application, il sera désormais affiché. Assurez-vous que votre mise en page tient compte de ce changement. |
| Mode sombre et en-tête               | L'icône **Toggle App Mode** disparaît si le menu de la page est masqué. **Solution de contournement** : utilisez un bouton avec l'action `Toggle App Mode`.                                                                            |
| Menu de page (Texte et icône)        | Pour les menus de page utilisant le style **Text and icon**, les icônes resteront désormais visibles lorsque le menu est réduit. Ce n'était pas le cas auparavant et cela peut légèrement affecter votre mise en page.                 |
| Menu de page (Texte seul et Icône seule) | Les menus de page utilisant les styles **Text only** ou **Icon only** ne peuvent plus être réduits. Si votre mise en page dépendait de la réduction de ces menus, des ajustements peuvent être nécessaires.                        |
| Image de marque (branding)          | Le logo et le titre de l'application apparaissent désormais côte à côte dans le coin supérieur gauche du menu de page. La barre supérieure séparée qui contenait auparavant le titre et le logo a été supprimée. Ce changement peut affecter l'équilibre de la mise en page et la visibilité de l'image de marque. |

### Changements au niveau de la plateforme

Les journaux d'audit sont les rapports de toutes les activités effectuées dans votre compte ToolJet. Voici les périodes de conservation par défaut qui déterminent la durée de stockage de ces journaux, selon votre type de déploiement.

| Déploiement  | Notes                                                                                   |
| :---------- | :-------------------------------------------------------------------------------------- |
| Cloud       | Aucun changement. Les journaux d'audit restent fixés à 90 jours.                       |
| Auto-hébergé | Les journaux d'audit sont désormais fixés par défaut à 90 jours. Remplacez via `.env` : `AUDIT_LOG_RETENTION_PERIOD=90` |

#### Synchronisation des groupes (migration uniquement)

La synchronisation des groupes pour LDAP et SAML est passée des **variables d'environnement** à une **configuration basée sur l'interface**.

Auparavant, les variables suivantes étaient utilisées lors de la connexion :

- `DISABLE_LDAP_GROUP_SYNC=true`
- `DISABLE_SAML_GROUP_SYNC=true`

Dans ToolJet 3.16, ces variables sont conservées **uniquement pour la compatibilité ascendante pendant la migration**.  
Pour les nouvelles installations, elles n'ont **aucun effet**.

Après la mise à niveau, la synchronisation des groupes doit être gérée exclusivement via l'interface.


## Changements mineurs de composants (sévérité faible)

Ces changements peuvent provoquer des **modifications visuelles mineures** mais ne nécessitent aucune action, sauf s'ils affectent votre mise en page.

| Composant         | Description du changement                                                                                             |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------- |
| Container         | Mises à jour de l'espacement (padding) appliquées. Cela peut légèrement affecter l'alignement des composants enfants rapprochés comme les en-têtes ou les cartes. |
| File Picker       | Interface améliorée avec ajout d'une sélection de plage de taille de fichier, de titres de liste et d'un retour visuel amélioré.                          |
| Tab               | Les en-têtes d'onglets ont subi une légère amélioration visuelle, y compris l'alignement et l'espacement.                         |
| List View         | L'espacement (padding) des enregistrements individuels a été légèrement ajusté pour être cohérent avec les autres composants de mise en page.                |
| Form              | L'espacement interne a été révisé pour s'aligner sur la nouvelle logique d'espacement du container.                                                               |
| Table             | Une barre de défilement horizontale a été ajoutée pour le contenu en débordement. La barre de défilement est également désormais plus large pour une meilleure accessibilité.     |
| Daterange Picker  | La conception de la fenêtre contextuelle du calendrier a été modernisée avec un meilleur regroupement visuel et une meilleure clarté de la sélection de dates.                           |
| Steps             | Les indicateurs d'étapes ont un espacement et une largeur mis à jour, améliorant l'alignement et l'ergonomie dans les formulaires à plusieurs étapes.                |
| Image             | L'interface de repli pour les images cassées a été améliorée — l'affichage est plus propre et plus informatif.                                              |
| Dividers          | L'espacement latéral a été supprimé sur les séparateurs horizontaux et verticaux, les rendant légèrement plus grands ou plus visibles.  |
| Canvas            | Lorsque le menu de la page se déploie, le canevas se réduit désormais de manière plus prévisible pour éviter les problèmes de découpage de mise en page.                     |
| Menu de page (Icône) | L'icône d'épingle a été remplacée par une icône de menu hamburger pour mieux refléter le comportement de bascule en mode réduit.       |

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
