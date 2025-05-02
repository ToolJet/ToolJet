---
id: windows
title: Windows
---

To run ToolJet, please install it in an Ubuntu environment using **[Windows Subsystem for Linux 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual#step-2---check-requirements-for-running-wsl-2)**. You can obtain the Ubuntu environment from the **Microsoft Store** by visiting this [link](https://apps.microsoft.com/store/detail/ubuntu-22042-lts/9PN20MSR04DW).

After successfully installing the Ubuntu environment, you will have access to a terminal window similar to the one shown below:

<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/contributing-guide/windows/wsl2.png" alt="Windows setup" />
</div>

:::warning
If you are setting up ToolJet on a Windows machine, ensure that the line endings in the **.env** file are changed to LF. By default, they may be set to CRLF, which is not compatible unless configured specifically for Windows machines.
:::

Once the environment is set up, you can proceed with the steps outlined in the Ubuntu documentation at **[Contributing Guide - Ubuntu Setup](/docs/contributing-guide/setup/ubuntu)**.