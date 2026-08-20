---
id: use-form-component
title: Utiliser le composant Form
---

Dans ce guide, nous allons créer une application simple utilisant le composant **[Form](/docs/widgets/form)** pour :

- Ajouter des enregistrements à **[ToolJet Database](/docs/tooljet-db/tooljet-database/)**
- Valider les entrées utilisateur
- Ajouter un comportement de formulaire conditionnel
- Actualiser automatiquement les données après soumission

## Étape 1 : Créer une table dans ToolJet Database

Créez une table nommée _products_ avec les colonnes suivantes :

- `name` (varchar)
- `category` (varchar)
- `quantity` (int)
- `price` (int)
- `supplier_email` (varchar)
- `rating` (int)
- `low_stock_note` (varchar)

Ajoutez quelques lignes d'exemple à la table.

## Étape 2 : Créer une requête pour récupérer les données

1. Ouvrez le **Query Panel** et cliquez sur **Add** pour créer une nouvelle requête. Sélectionnez **ToolJet Database** comme source de données.
2. Sélectionnez _products_ comme nom de table et **List rows** comme opération.
3. Renommez la requête en _fetchData_.
4. Activez `Run this query on application load?` afin que les données se chargent automatiquement au démarrage de l'application.

    <img className="screenshot-full img-l" src="/img/how-to/use-form/v2/fetchData.png" alt="fetchData Query" />

## Étape 3 : Créer l'interface utilisateur

1. Créez une nouvelle application.
2. Faites glisser un composant **[Table](/docs/widgets/table)** sur le canevas.
3. Définissez la propriété **Data** du Table sur :

   ```js
   {{queries.fetchData.data;}}
   ```

4. Faites glisser un composant **[Modal](/docs/widgets/modal-v2/)** au-dessus du Table.

    <img className="screenshot-full img-full" src="/img/how-to/use-form/v2/ui.png" alt="User Interface" />

## Étape 4 : Créer le formulaire

1. Faites glisser un composant **[Form](/docs/widgets/form)** à l'intérieur du **Modal**.
2. Désactivez le **Header** et le **Footer** du Form depuis son panneau de propriétés, car le Modal les fournit déjà.
3. Dans le champ **Generate form from**, sélectionnez la requête _fetchData_.
4. Ajustez le mapping des champs selon vos besoins et cliquez sur **Generate form**.

    <img className="screenshot-full img-m" src="/img/how-to/use-form/v2/generateForm.png" alt="Generate Form" />

5. Ajustez la mise en page du Form selon vos besoins.
6. Ajoutez deux boutons au footer du Modal : _Cancel_ et _Add_.

    <img className="screenshot-full img-full" src="/img/how-to/use-form/v2/formUI.png" alt="Form UI" />

## Étape 5 : Insérer des données à l'aide du formulaire

Créez une nouvelle requête pour écrire les données du formulaire dans la base de données :

- Nom : _addProduct_
- Opération : **Create row**
- Table : _products_

Associez chaque colonne à son champ de formulaire correspondant :

```js
name            → {{components.form.formData.name}}
category        → {{components.form.formData.category}}
quantity        → {{components.form.formData.quantity}}
price           → {{components.form.formData.price}}
rating          → {{components.form.formData.rating}}
low_stock_note  → {{components.form.formData.low_stock_note}}
supplier_email  → {{components.form.formData.supplier_email}}
```

<img className="screenshot-full img-full" src="/img/how-to/use-form/v2/addProduct.png" alt="addProduct Query" />

## Étape 6 : Connecter les événements et actualiser les données

**Actualiser le Table après une insertion réussie :**

1. Sélectionnez la requête _addProduct_ et allez dans **Settings**.
2. Cliquez sur **New event handler** et configurez :

   - Event : _Query Success_
   - Action : _Run Query_
   - Query : _fetchData_

    <img className="screenshot-full img-full mt-10" src="/img/how-to/use-form/v2/eventHandler1.png" alt="Refresh Table" />

**Exécuter la requête lorsque l'utilisateur clique sur Add :**

1. Sélectionnez le bouton _Add_ dans le footer du Modal.
2. Cliquez sur **New event handler** et configurez :

   - Event : _On click_
   - Action : _Run Query_
   - Query : _addProduct_

    <img className="screenshot-full img-full mt-10" src="/img/how-to/use-form/v2/eventHandler2.png" alt="Submit" />

La soumission du formulaire insère désormais une nouvelle ligne dans la table _products_ et actualise immédiatement le composant **Table** avec les dernières données.

## Étape 7 : Ajouter des validations

1. **Rendre les champs obligatoires**
   Plusieurs champs sont déjà marqués comme obligatoires depuis l'étape de génération du formulaire. Pour rendre _category_ également obligatoire, sélectionnez le composant d'entrée _category_ et activez le bouton bascule **Make this field mandatory**. ToolJet affiche une erreur si l'utilisateur tente de soumettre le formulaire alors que l'un de ces champs est vide.

2. **Valider le format de l'email**
   Sélectionnez le composant d'entrée _supplier_email_ et accédez à sa propriété **Validation**. Sélectionnez **Regex** et saisissez :

   ```js
   {{/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(components.form.formData.supplier_email) ? '' : 'Enter a valid email address'}}
   ```

   Ce motif d'expression régulière vérifie le format de l'email et renvoie un message d'erreur lorsque la saisie ne correspond pas.

## Étape 8 : Ajouter des champs conditionnels

Vous pouvez afficher ou masquer des champs en fonction de la saisie de l'utilisateur grâce à la propriété **Visibility**. Par exemple, le champ _low_stock_note_ n'est pertinent que lorsque la quantité saisie est faible.

Sélectionnez le composant d'entrée _low_stock_note_, cliquez sur **fx** à côté de sa propriété **Visibility**, et saisissez :

```js
{{components.form.formData.quantity < 10;}}
```

Le champ _low_stock_note_ n'apparaît désormais que lorsque la quantité est inférieure à 10, invitant l'utilisateur à ajouter une note sur l'état du stock.

## Étape 9 : Désactiver la soumission jusqu'à ce que le formulaire soit valide

Sélectionnez le bouton _Add_ dans le footer du Modal et définissez sa propriété **Disable** sur :

```js
{{!components.form.isValid;}}
```

La propriété `isValid` du composant Form ne retourne `true` que lorsque tous les composants enfants visibles passent leurs validations. Cela permet de garder le bouton désactivé jusqu'à ce que les champs obligatoires soient remplis et que les validations personnalisées, comme la vérification de l'email, soient satisfaites.
