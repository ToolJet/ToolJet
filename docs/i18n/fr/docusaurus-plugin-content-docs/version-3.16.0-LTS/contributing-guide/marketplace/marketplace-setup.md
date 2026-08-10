---
id: marketplace-setup
title: "Marketplace: Development Setup"
---

Le Marketplace propose des plugins personnalisés qui peuvent être installés sur votre instance ToolJet. Ce guide vise à vous aider à créer un nouveau plugin pour le marketplace de ToolJet.

## Prérequis

- [Node.js](https://nodejs.org/en/download/) **(v22.15.1)**
- [npm](https://www.npmjs.com/get-npm) **(v10.9.2)**

## Pour commencer

### Étape 1. Configurer ToolJet en local

Pour obtenir le dépôt ToolJet via git, utilisez la commande :

```bash
git clone https://github.com/ToolJet/ToolJet.git
```

Ensuite, reportez-vous au guide approprié pour votre environnement de développement afin de suivre les instructions de configuration :

- **[MacOS](/docs/contributing-guide/setup/macos)**
- **[Docker](/docs/contributing-guide/setup/docker)**
- **[Ubuntu](/docs/contributing-guide/setup/ubuntu)**

### Étape 2. Activer le Marketplace pour votre instance

Pour activer le marketplace sur votre instance ToolJet, vous devez spécifier les variables d'environnement suivantes dans votre fichier **`.env`** :

#### Activation de la fonctionnalité Marketplace

Utilisez cette variable d'environnement pour activer/désactiver la fonctionnalité permettant aux utilisateurs d'utiliser le marketplace.

| variable                   | valeur             |
| -------------------------- | ----------------- |
| ENABLE_MARKETPLACE_FEATURE | `true` ou `false` |

#### Activer le mode de développement de plugins Marketplace

L'utilisation de cette variable d'environnement facilite le développement de plugins en permettant des builds automatiques à chaque modification de package, simplifiant ainsi le processus de développement. Par ailleurs, elle intègre également un bouton de rechargement qui récupère toutes les modifications locales récentes depuis le système de fichiers pour les plugins installés, ce qui en fait une fonctionnalité précieuse pour améliorer l'expérience de développement globale.

| variable                    | valeur             |
| --------------------------- | ----------------- |
| ENABLE_MARKETPLACE_DEV_MODE | `true` ou `false` |

Veuillez noter que le marketplace n'est pas activé par défaut. Après avoir mis à jour la variable, redémarrez votre instance ToolJet.

Pour plus d'informations sur l'exécution de ToolJet sur votre machine locale, veuillez consulter les instructions fournies **[ici](/docs/contributing-guide/setup/architecture)**. Vous pouvez accéder au marketplace en naviguant vers la route **'/integrations'**.

### Étape 3 : Installer les packages requis

Les packages requis doivent être installés depuis le dossier racine marketplace. Utilisez les commandes suivantes pour installer les packages :

```bash
cd marketplace
npm install
```

Une fois les packages installés, exécutez la commande suivante pour construire le répertoire :

```bash
npm run build
```

### Étape 4 : Installation de tooljet-cli

Pour gérer les plugins du marketplace de ToolJet, notamment leur création, mise à jour et suppression, vous devrez utiliser **[tooljet-cli](https://www.npmjs.com/package/@tooljet/cli)**. Il peut être installé via npm en saisissant la commande suivante :

```bash
npm install -g @tooljet/cli

# Ensure the installation was successful
tooljet --version
```

Une fois la configuration de l'environnement pour le mode développeur Marketplace terminée, nous pouvons passer à la section suivante et commencer à [développer votre premier plugin](/docs/contributing-guide/marketplace/creating-a-plugin).
