# CPF.CNPJ

Look up Brazilian CPF and CNPJ registration data from Receita Federal in real time.

## Authentication

The data source takes a single API token. Create one at Panel > API > Tokens on
[cpfcnpj.com.br](https://www.cpfcnpj.com.br/dev/). The token is sent as the first path
segment of every request and is bound to the outbound IP address of your ToolJet server,
so allow that IP in the panel. A public test token that returns fictitious data is
`5ae973d7a997af13f0aaf2bf60e65803`.

## Operations

| Operation | Package | Returns |
| --- | --- | --- |
| CPF: name | 1 | Full name |
| CPF: name, birth date, gender, address | 3 | Full CPF profile |
| CNPJ: company name, trade name, address | 5 | Basic company data |
| CNPJ: full registration, partners (QSA), status, Simples | 6 | Full company registration |
| Balance | free | Remaining credits for the selected package |

The `document` field accepts digits only or a masked value. The plugin normalizes it and
verifies the check digit locally before the request, so an invalid CPF or CNPJ never spends
a credit. Alphanumeric CNPJ (in force since 2026) is supported.

## Test connection

The connection test calls the free `saldo` endpoint (`GET /{token}/saldo/1`). It costs no
credits and validates both the token and the outbound IP. An unknown token, or a token not
authorized for the outbound IP of the ToolJet server, answers HTTP 401 with an empty body.

## Main error codes

| Code | Meaning |
| --- | --- |
| 100 / 101 / 102 | CPF invalid / fewer than 11 digits / nonexistent |
| 200 / 201 / 202 | CNPJ invalid / fewer than 14 digits / nonexistent |
| 1000 | Invalid token (does not belong to the request IP) |
| 1001 | No credits |
| 1007 | Requests-per-second limit exceeded |

The gateway can also return `{ "status": "error", "code", "message" }` for malformed
requests. Both envelopes are surfaced as a query error.

More at https://www.cpfcnpj.com.br/dev/
