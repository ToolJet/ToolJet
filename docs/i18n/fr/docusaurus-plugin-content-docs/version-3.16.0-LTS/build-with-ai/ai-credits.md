---
id: ai-credits
title: Comprendre les crédits IA
---

Un crédit est une unité standardisée de puissance de traitement IA consommée à chaque opération IA effectuée dans ToolJet. Chaque opération, de la [génération d'applications complètes](/docs/build-with-ai/generate-applications) à la modification de mises en page ou à l'écriture de code personnalisé, consomme un nombre variable de crédits en fonction de la complexité de la tâche.

Dans ce guide, vous apprendrez comment fonctionne la consommation de crédits, les types de crédits, l'utilisation des crédits, comment obtenir plus de crédits, et bien plus encore.

## Comment les crédits sont consommés

Les crédits sont consommés en fonction de la complexité de chaque opération et du contexte de votre conversation. L'IA utilise l'historique de la conversation pour rester alignée avec votre intention ; plus votre session est ciblée et spécifique, plus elle fonctionne efficacement.

La consommation de crédits est volontairement variable : un simple ajustement de mise en page coûte bien moins de crédits que la génération d'une application complète avec une logique complexe. Cela signifie que vous avez un grand contrôle sur l'efficacité de votre construction ; des sessions ciblées avec des prompts clairs et spécifiques permettent d'accomplir davantage par crédit.

Pour des conseils sur la structuration de vos prompts et sessions afin d'obtenir les meilleurs résultats, consultez [Prompting 101 - Bonnes pratiques](/docs/build-with-ai/prompting101#efficient-utilization-of-credits).

## Utilisation des crédits

L'utilisation des crédits dans ToolJet varie en fonction de la complexité de la demande. Les crédits mensuels sont toujours consommés en premier. Les crédits complémentaires ne sont utilisés qu'une fois les crédits mensuels épuisés. Les encarts ci-dessous fournissent une fourchette moyenne des crédits utilisés pour différentes opérations, afin de vous aider à estimer votre utilisation.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '16px 0'}}>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>[Génération d'applications](/docs/build-with-ai/generate-applications)</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>100 crédits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Nouvelle fonctionnalité dans l'application</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>100 crédits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Modification de la mise en page/de l'UI</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>50 crédits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Modification des queries/de la base de données</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>30 crédits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>[Correction automatique des composants de débogage](/docs/build-with-ai/debug-components)</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>10 crédits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>[Assistant IA de documentation](/docs/build-with-ai/ai-docs-assistant)</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>6 crédits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Génération de query</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>5 crédits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Génération de code personnalisé</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Moyenne</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>2 crédits</span>
    </span>
  </div>

</div>

:::warning
Ces valeurs ne sont que des estimations moyennes destinées à vous aider à planifier vos opérations. **La consommation réelle de crédits variera en fonction de la complexité de l'opération.**
:::

## Types de crédits

### Crédits mensuels

Les crédits mensuels sont des crédits récurrents inclus dans votre licence achetée. Ils se renouvellent chaque mois à la date du cycle de facturation et sont valables un mois. Les crédits non utilisés ne sont pas reportés au mois suivant. Même si vous êtes sur un plan annuel, les crédits sont tout de même renouvelés sur une base mensuelle.

### Crédits complémentaires
<PlanBadge type="pro" />


Les crédits complémentaires peuvent être achetés en plus de vos crédits mensuels et constituent un achat unique qui ne se renouvelle pas chaque mois. Ces crédits ne peuvent être achetés que par multiples de 100 et sont valables un an à partir de la date d'achat. Si vous achetez des crédits supplémentaires après un premier achat, la validité de l'ensemble du pool de crédits est prolongée en fonction de la date d'achat la plus récente. Consultez la page [tarifs](https://www.tooljet.com/pricing) pour plus d'informations.

## Acheter des crédits complémentaires

### Déploiement self-hosted

Suivez ces étapes pour acheter des crédits complémentaires sur votre déploiement self-hosted de ToolJet :

1. Allez dans Settings > License. <br/>
   (URL d'exemple - https://app.nexuscorp.com/settings/license)
2. Cliquez sur le bouton **Get AI credits** en haut à droite. <br/>
   <img className="screenshot-full img-full" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/sh-button.png" alt="AI Credits" />
3. Une fenêtre de paiement s'ouvrira où vous pourrez saisir des détails tels que le nombre de crédits que vous souhaitez acheter et d'éventuels codes promo. Après avoir renseigné les détails, cliquez sur le bouton **Get AI credits** en bas. <br/>
   <img className="screenshot-full img-s" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/sh-modal.png" alt="AI Credits" />
4. Vous serez ensuite redirigé vers la passerelle de paiement. Une fois le paiement réussi, les crédits seront ajoutés à votre instance.

### Déploiement Cloud

Suivez ces étapes pour acheter des crédits complémentaires sur ToolJet Cloud :

1. Allez dans Settings > Subscription. <br/>
   (URL d'exemple - https://app.tooljet.com/nexuscorp/settings/subscription)
2. Cliquez sur le bouton **Get AI credits**. <br/>
   <img className="screenshot-full img-full" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/cloud-button.jpg" alt="AI Credits" />
3. Une fenêtre de paiement s'ouvrira où vous pourrez saisir des détails tels que le nombre de crédits que vous souhaitez acheter et d'éventuels codes promo. Après avoir renseigné les détails, cliquez sur le bouton Get AI credits en bas. <br/>
   <img className="screenshot-full img-full" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/cloud-modal.png" alt="AI Credits" />
4. Vous serez ensuite redirigé vers la passerelle de paiement. Une fois le paiement réussi, les crédits seront ajoutés à votre workspace.

## Allocation des crédits

Les crédits ToolJet AI sont alloués par builder et par mois selon la licence achetée. Le total des crédits de tous les builders, ainsi que tout crédit complémentaire acheté, sont regroupés et mis à disposition collectivement.

- Au **niveau de l'instance** pour les déploiements [self-hosted](/docs/tj-setup/tj-deployment#self-hosted-tooljet).
- Au **niveau du workspace** pour les déploiements [Cloud](/docs/tj-setup/tj-deployment#tooljet-cloud).

## Vérifier les crédits disponibles

### Dans l'app-builder

1. Cliquez sur l'icône de crédit en haut à droite de l'interface de chat IA.
2. Consultez le total de vos crédits disponibles (mensuels + complémentaires combinés).

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/app-builder.png" alt="tooljet available credits" />

### Dans les paramètres

1. Accédez à Settings > Subscription.
2. Consultez la répartition détaillée des crédits mensuels et complémentaires.
3. Vérifiez les périodes de validité et les dates de renouvellement.

Vous y trouverez également une option pour acheter des crédits complémentaires supplémentaires.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/settings.png" alt="tooljet available credits" />
