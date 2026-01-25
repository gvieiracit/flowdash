# Neo4j Azure VM Migration Guide
## Blue/Green Deployment: D4s_v3 → E4bds_v5 + Premium SSD

### Overview
| Environment | VM Size | Purpose | DNS |
|-------------|---------|---------|-----|
| UAT (current) | D4s_v3 (4 vCPU, 16GB) | Testing/backup | neo4jgraph.uksouth.cloudapp.azure.com |
| Prod (new) | E4bds_v5 (4 vCPU, 32GB) + P30 SSD | Production | neo4jprod.uksouth.cloudapp.azure.com |

---

## Phase 1: Create Snapshot

1. Go to **Azure Portal** → Search **"Disks"**
2. Find your Neo4j OS disk
3. Click **Create snapshot**
   - Name: `neo4j-snapshot-YYYY-MM-DD`
   - Snapshot type: **Full**
   - Storage type: **Standard HDD**
4. Click **Review + Create** → **Create**

---

## Phase 2: Create Managed Disk from Snapshot

1. Go to **Snapshots** → Select your snapshot
2. Click **Create disk**
3. Configure:
   - Name: `neo4j-prod-osdisk`
   - Region: **UK South**
   - Size: **128 GiB (P10)**
   - Disk type: **Premium SSD**
4. Click **Review + Create** → **Create**

---

## Phase 3: Create New VM from Cloned Disk

**Important:** Create the VM FROM the disk (Disks → select disk → Create VM)

### 3.1 Basics tab
- Resource group: Select your resource group
- VM name: `Neo4jGraphServerProd`
- Region: **UK South**
- Availability zone: **Zone 1**
- Security type: **Trusted launch virtual machines**
- Image: Auto-selected from disk
- Size: **Standard_E4bds_v5** (4 vCPUs, 32GB RAM, 12100 IOPS)
- License type: **Other**

### 3.2 Disks tab
- **OS disk:** 128 GiB, Premium SSD LRS, Delete with VM: unchecked
- **Data disk:** Click "Create and attach a new disk"
  - Name: `Neo4jGraphServerProd_DataDisk_0`
  - Size: **1024 GiB (P30)** - 5000 IOPS
  - Type: **Premium SSD LRS**
  - Host caching: **Read-only**
  - Delete with VM: **Unchecked**

### 3.3 Networking tab
- Virtual network: Same as current VM
- Subnet: Same as current VM
- Public IP: Create new (Standard, Static)
- NIC NSG: **Advanced** → Select existing NSG from current VM

### 3.4 Other tabs
- Management, Monitoring, Advanced, Tags: **Default settings**

### 3.5 Post-deployment
- Configure DNS: VM → Public IP → Configuration → DNS label: `neo4jprod`

---

## Phase 4: Configure SSH Access

If you missed downloading the SSH key during VM creation:

1. Go to VM → **Help** → **Reset password**
2. Mode: **Reset password**
3. Username: `azureuser`
4. Password: (create strong password)
5. Click **Update**

**Connect:**
```bash
ssh azureuser@neo4jprod.uksouth.cloudapp.azure.com
```

---

## Phase 5: Fix Hostname

The cloned VM has the old hostname. Fix immediately:

```bash
sudo hostnamectl set-hostname Neo4jGraphServerProd
sudo nano /etc/hosts
```

