---
id: system-requirements
title: System Requirements 
---

This document covers all the system requirements for self-hosting ToolJet. 

:::info
The official Docker tag for the Enterprise Edition is tooljet/tooljet:ee-lts-latest.
:::

## Operating Systems

### Supported Linux distribution

[ToolJet images](https://hub.docker.com/r/tooljet/tooljet/tags) can run on any Linux machine with x86 architecture (64-bit). Ensure that your system meets the minimum requirements specified below before installing ToolJet.

### Microsoft Windows

ToolJet is developed for Linux-based operating systems. Please consider using a virtual machine or Windows Subsystem for Linux 2 (WSL2) to run ToolJet on Windows.

## VM deployments:

- **Operating System:** Ubuntu 22.04 or later
- **Processor Architecture:** x86 (arm64 is not supported)
- **RAM:** 2GB
- **CPU:** 1 vCPU
- **Storage:** At least 8GiB, but can increase according to your requirements.

## Orchestrated Deployments:

- When employing container orchestration frameworks like Kubernetes, it's imperative to ensure that your cluster hosts at least one node equipped with the above specifications for seamlessly executing ToolJet deployments.

Note: Adjustments can be made based on specific needs and the expected load on the server.

:::info
To enable multiplayer editing and background jobs in ToolJet, you need to configure Redis. It is recommended to use Redis version 6.x.
:::

## Database software:

- It is recommended that your PostgreSQL database is of version 13.x.