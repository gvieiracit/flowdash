# Plan: Integrate Neo4j and Nginx Logs with Azure Monitor

**Date:** January 28, 2026
**Server:** neo4jprod.uksouth.cloudapp.azure.com
**Region:** UK South
**OS:** Ubuntu 22.04.5 LTS
**Status:** ✅ COMPLETE (Implemented January 28, 2026)

---

## Implementation Results

| Table | Status | Records at Completion |
|-------|--------|----------------------|
| **NginxAccess_CL** | ✅ Working | 132+ records |
| **NginxError_CL** | ✅ Working | 3 records |
| **Neo4jLogs_CL** | ✅ Ready | 0 records (waiting for new log entries) |

**Note:** Neo4jLogs_CL has 0 records because the neo4j.log file hasn't had new entries since January 27, 2026. The agent only collects NEW log lines that appear after it starts tailing. The table will populate automatically when Neo4j writes new INFO/WARN/ERROR messages.

---

## Azure Configuration

| Setting | Value |
|---------|-------|
| Subscription ID | `4ca620bb-e12a-40d7-af1e-6b3f8dff8074` |
| Resource Group | `ASOS_AI` |
| Log Analytics Workspace | `ASOS-AI-Logs` (new - spaces replaced with dashes) |
| Data Collection Endpoint | `asos-ai-dce-uksouth` (new) |
| Data Collection Rule (Neo4j) | `asos-ai-dcr-neo4j` (new) |
| Data Collection Rule (Nginx) | `asos-ai-dcr-nginx` (new) |
| Location | `uksouth` |
| VM Name | `Neo4jGraphServerProd` |

---

## 1. Objective

Integrate Neo4j database logs and Nginx reverse proxy logs into Azure Monitor for centralized logging, monitoring, alerting, and long-term retention.

### Goals
- Centralized log storage in Azure Log Analytics
- Real-time monitoring and alerting on errors
- Historical analysis and troubleshooting capability
- Compliance with log retention requirements
- Dashboard visibility for operations team

### Important: Local Logs Are Preserved

The Azure Monitor Agent **only reads and copies** log data - it does **not delete, modify, or move** the original files.

- Local logs remain on the server exactly as they are now
- Neo4j and Nginx continue writing to their usual locations
- Existing log rotation (Neo4j internal, Nginx logrotate) continues unchanged
- You can still SSH and `tail -f` logs for immediate troubleshooting
- Azure provides the historical analysis and alerting layer on top

### Important: Zero Downtime Implementation

**No need to stop Neo4j or Nginx.** The entire implementation can be done while services are running:

| Action | Impact on Production |
|--------|---------------------|
| Install Azure Monitor Agent | None - separate service |
| Configure Data Collection Rules | None - Azure Portal only |
| Add user to groups for permissions | None - doesn't affect running processes |
| AMA reading log files | None - read-only, no file locking |

The only service restart required is the Azure Monitor Agent itself:
```bash
sudo systemctl restart azuremonitoragent  # Only AMA restarts
# Neo4j and Nginx continue running uninterrupted
```

---

## 2. Current State Assessment

### 2.1 Server Infrastructure

| Component | Details |
|-----------|---------|
| VM Location | Azure UK South |
| OS | Ubuntu 22.04.5 LTS |
| Azure Linux Agent | Running (walinuxagent.service) |
| Azure Monitor Agent | **Not installed** |
| Azure CLI | **Not installed** |
| Disk Space | 119GB available on /dev/root |

### 2.2 Neo4j Logging

| Setting | Value |
|---------|-------|
| Log Directory | `/data/neo4j/logs/` |
| Main Log | `neo4j.log` (plain text format) |
| Debug Log | `debug.log` (JSON format) |
| Security Log | `security.log` (empty) |
| Query Log | `query.log` (empty, disabled) |
| HTTP Log | `http.log` (empty, disabled) |
| Log Rotation | Internal Log4j2 (20MB per file, 7 files max) |
| External Rotation | **Not configured** |

**Neo4j Log Format (neo4j.log):**
```
2026-01-27 11:47:27.243+0000 ERROR Increase in network aborts detected...
2026-01-27 13:38:48.321+0000 INFO  Network abort rate has normalized
```
Format: `{timestamp} {level} {message}`

