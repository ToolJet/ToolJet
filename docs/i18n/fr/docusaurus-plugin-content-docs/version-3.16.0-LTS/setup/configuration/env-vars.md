---
id: env-vars
title: Variables d'environnement
slug: /setup/env-vars/
---

ToolJet nécessite plusieurs variables d'environnement pour fonctionner correctement. Voici un guide simplifié pour les configurer.

## Serveur ToolJet

### Variables requises

#### Hôte ToolJet

- `TOOLJET_HOST` : URL publique de ToolJet (par exemple, `https://app.tooljet.com`)

#### Configuration Lockbox

- `LOCKBOX_MASTER_KEY` : chaîne hexadécimale de 32 octets pour chiffrer les identifiants des sources de données
  - Générez-la avec : `openssl rand -hex 32`

#### Secret d'application

- `SECRET_KEY_BASE` : chaîne hexadécimale de 64 octets pour chiffrer les cookies de session
  - Générez-la avec : `openssl rand -hex 64`

#### Configuration de la base de données

- `PG_HOST` : hôte de la base de données PostgreSQL
- `PG_DB` : nom de la base de données
- `PG_USER` : nom d'utilisateur
- `PG_PASS` : mot de passe
- `PG_PORT` : port

**Configuration Docker Compose :** Si vous utilisez une configuration Docker Compose avec une instance PostgreSQL intégrée, définissez `PG_HOST` sur `postgres`. Cela garantit que le DNS interne de Docker résout correctement le nom d'hôte, permettant au serveur ToolJet de se connecter à la base de données sans problème.

**URL de connexion à la base de données :** Si vous prévoyez d'utiliser l'URL de connexion à la base de données et que votre base de données ne prend pas en charge SSL, utilisez le format suivant lors de la configuration de la variable `DATABASE_URL` :

```
DATABASE_URL=postgres://PG_USER:PG_PASS@PG_HOST:5432/PG_DB?sslmode=disable
```

Remplacez `username`, `password`, `hostname`, `port` et `database_name` par les détails réels de votre base de données.

#### Désactiver la création automatique de la base de données et des extensions (facultatif)

- `PG_DB_OWNER=false` : par défaut, ToolJet tente de créer une base de données en fonction de la variable `PG_DB` définie, et peut également essayer de créer des extensions PostgreSQL. Cela nécessite que l'utilisateur PostgreSQL dispose de la permission `CREATEDB`. Si cette permission ne peut pas être accordée, vous pouvez désactiver ce comportement en définissant `PG_DB_OWNER` sur `false`, et vous devrez alors les exécuter manuellement.

#### Base de données ToolJet

- `TOOLJET_DB` : nom de la base de données par défaut (`tooljet_db`)
- `TOOLJET_DB_HOST` : hôte de la base de données
- `TOOLJET_DB_USER` : nom d'utilisateur de la base de données
- `TOOLJET_DB_PASS` : mot de passe de la base de données
- `TOOLJET_DB_PORT` : port de la base de données
- `TOOLJET_DB_BULK_UPLOAD_MAX_ROWS` : nombre maximal de lignes autorisées lors d'un import en masse (par défaut : 5000)
- `TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB` : taille maximale d'un fichier CSV pour l'import en masse. La valeur par défaut est 5 Mo

#### Pourquoi ToolJet nécessite deux bases de données

ToolJet nécessite deux bases de données distinctes pour un fonctionnement optimal. **TOOLJET_DB** est utilisée pour stocker les métadonnées internes de la plateforme, y compris les tables créées au sein de ToolJet. En revanche, **PG_DB** sert de base de données principale pour les données applicatives, gérant les données des utilisateurs finaux traitées par les applications construites sur ToolJet.

**Création automatique de la base de données :** le nom de base de données spécifié dans `TOOLJET_DB` sera automatiquement créé lors du démarrage du serveur, dans toutes les configurations de déploiement en production.

#### PostgREST

ToolJet utilise **PostgREST (v12.2.0)** pour l'accès à l'API. Les variables d'environnement suivantes sont requises pour PostgREST :

