---
id: data-flow
title: Flux de données
sidebar_label: Flux de données
---

Cette section explique comment fonctionnent les flux de données entre l'application parente et le module.

Il existe deux types de flux de données entre l'application parente et le module :
- **Du parent vers le module**
- **Du module vers le parent**

## Du parent vers le module

Lorsque vous ajoutez un module à une application :
- Le parent peut transmettre des valeurs d'entrée au module.
- Ces valeurs peuvent être utilisées n'importe où à l'intérieur du module (interface, queries, logique).

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/data-flow-parent-to-module.png" alt="Data flow from parent to module" />

Par exemple, supposons que vous souhaitiez transmettre les **userData** de l'application parente au module. Voici ce qui se passe :

```js
// Passed from parent
{
  "userData": {{ queries.getUser.data }}
}
```
Vous pouvez accéder à ces valeurs dans le module en utilisant l'objet `input`. Par exemple, pour accéder à userData, vous utiliseriez `{{input.userData}}`.

```js
// Consumed in module
{{input.userData}}
```

## Du module vers le parent

Le module peut renvoyer des données au parent à l'aide des outputs :
- Les valeurs de sortie sont évaluées à l'intérieur du module.
- L'application parente lit les valeurs de sortie en utilisant l'objet components.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/from-module-to-app.png" alt="Data flow from module to parent" />

Par exemple, supposons que vous ayez un module qui soumet un formulaire et renvoie les données soumises à l'application parente. Voici ce qui se passe :

```js
// Sent from module
{
  "submittedFormData": {{ components.form.formData }}
}
```

Vous pouvez accéder à ces valeurs dans l'application parente en utilisant l'objet `components`. Par exemple, pour accéder à submittedFormData, vous utiliseriez `{{components.<moduleName>.submittedFormData}}`.

```js
// Received in parent app
{{components.<moduleName>.submittedFormData}}
```

## Options d'exécution des queries

Vous disposez de deux options pour gérer les queries dans les modules :

### Queries déclenchées par le parent
- Définissez les queries à l'intérieur du module.
- Depuis l'application parente, déclenchez-les en utilisant une query d'entrée du module.
- Utilisez cette approche lorsque vous souhaitez un contrôle total depuis l'application.

<!-- For example, if you're building a form module where the parent wants to trigger submission, define the query inside the module and use the module input query option. -->

### Queries autonomes
- Laissez le module gérer ses propres queries en interne (par exemple, exécution au chargement ou au clic d'un bouton à l'intérieur du module).
- Ces queries restent invisibles pour l'application parente.
- Utilisez cette approche pour un comportement entièrement encapsulé.

<!-- For example, if you're building a chart module that fetches data automatically upon loading, define the query inside the module and make it self-executing. -->

Choisissez en fonction de si le parent doit contrôler le comportement du module ou laisser le module se gérer lui-même.

