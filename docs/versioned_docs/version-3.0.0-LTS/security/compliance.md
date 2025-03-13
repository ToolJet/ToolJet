---
id: compliance
title: Compliance
---

## Uncompromised Data Security with SOC 2 Type II Compliance

With SOC 2  Type II compliance, ToolJet ensures the highest level of data security. The adherence to SOC 2  Type II standards mirrors the rigorous data protection measures in place, covering everything from encryption to robust access controls. It also guarantees a consistent level of service availability and process integrity, instilling confidence in our customers and stakeholders about the safe handling of their sensitive information.

## Data Protection
We take extensive measures to protect your data. All data transmitted between users and our servers is encrypted using TLS to prevent unauthorized access during transit. Sensitive data stored on our servers is encrypted at rest, following industry-standard protocols. Access to this data is tightly controlled through role-based permissions, ensuring only authorized personnel can access sensitive information.

We also adhere to a **GDPR-compliant data deletion policy**, ensuring that personal data is permanently removed from our servers upon user request or at the end of the data retention period. Furthermore, we maintain comprehensive audit logs to track data access and modifications for monitoring and compliance purposes.

## Compliance and Certifications
We adhere to globally recognized standards for data security and compliance. ToolJet meets the requirements of the following certifications:

**GDPR**: ToolJet fully complies with the General Data Protection Regulation (GDPR), ensuring your personal data is processed and stored securely.

**SOC 2**: We undergo regular SOC 2 Type II audits to validate our commitment to maintaining high security, availability, and confidentiality standards.

**ISO 27001**: ToolJet follows the ISO 27001 standard for information security management, ensuring a systematic approach to managing sensitive information.

## Incident Response
We continuously monitor our systems for suspicious activities or security incidents. In the event of a security breach, we have a detailed incident response plan in place. This plan ensures immediate action is taken to contain the breach, communicate with affected parties, and implement remediation steps to prevent future incidents.

## Secure Development Practices
We adhere to globally recognized standards for data security and compliance. ToolJet meets the requirements of the certifications below.

We undergo regular **SOC 2 Type II audits** to validate our commitment to maintaining high standards in security, availability, and confidentiality.

## User Responsibility
We encourage all our users to practice good security habits to enhance security further. This includes creating strong, unique passwords for ToolJet accounts and enabling two-factor authentication for added protection. Users should also keep their devices and applications updated to guard against vulnerabilities.


## Data Storage

ToolJet does not store data returned from your data sources. ToolJet server acts as a proxy and passes the data as it is to the ToolJet client. The credentials for the data sources are handled by the server and never exposed to the client. For example, if you are making an API request, the query is run from the server and not from the frontend.


## Datasource Credentials
All the datasource credentials are securely encrypted using `aes-256-gcm`. The credentials are never exposed to the frontend ( ToolJet client ).

## Privacy Policy
ToolJet takes privacy seriously. Our transparent privacy policies ensure customers understand how their data is collected, stored, and processed. We adhere to privacy regulations in all regions in which we operate.

## Other Security Features
- **TLS**: If you are using ToolJet cloud, all connections are encrypted using TLS. We also have documentation for setting up TLS for self-hosted installations of ToolJet.
- **Audit logs**: Audit logs are available on the enterprise edition of ToolJet. Every user action is logged along with the IP addresses and user information.
- **Request logging**: All the requests to server are logged. If self-hosted, you can easily extend ToolJet to use your preferred logging service. ToolJet comes with built-in Sentry integration.
- **Whitelisted IPs**: If you are using ToolJet cloud, you can whitelist our IP address (34.86.81.252) so that your datasources are not exposed to the public.
- **Backups**: ToolJet cloud is hosted on AWS using EKS with autoscaling and regular backups.

If you notice a security vulnerability, please let the team know by sending an email to [security@tooljet.com](mailto:security@tooljet.com). 