**Neo4j Debug Log Format (debug.log - JSON):**
```json
{"time":"2026-01-28 10:33:07.334+0000","level":"INFO","category":"o.n.k.i.t.l.c.CheckPointerImpl","message":"...","databaseId":"...","databaseName":"neo4j"}
```

### 2.3 Nginx Logging

| Setting | Value |
|---------|-------|
| Log Directory | `/var/log/nginx/` |
| Access Log | `access.log` (combined format) |
| Error Log | `error.log` |
| Log Rotation | logrotate (daily, 14 days, compressed) |
| Permissions | www-data:adm (640) |

**Current Log Sizes:**
- access.log: ~143KB (current)
- error.log: ~7KB (current)
- Historical: 14 days of rotated logs

---

## 3. Proposed Solution

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Neo4j Production Server                              │
│                   (neo4jprod.uksouth.cloudapp.azure.com)                     │
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  /data/neo4j/    │    │  /var/log/nginx/ │    │  Azure Monitor   │       │
│  │  logs/           │    │                  │    │  Agent (AMA)     │       │
│  │  - neo4j.log     │    │  - access.log    │    │                  │       │
│  │  - debug.log     │    │  - error.log     │    │  Collects &      │       │
│  │                  │    │                  │    │  Ships logs      │       │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘       │
│           │                       │                       │                  │
│           └───────────────────────┴───────────────────────┘                  │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    │ HTTPS (TLS 1.2+)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Azure Cloud                                     │
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  Data Collection │    │  Log Analytics   │    │  Azure Monitor   │       │
│  │  Endpoint (DCE)  │───▶│  Workspace       │───▶│  Alerts          │       │
│  │  (UK South)      │    │                  │    │                  │       │
│  └──────────────────┘    │  Custom Tables:  │    │  - Error alerts  │       │
│                          │  - Neo4j_CL      │    │  - Performance   │       │
│  ┌──────────────────┐    │  - NginxAccess_CL│    │  - Availability  │       │
│  │  Data Collection │    │  - NginxError_CL │    │                  │       │
│  │  Rules (DCR)     │    │                  │    └──────────────────┘       │
│  │  - Parse logs    │    └────────┬─────────┘                               │
│  │  - Transform     │             │                                          │
│  └──────────────────┘             ▼                                          │
│                          ┌──────────────────┐                                │
│                          │  Azure Workbooks │                                │
│                          │  / Dashboards    │                                │
│                          └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Components Required

| Component | Purpose | Location |
|-----------|---------|----------|
| Azure Monitor Agent (AMA) | Collect and ship logs | On VM |
| Data Collection Endpoint (DCE) | Receive logs from agent | Azure UK South |
| Log Analytics Workspace | Store and query logs | Azure UK South |
| Data Collection Rules (DCR) | Define what to collect | Azure |
| Custom Tables | Store parsed log data | Log Analytics |
| Alert Rules | Notify on issues | Azure Monitor |
| Workbooks/Dashboards | Visualization | Azure Portal |

---

## 4. Implementation Options

### Option A: Azure Monitor Agent with Custom Text Logs (Recommended)

**Pros:**
- Native Azure integration
- No third-party tools
- Supports custom log parsing
- Built-in alerting and dashboards
- Pay-per-GB ingestion pricing

**Cons:**
- Requires DCE, DCR configuration
- Learning curve for KQL queries

**Estimated Cost:** ~$2.76/GB ingested (first 5GB/month free)

### Option B: Azure Monitor Agent + Fluent Bit

**Pros:**
- More flexible log parsing
- Better JSON handling
- Can route to multiple destinations

**Cons:**
- Additional component to manage
- More complex setup

### Option C: Direct Integration via Azure Event Hubs

**Pros:**
- Real-time streaming
- Can integrate with other services
- Good for high-volume scenarios

**Cons:**
- More complex architecture
- Higher cost for low-volume scenarios
- Requires code changes or additional agents

### Recommendation: **Option A** - Azure Monitor Agent with Custom Text Logs

