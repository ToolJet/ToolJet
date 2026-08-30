---
id: saphana
title: SAP HANA
---

ToolJet peut se connecter aux bases de données SAP HANA pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données SAP HANA, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requêtes, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le dashboard de ToolJet.

ToolJet a besoin des éléments suivants pour se connecter à votre base de données SAP HANA :

- **Host**
- **Port**
- **Username**
- **Password**

:::info
Veuillez vous assurer que le **Host/IP** de la base de données est accessible depuis votre VPC si vous utilisez une instance auto-hébergée de ToolJet. Si vous utilisez ToolJet Cloud, veuillez **whitelister** notre IP.
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/saphana/connect-v2.png" alt="ToolJet - Data source - SAP HANA" />

## Interroger SAP HANA

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes, situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **SAP HANA** ajoutée à l'étape précédente.
3. Ajoutez la requête.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou sur le bouton **Run** pour créer et déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/saphana/query-v3.png" alt="saphana query" />

```sql
select * from PRODUCTS
```

:::tip
Les résultats des requêtes peuvent être transformés à l'aide de transformations. Consultez notre documentation sur les transformations pour savoir comment faire : **[lien](/docs/app-builder/custom-code/transform-data)**
:::
