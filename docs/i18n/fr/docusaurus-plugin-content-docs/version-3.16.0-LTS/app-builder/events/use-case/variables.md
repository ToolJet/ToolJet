---
id: variables
title: Définir des variables
---

Les variables vous permettent de stocker et de gérer des données à travers toute votre application. Vous pouvez les utiliser pour gérer l'état des composants, contrôler la logique, stocker les saisies utilisateur ou créer des expériences utilisateur personnalisées. En définissant une valeur une seule fois dans une variable, vous pouvez la réutiliser dans différentes parties de votre application. Cela rend votre application plus facile à créer et à maintenir, sans avoir besoin de tout stocker dans une base de données.

ToolJet prend en charge deux types de variables :

- Les **variables au niveau de l'application** sont disponibles sur toutes les pages de votre application. Pour définir une variable au niveau de l'application, utilisez l'action `setVariable`.
- Les **variables au niveau de la page** ne sont disponibles que sur la page où elles sont créées. Pour définir une variable au niveau de la page, utilisez l'action `setPageVariable`.

## Définir des variables

### Variable au niveau de l'application

Supposons que vous construisiez une application multi-pages où, sur la première page, vous demandez à l'utilisateur son nom et souhaitez l'utiliser sur les autres pages. Voici comment procéder :
1. Ajoutez un composant **Text Input** pour recueillir le nom de l'utilisateur.
2. Ajoutez un composant **Button** pour soumettre le nom.
3. Configurez ce gestionnaire d'événements sur le composant **Button** :
    - Événement : **On Click**
    - Action : **Set variable**
    - Key : `username` *(Nom de variable de votre choix.)*
    - Value : `{{components.usernameinput.value}}` *(Référence à la saisie utilisateur dans le composant **Text Input**.)*

<img className="screenshot-full img-full" src="/img/app-builder/events/variables/username.png" alt="Events Architecture Diagram"/> <br/><br/>

Lorsque l'utilisateur clique sur le composant **Button**, son nom sera stocké dans la variable au niveau de l'application `username`. Vous pouvez accéder à cette variable n'importe où dans votre application avec cette syntaxe :

```js
{{variables.username}}
```

### Variable au niveau de la page

Maintenant, supposons que vous ayez un **Form** dans votre application et que vous souhaitiez stocker le numéro de contact de l'utilisateur uniquement sur cette page lorsqu'il soumet le **Form**. Pour ce faire, configurez ce gestionnaire d'événements sur le composant **Button** :

- Événement : **On Click**
- Action : **Set page variable**
- Key : `contact` *(Nom de variable de votre choix.)*
- Value : `{{components.feedbackForm.data.contact.value}}`  *(Référence à la saisie utilisateur dans le composant **Number Input**.)*

Lorsque l'utilisateur clique sur le composant **Button**, son numéro de contact sera enregistré dans une variable au niveau de la page nommée `contact`. Cette variable ne peut être utilisée que sur cette page spécifique avec cette syntaxe :

```js
{{page.variables.contact}}
```

## Supprimer des variables

### Variables au niveau de l'application

Dans votre application multi-pages, vous pourriez vouloir effacer (supprimer) la variable `username` lorsque l'utilisateur clique sur le composant **Button** nommé "Finish" sur la dernière page. Pour ce faire, configurez le gestionnaire d'événements suivant sur le composant **Button** :

- Événement : **On Click**
- Action : **Unset variable**
- Key : `username` *(Nom de la variable que vous souhaitez supprimer.)*

### Variables au niveau de la page

Dans votre application **Form**, vous pourriez vouloir effacer la variable de niveau page `contact` lorsque l'utilisateur clique sur le composant **Button** nommé "Next Page". Pour ce faire, configurez ce gestionnaire d'événements sur le composant **Button** :

- Événement : **On Click**
- Action : **Unset page variable**
- Key : `contact` *(Nom de la variable que vous souhaitez supprimer.)*

:::info
Vous pouvez également gérer les variables par le code. Reportez-vous au guide [Gérer les variables](/docs/app-builder/custom-code/managing-variables) pour plus d'informations.
:::
