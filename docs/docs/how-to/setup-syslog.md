---
id: setup-rsyslog
title: Setup Log File Generation (Rsyslog)
---
<div style={{paddingBottom:'24px'}}>

The log file serves as a comprehensive record of audit logs, capturing crucial information about various activities within the ToolJet. Follow the guide below to set up and utilize the log file feature effectively.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Activation and Configuration

### 1. Environment Variable Setup

- To **activate** the log file feature, simply set the environment variable `LOG_FILE_PATH` to specify the desired path for the log file. For instance, if you want to use `rsyslog` as the log file path, set `LOG_FILE_PATH` to `rsyslog`.

  ```bash
  LOG_FILE_PATH='rsyslog'
  ```

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/setup-rsyslog/envfile.png" alt="Setup log file generation" />
  </div>

- The log file path is relative to the home directory of the machine. For instance, if the home directory is `/home/tooljet`, the log file path will be `/home/tooljet/rsyslog`.

### 2. Server Restart
   
- After configuring the log file environment variable, it's essential to **restart the server** to initiate the log file generation process.

- This step ensures that the server recognizes the new configuration and begins recording audit logs.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Log Rotation and Organization

### 3. Daily Log Rotation

- The log file is designed to rotate on a daily basis, creating a new log file each day. This configuration aids in efficient management and organization of audit data.

### 4. Log File Path Structure

- The log file path is determined by the `LOG_FILE_PATH` variable. It is crucial to understand that this path is relative to the home directory of the machine. For instance, if `LOG_FILE_PATH` is set to `rsyslog`, the resulting log file path will be structured as follows:  

  ```bash
  homepath/rsyslog/{process_id}-{date}/audit.log
  ```
  
  - `{process_id}` is a placeholder for the unique process identifier.
  - `{date}` represents the current date.
  
  This structured path ensures that audit logs are organized by both process and date, simplifying traceability and analysis.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/setup-rsyslog/timestamp.png" alt="Setup log file generation" />
  </div>

### 5. Example Log Data
   
The log data captures essential details, such as user ID, organization ID, resource ID, resource type, action type, resource name, IP address, and additional metadata.

<details>
<summary>Example Log file data</summary>

```bash
{
  level: 'info',
  message: 'PERFORM APP_CREATE OF awdasdawdwd APP',
  timestamp: '2023-11-02 17:12:40',
  auditLog: {
    userId: '0ad48e21-e7a2-4597-9568-c4535aedf687',
    organizationId: 'cf8e132f-a68a-4c81-a0d4-3617b79e7b17',
    resourceId: 'eac02f79-b8e2-495a-bffe-82633416c829',
    resourceType: 'APP',
    actionType: 'APP_CREATE',
    resourceName: 'awdasdawdwd',
    ipAddress: '::1',
    metadata: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      tooljetVersion: '2.22.2-ee2.8.3'
    }
  },
  label: 'APP'
}
```

</details>

### 6. Folder Creation:

The log file feature automatically creates a folder in the home path with the specified name (e.g., `rsyslog`). This folder serves as the root directory for the organized storage of audit logs.

<div style={{textAlign: 'center'}}>
  <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/setup-rsyslog/folder.png" alt="Setup log file generation" />
</div>

</div>