This is the simplest and most maintainable solution for the current requirements.

---

## 5. Detailed Implementation Plan

### Phase 0: Install Azure CLI and Authenticate (Local Machine)

#### Step 0.1: Install Azure CLI on macOS
```bash
# Install via Homebrew
brew update && brew install azure-cli

# Verify installation
az --version
```

#### Step 0.2: Login with Interactive Browser Authentication
```bash
# This will open a browser window for authentication
az login

# Set the correct subscription
az account set --subscription "4ca620bb-e12a-40d7-af1e-6b3f8dff8074"

# Verify subscription is set
az account show --query "{Name:name, SubscriptionId:id}" -o table
```

Expected output:
```
Name              SubscriptionId
----------------  ------------------------------------
<Subscription>    4ca620bb-e12a-40d7-af1e-6b3f8dff8074
```

---

### Phase 1: Azure Infrastructure Setup

#### Step 1.1: Create Log Analytics Workspace
```bash
az monitor log-analytics workspace create \
  --resource-group "ASOS_AI" \
  --workspace-name "ASOS-AI-Logs" \
  --location "uksouth" \
  --retention-time 90

# Get the workspace resource ID (needed later)
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "ASOS_AI" \
  --workspace-name "ASOS-AI-Logs" \
  --query id -o tsv)

echo "Workspace ID: $WORKSPACE_ID"
```

Expected output:
```
Workspace ID: /subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.OperationalInsights/workspaces/ASOS-AI-Logs
```

#### Step 1.2: Create Data Collection Endpoint (DCE)
```bash
az monitor data-collection endpoint create \
  --name "asos-ai-dce-uksouth" \
  --resource-group "ASOS_AI" \
  --location "uksouth" \
  --public-network-access "Enabled"

# Get the DCE resource ID (needed later)
DCE_ID=$(az monitor data-collection endpoint show \
  --name "asos-ai-dce-uksouth" \
  --resource-group "ASOS_AI" \
  --query id -o tsv)

echo "DCE ID: $DCE_ID"
```

#### Step 1.3: Create Custom Tables in Log Analytics

**Create Neo4j Logs Table:**
```bash
az monitor log-analytics workspace table create \
  --resource-group "ASOS_AI" \
  --workspace-name "ASOS-AI-Logs" \
  --name "Neo4jLogs_CL" \
  --columns \
    name="TimeGenerated" type="datetime" \
    name="Level" type="string" \
    name="Message" type="string" \
    name="Category" type="string" \
    name="DatabaseName" type="string" \
    name="RawData" type="string"
```

**Create Nginx Access Logs Table:**
```bash
az monitor log-analytics workspace table create \
  --resource-group "ASOS_AI" \
  --workspace-name "ASOS-AI-Logs" \
  --name "NginxAccess_CL" \
  --columns \
    name="TimeGenerated" type="datetime" \
    name="ClientIP" type="string" \
    name="Method" type="string" \
    name="RequestUri" type="string" \
    name="StatusCode" type="int" \
    name="BytesSent" type="long" \
    name="UserAgent" type="string" \
    name="RawData" type="string"
```

**Create Nginx Error Logs Table:**
```bash
az monitor log-analytics workspace table create \
  --resource-group "ASOS_AI" \
  --workspace-name "ASOS-AI-Logs" \
  --name "NginxError_CL" \
  --columns \
    name="TimeGenerated" type="datetime" \
    name="Level" type="string" \
    name="Message" type="string" \
    name="RawData" type="string"
```

---

### Phase 2: Install Azure Monitor Agent on VM

#### Step 2.1: Install AMA via Azure VM Extension
```bash
# Find the VM resource ID first
VM_RESOURCE_ID=$(az vm show \
  --resource-group "ASOS_AI" \
  --name "Neo4jGraphServerProd" \
  --query id -o tsv)

echo "VM Resource ID: $VM_RESOURCE_ID"

# Install Azure Monitor Agent extension
az vm extension set \
  --name "AzureMonitorLinuxAgent" \
  --publisher "Microsoft.Azure.Monitor" \
  --resource-group "ASOS_AI" \
  --vm-name "Neo4jGraphServerProd" \
  --enable-auto-upgrade true
```

