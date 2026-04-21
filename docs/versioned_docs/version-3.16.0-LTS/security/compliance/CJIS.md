---
id: cjis
title: CJIS
---

# CJIS-Aligned Internal Tooling Using ToolJet

## **Scope and Objective**

This guide outlines how to implement CJIS-aligned (Criminal Justice Information Services)  internal tools using ToolJet within agency-controlled environments. It focuses on mapping requirements from the CJIS Security Policy to system design, infrastructure controls, and application-layer enforcement. The goal is to provide a structured approach to building internal tools that operate within CJIS expectations without introducing additional risk or complexity.

Now, before getting into implementation, it helps to clarify how CJIS defines compliance in practice.

## **CJIS Compliance Model**

At a high level, CJIS compliance is about how controls are enforced across systems.

- There is no CJIS certification for platforms

- Responsibility lies with the agency

- Systems must enforce defined controls consistently

### **Responsibility Model**

| Layer | Responsibility |
|---|---|
| Infrastructure | Agency |
| Identity | Agency |
| Application | Shared |
| Platform | Enables enforcement |

With that in place, the next step is to define how the system is structured.

## **System Model**

This is where the system model becomes important.

### **Components**

| Component | Role |
|---|---|
| Identity Provider | Authentication and MFA |
| ToolJet | Application layer |
| Data Systems | Source of CJI |
| Logging Systems | Audit and monitoring |

### **Trust Boundaries**

- Network boundary: private VPC or on premise

- Identity boundary: external authentication provider

- Data boundary: systems containing CJI

All boundary crossings must be authenticated, authorized, and logged.

Once the system boundaries are clear, the focus shifts to control areas.

## **Control Areas and Implementation Focus**

These control areas map directly to how internal tools need to behave.

| Control Area | Implementation Focus |
|---|---|
| Access Control | Identity and authorization |
| Encryption | Data protection in transit and at rest |
| Audit Logging | Traceability and monitoring |
| Data Residency | Data location and movement control |
| Network Security | Access restriction and segmentation |
| System Integrity | Configuration and patching |

## **ToolJet Capability Mapping**

| Control Area | ToolJet Capability |
|---|---|
| Access Control | RBAC and SAML SSO |
| Encryption | Operates within infrastructure controls |
| Audit Logging | Built-in logging with SIEM export |
| Data Residency | Self-hosted deployment |
| Network Security | Private deployment support |
| System Integrity | Configurable deployment patterns |

Now, translating this into implementation requires a structured approach.

## **Implementation Workflow**

The process can be broken down into a set of configuration steps.

### **1. Define Deployment Boundary**

- Deploy ToolJet within private infrastructure

- Restrict public access

- Route traffic through controlled gateways

Once the deployment boundary is defined, identity becomes the next control point.

### **2. Configure Identity and Authentication**

- Integrate SAML-based SSO

- Enforce MFA at identity provider level

- Ensure unique user identification as required by the CJIS Security Policy

After authentication, access needs to be restricted through roles.

### **3. Configure Authorization**

- Define RBAC roles

- Map roles to job functions

- Enforce least privilege access

With access defined, data access patterns need to be controlled.

### **4. Configure Data Access**

- Connect to databases using secure connections

- Enforce TLS

- Avoid duplication of CJI

At this stage, all actions must be logged for auditability.

### **5. Enable Audit Logging**

- Capture user actions and queries

- Export logs to SIEM systems such as Splunk or the Elastic Stack

- Define retention policies aligned with CJIS requirements

In parallel, network-level restrictions should be enforced.

### **6. Enforce Network Controls**

- Restrict ingress and egress traffic

- Use reverse proxies and firewalls

- Segment workloads

Next, encryption ensures data remains protected in all states.

### **7. Configure Encryption**

- Enforce TLS 1.2 or higher for all communications

- Enable encryption at rest in databases and storage systems

- Use cryptographic modules validated under FIPS 140-2

### **8. Maintain System Integrity**

- Apply regular patches to operating systems and containers

- Harden configurations using benchmarks from the Center for Internet Security

- Perform vulnerability scanning on infrastructure

Over time, system integrity becomes equally important.

### **9. Configure AI Controls (Optional)**

- Disable AI features for workflows involving CJI

- Restrict usage to approved or internal models

- Prevent logging of sensitive prompts or responses

If AI features are introduced, additional controls are required.

## **Architecture That Aligns with CJIS Expectations**

A CJIS-aligned deployment using ToolJet typically includes a private network layer such as a VPC or on premise setup, controlled access through VPN or zero trust gateways, and no direct public exposure.

