---
id: marketplace-plugin-pinecone
title: Pinecone
---

ToolJet s'intègre avec Pinecone pour exploiter ses capacités de base de données vectorielle. Cette intégration permet à ToolJet d'effectuer des opérations vectorielles telles que la mise à jour, l'interrogation et la gestion d'embeddings vectoriels dans les index Pinecone.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion {#connection}

Pour se connecter à Pinecone, l'identifiant suivant est requis :

- **API Key** : la clé API pour Pinecone peut être générée depuis la [Pinecone Console](https://app.pinecone.io/organizations/-/projects/-/keys).

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/connection.png" alt="Configuring Pinecone in ToolJet" />

## Opérations prises en charge {#supported-operations}

- **[Obtenir les statistiques d'un index](#get-index-stats)**
- **[Lister les ID de vecteurs](#list-vector-ids)**
- **[Récupérer des vecteurs](#fetch-vectors)**
- **[Upsert de vecteurs](#upsert-vectors)**
- **[Mettre à jour un vecteur](#update-a-vector)**
- **[Supprimer des vecteurs](#delete-vectors)**
- **[Interroger des vecteurs](#query-vectors)**

### Obtenir les statistiques d'un index {#get-index-stats}

Cette opération récupère les statistiques d'un index spécifique de votre base de données Pinecone.

#### Paramètre requis {#required-parameter}

- **Index** : le nom de l'index dont on souhaite obtenir les statistiques.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/get-index-query.png" alt="Get Index Stats Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "namespaces" : {} 1 key

  "dimension" : 4
  "indexFullness" : 0  
  "totalRecordCount" : 1
}
```

</details>

### Lister les ID de vecteurs {#list-vector-ids}

Cette opération récupère une liste d'ID de vecteurs à partir d'un index spécifié.

#### Paramètre requis {#required-parameter-1}

- **Index** : le nom de l'index depuis lequel lister les ID de vecteurs.

#### Paramètres optionnels {#optional-parameters}

- **Prefix** : filtre les ID de vecteurs par préfixe.
- **Limit** : nombre maximal d'ID de vecteurs à retourner.
- **Pagination Token** : jeton permettant de récupérer la page suivante de résultats.
- **Namespace** : espace de noms (namespace) spécifique à interroger au sein de l'index.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/list-vector-query.png" alt="List Vector IDs Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```yaml
{
  "vectors":
    [
      { "id": "0" },
      { "id": "1" },
      { "id": "10" },
      { "id": "11" },
      { "id": "12" },
      { "id": "13" },
      { "id": "14" },
      { "id": "15" },
      { "id": "16" },
      { "id": "17" },
    ],
  "pagination": { "next": "eyJza2lwX3Bhc3QiOiIxNyIsInByZWZpeCI6bnVsbH0=" },
  "namespace": "",
  "usage": { "readUnits": 1 },
}
```

</details>

### Récupérer des vecteurs {#fetch-vectors}

Cette opération récupère des vecteurs spécifiques par leur ID à partir d'un index.

#### Paramètres requis {#required-parameters}

- **Index** : le nom de l'index depuis lequel récupérer les vecteurs.
- **IDs** : tableau des ID de vecteurs à récupérer.

#### Paramètre optionnel {#optional-parameter}

- **Namespace** : espace de noms spécifique depuis lequel récupérer les vecteurs.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/fetch-vec-query.png" alt="Fetch Vectors Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```yaml
{ "records": {}, "namespace": "", "usage": { "readUnits": 1 } }
```

</details>

### Upsert de vecteurs {#upsert-vectors}

Cette opération insère ou met à jour des vecteurs dans un index.

#### Paramètres requis {#required-parameters-1}

- **Index** : le nom de l'index dans lequel effectuer l'upsert des vecteurs.
- **Vectors** : tableau de vecteurs à upserter, incluant les ID et les valeurs.

#### Paramètre optionnel {#optional-parameter-1}

- **Namespace** : espace de noms spécifique dans lequel upserter les vecteurs

```yaml
[{"id": "1", "values": [-0.057448626,0.040567733,-0.057180677,0.031162664]}]
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/upsert-query.png" alt="Upsert Vectors Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```yaml
Upsert Successful
```

</details>

### Mettre à jour un vecteur {#update-a-vector}

Cette opération met à jour les valeurs ou les métadonnées d'un vecteur unique.

#### Paramètres requis {#required-parameters-2}

- **Index** : le nom de l'index contenant le vecteur.
- **ID** : ID du vecteur à mettre à jour.

#### Paramètres optionnels {#optional-parameters-1}

- **Values** : valeurs mises à jour du vecteur, sous forme de tableau.
- **Sparse Vector** : représentation du vecteur creux (sparse).
- **Metadata** : métadonnées supplémentaires pour le vecteur.
- **Namespace** : espace de noms spécifique contenant le vecteur.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/update-vec-query.png" alt="Update Vector Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```yaml
Update Successful
```

</details>

### Supprimer des vecteurs {#delete-vectors}

Cette opération supprime des vecteurs d'un index.

#### Paramètre requis {#required-parameter-2}

- **Index** : le nom de l'index depuis lequel supprimer les vecteurs.

#### Paramètres optionnels {#optional-parameters-2}

- **IDs** : tableau des ID de vecteurs à supprimer.
- **Delete All** : indicateur booléen pour supprimer tous les vecteurs.
- **Namespace** : espace de noms spécifique depuis lequel supprimer les vecteurs.
- **Filter** : condition de filtrage pour une suppression sélective.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/delete-query.png" alt="Delete Vectors Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```yaml
Delete Successful
```

</details>

### Interroger des vecteurs {#query-vectors}

Cette opération interroge les vecteurs d'un index en fonction de leur similarité.

#### Paramètres requis {#required-parameters-3}

- **Index** : le nom de l'index à interroger.
- **Vectors** : valeurs du vecteur de requête.
- **Top K** : nombre de vecteurs les plus similaires à retourner.

#### Paramètres optionnels {#optional-parameters-3}

- **Namespace** : espace de noms spécifique à interroger.
- **Filter** : condition de filtrage pour la requête.
- **Include Values** : booléen pour inclure les valeurs des vecteurs dans les résultats.
- **Include Metadata** : booléen pour inclure les métadonnées dans les résultats.
- **Sparse Vector** : vecteur creux (sparse) pour la recherche hybride.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/query-vec.png" alt="Query Vectors Operation" />
