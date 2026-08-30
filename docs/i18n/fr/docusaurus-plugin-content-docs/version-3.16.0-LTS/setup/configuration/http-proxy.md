---
id: http-proxy
title: Connexion via un proxy HTTP
slug: /setup/http-proxy/
---

Le serveur se connectera à Internet via le proxy HTTP configuré lorsque la variable d'environnement ci-dessous est définie.

| Variable           | Description                           |
| :----------------- | :------------------------------------ |
| TOOLJET_HTTP_PROXY | Utilisée pour les requêtes HTTP et HTTPS |

## Informations sur le package

Nous utilisons le package [global-agent](https://www.npmjs.com/package/global-agent) pour gérer les proxys HTTP.

Ce package vous permet de configurer des proxys HTTP/HTTPS globaux pour votre application Node.js. Il est particulièrement utile lorsque vous devez router toutes les requêtes HTTP et HTTPS sortantes via un serveur proxy. Cela peut être bénéfique pour des scénarios tels que le contournement de restrictions réseau, la journalisation, ou l'ajout d'une couche de sécurité supplémentaire.

## Format de l'URL

Le format de la variable d'environnement suit la notation standard hôte et port :

```
http://127.0.0.1:8080
```

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