- `PGRST_JWT_SECRET` : secret JWT (générez-le avec `openssl rand -hex 32`). Si ce paramètre n'est pas spécifié, PostgREST refusera les demandes d'authentification.
- `PGRST_DB_URI` : chaîne de connexion à la base de données
- `PGRST_LOG_LEVEL=info`
- `PGRST_DB_PRE_CONFIG=postgrest.pre_config`

Si vous souhaitez apporter des modifications à la configuration ci-dessus, reportez-vous à la [documentation de configuration de PostgREST](https://postgrest.org/en/stable/configuration.html#environment-variables).

#### Configuration de PGRST_DB_URI

`PGRST_DB_URI` est requis pour PostgREST, qui est chargé d'exposer la base de données en tant qu'API REST. Elle doit être explicitement définie pour garantir un fonctionnement correct.

Elle suit le format suivant :

```
PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
```

Assurez-vous que :

- `username` et `password` correspondent aux identifiants de l'utilisateur de la base de données PostgREST.
- `hostname` est correctement défini (`postgres` si vous utilisez une configuration Docker Compose avec une instance PostgreSQL intégrée).
- `port` est le port PostgreSQL (par défaut : `5432`).
- `database_name` est la base de données utilisée pour PostgREST (`tooljet_db` dans cet exemple).

#### Configuration Redis

Incluez les variables d'environnement Redis suivantes dans le déploiement de ToolJet uniquement si vous vous connectez à une **instance Redis externe (v7.x recommandée)** pour une configuration multi-service ou multi-pod, ou lors de l'exécution de workflows avec des conteneurs worker distincts.

**Variables requises :**

```
REDIS_HOST=
REDIS_PORT=
```

**Variables facultatives :**

```
REDIS_USER=
REDIS_PASSWORD=
REDIS_DB=0                   # Numéro de base de données Redis (par défaut : 0)
REDIS_TLS=false              # Activer la connexion TLS/SSL (mettre à 'true')
```

:::info
**Pour les workflows :** lors de l'exécution de conteneurs worker distincts ou de plusieurs instances pour la planification des workflows, une instance Redis externe est **requise** pour la coordination de la file d'attente de tâches. Le Redis intégré ne fonctionne que pour les déploiements à instance unique.
:::

#### Planification des workflows

ToolJet Workflows vous permet de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Configurez les variables d'environnement suivantes pour activer la planification des workflows :

**Variables requises :**

- `WORKER` : définissez sur `true` pour activer le traitement des tâches pour la planification des workflows. Définissez sur `false` ou laissez non défini pour le mode HTTP uniquement (par défaut : `false`)

**Variables facultatives :**

- `TOOLJET_WORKFLOW_CONCURRENCY` : nombre de tâches de workflow traitées simultanément par instance de worker (par défaut : `5`)

:::warning
**Exigence Redis externe** : lors de l'exécution de conteneurs worker distincts ou de plusieurs instances, une instance Redis externe avec état est **requise** pour la coordination de la file d'attente de tâches. Le Redis intégré ne fonctionne que lorsque le serveur et le worker se trouvent dans la même instance de conteneur (déploiement à instance unique).
:::

Pour des exemples détaillés de configuration et de déploiement des workflows, reportez-vous au [Guide de migration des workflows](/docs/setup/workflow-temporal-to-bullmq-migration/).

### Configurations facultatives

#### Fonctionnalité de commentaires

- `COMMENT_FEATURE_ENABLE=true/false` : utilisez cette variable d'environnement pour activer/désactiver la fonctionnalité qui vous permet d'ajouter des commentaires sur le canvas. Pour configurer cette variable d'environnement, assurez-vous que l'édition multi-utilisateur est activée dans les paramètres.

#### Expiration de la session utilisateur

- `USER_SESSION_EXPIRY` : contrôle la durée d'expiration de la session (en minutes). Par défaut : **10 jours**.

Remarque : la variable attend une valeur en minutes. Exemple : USER_SESSION_EXPIRY = 120, ce qui correspond à 2 heures

#### Limite de tentatives de mot de passe

Par défaut, un compte est verrouillé après 5 tentatives de connexion échouées. Vous pouvez contrôler ce comportement avec :

- `DISABLE_PASSWORD_RETRY_LIMIT=true` : désactive la limite de tentatives.
- `PASSWORD_RETRY_LIMIT=<nombre>` : définit une limite de tentatives personnalisée (par défaut 5).

#### Masquer le lien de configuration du compte

- `HIDE_ACCOUNT_SETUP_LINK` : définissez sur `true` pour masquer le lien de configuration du compte destiné à l'administrateur dans la page de gestion des utilisateurs. Assurez-vous que le SMTP est configuré pour envoyer les e-mails de bienvenue.

#### Restreindre les inscriptions

Définissez `DISABLE_SIGNUPS=true` pour n'autoriser que les utilisateurs invités à s'inscrire. La page d'inscription reste visible mais devient inutilisable.

#### Configuration SMTP

ToolJet envoie des e-mails via SMTP.

:::info
Si vous avez effectué une mise à niveau depuis une version antérieure à la v2.62.0, les variables SMTP de votre fichier .env seront automatiquement mappées à l'interface utilisateur. Pour les versions v2.62.0 et ultérieures, la configuration SMTP ne sera plus récupérée depuis le fichier .env pour l'édition Enterprise. Vous devez configurer le SMTP via l'interface utilisateur. Vous pouvez supprimer ces variables de votre fichier .env en toute sécurité après vous être assuré que la configuration est correctement définie dans l'interface utilisateur.
:::

Pour l'**édition Enterprise**, configurez le SMTP dans l'interface des paramètres de ToolJet.

Pour l'**édition Community**, utilisez ces variables d'environnement :

- `DEFAULT_FROM_EMAIL` : adresse e-mail de l'expéditeur
- `SMTP_USERNAME` : nom d'utilisateur SMTP
- `SMTP_PASSWORD` : mot de passe SMTP
- `SMTP_DOMAIN` : hôte SMTP
- `SMTP_PORT` : port SMTP

#### Certificat CA personnalisé

Si ToolJet doit se connecter à des points de terminaison HTTPS auto-signés, assurez-vous que la variable d'environnement `NODE_EXTRA_CA_CERTS` est définie avec le chemin absolu du fichier de certificat CA.

- `NODE_EXTRA_CA_CERTS=/path/to/cert.pem` : chemin absolu vers le fichier PEM (peut contenir plusieurs certificats).

#### Import d'application via l'API ToolJet

Par défaut, le serveur accepte une taille JSON maximale de 50 Mo. Pour augmenter cette limite, utilisez la variable d'environnement suivante :

- `MAX_JSON_SIZE = "150mb"`

#### Personnalisation de la configuration des workflows

Vous pouvez contrôler le comportement d'exécution des workflows à l'aide des variables d'environnement suivantes :

| Variable | Description | Par défaut | Unité |
|-----------|-------------|---------|-------|
| `WORKFLOW_TIMEOUT_SECONDS` | Durée maximale pendant laquelle l'exécution d'un workflow peut s'exécuter avant expiration. | 60 | secondes |
| `WORKFLOW_JS_MEMORY_LIMIT_MB` | Limite de mémoire maximale allouée à chaque nœud `runjs` ou `loop` pendant l'exécution. | 20 | Mo |
| `WORKFLOW_JS_TIMEOUT_MS` | Durée maximale autorisée pour l'exécution de chaque nœud `runjs` ou `loop`. | 100 | millisecondes |

#### Limitation du débit des exécutions de requêtes de données

ToolJet limite le débit d'exécution d'une requête de données (depuis le bouton Exécuter/Aperçu de l'éditeur de requêtes, ou depuis une application lancée) afin de se protéger contre une boucle incontrôlée, par exemple un gestionnaire `onChange` récursif ou un script client, qui pourrait sinon saturer le pool de connexions et les sources de données en aval.

La limite est appliquée par `(utilisateur, application)` — les utilisateurs connectés sont identifiés par leur ID utilisateur, et les visiteurs anonymes sur des applications publiques sont identifiés par leur adresse IP. Une seule limite est partagée entre les exécutions dans le builder et dans le viewer, afin qu'une application incontrôlée ne puisse pas priver de ressources les autres applications ou les autres utilisateurs de la même application. Elle est activée par défaut.

| Variable | Description | Par défaut | Unité |
|-----------|-------------|---------|-------|
| `DISABLE_DATA_QUERY_RUN_THROTTLE` | Définissez sur `true` pour contourner entièrement la limitation. Lorsque non défini, la limitation est activée. | non défini | booléen |
| `DATA_QUERY_RUN_TTL` | Durée de la fenêtre de limitation de débit. | 1000 | millisecondes |
| `DATA_QUERY_RUN_LIMIT` | Nombre maximal d'exécutions de requêtes autorisées par fenêtre, par `(utilisateur, application)`. | 50 | exécutions |

Les requêtes dépassant la limite reçoivent une réponse HTTP `429`.

:::info
Les compteurs de limitation de débit sont suivis par pod. Dans un déploiement multi-pod, la limite effective est `DATA_QUERY_RUN_LIMIT` multipliée par le nombre de pods, jusqu'à ce qu'un stockage de compteur partagé (basé sur Redis) soit ajouté.
:::

#### Configuration d'un identifiant autre que l'e-mail pour l'OIDC ToolJet

Vous pouvez configurer OIDC en utilisant un identifiant autre que l'e-mail pour authentifier les utilisateurs auprès de ToolJet (par exemple, un identifiant d'employé) en définissant les variables d'environnement suivantes.

| Variable                  | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `SSO_UNIQUE_ID_FIELD`     | Nom du champ identifiant unique renvoyé par le fournisseur d'identité (IdP).         |
| `SSO_CUSTOM_EMAIL_DOMAIN` | Nom de domaine qui sera utilisé pour construire un identifiant d'e-mail factice. |

Pour en savoir plus, consultez [cette section](/docs/user-management/sso/oidc/setup#configuring-tooljet-oidc-with-non-email-identifier).

#### Configurer des règles de validation de mot de passe plus strictes

ToolJet vous permet d'imposer une règle de complexité de mot de passe plus stricte. Par défaut, le mot de passe de connexion doit comporter au moins 5 caractères et tout caractère peut être utilisé. Pour imposer une validation de mot de passe plus stricte, utilisez la variable d'environnement suivante :

- `ENABLE_PASSWORD_COMPLEXITY_RULES = true`

Lorsque la valeur est **false**, les mots de passe suivent les validations par défaut. Lorsque la valeur est **true**, les mots de passe doivent respecter toutes les règles suivantes :
| Règle | Exigence |
|-----------|-------------|
| Longueur du mot de passe | 12 à 24 caractères |
| Lettres majuscules | A-Z |
| Lettres minuscules | a-z |
| Chiffres | 0-9 |
| Caractères spéciaux | ! @ # $ % ^ & \* ( ) \_ + - = \{ \} [ ] : ; ” ' , . ? / \ \| |

:::info
Ces validations s'appliquent aussi bien au niveau de l'instance qu'au niveau du workspace.
:::

#### Configurer GitSync via des variables d'environnement

:::warning BETA
Cette fonctionnalité est actuellement en version bêta et n'est pas recommandée pour un usage en production.
Pour des instructions de configuration complètes, les clés spécifiques à chaque fournisseur et des exemples Docker Compose, consultez [Configurer GitSync via des variables d'environnement](/docs/beta/gitsync-env-vars).
:::

GitSync peut être configuré à l'aide de variables d'environnement plutôt que via l'interface utilisateur de ToolJet, ce qui est utile pour les configurations auto-hébergées où vous souhaitez automatiser ou versionner votre configuration GitSync.

ToolJet prend en charge **GitHub (HTTPS)**, **GitLab** et **Git (SSH)**. Par exemple, pour configurer GitSync avec GitHub (HTTPS), définissez les variables suivantes :

| **Clé** | **Description** |
| --- | --- |
| `GITHUB_URL` | L'URL HTTPS de votre dépôt GitHub. (par exemple `https://github.com/your-org/your-repo`) |
| `GITHUB_BRANCH` | La branche à synchroniser. |
| `GITHUB_APP_ID` | L'ID de votre application GitHub. |
| `GITHUB_INSTALLATION_ID` | L'ID d'installation de votre application GitHub. |
| `GITHUB_PRIVATE_KEY` | La clé privée générée lors de la création de l'application GitHub. Échappez les retours à la ligne avec `\n`. |

#### Configurer la clé de licence via une variable d'environnement

:::warning BETA
Cette fonctionnalité est actuellement en version bêta et n'est pas recommandée pour un usage en production.
:::

La clé de licence peut être configurée via une variable d'environnement afin d'éviter de la ressaisir dans l'interface utilisateur à chaque nouvelle instance. La définition de `TJ_LICENSE` garantit que la licence est appliquée automatiquement au démarrage, sans configuration manuelle.

| **Variable** | **Description** |
|:--- |:--- |
| `TJ_LICENSE` | Votre clé de licence ToolJet. Lorsqu'elle est définie, le champ de clé de licence de la page **Paramètres** est automatiquement pré-rempli à partir de cette variable. |

**Fonctionnement :**

- Lorsque la variable `TJ_LICENSE` est définie, la page **Paramètres** affiche le champ de clé de licence pré-rempli avec l'espace réservé `{{TJ_LICENSE_KEY}}`, indiquant que la valeur provient de l'environnement.
- Le champ sera désactivé et le bascule sera automatiquement placé sur le mode **Env variable**.
- Pour revenir à la saisie manuelle de la clé via l'interface utilisateur, utilisez le bascule de la page **Paramètres** pour passer au mode **UI**.

<img className="screenshot-full img-m" src="/img/env-vars/prefilled-license-key.png" alt="Prefilled License Key" />

### Intégrations tierces

#### Slack

Pour utiliser Slack comme source de données dans ToolJet, créez une application Slack et définissez :

- `SLACK_CLIENT_ID` : ID client de l'application Slack
- `SLACK_CLIENT_SECRET` : secret client de l'application Slack

#### Google OAuth

Pour connecter ToolJet aux services Google tels que Google Sheets, créez des identifiants OAuth dans Google Cloud Console.

- `GOOGLE_CLIENT_ID` : ID client OAuth Google
- `GOOGLE_CLIENT_SECRET` : secret client OAuth Google

#### API Google Maps

Pour utiliser le widget Maps dans ToolJet, créez une clé API Google Maps et définissez :

- `GOOGLE_MAPS_API_KEY` : clé API Google Maps

#### Surveillance des applications (APM)

- `APM_VENDOR=sentry` : définit le fournisseur APM.
- `SENTRY_DNS` : DSN du projet Sentry.
- `SENTRY_DEBUG=true/false` : active/désactive le débogage Sentry.

#### Sécurité et authentification

Par défaut, ToolJet envoie des mises à jour du nombre d'utilisateurs toutes les 24 heures. Pour désactiver cela, utilisez :

- `DISABLE_TOOLJET_TELEMETRY=true` : désactive la télémétrie (activée par défaut).

#### Authentification unique (SSO)

Activez le SSO Google ou GitHub avec ces variables d'environnement :

**SSO Google :**

- `SSO_GOOGLE_OAUTH2_CLIENT_ID` : ID client OAuth Google

**SSO GitHub :**

- `SSO_GIT_OAUTH2_CLIENT_ID` : ID client OAuth GitHub
- `SSO_GIT_OAUTH2_CLIENT_SECRET` : secret client OAuth GitHub
- `SSO_GIT_OAUTH2_HOST` : hôte GitHub si auto-hébergé

**Paramètres SSO généraux :**

- `SSO_ACCEPTED_DOMAINS` : liste de domaines e-mail autorisés, séparés par des virgules
- `SSO_DISABLE_SIGNUPS=true` : restreint les inscriptions aux utilisateurs existants

#### Synchronisation des groupes

Si l'une des variables d'environnement suivantes est définie sur true, la synchronisation des groupes sera ignorée lors du processus de connexion pour le fournisseur SSO correspondant :

- `DISABLE_LDAP_GROUP_SYNC=true` – désactive la synchronisation des groupes pour LDAP lors de la connexion.
- `DISABLE_SAML_GROUP_SYNC=true` – désactive la synchronisation des groupes pour SAML lors de la connexion.

#### Transfert des cookies pour l'API REST

Par défaut, ToolJet ne transfère pas les cookies avec les requêtes de l'API REST. Pour activer cela (auto-hébergé uniquement), définissez :

- `FORWARD_RESTAPI_COOKIES=true` : permet de transférer les cookies avec les requêtes de l'API REST.

#### Chemin des ressources statiques

Ceci est requis lorsque les ressources du client doivent être chargées depuis un autre emplacement (par exemple : un CDN). Il peut s'agir d'un chemin absolu ou relatif au fichier HTML principal.

- `ASSET_PATH` : chemin de chargement des ressources front-end (par exemple, `https://app.tooljet.com/`)

## Configurations supplémentaires

#### Chemin du fichier de journal

- `LOG_FILE_PATH` : chemin de stockage des journaux d'audit (par exemple, `tooljet/log/tooljet-audit.log`)

#### Intégration d'applications privées

Par défaut, seules les applications publiques peuvent être intégrées. Pour autoriser l'intégration d'applications ToolJet privées, définissez :

- `ENABLE_PRIVATE_APP_EMBED=true/false` : permet d'intégrer des applications ToolJet privées.

**Remarque : disponible dans ToolJet Enterprise 2.8.0+ et Community/Cloud 2.10.0+.**

#### Langue par défaut

Définissez la langue par défaut à l'aide de la variable `LANGUAGE`. Options prises en charge :

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

| Langue | Code | Nom natif |
| -------- | ---- | ----------- |
| Anglais  | en   | English     |
| Français   | fr   | Français    |
| Espagnol  | es   | Español     |
| Italien  | it   | Italiano    |

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

| Langue   | Code | Nom natif      |
| ---------- | ---- | ---------------- |
| Indonésien | id   | Bahasa Indonesia |
| Ukrainien  | uk   | Українська       |
| Russe    | ru   | Русский          |
| Allemand     | de   | Deutsch          |

</div>

</div>

Exemple : `LANGUAGE=fr` (pour le français).

**Remarque :** ce paramètre n'est pas disponible sur ToolJet Cloud.

#### Observabilité

ToolJet prend en charge OpenTelemetry (OTEL) pour une observabilité et une surveillance complètes. Activez la collecte de métriques pour surveiller les performances des applications, les exécutions de requêtes et l'état du système.

**Configuration de base :**

- `ENABLE_OTEL` : définissez sur `true` pour activer la collecte de métriques OpenTelemetry (par défaut : `false`)
- `OTEL_EXPORTER_OTLP_TRACES` : URL du point de terminaison des traces OTLP (par défaut : `http://localhost:4318/v1/traces`)
- `OTEL_EXPORTER_OTLP_METRICS` : URL du point de terminaison des métriques OTLP (par défaut : `http://localhost:4318/v1/metrics`)
- `OTEL_SERVICE_NAME` : identifiant du service pour les métriques (par défaut : `tooljet`)
- `OTEL_EXPORTER_OTLP_HEADERS` : en-têtes d'authentification pour le point de terminaison OTLP (facultatif, format : `key1=value1,key2=value2`)

**Configuration avancée :**

- `OTEL_LOG_LEVEL` : niveau de journalisation de débogage pour OTEL (utilisez `debug` pour des journaux détaillés)
- `OTEL_ACTIVE_USER_WINDOW_MINUTES` : fenêtre d'activité pour le suivi des utilisateurs simultanés, en minutes (par défaut : `5`)
- `OTEL_MAX_TRACKED_USERS` : nombre maximal d'utilisateurs/sessions suivis (par défaut : `10000`)
- `OTEL_INCLUDE_QUERY_TEXT` : inclure le texte réel de la requête dans les métriques - **ATTENTION :** crée une cardinalité élevée (par défaut : `false`)

:::warning Cardinalité élevée
N'activez `OTEL_INCLUDE_QUERY_TEXT=true` que pour le débogage. Cela crée des métriques à cardinalité élevée qui peuvent impacter les performances de Prometheus. Utilisez un collecteur OTEL pour filtrer cette étiquette en production.
:::

Pour des instructions de configuration complètes, des détails sur les métriques et l'intégration du tableau de bord Grafana, consultez la documentation [Observabilité OpenTelemetry](/docs/tj-setup/observability/observability-otel).

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
