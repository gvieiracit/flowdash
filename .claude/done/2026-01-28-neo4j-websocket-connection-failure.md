# Production Fix Plan: Neo4j WebSocket Connection Failure

**Date:** January 28, 2026
**Environment:** Production (https://flowdash-asos.ciandt.com/)
**Affected System:** Neo4j Database Proxy (nginx)
**Server:** neo4jprod.uksouth.cloudapp.azure.com
**Status:** ✅ Implemented successfully on January 28, 2026 at 10:03 UTC
**Backup File:** `/etc/nginx/sites-available/neo4j.backup.20260128_100149`

---

## 1. Problem Description

### 1.1 User-Reported Symptoms

Starting January 27, 2026, users reported the following errors when accessing FlowDash:

**Error 1 - Initial Connection:**
```
Unable to establish connection
WebSocket connection failure. Due to security constraints in your web browser,
the reason for the failure is not available to this Neo4j Driver. Please use
your browsers development console to determine the root cause of the failure.
WebSocket `readyState` is: 3
```

**Error 2 - After Page Refresh:**
```
Unable to load dashboard "My Dashboard".
WebSocket connection failure. Due to security constraints in your web browser...
WebSocket `readyState` is: 3
```

### 1.2 Impact on Users

- Users cannot connect to the FlowDash application
- Dashboards fail to load
- Application is effectively unusable
- Issue is intermittent but frequent

---

## 2. Root Cause Analysis

### 2.1 Investigation Summary

| Check | Result |
|-------|--------|
| Neo4j Service | Running (since Jan 22, 00:19) |
| Neo4j Port 7687 | Listening and accepting connections |
| SSL Certificate | Valid (expires Apr 21, 2026) |
| DNS Resolution | Working (resolves to 20.77.114.211) |
| Direct WebSocket to :7687 | **Works** (101 Switching Protocols) |
| WebSocket through nginx :443 | **Fails** (connection resets) |

### 2.2 Architecture Overview

```
┌──────────────┐      HTTPS/WSS      ┌──────────────┐      HTTP/WS       ┌──────────────┐
│   Browser    │ ──────────────────► │    Nginx     │ ─────────────────► │    Neo4j     │
│  (FlowDash)  │       :443          │  (SSL Term)  │       :7687        │   (Bolt)     │
└──────────────┘                     └──────────────┘                    └──────────────┘
```

### 2.3 Protocol Stack

The communication uses multiple protocol layers:

```
┌─────────────────────────────┐
│      Bolt Protocol          │  ← Binary database queries
├─────────────────────────────┤
│      WebSocket              │  ← Transport framing
├─────────────────────────────┤
│      HTTPS/TLS              │  ← Encryption (nginx terminates)
├─────────────────────────────┤
│      TCP                    │  ← Network
└─────────────────────────────┘
```

**Important:** Bolt is a **binary protocol**, not HTTP. It requires immediate byte-by-byte transmission without buffering.

### 2.4 Root Cause Identified

**The nginx reverse proxy is buffering Bolt protocol messages.**

Current nginx configuration:
```nginx
location / {
    proxy_pass http://localhost:7687;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
}
```

**Problems with this configuration:**

1. **Missing `proxy_buffering off`** - Nginx buffers responses, delaying Bolt messages
2. **Missing `proxy_request_buffering off`** - Nginx buffers requests, delaying handshake
3. **Missing `proxy_send_timeout`** - No explicit send timeout configured

### 2.5 Evidence from Logs

**Neo4j logs (`/data/neo4j/logs/neo4j.log`) show:**

```
2026-01-28 09:24:14 ERROR - ClientTimeoutException: Terminated connection 'bolt-14190'
as the client failed to authenticate within 30000 ms.
```

```
2026-01-26 10:22:55 ERROR - Failed to transmit operation result: Response write failure
Caused by: Connection reset by peer
```

```
2026-01-27 11:47:27 ERROR - Increase in network aborts detected (more than 2 network
related connection aborts over a period of 600000 ms)
```

**Interpretation:**
- Bolt handshake messages are delayed by nginx buffering
- Neo4j times out waiting for authentication (30 second limit)
- Connections are reset because data cannot be transmitted

---

## 3. Solution

### 3.1 Fix Overview

Add buffering and timeout directives to the nginx configuration to ensure Bolt protocol messages are passed through immediately without buffering.

### 3.2 Configuration Changes

**File:** `/etc/nginx/sites-available/neo4j` (symlinked from `/etc/nginx/sites-enabled/neo4j`)

> **Important:** The nginx configuration uses symlinks. The actual config files are in `sites-available/`, and `sites-enabled/` contains symlinks to them. Always edit the file in `sites-available/`.

**Current Configuration:**
```nginx
server {
    server_name neo4jprod.uksouth.cloudapp.azure.com;

    location / {
        proxy_pass http://localhost:7687;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/neo4jprod.uksouth.cloudapp.azure.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neo4jprod.uksouth.cloudapp.azure.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

**New Configuration (changes in the `location /` block only):**
```nginx
server {
    server_name neo4jprod.uksouth.cloudapp.azure.com;

    location / {
        proxy_pass http://localhost:7687;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Disable buffering for WebSocket/Bolt protocol
        proxy_buffering off;
        proxy_request_buffering off;

        # Timeouts for long-running connections (24 hours)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        # Disable caching
        proxy_cache off;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/neo4jprod.uksouth.cloudapp.azure.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neo4jprod.uksouth.cloudapp.azure.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

### 3.3 Explanation of New Directives

| Directive | Purpose | Why Needed |
|-----------|---------|------------|
| `proxy_buffering off` | Disables response buffering | Bolt binary messages must be sent immediately to the client |
| `proxy_request_buffering off` | Disables request buffering | Bolt handshake messages must reach Neo4j immediately |
| `proxy_send_timeout 86400s` | Sets send timeout to 24 hours | Prevents nginx from closing idle WebSocket connections |
| `proxy_cache off` | Disables caching | Ensures no interference with live WebSocket data |

---

## 4. Impact Assessment

### 4.1 Expected Positive Impacts

| Impact | Description |
|--------|-------------|
| Connection stability | WebSocket connections will no longer timeout during Bolt handshake |
| No more authentication failures | Handshake messages will pass immediately, completing within timeout |
| No more "Connection reset" | Data will flow without buffering-related resets |
| Reduced error rate | Network abort errors in Neo4j logs will decrease significantly |

### 4.2 Potential Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Brief connection drop during reload | Expected | Reload is graceful (~1 second disruption) |
| Configuration syntax error | Low | Test with `nginx -t` before applying |
| Unexpected behavior | Low | Immediate rollback plan available |

### 4.3 Service Disruption

- **During deployment:** ~1-2 seconds (graceful reload)
- **If rollback needed:** ~1-2 seconds (graceful reload)

---

## 5. Implementation Steps

### 5.1 Pre-Implementation Checklist

- [ ] SSH access to server verified
- [ ] Backup plan understood
- [ ] Rollback commands ready
- [ ] Monitoring dashboards open (optional)

### 5.2 Step-by-Step Procedure

#### Step 1: Connect to Server
```bash
ssh gvieira@neo4jprod.uksouth.cloudapp.azure.com
```

#### Step 2: Create Backup
```bash
sudo cp /etc/nginx/sites-available/neo4j /etc/nginx/sites-available/neo4j.backup.$(date +%Y%m%d_%H%M%S)
```

> **⚠️ Critical:** Always create backups in `sites-available/`, NEVER in `sites-enabled/`. Creating files directly in `sites-enabled/` will cause nginx to load them as additional configurations, resulting in "duplicate default server" errors.

#### Step 3: Verify Backup Created
```bash
ls -la /etc/nginx/sites-available/
```
Expected: See `neo4j.backup.YYYYMMDD_HHMMSS` file

#### Step 4: Edit Configuration
```bash
sudo nano /etc/nginx/sites-available/neo4j
```

Find the `location /` block and replace it with:
```nginx
    location / {
        proxy_pass http://localhost:7687;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Disable buffering for WebSocket/Bolt protocol
        proxy_buffering off;
        proxy_request_buffering off;

        # Timeouts for long-running connections (24 hours)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        # Disable caching
        proxy_cache off;
    }
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

#### Step 5: Test Configuration Syntax
```bash
sudo nginx -t
```
**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**If syntax error:** Do NOT proceed. Fix the error or restore backup.

#### Step 6: Apply Configuration
```bash
sudo systemctl reload nginx
```

#### Step 7: Verify Nginx is Running
```bash
sudo systemctl status nginx
```
**Expected:** `Active: active (running)`

#### Step 8: Test Application
Open https://flowdash-asos.ciandt.com/ in browser and verify:
- [ ] No "Unable to establish connection" error
- [ ] Dashboard loads successfully
- [ ] Data displays correctly

---

## 6. Testing Procedure

### 6.1 Immediate Tests (After Deployment)

| Test | How to Verify | Expected Result |
|------|---------------|-----------------|
| Nginx status | `sudo systemctl status nginx` | Active (running) |
| App loads | Open https://flowdash-asos.ciandt.com/ | No WebSocket error |
| Dashboard works | Click on a dashboard | Data loads |
| Browser console | F12 → Console tab | No WebSocket errors |

### 6.2 WebSocket Connection Test
```bash
curl -i -N --max-time 10 \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  "https://neo4jprod.uksouth.cloudapp.azure.com:443/"
```
**Expected:** `HTTP/1.1 101 Switching Protocols`

### 6.3 Monitor Neo4j Logs (15-30 minutes)
```bash
tail -f /data/neo4j/logs/neo4j.log
```
**Expected:** No new "network aborts" or "Connection reset" errors

---

## 7. Rollback Plan

### 7.1 When to Rollback

Rollback immediately if:
- Nginx fails to start after reload
- Application is completely inaccessible
- Errors are worse than before

### 7.2 Rollback Procedure

#### Quick Rollback (< 1 minute)
```bash
# 1. SSH to server (if not connected)
ssh gvieira@neo4jprod.uksouth.cloudapp.azure.com

# 2. List backups to find the timestamp
ls -la /etc/nginx/sites-available/

# 3. Restore backup (replace YYYYMMDD_HHMMSS with actual timestamp)
# For this implementation, the backup is: neo4j.backup.20260128_100149
sudo cp /etc/nginx/sites-available/neo4j.backup.20260128_100149 /etc/nginx/sites-available/neo4j

# 4. Test configuration
sudo nginx -t

# 5. Reload nginx
sudo systemctl reload nginx

# 6. Verify nginx is running
sudo systemctl status nginx
```

### 7.3 Emergency Recovery (If Nginx Won't Start)

```bash
# Stop nginx
sudo systemctl stop nginx

# Restore backup
sudo cp /etc/nginx/sites-available/neo4j.backup.20260128_100149 /etc/nginx/sites-available/neo4j

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
```

### 7.4 If All Else Fails

```bash
# Check nginx error log for details
sudo tail -100 /var/log/nginx/error.log

# If config is completely broken, restore and restart
sudo cp /etc/nginx/sites-available/neo4j.backup.20260128_100149 /etc/nginx/sites-available/neo4j
sudo systemctl restart nginx
```

---

## 8. Quick Reference

### 8.1 Key Commands

| Action | Command |
|--------|---------|
| SSH to server | `ssh gvieira@neo4jprod.uksouth.cloudapp.azure.com` |
| Backup config | `sudo cp /etc/nginx/sites-available/neo4j /etc/nginx/sites-available/neo4j.backup.$(date +%Y%m%d_%H%M%S)` |
| Edit config | `sudo nano /etc/nginx/sites-available/neo4j` |
| Test syntax | `sudo nginx -t` |
| Apply changes | `sudo systemctl reload nginx` |
| Check status | `sudo systemctl status nginx` |
| View nginx errors | `sudo tail -50 /var/log/nginx/error.log` |
| View Neo4j logs | `tail -f /data/neo4j/logs/neo4j.log` |

### 8.2 Key Files

| File | Purpose |
|------|---------|
| `/etc/nginx/sites-available/neo4j` | Nginx Neo4j proxy configuration (source file) |
| `/etc/nginx/sites-enabled/neo4j` | Symlink to sites-available/neo4j (active config) |
| `/data/neo4j/logs/neo4j.log` | Neo4j application logs |
| `/data/neo4j/logs/debug.log` | Neo4j debug logs |
| `/var/log/nginx/error.log` | Nginx error logs |

### 8.3 Key URLs

| URL | Purpose |
|-----|---------|
| https://flowdash-asos.ciandt.com/ | Production application |
| neo4jprod.uksouth.cloudapp.azure.com:443 | Neo4j proxy endpoint |
| neo4jprod.uksouth.cloudapp.azure.com:7687 | Neo4j direct (blocked by client firewall) |

---

## 9. Post-Implementation

### 9.1 Success Criteria

- [ ] No WebSocket connection errors in FlowDash
- [ ] Dashboards load successfully
- [ ] No new "network aborts" in Neo4j logs for 30+ minutes
- [ ] Users confirm issue is resolved

### 9.2 Monitoring (Next 24-48 Hours)

- Monitor Neo4j logs for any new connection errors
- Check with users if they experience any issues
- Review nginx error logs for any anomalies

### 9.3 Documentation

After successful implementation:
- Document the change in your change management system
- Update any infrastructure documentation
- Note the backup file location for future reference

---

## 10. Appendix

### 10.1 Why Port 443 Instead of 7687?

The client's network blocks non-standard ports. Only ports 80 and 443 are allowed outbound. Therefore:
- Nginx terminates SSL on port 443
- Nginx proxies to Neo4j on localhost:7687
- This allows the application to work through corporate firewalls

### 10.2 Why Not Use nginx Stream Module?

The current nginx installation does not have the stream module compiled in:
```
nginx -V 2>&1 | grep stream
# No output = stream module not available
```

The stream module would allow raw TCP proxying, which is more reliable for binary protocols. However, the HTTP proxy with buffering disabled should work for WebSocket/Bolt.

### 10.3 Alternative Solutions (If Option 1 Fails)

1. **Install nginx with stream module:** `sudo apt install nginx-full`
2. **Use HAProxy:** Better WebSocket/binary protocol support
3. **Use Azure Application Gateway:** Native WebSocket support with SSL termination

---

## 11. Lessons Learned (Implementation Notes)

This section documents issues encountered during actual implementation and their solutions.

### 11.1 Nginx Configuration File Structure

**Issue:** The plan initially referenced `/etc/nginx/sites-enabled/default`, but the actual Neo4j configuration was in a separate file.

**Discovery:** The server uses a split configuration:
```
/etc/nginx/sites-available/
├── default      # General nginx config
└── neo4j        # Neo4j proxy config (THIS IS THE FILE TO EDIT)

/etc/nginx/sites-enabled/
├── default -> /etc/nginx/sites-available/default  (symlink)
└── neo4j -> /etc/nginx/sites-available/neo4j      (symlink)
```

**Lesson:** Always check the actual nginx configuration structure before making changes. Use `ls -la /etc/nginx/sites-enabled/` to identify symlinks and their targets.

### 11.2 Backup Location Critical

**Issue:** Creating a backup directly in `sites-enabled/` caused nginx to fail with "duplicate default server" error.

**What happened:**
```bash
# WRONG - This creates a new config file that nginx tries to load
sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.xxx
# Results in: nginx: [emerg] a duplicate default server for 0.0.0.0:80
```

**Solution:** Always create backups in `sites-available/`, never in `sites-enabled/`:
```bash
# CORRECT - Backup in sites-available (nginx won't load it)
sudo cp /etc/nginx/sites-available/neo4j /etc/nginx/sites-available/neo4j.backup.xxx
```

**Lesson:** The `sites-enabled/` directory should ONLY contain symlinks. Any actual files placed there will be loaded by nginx as additional configurations.

### 11.3 Remote SSH Command Execution with sudo

**Issue:** Running `sudo` commands through SSH with `sshpass` requires special handling because there's no TTY for password input.

**What failed:**
```bash
sshpass -p 'xxx' ssh user@host "sudo some_command"
# Error: sudo: a terminal is required to read the password
```

**Solution:** Use `sudo -S` to read password from stdin:
```bash
sshpass -p 'xxx' ssh user@host "echo 'xxx' | sudo -S some_command 2>/dev/null"
```

### 11.4 Heredoc Through SSH Doesn't Work Reliably

**Issue:** Using heredoc to write multi-line config files through SSH + sshpass doesn't work reliably.

**What failed:**
```bash
sshpass -p 'xxx' ssh user@host "sudo tee /etc/nginx/... << 'EOF'
config content
EOF"
# File content was not updated correctly
```

**Solution:** Use a temp file approach:
```bash
sshpass -p 'xxx' ssh user@host "
# Create temp file with config content
cat > /tmp/config.tmp << 'ENDOFFILE'
config content here
ENDOFFILE

# Copy temp file to destination with sudo
echo 'password' | sudo -S cp /tmp/config.tmp /etc/nginx/sites-available/neo4j
"
```

### 11.5 Neo4j Log File Location

**Issue:** The plan referenced `/var/log/neo4j/` but the actual logs were in a different location.

**Discovery:** Neo4j was configured with a custom log directory:
- Config setting: `server.directories.logs=/data/neo4j/logs`
- Actual logs: `/data/neo4j/logs/neo4j.log`
- Old/stale logs: `/var/log/neo4j/neo4j.log` (not updated since restart)

**Lesson:** Always verify log locations by checking the Neo4j configuration:
```bash
cat /etc/neo4j/neo4j.conf | grep -i log
```

### 11.6 Summary of Correct Commands

For future reference, here are the verified working commands:

```bash
# SSH with password (using sshpass)
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no user@host "commands"

# Sudo with password via stdin
echo 'PASSWORD' | sudo -S command 2>/dev/null

# Create backup (correct location)
sudo cp /etc/nginx/sites-available/neo4j /etc/nginx/sites-available/neo4j.backup.$(date +%Y%m%d_%H%M%S)

# Edit config using temp file approach
cat > /tmp/nginx.tmp << 'EOF'
server {
    # config here
}
EOF
echo 'PASSWORD' | sudo -S cp /tmp/nginx.tmp /etc/nginx/sites-available/neo4j

# Test and reload
sudo nginx -t && sudo systemctl reload nginx

# View correct Neo4j logs
tail -f /data/neo4j/logs/neo4j.log
```