#### Step 2.2: Verify Installation (on the VM via SSH)
```bash
# SSH to the server
sshpass -p 'khXUWz3M4cBUVET' ssh gvieira@neo4jprod.uksouth.cloudapp.azure.com \
  "systemctl status azuremonitoragent"
```

Expected output should show the agent as `active (running)`.

---

### Phase 3: Configure Data Collection Rules

#### Step 3.1: Create DCR for Neo4j Logs

First, create a JSON file for the DCR configuration:

```bash
# Create DCR JSON configuration file
cat > /tmp/dcr-neo4j.json << 'EOF'
{
  "location": "uksouth",
  "properties": {
    "dataCollectionEndpointId": "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.Insights/dataCollectionEndpoints/asos-ai-dce-uksouth",
    "streamDeclarations": {
      "Custom-Neo4jLogs_CL": {
        "columns": [
          {"name": "TimeGenerated", "type": "datetime"},
          {"name": "RawData", "type": "string"}
        ]
      }
    },
    "dataSources": {
      "logFiles": [
        {
          "streams": ["Custom-Neo4jLogs_CL"],
          "filePatterns": ["/data/neo4j/logs/neo4j.log"],
          "format": "text",
          "name": "Neo4jLogSource"
        }
      ]
    },
    "destinations": {
      "logAnalytics": [
        {
          "workspaceResourceId": "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.OperationalInsights/workspaces/ASOS-AI-Logs",
          "name": "LogAnalyticsDest"
        }
      ]
    },
    "dataFlows": [
      {
        "streams": ["Custom-Neo4jLogs_CL"],
        "destinations": ["LogAnalyticsDest"],
        "outputStream": "Custom-Neo4jLogs_CL"
      }
    ]
  }
}
EOF

# Create the DCR
az monitor data-collection rule create \
  --name "asos-ai-dcr-neo4j" \
  --resource-group "ASOS_AI" \
  --location "uksouth" \
  --rule-file "/tmp/dcr-neo4j.json"
```

#### Step 3.2: Create DCR for Nginx Logs

```bash
# Create DCR JSON configuration file
cat > /tmp/dcr-nginx.json << 'EOF'
{
  "location": "uksouth",
  "properties": {
    "dataCollectionEndpointId": "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.Insights/dataCollectionEndpoints/asos-ai-dce-uksouth",
    "streamDeclarations": {
      "Custom-NginxAccess_CL": {
        "columns": [
          {"name": "TimeGenerated", "type": "datetime"},
          {"name": "RawData", "type": "string"}
        ]
      },
      "Custom-NginxError_CL": {
        "columns": [
          {"name": "TimeGenerated", "type": "datetime"},
          {"name": "RawData", "type": "string"}
        ]
      }
    },
    "dataSources": {
      "logFiles": [
        {
          "streams": ["Custom-NginxAccess_CL"],
          "filePatterns": ["/var/log/nginx/access.log"],
          "format": "text",
          "name": "NginxAccessSource"
        },
        {
          "streams": ["Custom-NginxError_CL"],
          "filePatterns": ["/var/log/nginx/error.log"],
          "format": "text",
          "name": "NginxErrorSource"
        }
      ]
    },
    "destinations": {
      "logAnalytics": [
        {
          "workspaceResourceId": "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.OperationalInsights/workspaces/ASOS-AI-Logs",
          "name": "LogAnalyticsDest"
        }
      ]
    },
    "dataFlows": [
      {
        "streams": ["Custom-NginxAccess_CL"],
        "destinations": ["LogAnalyticsDest"],
        "outputStream": "Custom-NginxAccess_CL"
      },
      {
        "streams": ["Custom-NginxError_CL"],
        "destinations": ["LogAnalyticsDest"],
        "outputStream": "Custom-NginxError_CL"
      }
    ]
  }
}
EOF

# Create the DCR
az monitor data-collection rule create \
  --name "asos-ai-dcr-nginx" \
  --resource-group "ASOS_AI" \
  --location "uksouth" \
  --rule-file "/tmp/dcr-nginx.json"
```

#### Step 3.3: Associate DCRs with VM

