---
id: py
title: Nœud Python
---

<br/>

Le nœud **Python** vous permet d'exécuter du code Python côté serveur personnalisé au sein de votre workflow. Il peut être utilisé pour :
- Transformer des données
- Effectuer des calculs complexes
- Affiner les réponses
- Mettre en œuvre une logique métier

Ce nœud s'exécute de manière sécurisée dans un environnement en bac à sable (sandbox) sur le serveur, il peut donc gérer la manipulation de données à grande échelle, préparer ou enrichir des données pour les nœuds suivants, ou créer des réponses personnalisées pour des services externes.

**Remarque :** pour transmettre les résultats aux nœuds suivants, vous pouvez soit définir une variable `result`, soit terminer votre code par une expression — la valeur évaluée de la dernière expression est automatiquement renvoyée.

## Accéder à l'état du workflow

Tous les résultats des nœuds précédents, les paramètres et les variables du workflow sont injectés dans le contexte d'exécution Python en tant que variables globales. Vous pouvez y faire référence directement dans votre code.

```python
# Access results from a previous node named 'getSalesData'
sales = getSalesData['data']

# Access workflow parameters
user_id = params['userId']
```

## Exemple : affiner votre réponse avec Python

Affinez votre réponse en manipulant les données avec Python. Par exemple, vous pouvez utiliser le découpage de liste (list slicing) pour sélectionner un sous-ensemble de données :

```python
result = {
    "sales": getSalesData["data"][:5],
    "inventory": getInventory["data"][:5],
    "csv": generateCSVData["data"]
}
```

## Exemple : utiliser des packages externes

Vous pouvez installer des packages Python externes pour votre workflow via le gestionnaire de packages. Les packages sont définis au format `requirements.txt` et installés une seule fois par version de workflow.

```python
import pydash

result = pydash.map_([1, 2, 3], lambda x: x * 2)
# Returns: [2, 4, 6]
```

:::info
Seuls les packages disposant de wheels précompilées (pure Python ou manylinux) sont pris en charge. Les packages nécessitant une compilation C lors de l'installation ne sont pas disponibles.
:::

## Limitations

- **Délai d'expiration (Timeout)** : chaque exécution de nœud Python est limitée à 10 secondes.
- **Mémoire** : l'exécution est limitée à 512 Mo de mémoire virtuelle.
- **Pas d'accès réseau** : le sandbox n'autorise pas les appels réseau sortants. Utilisez des nœuds de source de données pour récupérer des données externes avant de les transmettre à un nœud Python.
- **Les valeurs de retour doivent être sérialisables en JSON** : les chaînes de caractères, les nombres, les listes, les dictionnaires, `None` et les booléens sont pris en charge.