---
id: system-requirements
title: System Requirements 
---

This document covers all the system requirements for self-hosting ToolJet. 

:::info
The official Docker tag for the Enterprise Edition is tooljet/tooljet:EE-LTS-latest.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Operating Systems

### Supported Linux Distributions

[ToolJet images](https://hub.docker.com/r/tooljet/tooljet/tags) can run on any Linux machine with an x86 architecture (64-bit). Ensure that your system meets the minimum requirements specified below before installing ToolJet.

### Microsoft Windows

ToolJet is developed for Linux-based operating systems. Please consider using a virtual machine or Windows Subsystem for Linux 2 (WSL2) to run ToolJet on Windows.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## VM Deployments:

- **Operating System:** Ubuntu 22.04 or later
- **Processor Architecture:** x86 (ARM64 is not supported)
- **RAM:** 2GB
- **CPU:** 1 vCPU
- **Storage:** At least 8 GiB, but it can increase according to your requirements.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Orchestrated Deployments:

- When employing container orchestration frameworks like Kubernetes, ensure that your cluster hosts at least one node equipped with the above specifications for seamless ToolJet deployments.

Note: Adjustments can be made based on specific needs and the expected load on the server

:::info
To enable multiplayer editing and background jobs in ToolJet, you need to configure Redis. It is recommended to use Redis version 6.x.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Database Software:

- It is recommended that your PostgreSQL database is version 13.x.

</div>