```bash
# Get DCR IDs
DCR_NEO4J_ID=$(az monitor data-collection rule show \
  --name "asos-ai-dcr-neo4j" \
  --resource-group "ASOS_AI" \
  --query id -o tsv)

DCR_NGINX_ID=$(az monitor data-collection rule show \
  --name "asos-ai-dcr-nginx" \
  --resource-group "ASOS_AI" \
  --query id -o tsv)

# Get VM ID
VM_ID=$(az vm show \
  --resource-group "ASOS_AI" \
  --name "Neo4jGraphServerProd" \
  --query id -o tsv)

# Associate Neo4j DCR with VM
az monitor data-collection rule association create \
  --name "neo4j-dcr-association" \
  --resource "$VM_ID" \
  --rule-id "$DCR_NEO4J_ID"

# Associate Nginx DCR with VM
az monitor data-collection rule association create \
  --name "nginx-dcr-association" \
  --resource "$VM_ID" \
  --rule-id "$DCR_NGINX_ID"
```

---

### Phase 4: Configure File Permissions (on VM)

The Azure Monitor Agent runs as the `azuremonitor` user. Configure permissions to read log files:

```bash
# SSH to the server and configure permissions
sshpass -p 'khXUWz3M4cBUVET' ssh gvieira@neo4jprod.uksouth.cloudapp.azure.com << 'REMOTE_SCRIPT'
# Add azuremonitor user to adm group (for nginx logs)
echo 'khXUWz3M4cBUVET' | sudo -S usermod -a -G adm azuremonitor 2>/dev/null

# Add azuremonitor user to neo4j group (for neo4j logs)
echo 'khXUWz3M4cBUVET' | sudo -S usermod -a -G neo4j azuremonitor 2>/dev/null

# Ensure Neo4j logs are readable by group
echo 'khXUWz3M4cBUVET' | sudo -S chmod 640 /data/neo4j/logs/*.log 2>/dev/null

# Restart agent to pick up group changes
echo 'khXUWz3M4cBUVET' | sudo -S systemctl restart azuremonitoragent 2>/dev/null

# Verify agent status
echo 'khXUWz3M4cBUVET' | sudo -S systemctl status azuremonitoragent --no-pager 2>/dev/null
REMOTE_SCRIPT
```

---

### Phase 5: Verify Log Collection

#### Step 5.1: Check Agent Status (wait 5-10 minutes for logs to appear)
```bash
# Query the Log Analytics workspace for recent logs
az monitor log-analytics query \
  --workspace "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.OperationalInsights/workspaces/ASOS-AI-Logs" \
  --analytics-query "Neo4jLogs_CL | take 5" \
  --timespan "PT1H"
```

#### Step 5.2: Verify Nginx Logs
```bash
az monitor log-analytics query \
  --workspace "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.OperationalInsights/workspaces/ASOS-AI-Logs" \
  --analytics-query "NginxAccess_CL | take 5" \
  --timespan "PT1H"
```

---

### Phase 6: Create Alerts (Optional - Can be done via Portal)

#### Step 6.1: Create Alert for Neo4j Errors
```bash
az monitor scheduled-query create \
  --name "Neo4j Error Alert" \
  --resource-group "ASOS_AI" \
  --location "uksouth" \
  --scopes "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.OperationalInsights/workspaces/ASOS-AI-Logs" \
  --condition "count 'Neo4jLogs_CL | where RawData contains \"ERROR\" | where RawData contains \"network aborts\" or RawData contains \"Connection reset\"' > 5" \
  --evaluation-frequency "5m" \
  --window-size "5m" \
  --severity 2 \
  --description "Alert when Neo4j has high network abort rate"
```

---

### Phase 7: Cleanup - Uninstall Azure CLI (Local Machine)

After implementation is complete and verified:

```bash
# Logout from Azure
az logout

# Uninstall Azure CLI on macOS
brew uninstall azure-cli

# Remove Azure CLI cache and configuration
rm -rf ~/.azure

# Verify uninstallation
az --version  # Should show "command not found"
```

---

## 6. File Permission Considerations

### Current Permissions

