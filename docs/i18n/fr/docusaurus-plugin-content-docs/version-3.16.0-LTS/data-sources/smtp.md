---
id: smtp
title: SMTP
---

La source de données SMTP facilite la connexion entre les applications ToolJet et les serveurs de messagerie, permettant aux applications d'envoyer des e-mails.

## Connexion

Pour établir une connexion avec la source de données SMTP, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit naviguer vers la page **[Data Sources](/docs/data-sources/overview/)** depuis le tableau de bord ToolJet et choisir SMTP comme source de données.

ToolJet nécessite les éléments suivants pour se connecter à un serveur SMTP :

- **Host** 
- **Port** 
- **Username**
- **Password**

### Trouver les informations de configuration

Les informations de configuration SMTP telles que l'hôte et le port peuvent généralement être obtenues auprès de votre fournisseur de messagerie. Voici quelques paramètres généraux pour les fournisseurs de messagerie les plus couramment utilisés :

- **Gmail**
    - **Host** : smtp.gmail.com
    - **Port** : 587 ou 465 (SSL)
    - **Username** : votre adresse Gmail complète
    - **Password** : votre mot de passe Gmail
- **Yahoo Mail**
    - **Host** : smtp.mail.yahoo.com
    - **Port** : 465 (SSL)
    - **Username** : votre adresse e-mail Yahoo
    - **Password** : votre mot de passe Yahoo Mail
- **Outlook.com/Hotmail**
    - **Host** : smtp.office365.com
    - **Port** : 587 ou 465 (SSL)
    - **Username** : votre adresse e-mail Outlook.com/Hotmail
    - **Password** : votre mot de passe Outlook.com/Hotmail.

<img className="screenshot-full img-full" src="/img/datasource-reference/smtp/connect-v2.png" alt="smtp connect" />

## Interroger SMTP

Pour créer une requête permettant d'envoyer un e-mail, suivez ces étapes :

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes situé dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **SMTP** ajoutée à l'étape précédente.
3. Saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour afficher un aperçu du résultat, ou sur le bouton **Run** pour déclencher la requête.

#### Paramètre requis
 - **From** : adresse e-mail de l'expéditeur.
 - **To** : adresse e-mail du destinataire.
 - **Subject** : sujet de l'e-mail.
 - **Body** : vous pouvez saisir le corps du texte de l'e-mail au format texte brut ou HTML, dans leurs champs respectifs.
 
#### Paramètre optionnel
 - **From Name** : nom de l'expéditeur.
 - **CC mail to** : adresse e-mail des destinataires qui recevront une copie de l'e-mail, et dont les adresses e-mail seront visibles par les autres destinataires.
 - **BCC mail to** : adresse e-mail des destinataires qui recevront une copie de l'e-mail, mais dont l'adresse restera masquée aux autres destinataires.
 - **Attachments** : vous pouvez ajouter des pièces jointes à une requête SMTP en référençant le fichier depuis le composant File Picker dans le champ attachments.
    - Par exemple, vous pouvez définir la valeur du champ `Attachments` sur `{{ components.filepicker1.file }}` ou passer un objet `{{[{ name: "filename.jpg", dataURL: " " }]}}` pour inclure des pièces jointes.

<img className="screenshot-full img-full" src="/img/datasource-reference/smtp/querying-v3.png" alt="smtp cquerying" />
