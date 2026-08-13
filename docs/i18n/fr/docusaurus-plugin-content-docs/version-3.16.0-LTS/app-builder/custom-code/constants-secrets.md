---
id: constants-secrets
title: Référencer les constantes et les secrets 
---

Lorsque vous créez des applications dans ToolJet, vous avez souvent besoin de réutiliser des valeurs fixes (telles que des URL ou des indicateurs d'environnement) ou de gérer de manière sécurisée des informations sensibles (telles que des clés API ou des identifiants de base de données). Les [constantes et secrets de l'espace de travail](/docs/security/constants/) simplifient ce processus tout en le rendant sûr et facile à maintenir, en particulier lorsque vous travaillez sur plusieurs applications ou avec des équipes plus importantes. 

Dans ce guide, vous apprendrez à utiliser les constantes et secrets de l'espace de travail au sein de vos applications ToolJet. 

Vous pouvez créer une constante ou un secret global directement depuis le Dashboard ToolJet. Une fois créés, ces constantes et secrets peuvent être référencés par les créateurs d'applications dans l'app-builder. 

<img className="screenshot-full img-full" style={{marginBottom:"15px"}} src="/img/security/constants/constants-secret/env-specific-const-v2.png" alt="CMS Page"/>

## Caractéristiques et utilisation

Les constantes et les secrets vous permettent tous deux de stocker des valeurs réutilisables pour vos applications. Cependant, ils répondent à des besoins différents et présentent des caractéristiques distinctes, comme indiqué ci-dessous :

|   Caractéristique        |       Constantes globales        |         Secrets           |
|-------------------------|:-----------------------------:|:-------------------------:|
| Composants              |             ✅                |           ❌              |
| Requêtes de données          |             ✅                |           ✅              |
| Chiffré en base de données         |             ✅                |           ✅              |
| Masqué côté frontend      |             ❌                |           ✅              |
| Résolu côté client |             ✅                |           ❌              |
| Résolu côté serveur |             ❌                |           ✅              |
| Convention de nommage       | `{{constants.constant_name}}` | `{{secrets.secret_name}}` |

## Contrôle d'accès

Pour garantir la sécurité et la gouvernance :
- Seuls les Admins peuvent créer, modifier ou supprimer des constantes et des secrets.
- Les créateurs d'applications (Builders) peuvent les référencer dans leurs applications mais ne peuvent pas les modifier.

## Cas d'usage

### Valeurs réutilisables entre applications avec les constantes globales

Imaginez que vous créez une application qui récupère les prix de produits depuis une API. L'URL de base de votre API est la même pour plusieurs requêtes.

Plutôt que de coder cette URL en dur partout, définissez une constante globale. Ainsi, si l'URL de base change un jour, vous n'avez besoin de la mettre à jour qu'en un seul endroit, ce qui réduit les erreurs et améliore la maintenabilité.

- Nom : `API_BASE_URL`
- Valeur : `https://api.example.com/v1`

Vous pouvez désormais la référencer dans vos requêtes ou votre code personnalisé :

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/constants_usecase.png" alt="constant usecase"/>

### Gérer les identifiants sensibles avec les secrets

Supposons que votre application utilise un service tiers tel qu'OpenAI qui nécessite une clé API. Stocker cette clé directement dans les requêtes ou le code n'est pas une bonne pratique. Définissez plutôt un secret :

- Nom : `OPENAI_API_KEY`
- Valeur : `sk_****************`

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/secret_usecase.png" alt="secret usecase"/>

Les secrets sont chiffrés et ne sont accessibles qu'au sein des requêtes et des sources de données. Ils ne sont pas accessibles dans les composants, ce qui garantit que vos identifiants restent sécurisés.
