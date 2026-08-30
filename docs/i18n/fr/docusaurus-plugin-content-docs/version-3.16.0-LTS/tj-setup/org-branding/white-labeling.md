---
id: white-labeling
title: White Labeling
---

<PlanBadge type="team" />

La fonctionnalité White Label de ToolJet vous permet de personnaliser l'apparence de votre déploiement ToolJet pour l'adapter à vos directives de marque, y compris votre logo, votre favicon, le titre de la page et la page de connexion, afin que ToolJet apparaisse comme votre propre produit. Ce guide vous aidera à comprendre la configuration du marquage blanc (white labelling) pour votre organisation. Pour les instances **auto-hébergées**, le marquage blanc est défini au [niveau de l'instance](/docs/user-management/authentication/self-hosted/instance-login) et pour le **cloud**, il est appliqué au [niveau du workspace](/docs/user-management/authentication/self-hosted/workspace-login).

## Configuration

Pour accéder à la configuration du marquage blanc, allez dans **Settings > White Labelling**. <br/><br/>
Exemple d'URL :
- Auto-hébergé - `https://app.corp.com/settings/white-labelling`
- Cloud - `https://app.tooljet.com/<workspace-slug>/settings/white-labelling`

<img className="screenshot-full img-full" src="/img/tooljet-setup/whitelabelling/settings.png" alt="white labelling" /> <br/><br/>

Dans cette section, vous pouvez configurer les éléments de marque suivants :

- **Logo de l'application** : cela inclut le logo affiché sur l'écran de connexion, le dashboard, l'éditeur d'application et l'application déployée. (Dimensions recommandées : 130px x 26px)
- **Titre de la page** : c'est le titre associé à la page web affiché dans l'onglet du navigateur. (Longueur de titre recommandée : 50-60 caractères)
- **Favicon** : c'est une icône associée à la page web affichée dans l'onglet du navigateur. (Dimensions recommandées : 32px x 32px ou 16px x 16px) <br/>
    <img style={{ marginTop: '10px' }} className="screenshot-full img-m" src="/img/tooljet-setup/whitelabelling/intro.png" alt="whitelable your brand" />
- **Image de la page de connexion** : elle est affichée sur le côté droit de la page de connexion et peut être utilisée pour donner aux utilisateurs un indice sur ce à quoi ils se connectent. (Dimensions recommandées : 1024px x 1024px) <br/>
    <img style={{ marginTop: '10px' }} className="screenshot-full img-full" src="/img/tooljet-setup/whitelabelling/intro-v2.png" alt="whitelable your brand" />

## FAQ

<details id="tj-dropdown">
    <summary>
         **Qu'advient-il du marquage blanc si la licence ou l'abonnement expire ?**
    </summary>
Si votre licence ou votre abonnement expire, le marquage blanc reviendra automatiquement à la marque par défaut de ToolJet jusqu'au renouvellement de la licence.

</details>