<img className="screenshot-full img-full" src="/img/compliance/cjis.png" alt="CJIS" />

The application layer runs in containerized environments with hardened configurations, supported by reverse proxies enforcing TLS and request validation. Identity is managed through SAML based SSO with MFA, while data remains in agency-controlled systems with strict database level permissions.

Observability is handled through centralized logging systems integrated with SIEM and SOC workflows.

## **Compliance Positioning**

ToolJet operates as an application-layer system within environments handling Criminal Justice Information (CJI). It does not provide CJIS certification and does not act as a system of record. Instead, it enables enforcement of access control, audit logging, and secure data access patterns when deployed within agency-controlled infrastructure.

Compliance with the CJIS Security Policy is achieved through correct configuration of infrastructure, identity systems, and application-layer controls. ToolJet participates in this model by enforcing user-level access, integrating with identity providers, and supporting auditability across workflows.

**Shared Responsibility Model**

CJIS alignment follows a shared responsibility model across infrastructure, identity, and application layers.

| Layer | Responsibility | Description |
|---|---|---|
| Infrastructure | Agency | Network isolation, encryption at rest, system patching |
| Identity | Agency | User authentication, MFA enforcement, access lifecycle |
| Data Systems | Agency | Storage, classification, and protection of CJI |
| Application | Shared | Access enforcement, query control, audit logging |
| ToolJet Platform | Enables enforcement | Provides RBAC, SSO integration, and logging capabilities |

In this model, ToolJet does not replace underlying security controls but operates within them to enforce application-level restrictions.

## **Deployment and Trust Boundaries**

A CJIS-aligned deployment requires clear separation of trust zones and controlled interaction between components.

- ToolJet is deployed within a private network boundary (VPC or on premise)

- Identity providers may exist outside the network but are treated as trusted federated systems

- Data systems containing CJI remain isolated and are accessed through controlled connections

- All communication across boundaries must be authenticated, authorized, and encrypted

This separation ensures that CJI does not traverse uncontrolled paths and that each access point is governed by policy.

**Security and Compliance Characteristics**

The following characteristics define how ToolJet aligns with CJIS expectations at the application layer:

- Operates as a stateless interface layer without requiring persistence of CJI

- Integrates with enterprise identity providers for SAML-based authentication and MFA

- Enforces role-based access control mapped to organizational roles

- Supports centralized audit logging and export to SIEM systems such as Splunk

- Runs within agency-controlled infrastructure, supporting data residency and isolation requirements

- Relies on underlying systems for encryption, including support for FIPS 140-2 aligned environments  \
 \
These characteristics allow ToolJet to operate within regulated environments without introducing additional data exposure risk

##  \
**CJIS Compliance Checklist with Policy Mapping**

All section references and excerpts are derived from the CJIS Security Policy published by the Federal Bureau of Investigation.

### **Access Control and Authentication**

| Control | CJIS Section | Policy Excerpt | Implementation |
|---|---|---|---|
| Unique user identification | 5.6.2.1 | Each user must be uniquely identified. Shared or group accounts are not permitted for access to CJI systems. | SAML based SSO |
| Multi-factor authentication | 5.6.2.2 | MFA is required for all remote access to CJI systems and must include at least two authentication factors. | Enforced via IdP |
| Least privilege access | 5.5.2 | Access to CJI must be limited to authorized users based on job responsibilities and need-to-know principles. | RBAC configuration |
| Session management | 5.5.6 | Systems must enforce session timeouts and re-authentication to reduce risk of unauthorized access. | IdP and proxy policies |

### **Encryption and Data Protection**

| Control | CJIS Section | Policy Excerpt | Implementation |
|---|---|---|---|
| Data in transit | 5.10.1.2 | CJI transmitted outside secure boundaries must be encrypted using FIPS-validated cryptographic mechanisms. | TLS enforcement |
| Data at rest | 5.10.1.1 | CJI stored electronically must be protected using encryption or equally effective safeguards. | Infrastructure encryption |
| FIPS compliance | 5.10.1.2 | Cryptographic modules used must be validated under FIPS 140-2 or equivalent standards. | Environment configuration |

### **Audit and Accountability**

| Control | CJIS Section | Policy Excerpt | Implementation |
|---|---|---|---|
| Activity logging | 5.10.1 | Systems must generate audit records for events including user access, queries, and administrative actions. | ToolJet logs |
| Data access tracking | 5.10.1.3 | Audit logs must capture sufficient detail to identify who accessed CJI, what actions were performed, and when. | Query logging |
| Log retention | 5.10.4 | Audit records must be retained for a defined period consistent with CJIS and organizational requirements. | SIEM integration |
| Log integrity | 5.10.5 | Audit logs must be protected from unauthorized modification or deletion. | Centralized logging |

