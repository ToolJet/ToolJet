---
id: marketplace-plugin-prometheus
title: Prometheus
---

ToolJet s'intègre avec Prometheus pour vous aider à récupérer et afficher des métriques dans votre application. Vous pouvez utiliser ce plugin pour exécuter des requêtes PromQL et afficher des données en temps réel ou historiques provenant de votre serveur Prometheus. Il est utile pour créer des dashboards internes destinés à surveiller les systèmes et à suivre les performances.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Suivez les étapes de la [documentation Prometheus](https://prometheus.io/docs/prometheus/latest/getting_started/) pour configurer et exécuter un serveur Prometheus.

Pour connecter Prometheus à ToolJet, vous aurez besoin des informations suivantes :

- **Prometheus server URL**
- **Username**
- **Password**
- **CA certificate** ou **Client Certificate**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/prometheus/connection.png" alt="Configuring Prometheus in ToolJet" />

Une fois connecté, vous pouvez commencer à utiliser des requêtes instantanées et des requêtes sur intervalle (range queries) pour récupérer les données de métriques depuis votre serveur.

## Opérations prises en charge

- [Requête instantanée avec PromQL](#instant-query-with-promql)
- [Requête sur intervalle avec PromQL](#range-query-with-promql)

### Requête instantanée avec PromQL {#instant-query-with-promql}

Récupère la valeur actuelle d'une métrique à un instant donné.

**Paramètres requis**

- **Query** : une expression PromQL valide pour récupérer la métrique.
- **Request method** : définit la façon dont la requête est envoyée (GET ou POST).

**Paramètres optionnels**

- **Time** : horodatage spécifique auquel évaluer la requête.
- **Timeout** : durée maximale pendant laquelle la requête est autorisée à s'exécuter avant expiration.
- **Limit** : limite le nombre de résultats retournés.

<img style={{  marginBottom: "15px" }}  className="screenshot-full img-full" src="/img/marketplace/plugins/prometheus/instant-query.png" alt="Instant Query with PromQL in ToolJet" />

<details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
status : "success"
    data : {} 3 keys
```
</details>

### Requête sur intervalle avec PromQL {#range-query-with-promql}

Récupère les données de métrique sur une plage de temps spécifiée.

**Paramètres requis**

- **Query** : une expression PromQL valide pour récupérer la métrique.
- **Start** : horodatage de début de la plage de temps.
- **End** : horodatage de fin de la plage de temps.
- **Step** : intervalle entre les points de données au sein de la plage de temps.
- **Request method** : définit la façon dont la requête est envoyée (GET ou POST).

**Paramètres optionnels**

- **Timeout** : durée maximale pendant laquelle la requête est autorisée à s'exécuter avant expiration.
- **Limit** : limite le nombre de résultats retournés.

<img style={{  marginBottom: "15px" }} className="screenshot-full img-full" src="/img/marketplace/plugins/prometheus/range-query.png" alt="Range Query with PromQL in ToolJet" />

<details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
status : "success"
    data : {} 2 keys
```
</details>
