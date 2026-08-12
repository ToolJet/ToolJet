---
id: grpcv2
title: gRPC 2.0
---

:::info gRPC 2.0
Cette documentation couvre la source de données **gRPC 2.0** avec des fonctionnalités améliorées, notamment la réflexion serveur et l'authentification OAuth2. Le [gRPC historique](/docs/data-sources/grpc) reste disponible mais est déprécié.
:::

## Nouveautés de gRPC 2.0

La nouvelle source de données gRPC 2.0 apporte des améliorations significatives par rapport à la version historique :
- **Prise en charge de la réflexion serveur** : Découvrez dynamiquement les services et les méthodes sans fichiers proto
- **Import de fichier proto par URL** : Importez des fichiers proto depuis des URL distantes
- **Authentification améliorée** : Prise en charge complète d'OAuth2, authentification basique/bearer améliorée
- **Configuration SSL/TLS** : Gestion complète des certificats
- **En-têtes de métadonnées personnalisés** : Prise en charge des clés d'API et de l'authentification personnalisée
- **Prêt pour le cloud** : Aucune dépendance au système de fichiers local

## Prérequis : mettre à niveau ToolJet vers la version 2.5 ou supérieure

Vous trouverez des instructions sur la façon de procéder dans les guides de configuration situés ici : [ToolJet Setup](/docs/setup/try-tooljet).

:::note
Contrairement à la source de données gRPC historique, gRPC 2.0 **ne nécessite pas** l'ajout de fichiers proto à votre serveur ni le montage de volumes. La nouvelle version prend en charge :
- **La réflexion serveur** : Découvrez automatiquement les services depuis votre serveur gRPC
- **Les URL de fichiers proto** : Importez des fichiers proto directement depuis des URL distantes

:::tip Migration depuis le gRPC historique
Si vous effectuez une mise à niveau depuis la source de données gRPC historique, vous n'avez plus besoin de :
- Créer un répertoire `/protos`
- Monter des volumes dans docker-compose.yml
- Redémarrer votre instance ToolJet pour les changements de fichiers proto
:::

## Configuration du fichier proto

gRPC 2.0 propose deux méthodes pour définir le schéma de votre service :

### Réflexion serveur (recommandé)

La réflexion serveur permet à ToolJet de découvrir automatiquement tous les services et méthodes disponibles depuis votre serveur gRPC. C'est l'approche la plus flexible car elle s'adapte aux changements de schéma sans nécessiter de mises à jour dans ToolJet.

**Prérequis pour la réflexion serveur :**
- Votre serveur gRPC doit avoir la réflexion activée
- Le serveur doit être accessible depuis votre instance ToolJet

**Activer la réflexion sur votre serveur gRPC :**

Pour les serveurs Go :

```go
import "google.golang.org/grpc/reflection"
s := grpc.NewServer()
// Register your services...
reflection.Register(s)
```

Pour les serveurs Node.js :
```javascript
const reflection = require('@grpc/reflection');
reflection.loadSync(server);
```

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/server-reflection.png" alt="gRPC 2.0: connection configuration" />

### Import de fichier proto par URL

Si la réflexion serveur n'est pas disponible ou si vous préférez utiliser un fichier proto spécifique, vous pouvez l'importer directement depuis une URL.

**Formats d'URL pris en charge :**

- `https://example.com/api.proto`
- `https://raw.githubusercontent.com/user/repo/main/api.proto`
- Toute URL HTTPS publiquement accessible servant un fichier `.proto`

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/proto.png" alt="gRPC 2.0: connection configuration" />

## Connexion à gRPC 2.0
Après avoir configuré votre schéma proto, établissez une connexion en accédant à la page [source de données](/docs/data-sources/overview).

### Configuration de la connexion
ToolJet gRPC 2.0 nécessite la configuration suivante :

#### Paramètres de base
- **Server URL** : Le point de terminaison de votre serveur gRPC (par exemple, `grpcb.in:9001` ou `https://api.example.com:443`)
- **Proto Files** : Choisissez entre « Server Reflection » ou « Import Proto File URL »
- **Custom Metadata** : Paires clé-valeur pour les en-têtes personnalisés (optionnel)

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/config.png" alt="gRPC 2.0: connection configuration" />

#### Options d'authentification

gRPC 2.0 prend en charge des méthodes d'authentification complètes :

- **None (par défaut)**
    - Aucune authentification requise
- **Basic Authentication**
    - Nom d'utilisateur et mot de passe
    - Ajoute automatiquement les métadonnées d'authentification aux requêtes
- **Bearer Token**
    - Authentification basée sur un jeton
    - Prend en charge les préfixes d'en-têtes personnalisés
-**OAuth2 (nouveau)**
    - Prise en charge complète du flux OAuth2
    - Types d'octroi Authorization Code, Client Credentials
    - Paramètres et portées OAuth personnalisés
    - Rafraîchissement automatique des jetons
