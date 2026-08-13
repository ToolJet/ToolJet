---
id: runpy
title: Utiliser RunPy
---

Dans ce guide, nous allons apprendre à importer des bibliothèques Python dans vos applications.

Si vous découvrez les queries RunPy, consultez notre [guide](/docs/data-sources/run-py/) pour bien démarrer avec RunPy. ToolJet prend en charge l'installation de bibliothèques à l'aide de **micropip**. Consultez [cette](https://pyodide.org/en/stable/usage/packages-in-pyodide.html) documentation pour une liste des bibliothèques prises en charge.

## Installer des packages Python

Dans ToolJet, vous pouvez écrire du code Python pour une logique personnalisée, et pour des tâches de traitement de données intensives, vous pouvez utiliser des bibliothèques Python sans avoir besoin d'écrire du code complexe à partir de zéro. Voici comment les utiliser :

Vous pouvez utiliser **micropip** pour installer des packages comme Pandas et NumPy comme suit :

```python
import micropip
await micropip.install('pandas')
await micropip.install('numpy')
```

Déclenchez cette query RunPy une seule fois pour installer ces packages.

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/install_py.png" alt="Installing py modules" />

## Cas d'usage

### Analyser des données CSV

Supposons que vous souhaitiez que les utilisateurs téléchargent un CSV et visualisent le résultat analysé. Voici comment vous pouvez utiliser pandas et le module CSV de Python. Créez une query RunPy pour analyser les données CSV à l'aide des modules `StringIO`, `csv` et `Pandas`.

```python
from io import StringIO
import csv
import pandas as pd

scsv = components.filepicker1.file[0].content

f = StringIO(scsv)
reader = csv.reader(f, delimiter=',')

df = pd.DataFrame(reader)

print(df.info())
print(df)
```

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/parseCSV.png" alt="Installing py modules" />

- Ajoutez un File Picker à votre application et changez le type de fichier en CSV.
- Dans les paramètres d'événements du File Picker :
    - Événement : On File Loaded
    - Action : Run Query → choisissez votre script RunPy
- Téléchargez un fichier CSV. Lorsque vous déclenchez la query RunPy, elle analysera les données et affichera le résultat dans la console du navigateur

### Prétraitement des prompts pour les API d'IA

Lors de la création d'applications qui s'intègrent à des API d'IA (comme OpenAI, Cohere ou HuggingFace), vous devez souvent envoyer des entrées de texte de longue durée — comme des transcriptions de réunions, des retours d'utilisateurs ou des extraits de documents — à l'API. Cependant, de nombreuses API d'IA ont des limitations de taille d'entrée (par exemple, 4 096 tokens pour GPT-3.5), et elles fonctionnent souvent mieux lorsque l'entrée est propre et concise.

Ainsi, avant d'envoyer les données, vous pourriez vouloir :
- Nettoyer et normaliser le texte (supprimer les retours à la ligne, les espaces supplémentaires, les caractères non-ASCII)
- Découper le texte en morceaux de taille acceptable pour l'API (par exemple, 500 caractères ou 300 mots)
- Éventuellement, supprimer les sections non pertinentes (comme les en-têtes, le texte standard ou les avertissements)

Voici un exemple de la façon de réaliser cette étape de prétraitement à l'aide d'expressions régulières (`re`) :

```python
import re

# Get raw text from a multi-line input component (like a long form or a textarea)
raw_text = components.textarea1.text

# 1. Clean the text
cleaned = re.sub(r"\s+", " ", raw_text).strip()

# 2. Chunk the cleaned text into slices of 500 characters each
chunks = [cleaned[i:i+500] for i in range(0, len(cleaned), 500)]

# Output the cleaned and chunked data
print({"chunks": chunks})
```

<details id="tj-dropdown">

<summary>Entrée - Notes de réunion</summary>

Nous avons discuté de la feuille de route du T3 et convenu de prioriser les améliorations de performance. Il y a également eu des suggestions pour améliorer l'expérience d'onboarding.

Éléments d'action :
 - Alice va enquêter sur les problèmes de mise en cache et faire un rapport avant lundi prochain.
 - Bob va examiner la réactivité de l'interface sur différentes tailles d'écran.
 - Carol va commencer à planifier l'enquête de retour utilisateur pour le T4.

Discussion supplémentaire :
- Une proposition a été faite pour réduire les temps de build en passant à un système CI/CD plus récent.
- Des préoccupations ont été soulevées concernant la fiabilité et les problèmes de latence de l'API backend.
- L'équipe data a mentionné qu'elle est en retard sur la mise en place du nouveau pipeline de tableau de bord.

Prochaines étapes :
- Les points hebdomadaires reprendront à partir de mardi prochain.
- Chaque équipe soumettra un rapport d'avancement bimensuel.
- La planification de la démo produit prévue pour le 15 novembre commencera la semaine prochaine.

</details>


<details id="tj-dropdown">

<summary>Sortie - Données découpées</summary>

```json
{
  "chunks": [
    "We discussed the Q3 roadmap and agreed to prioritize performance improvements. There were also suggestions to improve the onboarding experience. Action items: - Alice will investigate caching issues and report back by next Monday. - Bob will look into UI responsiveness across different screen sizes. - Carol will start planning for the user feedback survey in Q4.",
    
    "Additional Discussion: - A proposal was made to reduce build times by moving to a newer CI/CD system. - Concerns were raised about backend API reliability and latency issues. - Data team mentioned they are behind on setting up the new dashboard pipeline. Next Steps: - Weekly check-ins will resume starting next Tuesday. - Each team will submit a biweekly progress report. - Planning for the product demo scheduled for November 15th will start next week."
  ]
}
```

</details>

