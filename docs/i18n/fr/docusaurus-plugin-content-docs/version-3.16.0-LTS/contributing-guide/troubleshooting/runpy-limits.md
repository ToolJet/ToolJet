---
id: runpy-limitations
title: RunPy limitations
---

### Limitation : Impossible d'ouvrir des URL externes avec urlopen dans RunPy

Lors de l'utilisation de la fonction `urlopen` au sein d'une requête RunPy, vous pouvez rencontrer une erreur en essayant d'ouvrir des URL externes, comme `https://api.baserow.io`. Cette limitation est due au framework sous-jacent utilisé par RunPy, Pyodide, qui présente certaines contraintes et peut ne pas prendre en charge toutes les fonctionnalités disponibles dans un environnement Python standard.

### Solution : Utiliser la fonction fetch avec JavaScript

Pour contourner cette limitation, vous pouvez utiliser la fonction `fetch` de JavaScript, car Pyodide prend en charge l'interopérabilité entre Python et JavaScript. Voici un exemple de la façon d'effectuer une requête HTTP à l'aide de la fonction `fetch` dans une requête RunPy :

```python
from js import fetch
import json

async def push_data(url, data):
    response = await fetch(
        url,
        method='POST',
        headers=[
            ["Authorization", "Token <my_token>"],
            ["Content-Type", "application/json"]
        ],
        body=data
    )
    reply = await response.json()
    return reply

url = "https://api.baserow.io/api/database/rows/table/.../?user_field_names=true"
reply = await push_data(url, json.dumps(<my_data>))
reply
```

Dans l'exemple ci-dessus, la fonction `fetch` est utilisée pour effectuer une requête HTTP POST vers l'URL spécifiée. L'en-tête `Authorization` est inclus pour fournir le jeton d'authentification nécessaire, et le corps de la requête est transmis sous forme de données JSON.

En utilisant la fonction `fetch` et l'interopérabilité JavaScript, vous pouvez effectuer avec succès des requêtes HTTP dans une requête RunPy dans les scénarios où `urlopen` peut rencontrer des limitations.

Il est important de noter que la solution proposée ici suppose que vous disposez du jeton d'autorisation et des données nécessaires pour envoyer à la table Baserow. Adaptez le code en conséquence pour répondre à vos besoins spécifiques.