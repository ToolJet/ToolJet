---
id: overview
title: Aperçu des sources de données
sidebar_label: Aperçu
---

Les sources de données permettent d'importer et d'exporter des données vers diverses sources, notamment des bases de données, des API externes et des services. Une fois qu'une source de données est connectée à un workspace, la connexion peut être partagée avec n'importe quelle application de ce workspace.

ToolJet propose un large éventail de sources de données. Si besoin, vous pouvez développer et intégrer un plugin de votre choix ou utiliser un plugin disponible depuis la marketplace. Consultez le **[guide d'aperçu de la Marketplace](/docs/marketplace/marketplace-overview)** pour plus d'informations.

<img className="screenshot-full img-full" src="/img/datasource-reference/overview/datasources-overview.png" alt="Data Sources: Overview" />

## Connexion des sources de données

1. **Créez une nouvelle application** depuis le dashboard, puis cliquez sur le bouton **+** du panneau de requêtes.
    <img className="screenshot-full img-full" src="/img/datasource-reference/overview/query-panel.png" alt="Data Sources: Overview" />
    Vous pouvez également accéder directement à la page **Data Sources** depuis la barre latérale gauche du dashboard.

2. Sur la page **Data Sources**, vous trouverez plusieurs catégories de sources de données sur la gauche, notamment les bases de données, les API, les stockages cloud et les plugins. Cliquez sur chaque catégorie pour afficher la liste des sources de données disponibles. Lorsque vous survolez la source de données souhaitée, un bouton **+ Add** apparaît. En cliquant sur ce bouton, la source de données sélectionnée est intégrée au workspace.
    <img className="screenshot-full img-full" src="/img/datasource-reference/newui/overview/googlesheets-datasource-v3.png" alt="Overview of Data Sources" />
  
3. Une fois la source de données ajoutée, vous devrez saisir les informations de configuration nécessaires à l'établissement de la connexion. <br/>
    ***Remarque : pour les plans payants, la saisie et l'enregistrement de la configuration sont nécessaires pour permettre sa disponibilité sur [plusieurs environnements](/docs/development-lifecycle/environment/self-hosted/multi-environment).***
    <img className="screenshot-full img-full" src="/img/datasource-reference/newui/overview/gs-dev-v3.png" alt="Overview of Data Sources" />
  
4. Retournez au panneau de requêtes de votre application. La source de données récemment ajoutée sera accessible dans le panneau de requêtes, sous la section **Available data sources**. Les sources de données ajoutées peuvent désormais être utilisées à la fois dans les **applications existantes** et dans les **nouvelles applications créées**.
    <img className="screenshot-full img-full" src="/img/datasource-reference/overview/available-ds.png" alt="Overview of Data Sources" />
  
5. À ce stade, vous pouvez créer des requêtes vers les sources de données connectées. Dans ces requêtes, il est possible de basculer entre **différentes connexions** associées à la même source de données, dans les cas où plusieurs connexions ont été établies.
    <img className="screenshot-full img-full" src="/img/datasource-reference/overview/restapi.png" alt="Overview of Data Sources" />

## Sources de données par défaut

Par défaut, 4 sources de données sont disponibles sur chaque application ToolJet :
- **[ToolJet Database](/docs/tooljet-db/tooljet-database/)**
- **[RestAPI](/docs/data-sources/restapi/)**
- **[Run JavaScript Query](/docs/data-sources/run-js/)**
- **[Run Python Query](/docs/data-sources/run-py/)**

<img className="screenshot-full img-full" src="/img/datasource-reference/newui/overview/default-data-sources.png" alt="Data Sources: Overview" />
