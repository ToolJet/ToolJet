---
id: configuration
title: Setting Up Outgoing Emails (SMTP)
---

<PlanBadge type="self-hosted" />

Configurer un serveur SMTP permet à votre instance ToolJet auto-hébergée d'envoyer automatiquement des e-mails sortants. Sans cette configuration, les flux suivants basés sur l'e-mail ne fonctionneront pas :

- **Réinitialisation de mot de passe** : les utilisateurs qui ont oublié leur mot de passe ne peuvent pas recevoir de lien de réinitialisation
- **Invitations au workspace** : les utilisateurs ne recevront pas l'e-mail d'invitation
- **Activation de compte** : les e-mails de confirmation d'inscription ne seront pas délivrés

Il existe deux façons de configurer le SMTP dans ToolJet :

1. **[Via l'interface graphique](#configuration-using-gui)** — Saisissez les identifiants directement dans le dashboard ToolJet. Idéal pour des configurations rapides et des tests.
2. **[Via des variables d'environnement](#configuration-with-environment-variables)** — Définissez les identifiants dans votre fichier `.env`. Recommandé pour les environnements de production où les secrets ne doivent pas être stockés dans l'interface utilisateur.

## Prérequis

Avant de commencer, assurez-vous d'avoir :
- Un accès Super Admin à votre instance ToolJet
- Les identifiants SMTP de votre fournisseur de service e-mail (hôte, port, nom d'utilisateur, mot de passe)

<!-- :::info
If you upgraded from a version prior to v2.62.0, any SMTP variables already present in your `.env` file will be automatically migrated to the UI.
::: -->

## Configuration via l'interface graphique {#configuration-using-gui}

1. Allez dans **Settings** dans ToolJet.
2. Ouvrez l'onglet **Email protocol (SMTP)**.
3. Activez le bouton bascule **Email protocol (SMTP)** pour l'activer.
4. Remplissez les champs suivants :
    | Champ           | Description                         | Exemple              |
    |-----------------|-------------------------------------|----------------------|
    | Host            | Nom d'hôte du serveur SMTP          | smtp.gmail.com       |
    | Port            | Numéro de port du serveur SMTP      | 587                  |
    | User            | Nom d'utilisateur du compte SMTP    | hello@example.com    |
    | Password        | Mot de passe ou jeton d'application du compte SMTP | your-app-password |
    | Sender's email  | L'adresse « From » sur les e-mails sortants | hello@example.com |
5. Cliquez sur **Save changes**.
    <img className="screenshot-full img-full"  style={{ marginTop:'10px' }} src="/img/enterprise/smtp/configuration-v3.png" alt="SMTP Configuration GUI" />

## Configuration via des variables d'environnement {#configuration-with-environment-variables}

Vous pouvez configurer le SMTP entièrement via des variables d'environnement et faire en sorte que ToolJet lise ces valeurs directement, en gardant les identifiants hors de l'interface utilisateur.

<img className="screenshot-full img-l" style={{ marginBottom:'15px' }} src="/img/enterprise/smtp/configuration-v2-env.png" alt="SMTP Configuration With Environment Variables" />

Ajoutez les variables suivantes à votre fichier `.env` :

```bash
DEFAULT_FROM_EMAIL=hello@tooljet.io
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_DOMAIN=smtp.mailgun.org
SMTP_PORT=587
SMTP_SSL=false
SMTP_DISABLED=false
```

**Comment cela fonctionne :**
- Sur les nouvelles installations, si des variables SMTP sont présentes dans `.env`, le bouton bascule **Apply configuration from environment variables** est automatiquement activé.
- Lorsque le bouton bascule est activé, les champs SMTP de l'interface utilisateur sont renseignés à partir des variables d'environnement et deviennent en lecture seule.
- Désactiver le bouton bascule vous permet de modifier manuellement ces valeurs dans l'interface utilisateur.

## Questions fréquentes

<details>
<summary>Les utilisateurs ne reçoivent pas les e-mails de réinitialisation de mot de passe. Que se passe-t-il ?</summary>

Cela signifie presque toujours que le SMTP n'est pas configuré ou est mal configuré. Demandez à votre Super Admin d'aller dans **Settings → Email protocol (SMTP)** et de vérifier que :
- Le bouton bascule est activé
- L'hôte, le port, le nom d'utilisateur et le mot de passe sont corrects
- L'adresse e-mail de l'expéditeur est renseignée

Si vous utilisez des variables d'environnement, assurez-vous que `SMTP_DISABLED` est défini sur `false`.

</details>

<details>
<summary>Les e-mails d'invitation ne sont pas délivrés aux nouveaux utilisateurs.</summary>

Les e-mails d'invitation au workspace sont envoyés via votre serveur SMTP configuré. Si les invités ne les reçoivent pas, vérifiez que le SMTP est activé et correctement configuré. Demandez également aux invités de vérifier leur dossier spam/courrier indésirable, car les nouveaux domaines expéditeurs sont parfois filtrés.

</details>

<details>
<summary>Le SMTP est configuré mais les e-mails ne sont toujours pas envoyés.</summary>

Suivez cette liste de vérification :
1. Confirmez que le bouton bascule est activé et que vous avez cliqué sur **Save changes**.
2. Vérifiez à nouveau les identifiants - copiez-collez depuis le dashboard de votre fournisseur pour éviter les erreurs de frappe.
3. Vérifiez que le port `587` (ou le port que vous utilisez) n'est pas bloqué par le pare-feu de votre serveur ou votre groupe de sécurité cloud.
4. Si vous utilisez Gmail, assurez-vous d'utiliser un mot de passe d'application (App Password), et non votre mot de passe de compte habituel.
5. Consultez les journaux du serveur ToolJet pour détecter les erreurs liées au SMTP (`connection refused`, `authentication failed`, etc.).

</details>

<details>
<summary>Puis-je utiliser Gmail ou Google Workspace comme serveur SMTP ?</summary>

Oui. Utilisez `smtp.gmail.com` sur le port `587`. Pour le mot de passe, vous devez générer un **mot de passe d'application** (App Password) depuis votre compte Google (Google n'autorise pas les mots de passe de compte habituels pour le SMTP). Les mots de passe d'application sont disponibles sous **Google Account → Security → 2-Step Verification → App passwords**.

</details>

<details>
<summary>Puis-je utiliser SendGrid, Mailgun, AWS SES ou un autre fournisseur ?</summary>

Oui, tout fournisseur exposant des identifiants SMTP standard fonctionne. Consultez le guide [Fournisseurs d'e-mails](./email-providers.md) pour des paramètres et exemples spécifiques à chaque fournisseur.

</details>

<details>
<summary>Les champs SMTP dans l'interface utilisateur sont grisés et je ne peux pas les modifier.</summary>

Cela signifie que le bouton bascule **Apply configuration from environment variables** est activé. ToolJet lit les paramètres SMTP depuis votre fichier `.env` et les champs de l'interface utilisateur sont en lecture seule. Pour les modifier manuellement, désactivez ce bouton bascule. Si vous souhaitez continuer à utiliser des variables d'environnement, mettez à jour les valeurs dans votre fichier `.env` et redémarrez ToolJet.

</details>

<details>
<summary>Les e-mails sont envoyés mais arrivent dans les spams.</summary>

Il s'agit d'un problème de configuration DNS, et non d'un problème ToolJet. Demandez à votre administrateur de domaine de vérifier :
- **L'enregistrement SPF** — autorise votre fournisseur SMTP à envoyer des e-mails au nom de votre domaine
- **DKIM** — ajoute une signature cryptographique aux e-mails sortants
- **DMARC** — indique aux serveurs destinataires quoi faire des e-mails non authentifiés

La plupart des fournisseurs de messagerie proposent un guide pour configurer ces enregistrements pour votre domaine.

</details>
