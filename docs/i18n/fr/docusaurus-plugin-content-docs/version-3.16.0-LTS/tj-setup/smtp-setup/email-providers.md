---
id: email-providers
title: Commonly Used Email Providers
---

Voici quelques paramètres généraux pour les fournisseurs d'e-mails les plus couramment utilisés :

| Fournisseur        | Hôte                 | Port             | Nom d'utilisateur | Mot de passe  | E-mail de l'expéditeur |
|--------------------|----------------------|------------------|---------------|-----------|----------------|
| Gmail              | smtp.gmail.com       | 587 ou 465 (SSL) | E-mail        | Mot de passe  | E-mail         |
| Yahoo Mail         | smtp.mail.yahoo.com  | 465 (SSL)        | E-mail        | Mot de passe  | E-mail         |
| Outlook.com/Hotmail| smtp.office365.com   | 587 ou 465 (SSL) | E-mail        | Mot de passe  | E-mail         |
| Zoho Mail          | smtp.zoho.com        | 587 ou 465 (SSL) | E-mail        | Mot de passe  | E-mail         |
| SendGrid           | smtp.sendgrid.net    | 587 ou 465 (SSL) | apikey        | Clé API   | E-mail         |
| Mailgun            | smtp.mailgun.org     | 587 ou 465 (SSL) | Nom d'utilisateur SMTP | Mot de passe  | E-mail |


## SendGrid

Pour configurer SendGrid, utilisez **`apikey`** comme nom d'utilisateur et la clé API générée comme mot de passe.

<img className="screenshot-full img-l" src="/img/enterprise/smtp/sendgrid-config.png" alt="SMTP Configuration Without Environment Variables" />

#### Étapes pour générer une clé API
1. Connectez-vous à votre compte [SendGrid](https://sendgrid.com/en-us).

2. Accédez à la page [API Keys](https://app.sendgrid.com/settings/api_keys) dans les paramètres.

3. Générez une nouvelle clé API pour l'utilisation SMTP.
    <img className="screenshot-full" src="/img/enterprise/smtp/sendgrid-api.png" alt="SMTP Configuration Without Environment Variables" />

## Mailgun

Mailgun fournit des identifiants spécifiques pour la configuration SMTP.
1. Récupérez le **nom d'utilisateur SMTP** depuis l'onglet SMTP Credentials de la page des paramètres du domaine.

2. Utilisez le mot de passe associé à votre compte Mailgun pour authentifier la connexion SMTP.
    <img className="screenshot-full" src="/img/enterprise/smtp/mailgun-cred.png" alt="SMTP Configuration Without Environment Variables" />
