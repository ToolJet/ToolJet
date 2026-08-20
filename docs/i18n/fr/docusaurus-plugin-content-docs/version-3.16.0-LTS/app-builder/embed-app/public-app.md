---
id: public-app
title: Application publique
---

# Intégrer une application ToolJet publique

Les applications ToolJet peuvent être intégrées publiquement, c'est-à-dire accessibles à tous sans authentification requise. Ceci est idéal lorsque l'application intégrée n'expose pas de données sensibles et est destinée à un accès large.

Les intégrations publiques sont couramment utilisées pour les formulaires de feedback, les tableaux de bord marketing, les sondages ou les widgets destinés aux clients, où la facilité d'accès importe davantage que le contrôle d'accès.

#### Quand utiliser une application publique

- Les données affichées ou collectées sont **non sensibles**
- L'application est destinée à des utilisateurs **externes** ou **anonymes**

#### Quand une application est intégrée publiquement

- L'application est affichée dans un iframe
- Aucune authentification ni connexion n'est requise
- Toute personne disposant de l'URL d'intégration peut consulter et interagir avec l'application

## Exemple

Par exemple, si vous gérez un portail de gestion d'inventaire et souhaitez partager publiquement les niveaux de stock — pour des fournisseurs, des magasins partenaires ou des clients — vous pouvez intégrer publiquement le tableau de bord d'inventaire ToolJet sur votre portail. Cela permet aux visiteurs de voir les noms d'articles, les quantités et la disponibilité, et de filtrer par « Available » ou « Out of Stock », offrant une vue transparente et interactive de votre inventaire sans nécessiter de connexion.

<iframe width="100%" height="650" src="https://app.tooljet.ai/applications/docs-inventory-example" title="ToolJet app - docs-inventory-example" frameborder="0" allowfullscreen></iframe>

<br/><br/>

En intégrant l'application dans le portail, vous pouvez obtenir :
- Une réduction des changements de contexte en permettant aux utilisateurs de vérifier l'inventaire sans quitter le portail
- Une prise de décision plus rapide grâce à un accès immédiat aux niveaux de stock
- Une collaboration transparente avec les partenaires ou fournisseurs en temps réel
- Des insights interactifs grâce au filtrage, mettant en évidence les articles disponibles et en rupture de stock
- Un accès public cohérent sans nécessiter de connexion ni d'outils supplémentaires

## Étapes pour intégrer une application publique

1. [Créez](/docs/getting-started/quickstart-guide) et [publiez](/docs/development-lifecycle/release/release-rollback/) votre application ToolJet.
2. Cliquez sur le bouton Share dans le coin supérieur droit de l'app-builder.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/embed-apps/share.png" alt="Click on the share button on the top right." />
3. Activez **Make application public** en basculant l'interrupteur.
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/embed-apps/public-app.png" alt="Make Application Public" />
4. Copiez le code iframe depuis **Embedded app link** et collez-le sur votre portail ou page web, à l'endroit où vous souhaitez intégrer l'application.
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/embed-apps/iframe.png" alt="Make Application Public" />
