---
id: choose-your-tooljet
title: Choose Your ToolJet
---

ToolJet versions are categorized into three main types: **Long-Term Support (LTS)**,  **Pre-Release**, and **Past versions**. Understanding these categories helps users choose the most suitable version for their needs.

## Long-Term Support (LTS) Versions

We highly recommend using LTS versions for most users. These versions are prioritized for bug fixes, updates, and overall stability, ensuring a reliable experience. LTS versions are ideal for production environments where stability and consistent performance are crucial.

Please find the latest LTS version here: <br/>
[Docker Hub - LTS Versions](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-latest/images/sha256-14b250f73fedd9b9b57064e718713bc74e5234d2446e0b3acf51b73ee0aff397?context=explore) 

| Version | Release Date | Docker Pull Command |
|---------|--------------|----------------------|
| [EE-LTS-2.50.9.25](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.25/images/sha256-fdf2858e364c238abd49418321a34676449383733ca3c6fb79ae4714e113a064?context=explore) | August 2, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.25` |
| [EE-LTS-2.50.9.24](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.24/images/sha256-a51522503c4b31eb5cd27bd105fe8693f371f17fcf6bf9c86c3fff3d6d9faf4f?context=explore) | August 1, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.24` |
| [EE-LTS-2.50.9.23](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.23/images/sha256-449700fb75a86def8a147c4e6592e1a5c43b8e0486dde5196aa7c9f3df1a17dd?context=explore) | July 30, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.23` |
| [EE-LTS-2.50.9.22](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.22/images/sha256-8df4b8279a02f55f9eff7f26b744cf73d1fb8c9d4bf2f3d3b16243849ac2f9c4?context=explore) | July 30, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.22` |
| [EE-LTS-2.50.9.21](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.21/images/sha256-1625a300d530076e9ba832bbb5c45bdbdd2e43dd4461bdf9ba659b59e77cb4af?context=explore) | July 26, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.21` |
| [EE-LTS-2.50.9.20](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.20/images/sha256-b4d89bb5c663daccd13d845a7ea31afdb41d364ae33101db3319ed7bc6ecdb85?context=explore) | July 25, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.20` |
| [EE-LTS-2.50.9.19](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.19/images/sha256-b62cb8d48bbab7a0b2bc92e251de6aba1f5b13a5ddd8e11e4b09f10d0eaf974f?context=explore) | July 24, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.19` |
| [EE-LTS-2.50.9.18](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.18/images/sha256-f95c0d05a2d8b8bd3ab515e223fb04ca74a0d9a71e500cddc480e6513ac7aaf2?context=explore) | July 18, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.18` |
| [EE-LTS-2.50.9.17](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.17/images/sha256-bf55f47ec955dcb62e93645582dadd60f7b20bec7e435a0921a9b47e03a0530b?context=explore) | July 12, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.17` |
| [EE-LTS-2.50.9.16](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.16/images/sha256-89d86e778458f5dfc2c43f5221a584fd9b48d8dc590f2bded2f287ba9c0addd1?context=explore) | July 11, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.16` |
| [EE-LTS-2.50.9.15](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.15/images/sha256-a3b12a843a2e06485816d4d3c6595638c01084e03bee24367345e80a048ea90b?context=explore) | July 10, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.15` |
| [EE-LTS-2.50.9.14](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.14/images/sha256-9615be8e9e827883d0ca49be4e705fe87ade54e274069626745566b4ead959b4?context=explore) | July 9, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.14` |
| [EE-LTS-2.50.9.13](https://hub.docker.com/layers/tooljet/tooljet/EE-LTS-2.50.9.13/images/sha256-f3d21f51a389c5f2e907e95c59cb12e1129a6fc6b5f1c11ec1e6e27ec21dad90?context=explore) | July 5, 2024 | `docker pull tooljet/tooljet:EE-LTS-2.50.9.13` |

:::info
Users are encouraged to upgrade to the latest LTS version to ensure they benefit from the latest improvements and maintain a secure and efficient environment. 
:::

## Pre-Release Versions

Pre-Release versions are designed for those looking to explore the latest features and advancements in ToolJet. These versions are experimental and may include new functionalities not yet available in LTS versions. However, due to their experimental nature, they may also contain bugs and lack the stability of LTS versions. Therefore, we advise against using Pre-Release versions in production environments.

*All versions starting from **2.60.x.x** are considered Pre-Release versions.*

## Past versions (Not maintained anymore)

Past versions of ToolJet are those that are no longer actively maintained or supported. These versions may still be available but are not recommended, especially in production environments, as they do not receive updates, bug fixes, or security patches. 

*Versions **2.45.x.x** and all earlier versions are considered past versions and are no longer maintained.*