### **Network and System Integrity**

| Control | CJIS Section | Policy Excerpt | Implementation |
|---|---|---|---|
| Network isolation | 5.5.1 | CJI must be protected through network segmentation and controlled access boundaries. | Private deployment |
| Patch management | 5.7.1.5 | Systems must be regularly updated to address vulnerabilities and maintain security posture. | Infrastructure processes |
| Secure configuration | 5.7.1 | Systems must be configured securely using industry-recognized standards and practices. | Hardened environments |

## **Technical Considerations**

### **Data Flow**

- Data is retrieved in real time from source systems

- No mandatory persistence within ToolJet

- Access controlled at query level

### **Encryption Model**

- ToolJet operates within infrastructure encryption model

- No independent cryptographic layer introduced

- Supports environments with FIPS requirements

### **Audit Model**

- Centralized logging across applications

- Supports integration with SIEM systems

- Enables consistent audit trails

### **AI Control Model**

- AI features are optional

- Must be explicitly configured

- Should not process CJI without safeguards

## **Failure Modes and Risk Considerations**

In practice, CJIS alignment often breaks down not at the infrastructure level, but at the configuration and operational layers.

The following failure modes are commonly observed in internal tooling systems:

### **Misconfigured Authorization**

- Overly broad RBAC roles expose CJI beyond intended users

- Lack of role segmentation between administrative and operational users

- Failure to update roles as responsibilities change

This typically violates least privilege expectations defined in the CJIS Security Policy.

**Incomplete Audit Logging**

- Missing logs for read operations on CJI

- Logs not forwarded to centralized systems

- Insufficient log retention policies

These gaps can make it difficult to reconstruct access patterns during audits.

### **Improper Network Exposure**

- ToolJet instances exposed directly to the public internet

- Lack of VPN or zero trust enforcement

- Weak ingress and egress controls

This increases the risk of unauthorized access to application interfaces.

**Data Handling Misconfigurations**

- Caching or persisting CJI within the application layer

- Use of temporary storage without encryption

- Improper handling of query results

ToolJet should operate as a stateless layer without retaining CJI wherever possible.

**Weak Encryption Enforcement**

- TLS not enforced across all internal connections

- Use of non-compliant cryptographic modules instead of FIPS 140-2 validated modules

- Misconfigured certificates or outdated protocols

### **External Service Leakage (AI / APIs)**

- Sending CJI to external APIs or AI services

- Lack of visibility into third-party data handling

- Logging sensitive prompts or responses

This is especially relevant when integrating AI features into internal tools.

Addressing these risks requires continuous validation of configurations, not just initial setup.

## **Summary**

CJIS alignment requires coordinated implementation across infrastructure, identity, application, and operations. ToolJet provides application-layer capabilities that support access control, audit logging, and secure data access patterns within controlled environments. Final compliance depends on correct configuration and enforcement by the agency.

## **Common Audit Questions**

During CJIS audits or internal security reviews, the following questions are typically raised. These should be addressed explicitly during implementation.

1. **Where is CJI stored?**

CJI should remain within agency-controlled data systems. ToolJet should not persist CJI and should retrieve data in real time from source systems.

2. **Does ToolJet store or cache sensitive data?**

ToolJet can be configured to operate without persistent storage of CJI. Any caching mechanisms should be disabled or restricted to non-sensitive data.

3. **How is access to CJI controlled?**

Access is enforced through:

- SAML-based authentication

- MFA at the identity provider

- RBAC policies within ToolJet

- Database-level access controls

- **How are user actions audited?**

User interactions, queries, and API calls should be logged and forwarded to SIEM systems such as Splunk. Logs should be retained and protected according to CJIS requirements.

- **How is access revoked?**

Access is revoked through the identity provider by disabling user accounts or removing group memberships. Changes propagate to ToolJet via SSO enforcement.

- **What happens during system failure?**

- ToolJet does not act as a system of record

- Failure does not result in loss of CJI

- Access is temporarily unavailable but data integrity remains intact

- **How is data protected in transit and at rest?**

- TLS is enforced for all communications

- Data at rest is protected using infrastructure-level encryption

- Cryptographic controls align with FIPS 140-2 requirements

- **Are external integrations restricted?**

External services, including APIs and AI models, should not process CJI unless explicitly approved and controlled. All outbound data flows should be audited.

These questions are typically used to validate whether controls are not only implemented, but also consistently enforced.