| Log File | Owner | Group | Permissions |
|----------|-------|-------|-------------|
| /data/neo4j/logs/neo4j.log | neo4j | neo4j | 644 |
| /data/neo4j/logs/debug.log | neo4j | neo4j | 644 |
| /var/log/nginx/access.log | www-data | adm | 640 |
| /var/log/nginx/error.log | www-data | adm | 640 |

### Changes Applied

1. Add `azuremonitor` user to `adm` group for nginx logs
2. Add `azuremonitor` user to `neo4j` group for Neo4j logs
3. Ensure Neo4j logs have group read permission (chmod 640)

---

## 7. Cost Estimation

### Log Analytics Ingestion

| Log Type | Est. Daily Volume | Monthly Volume | Cost/Month |
|----------|-------------------|----------------|------------|
| Neo4j neo4j.log | ~2 MB | ~60 MB | ~$0.17 |
| Neo4j debug.log | ~50 MB | ~1.5 GB | ~$4.14 |
| Nginx access.log | ~5 MB | ~150 MB | ~$0.41 |
| Nginx error.log | ~0.5 MB | ~15 MB | ~$0.04 |
| **Total** | ~57.5 MB/day | ~1.7 GB/month | **~$4.76/month** |

*Note: First 5GB/month is free. Pricing at $2.76/GB after free tier.*

### Additional Costs
- Data Collection Endpoint: Free
- Data Collection Rules: Free
- Alert Rules: ~$1.50/rule/month
- Workbooks: Free

**Estimated Total: ~$8-10/month**

---

## 8. Rollback Plan

If issues occur after implementation:

### Quick Disable - Stop Log Collection
```bash
# SSH to server and stop the agent
sshpass -p 'khXUWz3M4cBUVET' ssh gvieira@neo4jprod.uksouth.cloudapp.azure.com \
  "echo 'khXUWz3M4cBUVET' | sudo -S systemctl stop azuremonitoragent 2>/dev/null"
```

### Full Rollback - Remove Azure Resources

#### Step 1: Remove DCR Associations
```bash
# List and remove associations
az monitor data-collection rule association delete \
  --name "neo4j-dcr-association" \
  --resource "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.Compute/virtualMachines/Neo4jGraphServerProd" \
  --yes

az monitor data-collection rule association delete \
  --name "nginx-dcr-association" \
  --resource "/subscriptions/4ca620bb-e12a-40d7-af1e-6b3f8dff8074/resourceGroups/ASOS_AI/providers/Microsoft.Compute/virtualMachines/Neo4jGraphServerProd" \
  --yes
```

#### Step 2: Remove Azure Monitor Agent Extension
```bash
az vm extension delete \
  --name "AzureMonitorLinuxAgent" \
  --resource-group "ASOS_AI" \
  --vm-name "Neo4jGraphServerProd"
```

#### Step 3: Remove Data Collection Rules
```bash
az monitor data-collection rule delete \
  --name "asos-ai-dcr-neo4j" \
  --resource-group "ASOS_AI" \
  --yes

az monitor data-collection rule delete \
  --name "asos-ai-dcr-nginx" \
  --resource-group "ASOS_AI" \
  --yes
```

#### Step 4: Remove Data Collection Endpoint
```bash
az monitor data-collection endpoint delete \
  --name "asos-ai-dce-uksouth" \
  --resource-group "ASOS_AI" \
  --yes
```

#### Step 5: Remove Log Analytics Workspace (Optional - destroys all collected logs)
```bash
# WARNING: This deletes all collected log data permanently
az monitor log-analytics workspace delete \
  --resource-group "ASOS_AI" \
  --workspace-name "ASOS-AI-Logs" \
  --yes
```

#### Step 6: Revert Permission Changes on Server
```bash
sshpass -p 'khXUWz3M4cBUVET' ssh gvieira@neo4jprod.uksouth.cloudapp.azure.com << 'REMOTE_SCRIPT'
# Remove azuremonitor from groups
echo 'khXUWz3M4cBUVET' | sudo -S gpasswd -d azuremonitor adm 2>/dev/null
echo 'khXUWz3M4cBUVET' | sudo -S gpasswd -d azuremonitor neo4j 2>/dev/null
echo "Permission changes reverted"
REMOTE_SCRIPT
```

