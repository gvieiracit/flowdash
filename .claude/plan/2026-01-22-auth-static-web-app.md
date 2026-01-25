# Azure Static Web App - Authentication Setup
## NeoDash Dashboard Authentication (Entra ID / Azure AD)

### Overview
| Environment | URL | Authentication |
|-------------|-----|----------------|
| Production | https://gentle-sea-048057803.3.azurestaticapps.net | Optional |
| Staging/Preview | Auto-generated per PR | Required |

---

## Step 1: Create a Branch for Testing

Don't apply directly to master. Create a branch first:

```bash
git checkout -b feature/add-authentication
```

---

## Step 2: Create Configuration File

Create `staticwebapp.config.json` in your `./gallery` folder:

### Option A: Authentication on ALL environments (Production + Staging)

```json
{
  "routes": [
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "responseOverrides": {
    "401": {
      "redirect": "/.auth/login/aad",
      "statusCode": 302
    }
  }
}
```

### Option B: Authentication ONLY on Staging (Preview environments)

```json
{
  "routes": [
    {
      "route": "/*",
      "allowedRoles": ["authenticated", "anonymous"]
    }
  ],
  "responseOverrides": {
    "401": {
      "redirect": "/.auth/login/aad",
      "statusCode": 302
    }
  }
}
```

Then in Azure Portal → Static Web App → **Configuration**:
- Select **Protect staging environments only**
- Requires **Standard** hosting plan

### Option C: Authentication on Production, Open Staging (for testing)

Keep staging open for testing, protect production:

```json
{
  "routes": [
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "responseOverrides": {
    "401": {
      "redirect": "/.auth/login/aad",
      "statusCode": 302
    }
  }
}
```

Apply config only when merging to master (production).

---

## Step 3: Commit and Create Pull Request

```bash
git add gallery/staticwebapp.config.json
git commit -m "Add authentication config"
git push origin feature/add-authentication
```

Then in GitHub:
1. Go to your repository
2. Click **Compare & pull request**
3. Create PR against `master`

---

## Step 4: Test in Preview Environment

Once PR is created:
1. Azure auto-deploys a **preview environment**
2. Check PR comments for preview URL (e.g., `https://gentle-sea-048057803-preview.3.azurestaticapps.net`)
3. Test authentication works
4. Verify NeoDash loads after login

---

## Step 5: Merge to Production

If preview works:
1. Merge PR to master
2. Production auto-deploys with authentication

---

## Authentication Flow

```
User visits URL
       ↓
Redirect to Microsoft Login
       ↓
User enters Azure AD credentials
       ↓
Redirect back to NeoDash
       ↓
Dashboard loads
```

---

## Useful URLs

| Action | URL |
|--------|-----|
| Login (Entra ID) | `/.auth/login/aad` |
| Login (GitHub) | `/.auth/login/github` |
| Logout | `/.auth/logout` |
| User info | `/.auth/me` |

---

## Role Management (Optional)

To restrict to specific users:

1. Azure Portal → Static Web App → **Role management**
2. Click **Invite**
3. Enter user email
4. Assign role (e.g., `reader`, `admin`)

Update config to use custom roles:

```json
{
  "routes": [
    {
      "route": "/*",
      "allowedRoles": ["admin", "reader"]
    }
  ]
}
```

---

## File Location

```
your-repo/
├── gallery/
│   ├── index.html
│   ├── staticwebapp.config.json  ← config file here
│   └── ...
├── .github/
│   └── workflows/
└── README.md
```

---

## Rollback

If something goes wrong:
1. Delete or rename `staticwebapp.config.json`
2. Commit and push
3. Authentication removed
