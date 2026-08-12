---
id: run-py
title: Run Python Code
slug: /data-sources/run-py
---

Dans ToolJet, le code personnalisé **Run Python Code** peut être utilisé pour interagir avec les composants et les requêtes, permettant de personnaliser les actions et le traitement des données.

<img className="screenshot-full img-full" src="/img/datasource-reference/custom-python/data-source.png" alt="Run Python code" />

## Utiliser du code Python pour déclencher des actions spécifiques à un composant

1. Faites glisser un composant **Text** sur le canevas. Nous allons définir le texte du composant Text en utilisant la requête Python.
2. Créez une requête et sélectionnez **Run Python code** parmi les sources de données disponibles
3. Collez le code ci-dessous dans l'éditeur de code et enregistrez la requête :

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def myfunc(self):
        return "Hello my name is " + self.name

p1 = Person(tj_globals.currentUser.firstName, 36)

components.text1.setText(p1.myfunc())
```

4. Le code ci-dessus contient une fonction `myfunc` qui renvoie une chaîne, et nous utilisons une **[Component Specific Action](/docs/app-builder/events/use-case/csa)** pour définir la valeur du composant Text à partir de la requête Python.

:::tip

- Pour l'instant, Run Python code ne prend en charge que la [bibliothèque standard Python](https://docs.python.org/3/library/).
- Consultez les **[limitations de RunPy](/docs/contributing-guide/troubleshooting/runpy-limitations)** pour connaître les limites liées à l'utilisation du code Python
  :::

## Déclencher des requêtes à l'aide de Run Python Code

Pour déclencher des requêtes en Python, vous pouvez utiliser les fonctions ci-dessous :

```py
actions.runQuery('getSalesData')
#replace getSalesData with your query name
```

Ou

```py
queries.getSalesData.run()
#replace getSalesData with your query name
```

## Récupérer les données d'une requête

Pour accéder immédiatement aux données renvoyées par une requête dans **Run Python code**, vous pouvez utiliser les fonctions ci-dessous :

### Déclencher une requête et récupérer ses données

```py
await queries.getSalesData.run()
#replace getSalesData with your query name

value = queries.getSalesData.getData()
#replace getSalesData with your query name

value
```

### Déclencher une requête et récupérer ses données brutes

```py
await queries.getCustomerData.run()
#replace getCustomerData with your query name

value = queries.getCustomerData.getRawData()
#replace getCustomerData with your query name

value
```

### Déclencher une requête et récupérer son état de chargement

```py
await queries.getTodos.run()
#replace getTodos with your query name

value = queries.getTodos.getloadingState()
#replace getTodos with your query name

value
```

## Récupérer des variables

Pour définir et accéder à des variables ou à des variables de page dans **Run Python code**, vous pouvez utiliser les fonctions ci-dessous :

### Définir une variable

```py
actions.setVariable('color','blue')
#replace color with your desired variable name
```

### Récupérer immédiatement une variable après l'avoir définie

```py
actions.setVariable('mode','dark')
#replace mode with your desired variable name

actions.getVariable('mode')
#replace mode with your desired variable name
```

### Définir une variable spécifique à la page

```py
actions.setPageVariable('version', 1)
#replace version with your desired variable name
```

### Récupérer immédiatement une variable spécifique à la page après l'avoir définie

```py
actions.setPageVariable('number',1)
#replace number with your desired variable name

actions.getPageVariable('number')
#replace number with your desired variable name
```

## Utiliser les transformations avec Python

**Run Python code** peut être utilisé pour transformer les données récupérées dans les requêtes. Pour tester les transformations avec Python, créez une nouvelle requête **REST API**, laissez la méthode sur _GET_ et saisissez l'URL ci-dessous dans la propriété **URL**.

```yaml
https://dummyjson.com/products
```

Cliquez sur le bouton **Run** et vérifiez l'aperçu des données renvoyées ; voici la structure des données de la réponse :

```js
products_data = {
    "products": [
        {"title": "iPhone 9", ...},
        {"title": "iPhone X", ...},
        # Additional products...
    ]
}
```

### Filtrer les titres de la réponse

Pour extraire une liste de titres de produits à partir de la structure de données donnée, nous parcourons la liste _products_ et récupérons le _title_ de chaque produit en utilisant le code ci-dessous. Activez **Transformations** dans l'éditeur de requêtes et utilisez le code ci-dessous :

```python
return [product["title"] for product in data["products"]]
```

### Filtrer les produits par catégorie

Pour filtrer les produits par une catégorie spécifique, comme _smartphones_, et extraire leurs titres. Activez **Transformations** dans l'éditeur de requêtes et utilisez le code ci-dessous :

```python
return [product["title"] for product in data["products"] if product["category"] == "smartphones"]
```

### Calculer le prix moyen d'une catégorie

Pour calculer le prix moyen des produits de la catégorie _laptops_. Activez **Transformations** dans l'éditeur de requêtes et utilisez le code ci-dessous :

```python
return sum(product["price"] for product in data["products"] if product["category"] == "laptops") / len([product for product in data["products"] if product["category"] == "laptops"]) if len([product for product in data["products"] if product["category"] == "laptops"]) > 0 else 0
```

## Référencer les données d'une requête Python dans les composants

Comme pour d'autres valeurs dynamiques, vous pouvez référencer les données renvoyées par les requêtes **Run Python code** en utilisant les doubles accolades `{{}}`.

Par exemple, si vous avez une requête **Run Python code** nommée _updatedProductInfo_, vous pouvez passer `{{queries.updatedProductInfo.data}}` sous la propriété **Data** d'un composant Table pour le remplir avec les données renvoyées par la requête _updatedProductInfo_.

:::info
Des problèmes lors de l'écriture de code Python personnalisé ? Posez votre question dans notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA).
:::
