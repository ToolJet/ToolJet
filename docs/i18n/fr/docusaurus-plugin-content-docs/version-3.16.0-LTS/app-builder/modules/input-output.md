---
title: Configurer les entrées et les sorties
id: input-output
---

Les modules disposent de leurs propres entrées et sorties qui leur permettent d'interagir avec l'application parente. Vous pouvez configurer les entrées et les sorties d'un module depuis le panneau des propriétés.

## Entrées
Les entrées permettent à l'application parente d'envoyer des données ou de déclencher des actions à l'intérieur du module. Vous pouvez accéder aux entrées dans le module en utilisant l'objet **input**.

### Types d'entrées
- **Data** : Utilisez ceci pour transmettre des valeurs comme une chaîne, un nombre, un booléen, un tableau ou un objet.
- **Query** : Utilisez ceci pour déclencher des queries à l'intérieur du module depuis l'application parente.

<img className="screenshot-full img-m" src="/img/app-builder/modules/input-type.png" alt="Input Types" />

### Comment définir des entrées
Dans le panneau des propriétés, accédez à la section **Inputs** et cliquez sur **Add new**. Ensuite, fournissez les informations suivantes :

#### Entrée de type Data

Pour les entrées **Data**, définissez les paramètres suivants :

- **Name** : Un nom unique pour l'entrée
- **Type** : Sélectionnez **Data**
- **Default Value** (optionnel)

Par exemple, pour transmettre un titre de formulaire depuis l'application parente, créez une entrée avec le nom **formTitle** et le type **Data**. Vous pouvez également définir une valeur par défaut.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/module-input.png" alt="Module Input" /> 

Pour utiliser cette entrée dans le module, utilisez la syntaxe suivante :

```js
{{input.<input_name>}}
```

Dans notre cas, nous utiliserons `{{input.formTitle}}` pour accéder au titre du formulaire dans le composant.
```js
{{input.formTitle}}
```

Lorsque vous importez ce module dans une application, vous verrez le champ d'entrée dans les paramètres du module. Si vous définissez la valeur de **formTitle** sur **User Details**, le formulaire affichera cette valeur comme titre.

<img className="screenshot-full img-full" src="/img/app-builder/modules/module-input-in-app.png" alt="Input Settings" /> 

#### Entrée de type Query

Pour les entrées **Query**, définissez les paramètres suivants :
- **Name** : Un nom unique pour l'entrée
- **Type** : Sélectionnez Query

Par exemple, si vous souhaitez déclencher une query nommée **submitForm** depuis l'application parente, créez une entrée nommée **submit** et sélectionnez **Query** comme type.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/add-query-input.png" alt="Query Input" /> 

Pour gérer cette entrée dans le module, ajoutez un gestionnaire d'événements à un composant qui doit déclencher la query. Définissez l'action sur **Run Query** et sélectionnez la query en tant qu'entrée (par exemple, submit) dans le menu déroulant.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/event-handler-in-module.png" alt="Event Handler" /> 

Lorsque vous importez le module dans une application, vous verrez l'entrée de type query dans les paramètres du module. Vous pouvez alors sélectionner n'importe quelle query disponible dans l'application parente à déclencher.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/query-from-app.png" alt="Query Input Settings" /> 

## Tester les entrées

Vous pouvez tester le comportement d'un module avant de l'importer dans une application dans la section **Test Input** du panneau des propriétés du module builder. Pour ce faire, ouvrez le panneau des propriétés du module et faites défiler jusqu'à la section **Test Input**. Saisissez des valeurs d'exemple pour chaque entrée.

Par exemple, si le module possède une entrée nommée **formTitle**, vous pouvez saisir une valeur d'exemple comme **User Details** pour voir comment elle est rendue dans le module.

Vous pouvez également tester les entrées de type query en créant une query à l'intérieur du module builder et en la déclenchant à l'aide de l'entrée de type query définie.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/test-input.png" alt="Test Input" /> 

## Sorties

Les sorties permettent au module de renvoyer des données à l'application parente. Vous pouvez accéder aux sorties du module dans l'application parente en utilisant l'objet components.

Par exemple, si vous souhaitez renvoyer les données d'un formulaire soumis à l'application parente, créez une sortie nommée **formData** et transmettez les données du formulaire **depuis** le composant.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }}  src="/img/app-builder/modules/module-output.png" alt="Module Output" /> 

Pour accéder à cette sortie dans l'application parente, utilisez la syntaxe suivante :

```js
{{components.<module_name>.<output_name>}}
```

Dans ce cas, utilisez la référence suivante pour accéder aux données du formulaire.

```js
{{components.formModule.formData}}
```

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/output-in-app.png" alt="Output Consumption" />

Pour en savoir plus sur la façon dont les données circulent entre les modules et les applications, consultez le guide [Flux de données](/docs/app-builder/modules/data-flow).