Change `127.0.0.1 Neo4jGraphServer` to `127.0.0.1 Neo4jGraphServerProd`

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
exec bash
```

---

## Phase 6: Configure Data Disk

### 6.1 Verify Neo4j is running
```bash
sudo systemctl status neo4j
```
Press `q` to exit.

### 6.2 Find the new disk
```bash
lsblk
```
Look for ~1TB unformatted disk (likely `/dev/sda`)

### 6.3 Format and mount
```bash
sudo mkfs.ext4 /dev/sda
```

Note the UUID from output, then:

```bash
sudo mkdir -p /data/neo4j
sudo nano /etc/fstab
```
Add this line at the end:
```
UUID=YOUR-UUID /data/neo4j ext4 defaults,nofail 0 2
```
Save (`Ctrl+O`, `Enter`, `Ctrl+X`) and mount:
```bash
sudo mount -a
sudo chown -R neo4j:neo4j /data/neo4j
df -h | grep neo4j
```

---

## Phase 7: Move Neo4j Data to New Disk

### 7.1 Stop Neo4j
```bash
sudo systemctl stop neo4j
```

### 7.2 Copy data and logs
```bash
sudo cp -rp /var/lib/neo4j/data /data/neo4j/
sudo cp -rp /var/log/neo4j /data/neo4j/logs
```

### 7.3 Verify directories
```bash
ls -la /data/neo4j/
```

### 7.4 Update Neo4j config
```bash
sudo nano /etc/neo4j/neo4j.conf
```

Change these lines:
```
server.directories.data=/data/neo4j/data
server.directories.logs=/data/neo4j/logs
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 7.5 Start and verify
```bash
sudo systemctl start neo4j
sudo systemctl status neo4j
```

### 7.6 Test database connection
```bash
cypher-shell -u neo4j -p YOUR_PASSWORD -d neo4j "RETURN 1"
```

---

## Phase 8: SSL Certificate

### 8.1 Check current SSL config
```bash
sudo cat /etc/neo4j/neo4j.conf | grep -i ssl
```

### 8.2 Check existing certificate hostname
```bash
openssl x509 -in /var/lib/neo4j/certificates/bolt/public.crt -text -noout | grep -A1 "Subject:"
```

### 8.3 Generate new certificate
```bash
sudo systemctl stop neo4j
sudo lsof -i :80
```

If nginx is using port 80:
```bash
sudo systemctl stop nginx
```

Generate cert:
```bash
sudo certbot certonly --standalone -d neo4jprod.uksouth.cloudapp.azure.com
```

### 8.4 Copy cert to Neo4j directory
```bash
sudo cp /etc/letsencrypt/live/neo4jprod.uksouth.cloudapp.azure.com/fullchain.pem /var/lib/neo4j/certificates/bolt/public.crt
sudo cp /etc/letsencrypt/live/neo4jprod.uksouth.cloudapp.azure.com/privkey.pem /var/lib/neo4j/certificates/bolt/private.key
sudo chown neo4j:neo4j /var/lib/neo4j/certificates/bolt/*
```

### 8.5 Restart services
```bash
sudo systemctl start nginx
sudo systemctl start neo4j
```

---

## Phase 9: Update Nginx Config

### 9.1 Check nginx for old hostname
```bash
sudo nginx -T | grep server_name
```

### 9.2 Find files with old hostname
```bash
sudo grep -r "neo4jgraph" /etc/nginx/
```

### 9.3 Replace old hostname with new
```bash
sudo sed -i 's/neo4jgraph/neo4jprod/g' /etc/nginx/sites-available/neo4j
```

### 9.4 Verify replacement
```bash
sudo grep -r "neo4jgraph" /etc/nginx/
```

### 9.5 Test and reload nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Phase 10: Update NeoDash

### Connection Architecture
Nginx proxies SSL on port 443 to Neo4j Bolt on 7687:

| Service | URL | Port |
|---------|-----|------|
| Neo4j Browser | http://neo4jprod.uksouth.cloudapp.azure.com:7474 | 7474 (direct) |
| Bolt via Nginx | neo4j+s://neo4jprod.uksouth.cloudapp.azure.com:443 | 443 (SSL proxy) |

### NeoDash Connection Settings
- **Protocol:** `neo4j+s://`
- **Host:** `neo4jprod.uksouth.cloudapp.azure.com`
- **Port:** `443` (not 7687 - nginx handles SSL)
- **Username:** `neo4j`
- **Password:** your password
