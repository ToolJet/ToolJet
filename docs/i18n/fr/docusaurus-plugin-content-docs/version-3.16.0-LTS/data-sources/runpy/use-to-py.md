---
id: use-to-py-function-in-runpy
title: "Translating JavaScript Objects to Python in RunPy"
---

Ce guide illustre l'utilisation de la fonction **`to_py()`** dans les requêtes RunPy pour convertir des objets JavaScript en leurs représentations Python correspondantes. Elle permet une interopérabilité fluide entre les composants ToolJet, les requêtes basées sur JavaScript et la logique Python. Grâce à `to_py()`, des données structurées telles que des objets et des tableaux peuvent être consultées et traitées en toute sécurité dans du code Python.

## La fonction to_py()

La fonction **to_py()** de la bibliothèque **Pyodide** constitue l'équivalent de la fonction **to_js()**. Son objectif est de transformer des objets JavaScript en structures Python équivalentes. Cette conversion devient essentielle lors de la manipulation d'objets JavaScript dans l'environnement Pyodide à l'aide de code Python.

Comme **to_js()**, **to_py()** facilite le mapping et la conversion des types de données entre JavaScript et Python. Elle convertit efficacement les objets JavaScript, les tableaux et d'autres structures de données en leurs équivalents Python.

:::info
Consultez la documentation **[RunPy](/docs/data-sources/run-py)** pour une compréhension plus approfondie.
:::

## Utiliser la fonction to_py()

Pour tester le fonctionnement de la fonction `to_py`, suivez les étapes mentionnées ci-dessous :

- Depuis le tableau de bord ToolJet, créez une nouvelle application en cliquant sur le bouton **Create an app**.
- Une fois l'application créée, accédez au panneau de requêtes, cliquez sur le bouton **+ Add** et choisissez **Run Python Code** comme source de données.
- Utilisez le code ci-dessous dans l'éditeur de code de la requête *runpy* :

```python
import pyodide # Import the Pyodide library

def to_py(js_object): # Define a function to convert JavaScript objects to Python dictionaries
  return dict(js_object) # Convert the JavaScript object to a Python dictionary

my_js_object = {"name": "Sam", "age": 28, "country": "India"} # Create a JavaScript object

my_py_dict = to_py(my_js_object) # Convert the JavaScript object to a Python dictionary

my_py_dict # Return the Python dictionary
```

Dans cet exemple, un objet JavaScript `my_js_object` est créé à l'aide de la méthode `Object.fromEntries()`, représentant une structure de type dictionnaire. La fonction `to_py()` est ensuite utilisée pour convertir cet objet JavaScript en un dictionnaire Python, produisant `my_py_dict`.

Le résultat sera :
```json
name:"Sam"
age:28
country:"India"
```

En exploitant to_py(), les objets JavaScript peuvent facilement se transformer en représentations Python, permettant leur manipulation à l'aide de code Python dans l'environnement Pyodide.

Les fonctions **to_js()** et **to_py()** offrent toutes deux un moyen pratique d'échanger des données entre Python et JavaScript dans Pyodide, permettant d'exploiter les forces des deux langages au sein d'un environnement unifié.

## Pourquoi l'utilisation de to_py() est-elle essentielle ?

- Lors de la prévisualisation des résultats d'une requête *RunPy*, des différences entre les onglets JSON et Raw peuvent apparaître en raison des mécanismes de conversion et d'affichage de **Pyodide**. Par défaut, les **dictionnaires Python** sont convertis en **objets JavaScript Map** dans Pyodide, assurant la compatibilité entre les deux langages.

- Par conséquent, l'onglet **JSON** présente les données au format d'objets JavaScript, indiqués par les symboles **()**, tandis que l'onglet **Raw** affiche la représentation brute sous la forme **[{}, {}, ...],** montrant les dictionnaires Python dans leur forme d'origine avec les symboles **{}**.

- Les deux représentations sont correctes : l'onglet JSON présente des données converties compatibles avec JavaScript, tandis que l'onglet Raw affiche les dictionnaires Python d'origine. Le choix dépend du cas d'utilisation de l'utilisateur et du fait qu'il ait besoin de travailler avec les données dans un **contexte JavaScript** ou dans un **contexte Python**.

- Pour maintenir la cohérence entre les représentations JSON et Raw, la fonction `to_js()` fournie par Pyodide peut convertir explicitement les dictionnaires Python en objets JavaScript. Cela garantit l'alignement entre les représentations et garantit que les données sont dans le format souhaité.

## Exemple de requête 
Cet exemple montre comment utiliser une requête RunPy pour effectuer des calculs basés sur les entrées de l'utilisateur à partir de composants d'interface utilisateur et renvoyer des données structurées pouvant être consommées par d'autres composants.

**Scénario : calculer le coût total à partir des entrées de l'utilisateur.**

Dans ce scénario, l'application recueille une quantité et un prix auprès de l'utilisateur et calcule le coût total à l'aide d'une logique Python.

**Étape 1 :** Ajoutez les composants suivants au canevas :
- Quantity – composant Number Input nommé `quantity_input`
- Price – composant Number Input nommé `price_input`

 Ensuite, liez l'interface utilisateur avec ce code pour le résultat.

```yaml
{{queries.runpy1.data}}
```

**Étape 2 :** Configuration de la requête RunPy
Créez une requête Run Python Code et ajoutez le code suivant :

```python
quantity = int(components.quantity_input.value or 0)
price = int(components.price_input.value or 0)

total = quantity * price

{
  "quantity": quantity,
  "price": price,
  "total": total
}
```

<img style={{ marginBottom:'15px'}} className="screenshot-full img-m" src="/img/how-to/to_py/example.png" alt="Appwrite update" />