---

## 9. Prerequisites Checklist

All prerequisites completed:

- [x] Azure subscription with permissions to create resources
- [x] Resource group identified: `ASOS_AI`
- [x] Log Analytics workspace name: `ASOS-AI-Logs`
- [x] Subscription ID: `4ca620bb-e12a-40d7-af1e-6b3f8dff8074`
- [x] SSH access to Neo4j server
- [x] Sudo access on Neo4j server
- [x] Azure CLI installed (Phase 0) ✅
- [x] Azure authentication completed (Phase 0) ✅
- [x] Azure CLI uninstalled after completion (Phase 7) ✅

---

## 10. Summary of Azure Resources Created

| Resource Type | Name | Resource Group | Status |
|---------------|------|----------------|--------|
| Log Analytics Workspace | `ASOS-AI-Logs` | ASOS_AI | ✅ Created |
| Data Collection Endpoint | `asos-ai-dce-uksouth` | ASOS_AI | ✅ Created |
| Data Collection Rule | `asos-ai-dcr-neo4j` | ASOS_AI | ✅ Created |
| Data Collection Rule | `asos-ai-dcr-nginx` | ASOS_AI | ✅ Created |
| VM Extension | `AzureMonitorLinuxAgent` | ASOS_AI | ✅ Installed |
| VM Managed Identity | System-assigned | ASOS_AI | ✅ Enabled |
| Custom Table | `Neo4jLogs_CL` | (in workspace) | ✅ Created |
| Custom Table | `NginxAccess_CL` | (in workspace) | ✅ Created |
| Custom Table | `NginxError_CL` | (in workspace) | ✅ Created |

**Key Resource IDs:**
- Workspace Customer ID: `dd9fc271-af91-4233-a07c-54dfa459f862`
- DCE Ingestion Endpoint: `https://asos-ai-dce-uksouth-su81.uksouth-1.ingest.monitor.azure.com`
- VM Managed Identity Principal: `6a2aaf5c-82ec-4436-b126-136274ec14a6`

---

## 11. References

