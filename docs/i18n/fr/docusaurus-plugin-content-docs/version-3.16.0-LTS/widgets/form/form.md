---
id: generate-form
title: Générer un formulaire
---

Le composant **Form** dans ToolJet vous permet de regrouper plusieurs champs de saisie et de les gérer comme une seule unité. Il simplifie les workflows de collecte de données, de validation et de soumission en réunissant en un seul endroit tous les composants et la logique liés au formulaire.

:::caution Restricted components
Des composants comme **Kanban**, **Calendar**, **Container**, **ListView**, **Tabs** et **Form** ne peuvent pas être déposés à l'intérieur du composant **Form**.
:::

Ce guide présente les différentes façons de générer un formulaire dans ToolJet. Pour des informations détaillées sur les propriétés, les CSA et la personnalisation du schéma, consultez les guides suivants :
- [Form Component Properties](/docs/widgets/form/properties)
- [Component Specific Actions (CSAs) and Exposed Variables](/docs/widgets/form/csa)
- [Custom Schema](/docs/widgets/form/schema)

## Générer un formulaire {#generating-form}

Dans ToolJet, vous pouvez générer un **Form** de l'une des façons suivantes :

- [En utilisant un schéma JSON](#using-json-schema)
- [En utilisant du JSON brut](#using-raw-json)
- [En utilisant la sortie d'une requête](#using-query-output)
- [En utilisant le panneau de propriétés du formulaire](#using-form-property-panel)
- [En faisant glisser des composants dans le formulaire](#by-dragging-components-into-the-form)

### En utilisant un schéma JSON {#using-json-schema}

En utilisant un schéma JSON, vous pouvez créer des formulaires dynamiques qui mettent automatiquement à jour leur structure (champs, styles, etc.) en fonction de différentes conditions.

Par exemple, si vous créez un formulaire d'onboarding dans lequel des champs comme Name, Email ou Department changent en fonction des saisies de l'équipe ou des réponses d'API, le schéma JSON vous aide à générer l'ensemble du formulaire sans avoir à ajouter manuellement chaque champ. Ceci est particulièrement utile dans les panneaux d'administration ou les outils internes où le formulaire peut changer fréquemment.

Pour utiliser un schéma JSON, sélectionnez **JSON Schema** dans le menu déroulant **Generate form from** du panneau de propriétés du formulaire. Ensuite, fournissez un objet JSON contenant `title`, `properties` et `submitButton` dans le format suivant :

```js
{{{
  "title": " ", // Provide title for Form

  "properties": {

  }, // Provide schema of the components that will be inside the form

  "submitButton": {

  } // Provide schema of the submit button
}}}
```

| <div style={{ width:"100px"}}> Clé </div>  | <div style={{ width:"100px"}}> Description </div> |
| :----------- | :----------- | 
| **title** | Spécifie le titre du formulaire. | 
| **properties** | 	Définit le schéma des champs du formulaire (les composants qui seront rendus dans le formulaire).  | 
| **submitButton** | Définit le schéma et le comportement du bouton de soumission du formulaire. | 

Consultez le guide [Custom Schema](/docs/widgets/form/schema) pour des exemples de schéma des composants couramment utilisés.

<img className="screenshot-full img-full" src="/img/widgets/form/json-schema-dropdown.png" alt="Component Event Handler" />

### En utilisant du JSON brut {#using-raw-json}

Avec du JSON brut, vous pouvez générer un formulaire simplement en fournissant un objet JSON avec des paires clé-valeur. ToolJet détecte automatiquement les types de champs et génère les composants de saisie correspondants.

Par exemple, si une valeur est une chaîne de caractères, il génère un champ de texte ; pour un booléen, il génère une case à cocher ; pour les tableaux, et ainsi de suite. Cette méthode est utile lorsque vous disposez déjà de données d'exemple (issues d'une API ou d'un objet statique) et que vous souhaitez générer rapidement un formulaire.

Pour utiliser du JSON brut, sélectionnez **Raw JSON** dans le menu déroulant **Generate form from** du panneau de propriétés du formulaire. Après avoir saisi l'objet JSON, vous pouvez gérer directement les champs de saisie depuis le panneau de propriétés du formulaire, y compris la personnalisation du type de saisie, du label, du placeholder, de la valeur par défaut, et plus encore.

**Exemple d'objet JSON** :
```js
{
    "name":"John Doe",
    "age":35,
    "isActive":true,
    "dob":"01-01-1990",
    "hobbies":[
        "reading","gaming","cycling"
    ],
    "address":{
        "street":"123 Main Street",
        "city":"New York"
    }
}
```

<img className="screenshot-full img-full" src="/img/widgets/form/raw-json-dropdown.png" alt="Component Event Handler" />

### En utilisant la sortie d'une requête {#using-query-output}

Vous pouvez générer un formulaire à l'aide de la sortie d'une requête (par exemple, en récupérant les détails d'un utilisateur depuis une API ou une base de données). ToolJet lit la structure de la réponse de la requête et crée automatiquement des champs de saisie en fonction des paires clé-valeur renvoyées.

Supposons que vous ayez une sortie de requête au format suivant :

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/widgets/form/query-output.png" alt="Component Event Handler" />

Pour générer un formulaire à l'aide de la sortie d'une requête, sélectionnez le nom de la requête dans le menu déroulant **Generate form from** du panneau de propriétés du formulaire.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/widgets/form/query-dropdown.png" alt="Component Event Handler" />

Après avoir sélectionné la requête, une fenêtre modale apparaît et associe automatiquement tous les champs de sortie de la requête à leurs composants de saisie respectifs en fonction du type de saisie. Vous pouvez modifier le type de composant ou le label de saisie si nécessaire. De plus, vous pouvez choisir si un champ doit être obligatoire. Une fois les ajustements nécessaires effectués, cliquez sur le bouton **+ Generate Form** en bas de la fenêtre modale pour créer le formulaire.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/widgets/form/query-modal.png" alt="Component Event Handler" />

Une fois le formulaire généré, vous pouvez gérer davantage chaque champ de saisie depuis le panneau de propriétés du formulaire, y compris changer le type de saisie, le label, le placeholder, la valeur par défaut, et plus encore.

### En utilisant le panneau de propriétés du formulaire {#using-form-property-panel}

Vous pouvez générer un formulaire à l'aide du panneau de propriétés du composant **Form**. Cliquez sur l'icône **+** à côté de la section Fields du panneau. Une fenêtre modale s'ouvre où vous pouvez sélectionner le type de composant de saisie, définir le label, le placeholder, la valeur par défaut, et marquer le champ comme obligatoire.

Après avoir configuré les propriétés, cliquez sur le bouton **+ Add Field** en bas pour ajouter le nouveau champ de saisie au formulaire.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/widgets/form/form-property-panel.png" alt="Component Event Handler" />

Une fois le formulaire généré, vous pouvez gérer davantage chaque champ de saisie depuis le panneau de propriétés du formulaire, y compris changer le type de saisie, le label, le placeholder, la valeur par défaut, et plus encore.

### En faisant glisser des composants dans le formulaire {#by-dragging-components-into-the-form}

Vous pouvez faire glisser et déposer des composants depuis la bibliothèque de composants directement dans le composant **Form** pour créer un formulaire. Une fois le formulaire créé, vous pouvez gérer chaque champ de saisie depuis le panneau de propriétés du formulaire, y compris changer le type de saisie, le label, le placeholder, la valeur par défaut, et plus encore.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-m" src="/img/widgets/form/drag.png" alt="Component Event Handler" />
