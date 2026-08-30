---
id: marketplace-plugin-mistral_ai
title: Mistral AI
---

Mistral AI peut être intégré à ToolJet pour générer du contenu textuel de haute qualité. En définissant différents rôles, il permet la création de contenu contextuellement pertinent et dynamique.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à Mistral AI, vous aurez besoin d'une **clé API**, qui peut être générée depuis la **[console Mistral AI](https://console.mistral.ai/api-keys/)**.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/mistral/config.png" alt="Configuration de la source de données Mistral" />

## Opérations prises en charge

### Génération de texte

Utilisez cette opération pour générer du contenu textuel en contrôlant différents paramètres afin d'obtenir des résultats précis.

**Paramètres requis**

- **Model** : Utilisé pour spécifier le modèle d'IA pour générer le contenu. Les modèles disponibles sont :

    - mistral-large-latest
    - ministral-3b-latest
    - ministral-8b-latest
    - open-mistral-nemo
    - mistral-small-latest

- **Messages** : Fournissez une entrée structurée pour définir le contexte ou la conversation. <br/>

:::info

1. Un objet message avec le rôle **assistant** doit toujours avoir un objet message de préfixe et de suffixe dans le tableau messages.
2. Si un objet message avec le rôle **assistant** est le dernier du tableau, définissez `prefix: true` dans cet objet.
:::

**Paramètres optionnels**

- **Max size** : Définit la longueur maximale du contenu généré.
- **Temperature** : Ajustez pour contrôler la créativité et la diversité de la sortie.
- **Top P** : Utilisé pour limiter le caractère aléatoire en définissant un seuil de probabilité.
- **Stop token(s)** : Spécifiez des jetons ou des expressions pour terminer la génération de contenu.
- **Random seed** : Définissez pour garantir des résultats cohérents en initialisant le générateur.
- **Response format** : Choisissez entre du texte brut ou une sortie JSON structurée.
- **Presence penalty** : Appliquez pour réduire la répétition de mots ou d'expressions.
- **Frequency penalty** : Utilisé pour dissuader l'utilisation fréquente de mots afin d'obtenir des réponses plus variées.
- **Completions (N)** : Définit le nombre de variations de réponse à générer.
- **Safe prompt** : Assure que l'invite est exempte de contenu inapproprié ou sensible.

Voici un exemple de message d'entrée :

```yaml
Messages
[{
    "role": "system",
    "content": "You are a financial advisor of a fortune 500 company"
},
{
    "role": "user",
    "content": "Can you help me with tax benefits for the employee"
},
{
    "role": "assistant",
    "content": "Sure! Please help me with more specific details of your employment and salary structure."
},
{
    "role": "user",
    "content": "I am a salaried employee with 220,000 USD yearly compensation"
}
]
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/mistral/query-v2.png" alt="Requête Mistral" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

"While I can't provide personalized financial advice, I can certainly help you understand some common investment options that may offer tax benefits. Here are some strategies to consider:

#### 1. **Retirement Accounts**
- **401(k) or 403(b):** These are employer-sponsored retirement plans. Contributions are made with pre-tax dollars, reducing your taxable income. Employer matching contributions can also boost your savings.
- **Traditional IRA:** Contributions may be tax-deductible, depending on your income and whether you have access to a workplace retirement plan. Withdrawals are taxed as ordinary income.
- **Roth IRA:** Contributions are made with after-tax dollars, but qualified withdrawals are tax-free. This can be beneficial for those who expect to be in a higher tax bracket in retirement.

#### 2. **Health Savings Accounts (HSAs)**
- **HSAs:** These are available to individuals with high-deductible health plans. Contributions are tax-deductible, earnings grow tax-free, and withdrawals for qualified medical expenses are tax-free.

#### 3. **Tax-Loss Harvesting**
- **Selling Losing Investments:** You can sell investments that have lost value to offset gains from other investments, reducing your capital gains tax liability.

#### 4. **Municipal Bonds**
- **Muni Bonds:** These are issued by state and local governments and are often exempt from federal taxes and sometimes state taxes as well.

#### 5. **Education Savings Accounts**
- **529 Plans:** Contributions grow tax-free, and withdrawals are tax-free if used for qualified education expenses. Some states offer tax deductions or credits for contributions.
- **Coverdell ESAs:** Similar to 529 plans but with more restrictions on contributions and uses.

#### 6. **Real Estate Investments**
- **Rental Income:** Income from rental properties can be offset by depreciation, reducing your taxable income.
- **1031 Exchanges:** Allows you to defer capital gains taxes by reinvesting the proceeds from the sale of an investment property into a similar property.

#### 7. **Tax-Efficient Investments**
- **Index Funds and ETFs:** These often have lower turnover rates, which can reduce capital gains distributions and therefore tax liabilities.
- **Dividend-Paying Stocks:** Qualified dividends are taxed at lower rates than ordinary income.

#### 8. **Charitable Contributions**
- **Donations:** Contributions to qualified charities can be tax-deductible, reducing your taxable income.
- **Donor-Advised Funds:** Allow you to make a charitable contribution and receive an immediate tax deduction, while deciding later where to allocate the funds.

#### 9. **Energy-Efficient Home Improvements**
- **Tax Credits:** Certain energy-efficient home improvements may qualify for tax credits.

#### 10. **Business Ownership**
- **Sole Proprietorships, LLCs, S-Corps:** Different business structures offer various tax benefits, such as pass-through income and deductions for business expenses.

#### Steps to Create a Plan:
1. **Assess Your Financial Goals:** Determine what you want to achieve with your investments (e.g., retirement savings, education funding).
2. **Evaluate Your Tax Situation:** Understand your current and future tax brackets to choose the right investment vehicles.
3. **Diversify Your Portfolio:** Spread your investments across different asset classes to manage risk.
4. **Consult a Professional:** Consider working with a financial advisor or tax professional to tailor a plan to your specific needs."

</details>
