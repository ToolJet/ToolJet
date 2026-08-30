---
id: canvas
title: Canvas et mise en page
---

Le **canvas** est la zone principale de l'app-builder où vous créez votre application et concevez l'interface utilisateur.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/canvas.png" alt="App Builder: Canvas"/>

## Personnaliser le canvas

Via les paramètres globaux (Global Settings), vous pouvez personnaliser les propriétés suivantes du **canvas** :

- **Max width of canvas** : Définit la largeur maximale du canvas, qui peut être définie en pixels ou en pourcentage de la taille de l'écran. La hauteur du canvas s'étend automatiquement à mesure que des composants sont ajoutés.
- **Canvas background** : Définit la couleur d'arrière-plan du canvas. Elle peut également être contrôlée dynamiquement en cliquant sur **fx** et en saisissant une expression logique.
- **App mode** : Vous pouvez choisir parmi trois modes de thème
    - **Auto** : S'adapte aux paramètres de thème du navigateur ou permet aux utilisateurs de basculer entre les modes clair et sombre.
    - **Light** : Maintient l'application en mode clair, les utilisateurs ne peuvent pas passer en mode sombre.
    - **Dark** : Maintient l'application en mode sombre, les utilisateurs ne peuvent pas passer en mode clair.

<img className="screenshot-full img-s" src="/img/app-builder/canvas/global-settings.png" alt="App Builder: Canvas"/>

## Construire l'interface utilisateur

Pour construire l'interface utilisateur, les composants peuvent être glissés depuis la [bibliothèque de composants](/docs/app-builder/building-ui/component-library/) à droite. Utilisez le Component Handle pour repositionner un composant. Un composant peut être redimensionné depuis n'importe lequel de ses bords ou de ses coins.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/drag.gif" alt="App Builder: Canvas"/>

### Grille, alignement automatique et repères

Le canvas de ToolJet fournit un arrière-plan en grille, un alignement automatique intelligent (smart snapping) et des repères visuels pour faciliter l'alignement et le positionnement précis des composants. Les composants s'alignent automatiquement sur les lignes de la grille et les éléments proches, réduisant le besoin d'ajustements manuels. Chaque cellule de la grille du canvas a une hauteur fixe de 10 pixels. La largeur de chaque cellule s'ajuste en fonction de la taille de l'écran.

<img className="screenshot-full img-m" src="/img/app-builder/canvas/snap.png" alt="App Builder: Canvas"/>

## Créer une mise en page

Dans ToolJet, les composants peuvent être regroupés à l'aide d'un composant de mise en page tel qu'un **[Container](/docs/widgets/container/)** ou un **[Form](/docs/widgets/form/)**. Vous pouvez glisser-déposer les composants correspondants dans les composants de mise en page sur le canvas pour créer une section.

<img className="screenshot-full img-m" src="/img/app-builder/canvas/form.png" alt="App Builder: Canvas"/>

## Gérer les composants sur le canvas

#### Sélectionner et déplacer plusieurs composants

Vous pouvez sélectionner plusieurs composants en cliquant et en faisant glisser sur ceux-ci, ou en cliquant individuellement tout en maintenant la touche Maj (Shift) enfoncée. Une fois sélectionnés, tous les composants peuvent être déplacés ensemble en tant que groupe.

#### Copier des composants

Les composants sur le canvas peuvent être copiés à l'aide de **Cmd/Ctrl + C**.

<img className="screenshot-full img-m" src="/img/app-builder/canvas/copy.png" alt="App Builder: Canvas"/>

#### Coller des composants

Les composants copiés peuvent être collés sur le canvas à l'aide de **Cmd/Ctrl + V**.

<img className="screenshot-full img-m" src="/img/app-builder/canvas/paste.png" alt="App Builder: Canvas"/>

#### Cloner des composants

Les composants sur le canvas peuvent être clonés à l'aide de **Cmd/Ctrl + D**. Contrairement au copier-coller, le clonage crée instantanément un doublon du composant sélectionné.

<img className="screenshot-full img-m" src="/img/app-builder/canvas/clone.png" alt="App Builder: Canvas"/>

<br/><br/>

:::note
Pour d'autres raccourcis, consultez le [guide des raccourcis clavier](/docs/tutorial/keyboard-shortcuts/).
:::
