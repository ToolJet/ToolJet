# Adanos Marketplace Plugin for ToolJet

Native connector for [Adanos](https://adanos.org) market and social media sentiment data.

## Features

- **Authentication**: Connect using your Adanos API key (`X-API-Key`).
- **Data Sources**:
  - Reddit stocks (`/reddit/stocks/v1`)
  - X / FinTwit stocks (`/x/stocks/v1`)
  - News stocks (`/news/stocks/v1`)
  - Polymarket stocks (`/polymarket/stocks/v1`)
  - Reddit crypto (`/reddit/crypto/v1`)
- **Supported Operations**:
  - `Get asset sentiment`: Sentiment metrics and score for a specific stock ticker or crypto token.
  - `Get trending assets`: Real-time buzz and trending assets.
  - `Compare assets`: Side-by-side sentiment comparison for up to 10 assets.
  - `Get market sentiment`: Overall market sentiment score, buzz, and leading market drivers.
