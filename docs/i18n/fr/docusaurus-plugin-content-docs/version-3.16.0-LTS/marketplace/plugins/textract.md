---
id: marketplace-plugin-textract
title: Amazon Textract
---

ToolJet s'intègre avec Amazon Textract pour faciliter l'extraction de texte et de données à partir de divers types de documents, tels que les documents scannés, les formulaires et les tableaux. Les formats de documents pris en charge incluent PDF, JPEG/JPG et PNG.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé la procédure d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour connecter ToolJet à Amazon Textract, vous aurez besoin des identifiants suivants :
- **Access key**
- **Secret key**
- **Region**

:::caution
- L'accès au bucket S3 dépend des permissions accordées au rôle IAM ajouté pour la connexion.
- Seuls les documents d'une seule page sont pris en charge. Pour les PDF multi-pages, envisagez de les convertir en formats d'une seule page à l'aide d'outils en ligne.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/textract/connection-v2.png" alt="Amazon Textract Configuration" style={{ marginBottom:'15px' }} />

</div>

## Opérations prises en charge

- **[Analyze Document](#analyze-document)**
- **[Analyze document stored in AWS S3](#analyze-document-stored-in-aws-s3)**

:::info
Les données renvoyées par les requêtes sont au format **JSON** et peuvent inclure des informations supplémentaires telles que les scores de confiance et l'emplacement du contenu extrait dans le document original.
:::

### Analyze Document

Cette opération vous permet d'analyser le document à partir des données du document au format **base64**.

#### Paramètres requis : 

- **Document** : Fournissez les données du document au format base64. Le composant File Picker peut être utilisé ici pour sélectionner le document depuis le système local et récupérer dynamiquement les données base64 à l'aide des variables exposées. Exemple : `{{components.filepicker1.file[0].base64Data}}`.
- **Data Output** : Choisissez les types de sortie de données souhaités pour l'analyse du document. Les options incluent : 
  1. **Forms** : Extraire les paires clé-valeur des formulaires.
  2. **Tables** : Extraire les données des tableaux, y compris les en-têtes et le contenu des cellules.
  3. **Queries** : Extraire les données des bases de données et autres sources structurées.
  4. **Signature Detection** : Identifier et extraire les signatures.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/textract/analyze-query.png" alt="Amazon Textract querying" style={{ marginBottom:'15px' }} />

### Analyze Document Stored in AWS S3

Cette opération vous permet d'analyser le document stocké dans vos buckets AWS S3 en fournissant le nom du **bucket** et de l'**objet**.

#### Paramètres requis : 

- **Bucket** : Spécifiez le bucket S3 contenant le document.
- **Key** : Indiquez le nom du document (objet) à analyser.
- **Data Output** : Sélectionnez un ou plusieurs types de sortie de données du document. Les options incluent : 
  1. **Forms** : Extraire les paires clé-valeur des formulaires.
  2. **Tables** : Extraire les données des tableaux, y compris les en-têtes et le contenu des cellules.
  3. **Queries** : Extraire les données des bases de données et autres sources structurées.
  4. **Signature Detection** : Identifier et extraire les signatures.

  <img style={{ marginTop:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/textract/analyze-in-S3-query.png" alt="Amazon Textract querying" />