- **API Key via Metadata**
    - Utilise des en-têtes de métadonnées personnalisés pour l'authentification par clé d'API
    - Prise en charge de plusieurs formats d'en-tête

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/oauth.png" alt="gRPC 2.0: connection configuration" />

#### Configuration SSL/TLS

Options de sécurité améliorées pour les connexions chiffrées :

- **Bascule SSL/TLS**
    - Activer/désactiver le chiffrement SSL
- **Types de certificats :**
    - **None** : Aucune validation de certificat
    - **CA Certificate** : Vérifier le serveur avec une AC personnalisée
    - **Client Certificate** : TLS mutuel avec certificats client
- **Gestion des certificats :**
    - Stockage sécurisé des certificats
    - Prise en charge des certificats au format PEM
    - Champs distincts pour le certificat de l'AC, le certificat client et la clé privée

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/ssl.png" alt="gRPC 2.0: connection configuration" />

## En-têtes de métadonnées personnalisés

gRPC 2.0 prend en charge des en-têtes de métadonnées personnalisés pour une authentification flexible et une personnalisation des requêtes :

**Cas d'utilisation :**
    - Authentification par clé d'API (`x-api-key: your-api-key`)
    - En-têtes d'autorisation personnalisés
    - En-têtes de suivi des requêtes
    - Métadonnées spécifiques au service

**Configuration :**
    - Interface de paires clé-valeur similaire aux en-têtes REST API
    - Prise en charge des valeurs chiffrées
    - Valeurs dynamiques utilisant les variables ToolJet

## Création de requêtes

Une fois configurée, la source de données gRPC 2.0 sera disponible dans le panneau de requêtes de votre application.

### Sélection du service et de la méthode

1. Avec la **réflexion serveur** :
    1. Sélectionnez votre source de données gRPC 2.0
    2. Choisissez parmi les services découverts automatiquement
    3. Sélectionnez les méthodes disponibles pour le service choisi
    4. Les paramètres de méthode sont générés dynamiquement en fonction du schéma proto

2. Avec l'**URL de fichier proto** :
    1. L'import se termine automatiquement après validation de l'URL
    2. Les services et méthodes se remplissent à partir du fichier proto importé
    3. Les formulaires de paramètres sont générés à partir des définitions proto

<img className="screenshot-full img-l" src="/img/datasource-reference/grpc-2/service.png" alt="gRPC 2.0: query interface" />

### Configuration de la requête

- **Paramètres de méthode :**
    - Prise en charge des objets imbriqués et des champs répétés
    - Modes de saisie JSON ou basés sur un formulaire
- **Métadonnées de la requête :**
    - Remplace les métadonnées au niveau de la connexion pour des requêtes spécifiques
    - Ajoute des en-têtes spécifiques à la requête
- **Options avancées :**
    - Configuration du délai d'expiration de la requête
    - Paramètres de délai personnalisés

## Migration depuis le gRPC historique

Si vous utilisez actuellement la source de données gRPC historique, voici comment migrer :

### Principales différences

| Fonctionnalité | gRPC historique | gRPC 2.0 |
|---------|-------------|----------|
| Fichiers proto | Système de fichiers local | Réflexion serveur + import par URL |
| Authentification | Basic, Bearer, API Key | Basic, Bearer, OAuth2, métadonnées personnalisées |
| SSL/TLS | Limité | Gestion complète des certificats |
| Configuration | Montage manuel de fichiers | Aucune configuration requise |
| Mises à jour du schéma | Redémarrage du serveur requis | Automatique avec la réflexion |

### Étapes de migration
1. **Créer une nouvelle source de données gRPC 2.0**
   - Ajoutez gRPC 2.0 depuis la page des sources de données globales
   - Configurez avec la même URL de serveur
2. **Choisir la méthode proto**
   - **Si votre serveur prend en charge la réflexion** : Sélectionnez « Server Reflection »
   - **Si vous utilisez des fichiers proto** : Téléversez-les vers une URL publique et utilisez « Import Proto File URL »
3. **Mettre à jour l'authentification**
   - Les jetons Basic et Bearer fonctionnent de la même manière
   - Les clés d'API doivent être configurées comme des en-têtes de métadonnées personnalisés
   - Configuration d'OAuth2
4. **Mettre à jour les requêtes**
   - Recréez les requêtes en utilisant la nouvelle source de données
   - Testez le fonctionnement avec la nouvelle interface
5. **Supprimer la configuration historique** (optionnel)
   - Supprimez le répertoire `/protos`
   - Supprimez les montages de volumes de docker-compose.yml
   - Supprimez la source de données gRPC historique

:::note 
Support historique
La source de données gRPC historique reste disponible mais est dépréciée. Les nouveaux projets doivent utiliser gRPC 2.0, et les projets existants sont encouragés à migrer.
:::
