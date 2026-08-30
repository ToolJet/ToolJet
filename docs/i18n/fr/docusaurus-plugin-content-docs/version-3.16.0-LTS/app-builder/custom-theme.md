---
id: custom-theme
title: Thèmes d'application
---

<PlanBadge type="team" />

ToolJet prend en charge les thèmes d'application, offrant aux équipes un contrôle complet sur l'apparence de leurs applications. Grâce à cette fonctionnalité, vous pouvez définir et gérer plusieurs thèmes et les appliquer à vos applications de manière cohérente et réutilisable.

Chaque espace de travail peut avoir un ou plusieurs thèmes configurés, et toute application au sein de cet espace de travail peut utiliser l'un des thèmes définis. Cela permet de maintenir une cohérence visuelle entre les applications, d'améliorer l'alignement avec la marque, et d'enrichir l'expérience utilisateur.

## Pourquoi utiliser les thèmes d'application ?

Les thèmes d'application renforcent votre organisation en offrant :

- **Cohérence de marque** : alignez vos outils internes avec l'identité visuelle de votre entreprise.
- **Réutilisabilité** : définissez une fois, utilisez sur plusieurs applications.
- **Personnalisation** : mettez à jour l'apparence de toutes vos applications en une seule fois en modifiant le thème.
- **Collaboration** : les équipes travaillant sur des applications différentes peuvent maintenir un système de design unifié.

Cela est particulièrement utile pour les équipes disposant d'applications dans différents environnements (par ex., outils internes, applications destinées aux clients, panneaux d'administration) où chacune peut nécessiter une identité visuelle légèrement différente mais cohérente.

## Comment utiliser les thèmes d'application

Un thème d'application vous permet de personnaliser les composants d'UI de vos applications ToolJet en configurant un ensemble de styles visuels tels que :

- Couleurs de marque (Primaire, Secondaire, Tertiaire)
- Couleurs du texte
- Style des bordures et des surfaces
- Couleurs d'état système (par ex., erreur, succès)

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/custom-theme-config.png" alt="Configure custom theme" />

Vous pouvez configurer ces paramètres pour les modes clair et sombre, et prévisualiser instantanément les modifications à l'aide du panneau d'aperçu intégré.

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/custom-theme.png" alt="Configure custom theme" />

<br/><br/>

L'utilisation des thèmes d'application dans ToolJet se fait en deux étapes simples — **créer le thème** et **l'appliquer à vos applications**.

### 1. Créer un thème d'application

Rôle requis : **Admin**

- Accédez à vos **Workspace Settings**.
- Cliquez sur l'onglet **Theme**.
- Cliquez sur **Create new theme**.
- Configurez les styles de votre thème :
  - Définissez vos **couleurs de marque** : Primaire, Secondaire, Tertiaire
  - Définissez les couleurs de **Texte**, de **Bordure**, de **Statut système**, et de **Surface**
  - Choisissez les styles pour les modes **Light** et **Dark**
- Cliquez sur **Save** une fois que vous avez terminé.<br/>

Vous pouvez créer plusieurs thèmes selon vos besoins — pour différentes équipes, environnements ou clients.

### 2. Appliquer le thème à votre application

Rôle requis : **Admin/Builder**

- Ouvrez l'application dans laquelle vous souhaitez utiliser le thème.
- Cliquez sur l'**icône Settings** dans la **barre latérale gauche** pour ouvrir les **Global Settings**.
- Faites défiler jusqu'à la section **Theme**.
- Vous verrez une liste déroulante affichant le thème actuellement sélectionné (généralement le thème par défaut).
- Cliquez sur la liste déroulante pour afficher et sélectionner l'un de vos thèmes configurés. <br/>
  <img  className="screenshot-full img-m" src="/img/app-builder/custom-theme/select-theme.png" alt="Configure custom theme" />

Une fois sélectionné, votre application utilisera désormais le thème choisi comme style de base pour les composants.

### 3. Utiliser les styles du thème dans vos composants

Pour que vos composants adoptent les styles du thème :

- Sélectionnez un composant sur le canevas de l'application.
- Accédez à l'onglet **Style** du composant.
- Partout où une couleur peut être définie (fond, bordure, texte), vous verrez une option **Theme** à côté du sélecteur de couleur. Une fois sélectionnée, vous verrez la liste des couleurs du thème telles que Brand/Primary, Brand/Secondary, Text/Primary, etc.

Ces options correspondent directement à ce que vous avez configuré lors de la mise en place du thème.

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/choose-theme-color.png" alt="Configure custom theme" />

Une fois que les composants sont stylisés à l'aide des options du thème, changer de thème depuis les Global Settings mettra instantanément à jour tous ces composants, rendant votre application visuellement cohérente et facile à mettre à jour.

## Scénarios

Voici quelques scénarios dans lesquels les thèmes d'application sont particulièrement utiles :

- **Applications spécifiques à une marque** : créez des thèmes différents pour les différentes marques/clients de votre entreprise.
- **Bascule mode clair et sombre** : offrez à vos utilisateurs finaux une transition visuelle fluide entre les modes clair et sombre.
- **Organisations multi-équipes** : permettez à chaque équipe de votre organisation de créer et de maintenir son propre thème sans affecter les autres.

## Exemple

Voici un exemple montrant l'apparence d'une interface d'application avant et après l'application d'un thème d'application.

### Avant (thème par défaut)

Voici l'UI ToolJet par défaut, sans aucun thème d'application appliqué. Elle utilise l'image de marque standard et des couleurs neutres.
<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/default-theme-app-v1.png" alt="Configure custom theme" />

### Après (thème d'application appliqué)

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/custom-theme-app-v1.png" alt="Configure custom theme" />

Voici la même application après l'application du thème d'application « Coral ». Remarquez que la couleur des boutons, les accents primaires, et l'alignement visuel global reflètent désormais la palette choisie.

En configurant simplement un thème une seule fois au niveau de l'espace de travail, vous pouvez instantanément appliquer une nouvelle apparence à toutes vos applications, améliorant ainsi l'utilisabilité, la clarté et l'identité de marque.
