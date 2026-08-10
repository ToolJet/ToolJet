---
id: csa
title: CSA et variables exposées
---

Ce guide couvre les actions spécifiques au composant pour le composant **Form** ainsi que ses variables exposées. Pour apprendre à générer un formulaire, consultez le guide [Generate Form](/docs/widgets/form/). Pour plus d'informations sur les propriétés du composant **Form**, consultez le guide [Properties](/docs/widgets/form/properties).

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> Requête RunJS </div>|
| :------------ | :---------- | :------------ |
| submitForm | Soumet les données du formulaire. | `components.form1.submitForm()` |
| resetForm | Réinitialise les données du formulaire. | `components.form1.resetForm()` |
| setVisibility()| Définit la visibilité du composant.            | `components.form1.setVisibility(false)`   |
| setLoading()   | Définit l'état de chargement du composant.         | `components.form1.setLoading(true)` |
| setDisable()   | Désactive le composant.                          | `components.form1.setDisable(true)` |


## Variables exposées

| Variable | <div style={{ width:"250px"}}> Description </div> | Comment y accéder |
|:--------|:-----------|:------------|
|  data | Contient toutes les variables exposées de tous les composants imbriqués. | `{{components.form1.data}}`|
|  formData  | Contient la valeur de tous les composants imbriqués. | `{{components.form1.formData}}` |
|  children  | Contient toutes les propriétés de tous les composants imbriqués. | `{{components.form1.children}}` |
|  isValid  | Indique si toutes les saisies respectent les critères de validation. | `{{components.form1.isValid}}`|
|  isLoading | Indique si le composant est en cours de chargement. | `{{components.form1.isLoading}}`|
|  isVisible | Indique si le composant est visible. | `{{components.form1.isVisible}}`|
|  isDisabled  | Indique si le composant est désactivé. | `{{components.form1.isDisabled}}`|
