---
id: custom-component
title: Custom Component
slug: /widgets/custom-component/
---

ToolJet vous permet de créer votre propre composant React à l'aide du **Custom Component**, offrant une plus grande flexibilité et personnalisation pour votre application. Le **Custom Component** possède deux propriétés principales :

1. **[Data](#data)** : Utilisée pour transmettre des données ou des noms de requêtes au composant. Ces requêtes peuvent être déclenchées depuis l'intérieur du composant.
2. **[Code](#code)** : Utilisée pour écrire le code React du **Custom Component**. ToolJet propose deux fonctions intégrées pour interagir avec le composant : la fonction [Update Data](#update-data-function) et la fonction [Run Query](#run-query-function).


## Data

Les données peuvent être transmises à un custom component à l'aide du champ **Data**. Les données doivent être structurées sous forme d'objet ou de tableau d'objets. Un nom de requête peut également être transmis via ce champ pour déclencher des requêtes à l'aide du custom component.

<img className="screenshot-full" src="/img/widgets/custom-component/data.png" alt="Custom Component Data Property" />

#### Exemple :
```json
{{{ 
    title: 'Hi! There', 
    buttonText: 'Update Title',
    queryName: 'fetchData'
}}}
```
**OU**
```json
{{{ 
    images: [ 
	  { "url" : "https://reqres.in/img/faces/7-image.jpg", "title" : "Olivia"}, 
	  { "url" : "https://reqres.in/img/faces/5-image.jpg", "title" : "Liam"}, 
	  { "url" : "https://reqres.in/img/faces/3-image.jpg", "title" : "Sophia"}
    ]
}}}
```

### Transmettre des données via une requête

Les données récupérées par une requête peuvent également être transmises au **Custom Component** dans l'objet data.

<img className="screenshot-full" src="/img/widgets/custom-component/query-data.png" alt="Custom Component Data Property" />


## Code

Le code React d'un **Custom Component** peut être ajouté dans le champ **Code**. Vous pouvez interagir avec l'application via le custom component à l'aide du paramètre et des fonctions intégrées suivants.

### Paramètre Data

Pour accéder aux données transmises via le champ [data](#data), définissez le paramètre `data` de la fonction *MyCustomComponent*.

#### Exemple

```js
import React from "https://cdn.jsdelivr.net/npm/react@17.0.2/+esm";
import ReactDOM from "https://cdn.jsdelivr.net/npm/react-dom@17.0.2/+esm";
import Container from "https://cdn.jsdelivr.net/npm/@material-ui/core@4.12.4/Container/+esm";

const MyCustomComponent = ({data}) => (
  <Container>
      <p>Employee Name: <b>{data.name}</b></p>
      <p>Designation: <b>{data.designation}</b></p>
      <p>Department: <b>{data.department}</b></p>
    </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
```

:::warning CAUTION
Bien que les imports nommés depuis `@material-ui/core/+esm` puissent fonctionner dans des cas simples, ils peuvent échouer dans des scénarios plus complexes en raison d'une prise en charge incomplète d'ESM dans Material UI v4. Si vous rencontrez des problèmes, essayez d'importer les composants individuellement.
:::

<img className="screenshot-full" src="/img/widgets/custom-component/data-prop.png" alt="Custom Component Data Property" />

### Fonction Update Data {#update-data-function}

Pour mettre à jour les données dans l'objet data, vous pouvez utiliser la fonction intégrée `updateData`.

#### Exemple

```js
import React from "https://cdn.jsdelivr.net/npm/react@17.0.2/+esm";
import ReactDOM from "https://cdn.jsdelivr.net/npm/react-dom@17.0.2/+esm";
import Button from "https://cdn.jsdelivr.net/npm/@material-ui/core@4.12.4/Button/+esm";
import Container from "https://cdn.jsdelivr.net/npm/@material-ui/core@4.12.4/Container/+esm";

const MyCustomComponent = ({data, updateData}) => (
  <Container>
    <p>Employee Name: <b>{data.name}</b></p>
    <p>Status: <b>{data.status}</b></p>
    <Button
      color="primary"
      variant="outlined"
      onClick={() => {updateData({status: 'Inactive'})}}
    >
      {data.button}
    </Button>
  </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/widgets/custom-component/update-data.png" alt="Custom Component Data Property" />

### Fonction Run Query {#run-query-function}

Le **Custom Component** dans ToolJet peut être utilisé pour déclencher des requêtes. Vous pouvez spécifier le nom de la requête dans le champ [data](#data). Utilisez la fonction intégrée `runQuery` pour exécuter la requête dynamiquement depuis l'intérieur du **Custom Component**.

#### Exemple

```js
import React from "https://cdn.jsdelivr.net/npm/react@17.0.2/+esm";
import ReactDOM from "https://cdn.jsdelivr.net/npm/react-dom@17.0.2/+esm";
import Button from "https://cdn.jsdelivr.net/npm/@material-ui/core@4.12.4/Button/+esm";
import Container from "https://cdn.jsdelivr.net/npm/@material-ui/core@4.12.4/Container/+esm";

const MyCustomComponent = ({ data, runQuery }) => (
  <Container>
    <h1>Employee Details</h1>
    <p>Name: <b>{data.name}</b></p>
    <p>Designation: <b>{data.designation}</b></p>
    <p>Department: <b>{data.department}</b></p>
    <p>Address: <b>{data.address}</b></p>
    <Button
      color="primary"
      variant="contained"
      onClick={() => {
        runQuery(data.queryName);
      }}
    >
      Fetch Contact Info
    </Button>
  </Container>
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
);

const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);
```

<img className="screenshot-full" src="/img/widgets/custom-component/run-query.png" alt="Custom Component Run Query code" />

## Styles

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Visibility | Contrôle la visibilité du composant. | Activez ou désactivez, ou définissez-la de manière programmatique avec **fx**. |
| Border color | Définit la couleur de bordure du composant. | Sélectionnez une couleur dans le sélecteur de couleurs ou définissez-la de manière programmatique avec **fx**. |
| Border radius | Définit le rayon des coins du composant. | Saisissez une valeur numérique (par défaut : `6`) ou définissez-la de manière programmatique avec **fx**. |
| Box shadow | Définit les propriétés de l'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre forfait comprend la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::
