---
id: reset-password
title: Reset Password
---

Lorsque la connexion par mot de passe est activée, il existe deux façons pour un utilisateur de réinitialiser son mot de passe. La première méthode permet à l'utilisateur de réinitialiser lui-même son mot de passe. La seconde méthode permet à un **Super Admin** de réinitialiser le mot de passe pour un utilisateur.

## Mot de passe oublié

1. Sur la page de connexion, cliquez sur **Forgot Password**.

2. Saisissez l'adresse e-mail enregistrée associée au compte, puis cliquez sur le bouton **Send a reset link**.

    <img className="screenshot-full" src="/img/user-management/profile-management/reset-password/forget-password.png" alt="General Settings: Reset Password" />

3. Recevez un lien de réinitialisation de mot de passe par e-mail.

4. Cliquez sur le lien pour être redirigé vers la page de réinitialisation du mot de passe.

    <img className="screenshot-full" src="/img/user-management/profile-management/reset-password/mail.png" alt="General Settings: Reset Password" />

## Réinitialisation du mot de passe par le Super Admin {#super-admin-reset-password}

Si un utilisateur oublie son mot de passe ou si celui-ci doit être mis à jour, le super admin peut facilement réinitialiser le mot de passe de n'importe quel utilisateur de l'instance en suivant ces étapes :

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Settings > All Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/instance-settings/all-users`)

3. Repérez l'utilisateur dont le mot de passe doit être réinitialisé.

4. Cliquez sur l'icône à trois points (kebab) à droite du nom de l'utilisateur et sélectionnez **Reset Password**.

    <img className="screenshot-full" src="/img/user-management/profile-management/reset-password/super-admin-reset.png" alt="General Settings: Reset Password" />

5. Une fenêtre modale apparaîtra avec deux options pour réinitialiser le mot de passe :

    a. **Automatically Generate Password** : Sélectionner cette option générera automatiquement un nouveau mot de passe pour l'utilisateur. <br/>
    b. **Create Password** : Sélectionner cette option permettra au Super Admin de créer un nouveau mot de passe pour l'utilisateur.

    <img className="screenshot-full img-s" src="/img/user-management/profile-management/reset-password/auto-password.png" alt="General Settings: Reset Password" />