- [Install and Manage the Azure Monitor Agent](https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-manage)
- [Collect logs from a text file with Azure Monitor Agent](https://learn.microsoft.com/en-us/azure/azure-monitor/agents/data-collection-text-log)
- [Azure Monitor Agent Supported Operating Systems](https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-supported-operating-systems)
- [Kusto Query Language (KQL) Overview](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [Azure CLI Installation Guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-macos)

---

## 12. Implementation Execution Order

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 0** | Install Azure CLI, authenticate via interactive login | ✅ Complete |
| **Phase 1** | Create Log Analytics Workspace, DCE, custom tables | ✅ Complete |
| **Phase 2** | Install Azure Monitor Agent on VM + enable managed identity | ✅ Complete |
| **Phase 3** | Create and associate Data Collection Rules | ✅ Complete |
| **Phase 4** | Configure file permissions (syslog user) | ✅ Complete |
| **Phase 5** | Verify logs are flowing | ✅ Complete |
| **Phase 6** | Create alerts | ⏭️ Skipped (can do via Portal) |
| **Phase 7** | Uninstall Azure CLI from local machine | ✅ Complete |

---

## 13. Implementation Changes from Original Plan

The following changes were made during implementation:

### 13.1 Table Creation Syntax Correction

**Original (incorrect):**
```bash
--columns name="TimeGenerated" type="datetime" name="Level" type="string"
```

**Corrected:**
```bash
--columns TimeGenerated=datetime Level=string Message=string RawData=string
```

The Azure CLI expects `column_name=column_type` format, not `name="x" type="y"` format.

### 13.2 VM Managed Identity Required

The VM did not have a managed identity configured, which caused MSI token errors:
```
Failed to get MSI token from IMDS endpoint: http://169.254.169.254 ErrorCode:-2146041343
```

**Fix added after Phase 2:**
```bash
az vm identity assign \
  --resource-group "ASOS_AI" \
  --name "Neo4jGraphServerProd"
```

### 13.3 AMA Runs as `syslog` User (Not `azuremonitor`)

The Azure Monitor Agent on Ubuntu runs as the `syslog` user, not `azuremonitor` as documented.

**Updated Phase 4 commands:**
```bash
# Add syslog user to neo4j group (not azuremonitor)
sudo usermod -a -G neo4j syslog
sudo usermod -a -G adm syslog
```

### 13.4 CLI Query Requires Workspace Customer ID

For reliable CLI queries, use the workspace Customer ID (GUID) instead of the full resource path:

```bash
# Get the Customer ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "ASOS_AI" \
  --workspace-name "ASOS-AI-Logs" \
  --query customerId -o tsv)

# Use Customer ID for queries
az monitor log-analytics query \
  --workspace "$WORKSPACE_ID" \
  --analytics-query "NginxAccess_CL | count"
```

### 13.5 Phase 6 (Alerts) Skipped

Alert creation was not implemented via CLI. Alerts can be configured via Azure Portal at any time.

---

## 14. Lessons Learned

### 14.1 Custom Tables Only Appear in Logs Explorer After Receiving Data

Tables created via CLI exist in the workspace settings but won't appear in the Logs explorer sidebar until they receive their first data. This is expected behavior.

### 14.2 AMA Only Collects NEW Log Entries

The Azure Monitor Agent starts tailing log files from the **current position** (end of file). Historical data before the agent starts is **not collected**. This explains why:
- NginxAccess_CL immediately showed data (file actively written to)
- Neo4jLogs_CL showed 0 records (no new entries since Jan 27)

### 14.3 Neo4j Logging Behavior

Neo4j's `neo4j.log` only receives entries when:
- The database starts/stops
- INFO/WARN/ERROR events occur
- Configuration changes happen

During normal operation with no issues, this file can remain unchanged for days. The `debug.log` (JSON format) is more active but wasn't included in the initial DCR.

### 14.4 Fluentbit Under the Hood

The AMA automatically deploys and manages Fluentbit for log collection. Configuration is at:
```
/etc/opt/microsoft/azuremonitoragent/config-cache/fluentbit/td-agent.conf
```

Position tracking databases are at:
```
/etc/opt/microsoft/azuremonitoragent/config-cache/fluentbit/db/
```

### 14.5 First-Time Ingestion Delay

For a brand new Log Analytics workspace, expect:
- 5-10 minutes for data to appear in tables
- Tables won't show in Logs explorer until data arrives
- Usage and Heartbeat tables also take time to initialize

### 14.6 Verifying Agent Health

Key logs to check on the VM:
```bash
# Error log (check for MSI token or permission issues)
/var/opt/microsoft/azuremonitoragent/log/mdsd.err

# Info log (check for DCR loading and heartbeat)
/var/opt/microsoft/azuremonitoragent/log/mdsd.info

# Fluentbit log (check for file tailing issues)
/var/opt/microsoft/azuremonitoragent/log/fluentbit.log
```

### 14.7 SSH Command Patterns

When running sudo through SSH with sshpass:
```bash
# Use -S flag to read password from stdin, redirect stderr
echo 'password' | sudo -S command 2>/dev/null
```

---

## 15. Post-Implementation Tasks (Optional)

- [ ] Create Azure Workbook dashboard for log visualization
- [ ] Configure alert rules for Neo4j errors
- [ ] Configure alert rules for Nginx 5xx errors
- [ ] Consider adding Neo4j `debug.log` to collection (higher volume, JSON format)
- [ ] Set up action groups for alert notifications (email, Teams, etc.)

---

## 16. Access Instructions

**View logs in Azure Portal:**
1. Navigate to: Azure Portal > Log Analytics workspaces > ASOS-AI-Logs > Logs
2. Run KQL queries:

```kusto
// View recent Nginx access logs
NginxAccess_CL
| top 100 by TimeGenerated desc
| project TimeGenerated, RawData

// View Nginx errors
NginxError_CL
| top 100 by TimeGenerated desc

// View Neo4j logs (when available)
Neo4jLogs_CL
| top 100 by TimeGenerated desc

// Count records by table
union NginxAccess_CL, NginxError_CL, Neo4jLogs_CL
| summarize count() by Type
```
