---
id: custom-domain
title: Custom Domain
---

Un domaine personnalisé est un nom de domaine défini par l'utilisateur qui peut être configuré pour accéder à une application via une URL spécifique et reconnaissable.

### Pourquoi utiliser un domaine personnalisé ?

L'utilisation d'un domaine personnalisé permet aux organisations d'accéder à ToolJet via leur propre URL de marque au lieu de l'URL ToolJet par défaut. Par exemple, au lieu d'utiliser une URL de workspace générique, les équipes peuvent accéder à leurs applications via une URL comme `tools.yourcompany.com`.

Cela aide les organisations à :

- Maintenir une image de marque cohérente pour les outils et applications internes.
- Offrir une expérience plus professionnelle et fiable aux utilisateurs finaux des applications créées avec ToolJet.
- Intégrer ToolJet plus naturellement dans l'infrastructure existante de l'entreprise et dans les portails internes.

Pour les équipes qui créent des outils internes, accéder aux applications via un domaine d'entreprise donne l'impression que la plateforme fait partie intégrante de l'écosystème produit de l'organisation, plutôt que d'être un outil tiers.

## Auto-hébergé

Dans un déploiement auto-hébergé de ToolJet, vous pouvez configurer un domaine personnalisé en définissant la variable d'environnement `TOOLJET_HOST `.

### Prérequis

- Une instance auto-hébergée de ToolJet en cours d'exécution.
- Un nom de domaine enregistré.
- Un enregistrement DNS configuré pointant votre domaine vers le serveur ToolJet.

### Étapes de configuration

#### 1. Définir la variable d'environnement TOOLJET_HOST

La variable `TOOLJET_HOST` définit l'URL publique à laquelle ToolJet sera accessible. Vous devez mettre à jour cette variable avec le domaine souhaité.

| Variable       | Description                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `TOOLJET_HOST` | l'URL publique du client ToolJet ( ex : `https://app.corp.com`,`https://corp.org`,`https://corp.ai` ) |

#### 2. Redémarrer les services

Après avoir défini la variable d'environnement et les configurations DNS, redémarrez votre déploiement ToolJet pour appliquer les modifications.

## ToolJet Cloud

<PlanBadge type="team" />

ToolJet Cloud vous permet d'associer un domaine ou sous-domaine personnalisé à votre workspace, afin que votre équipe puisse accéder à ToolJet via une URL telle que `tools.yourcompany.com` au lieu de l'URL ToolJet Cloud par défaut.

### Association de domaine au niveau du workspace

Dans ToolJet Cloud, les domaines personnalisés sont configurés par workspace. Cela signifie que le domaine que vous configurez s'appliquera uniquement à ce workspace spécifique et à toutes les applications qu'il contient.

Par exemple :
| Workspace | Domaine personnalisé |
| -------------------- | --------------------------- |
| Workspace Finance | `finance-tools.company.com` |
| Workspace Opérations | `ops-tools.company.com` |

Une fois configuré, les utilisateurs accéderont au workspace et à ses applications via le domaine personnalisé au lieu de l'URL ToolJet Cloud par défaut.

### Prérequis

- Un nom de domaine enregistré avec accès à ses paramètres DNS.
- Un workspace ToolJet Cloud sur un plan pris en charge (Trial, Teams ou Enterprise).

### Étapes de configuration

#### 1. Créer un enregistrement DNS

Connectez-vous à la console de gestion DNS de votre fournisseur de domaine et créez un enregistrement **CNAME** qui fait pointer le sous-domaine souhaité vers `app.tooljet.com`.

| Type d'enregistrement | Hôte/Nom                             | Valeur             |
| ----------- | ------------------------------------- | ----------------- |
| CNAME       | `tools` (ou le sous-domaine de votre choix) | `app.tooljet.com` |

Par exemple, si votre domaine est `yourcompany.com` et que vous souhaitez utiliser `tools.yourcompany.com`, créez un enregistrement CNAME avec l'hôte `tools` pointant vers `app.tooljet.com`.

:::info
Si vous souhaitez utiliser un domaine racine (par exemple, `yourcompany.com`) au lieu d'un sous-domaine, le type d'enregistrement dépend de votre fournisseur DNS. Certains fournisseurs comme Cloudflare prennent en charge l'aplatissement CNAME (CNAME flattening) au niveau racine, tandis que d'autres (comme AWS Route 53) nécessitent un enregistrement **ALIAS**. Consultez la documentation de votre fournisseur DNS pour connaître le type d'enregistrement pris en charge au niveau du domaine racine.
:::

#### 2. Ajouter le domaine dans ToolJet

1. Allez dans **Settings** > **Custom Domain** dans votre workspace ToolJet Cloud.
2. Saisissez le domaine ou sous-domaine configuré à l'étape précédente (par exemple, `tools.yourcompany.com`).
3. Cliquez sur _Save changes_.

#### 3. Attendre la propagation DNS

Les modifications DNS peuvent prendre quelques minutes pour se propager, selon votre fournisseur DNS et les paramètres TTL.

#### 4. Tester la connexion

Après un certain temps, cliquez sur **Test connection** sur la page des paramètres de domaine personnalisé pour vérifier que votre domaine est correctement associé. Une fois le test réussi, votre workspace ToolJet sera accessible via votre domaine personnalisé.

### Impact de la mise à jour d'un domaine personnalisé

Lorsqu'un domaine personnalisé est configuré ou mis à jour pour un workspace ToolJet Cloud, le workspace commencera à se résoudre depuis le nouveau domaine une fois la propagation DNS terminée.

Étant donné que les flux d'authentification dépendent de l'URL de l'application, vous devrez peut-être mettre à jour les URL de redirection auprès de vos fournisseurs d'authentification. Par exemple, si vous utilisez des fournisseurs SSO tels qu'Okta, Azure AD ou Google OAuth, assurez-vous que les URL de redirection/callback incluent le nouveau domaine personnalisé.

Si ces URL ne sont pas mises à jour, les utilisateurs peuvent rencontrer des erreurs d'authentification lors de la connexion.
