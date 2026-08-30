---
id: whitelist-cdn-domains
title: Whitelist CDN Domains
---

<PlanBadge type="self-hosted" />

Vous pouvez importer une bibliothèque externe de votre choix pour étendre les fonctionnalités de votre application. ToolJet prend en charge [jsDelivr](https://www.jsdelivr.com/) et [Skypack](https://www.skypack.dev/) par défaut, mais vous pouvez charger n'importe quelle autre bibliothèque en ajoutant simplement l'URL du CDN à la liste blanche (whitelist). Découvrez comment importer des bibliothèques via des CDN en suivant notre guide [Importation de bibliothèques externes](/docs/data-sources/runjs/use-axios-in-runjs).

Pour ce faire, définissez la variable d'environnement CSP_WHITELISTED_DOMAINS avec vos domaines CDN personnalisés. Une fois configuré, ToolJet met automatiquement à jour les en-têtes de Content Security Policy (CSP) pour inclure le CDN approuvé. Cela garantit le chargement sécurisé des bibliothèques externes tout en maintenant la conformité CSP.

| Variable                | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| CSP_WHITELISTED_DOMAINS | Domaines CDN ( ex : cdn.example.com, assets.mycompany.com, static.customcdn.net) |

:::note
La possibilité d'ajouter des domaines CDN à la liste blanche depuis l'interface utilisateur arrive bientôt !
:::
