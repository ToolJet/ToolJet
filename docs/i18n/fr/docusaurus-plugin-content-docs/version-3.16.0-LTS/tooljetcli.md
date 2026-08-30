---
id: tooljet-cli
title: ToolJet CLI
---

ToolJet CLI est un outil puissant qui permet aux développeurs de créer et d'améliorer facilement des plugins Marketplace pour l'espace de travail ToolJet.

:::info
À partir de la version 0.0.14 de ToolJet CLI, la création de plugins de source de données a été dépréciée afin de privilégier les plugins marketplace. Ce changement améliore l'expérience de développement des plugins et s'aligne avec la feuille de route de ToolJet.
:::

## Installation

Pour gérer les plugins de la marketplace ToolJet, notamment leur création, leur mise à jour et leur suppression, vous devrez utiliser **[tooljet-cli](https://www.npmjs.com/package/@tooljet/cli)**. Il peut être installé via npm en exécutant la commande suivante :

```bash
npm install -g @tooljet/cli
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/install.png" alt="Installation de ToolJet CLI" />

</div>

#### Vérifier que l'installation a réussi

```bash
tooljet --version
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/version.png" alt="Vérification de la version de ToolJet CLI" />

</div>

## Commandes

### info

Cette commande renvoie les informations sur l'environnement d'exécution de tooljet.

```bash
tooljet info
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/info.png" alt="Informations ToolJet CLI" />

</div>

### create

Cette commande crée un nouveau plugin.

```bash
tooljet plugin create PLUGIN_NAME
```
:::tip
Consultez le guide détaillé sur la création d'un plugin marketplace [ici](/docs/contributing-guide/marketplace/creating-a-plugin).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/create.gif" alt="ToolJet CLI : créer un plugin" />

</div>

### delete

Cette commande supprime un plugin.

```bash
tooljet plugin delete PLUGIN_NAME
```

La CLI demandera aux développeurs de vérifier si le plugin à supprimer est un plugin marketplace avant de procéder à la suppression.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooljet-cli/delete.gif" alt="ToolJet CLI : supprimer un plugin" />

</div>

### install

Installe un nouveau module npm à l'intérieur d'un plugin tooljet.

```bash
tooljet plugin install [NPM_MODULE] --plugin <value>
```
