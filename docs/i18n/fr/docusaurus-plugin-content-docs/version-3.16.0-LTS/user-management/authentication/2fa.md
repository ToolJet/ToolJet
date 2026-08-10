---
id: 2fa
title: Two Factor Authentication
---

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

L'authentification à deux facteurs (2FA) ajoute une couche de sécurité supplémentaire à votre connexion ToolJet en exigeant un mot de passe à usage unique basé sur le temps (TOTP) provenant d'une application d'authentification, en plus de votre e-mail et de votre mot de passe. ToolJet fonctionne avec n'importe quelle application d'authentification TOTP, comme 1Password, Google Authenticator ou Microsoft Authenticator.

:::info
L'authentification à deux facteurs s'applique uniquement aux comptes qui se connectent avec un mot de passe. Elle ne s'applique pas aux utilisateurs qui se connectent via SSO.
:::

## Activer l'authentification à deux facteurs

Rôle requis : **Super Admin**

Avant que les utilisateurs puissent configurer la 2FA sur leurs comptes, un super admin doit activer cette fonctionnalité pour l'instance.

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Settings > Security**. <br/>
   (URL d'exemple - `https://app.corp.com/settings/security`)
   <img className="screenshot-full img-full" src="/img/user-management/authentication/2fa/security.png" alt="Security Tab" />
3. Activez le bouton bascule **Two-factor authentication**.

:::note
En activant ce bouton bascule, la 2FA n'est pas imposée à tout le monde. Cela la rend simplement disponible - elle s'applique à un utilisateur uniquement après que celui-ci a configuré manuellement la 2FA depuis son propre profil.
:::

## Configurer l'authentification à deux facteurs depuis le profil

Une fois que le Super Admin a activé l'authentification à deux facteurs, les utilisateurs peuvent la configurer depuis leur profil.

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Profile Settings**. <br/>
    (URL d'exemple - `https://app.corp.com/nexus/profile-settings`)
3. Sur la carte **Two factor authentication**, cliquez sur **Add app**.
   <img className="screenshot-full img-full" src="/img/user-management/authentication/2fa/profile.png" alt="Profile Settings" />
4. Scannez le code QR avec une application d'authentification, ou si vous ne pouvez pas le scanner, copiez la clé secrète affichée sous le code QR et saisissez-la manuellement dans votre application.
5. Saisissez le code à 6 chiffres généré par l'application et cliquez sur **Submit**.
   <img className="screenshot-full img-s" src="/img/user-management/authentication/2fa/qr.png" alt="QR" />

Une fois confirmé, le statut de la carte passe à **Active**, et un code de votre application d'authentification vous sera demandé chaque fois que vous vous connecterez avec votre mot de passe.

## Réinitialiser l'authentification à deux facteurs

### Niveau administrateur

Rôle requis : **Super Admin**

Si un utilisateur perd l'accès à son application d'authentification, un super admin peut réinitialiser la 2FA pour cet utilisateur :

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Settings > All Users**. <br/>
   (URL d'exemple - `https://app.corp.com/settings/all-users`)
3. Trouvez l'utilisateur dans la liste. Les utilisateurs ayant activé la 2FA affichent **Enabled** dans la colonne **2FA**.
4. Cliquez sur l'icône à trois points (kebab) à droite de la ligne de l'utilisateur et sélectionnez **Reset 2FA**. <br/>
    Cette option n'apparaît que pour les utilisateurs ayant actuellement la 2FA activée. <br/>
   <img className="screenshot-full img-s" src="/img/user-management/authentication/2fa/admin-reset.png" alt="Reset" />

La 2FA de l'utilisateur est désactivée, et il peut la reconfigurer depuis **Profile Settings**.

### Niveau utilisateur

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Profile Settings**. <br/>
    (URL d'exemple - `https://app.corp.com/nexus/profile-settings`)
3. Sur la carte **Two factor authentication**, cliquez sur **Reset**.
4. Cela rouvrira l'écran de configuration, afin que vous puissiez scanner le code QR ou copier le secret sur un nouvel appareil, puis reconfirmer avec un nouveau code. Utilisez cette option si vous changez d'appareil ou réinstallez votre application d'authentification.

## Désactiver l'authentification à deux facteurs

### Niveau administrateur

Rôle requis : **Super Admin**

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Settings > Security**. <br/>
   (URL d'exemple - `https://app.corp.com/settings/security`)
3. Désactivez le bouton bascule **Two-factor authentication**.

### Niveau utilisateur

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Profile Settings**. <br/>
    (URL d'exemple - `https://app.corp.com/nexus/profile-settings`)
3. Sur la carte **Two factor authentication**, cliquez sur **Disable**.
4. Saisissez votre code actuel à 6 chiffres pour désactiver la 2FA sur votre compte.

## Se connecter avec l'authentification à deux facteurs

Si vous avez activé la 2FA sur votre compte, après avoir saisi votre e-mail et votre mot de passe, un code actuel à 6 chiffres provenant de votre application d'authentification vous sera demandé. Saisissez le code et cliquez sur **Submit** pour vous connecter.
<img className="screenshot-full img-full" src="/img/user-management/authentication/2fa/login.png" alt="Security Tab" />

Vous ne pouvez pas accéder à votre application d'authentification ? Cliquez sur **Trouble signing in?** sur l'écran pour obtenir des instructions de récupération.

:::note
1. Les codes se renouvellent toutes les 30 secondes. Si votre code est constamment rejeté, vérifiez que l'horloge de votre appareil est synchronisée - les applications d'authentification dépendent d'une heure précise pour générer des codes valides.
2. Si vous fermez l'onglet pendant la saisie de l'OTP, vous devrez reprendre le processus de connexion depuis le début, c'est-à-dire saisir à nouveau votre e-mail et votre mot de passe.
:::

## Vérifier quels utilisateurs ont activé la 2FA

Rôle requis : **Super Admin**

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Settings > All Users**. <br/>
   (URL d'exemple - `https://app.corp.com/settings/all-users`) <br/>
3. Vérifiez la colonne **2FA** pour chaque utilisateur - elle affiche **Enabled** ou **Disabled** selon que cet utilisateur a activé ou non la 2FA.
<img className="screenshot-full img-full" src="/img/user-management/authentication/2fa/check-enable.png" alt="Security Tab" />
