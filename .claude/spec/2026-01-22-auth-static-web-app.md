# Specification: Azure Static Web App Authentication (Entra ID)

**Plan Reference**: `.claude/plan/2026-01-22-auth-static-web-app.md`
**Option Selected**: Entra ID on both environments (test in staging first via PR)

---

## Summary

Add Entra ID (Azure AD) authentication to the FlowDash gallery Azure Static Web App. Authentication will be tested in the preview/staging environment first (via PR), and only applied to production after explicit merge approval.

---

## Deployment Strategy

| Phase | Action | Production | Staging/Preview |
|-------|--------|------------|-----------------|
| 1. PR Created | Auto-deploy preview | **Unchanged** | **Auth enabled** |
| 2. Testing | Test in preview | **Unchanged** | **Auth enabled** |
| 3. Merge (explicit) | Deploy to prod | **Auth enabled** | N/A |

**Key Point**: Production remains untouched until you explicitly request the merge.

---

## Files to Change

### 1. CREATE: `gallery/staticwebapp.config.json`

**What**: Create a new Azure Static Web Apps configuration file for Entra ID authentication.

**Where**: Root of the `gallery/` folder (alongside `package.json`, `README.md`).

**Why**: Azure Static Web Apps reads this configuration file to determine routing rules and authentication requirements. This enforces that all visitors must authenticate via Microsoft/Entra ID.

**Content**:
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

**Explanation**:
- `allowedRoles: ["authenticated"]` - Only authenticated users can access any route
- `responseOverrides.401` - Unauthenticated users are redirected to Entra ID login
- `/.auth/login/aad` - Azure's built-in Entra ID authentication endpoint

---

## Manual Steps Required

**None for testing** - The PR preview will automatically have authentication enabled.

**After merge (optional)**: If you want to restrict access to specific users:
1. Azure Portal → Static Web App → Role management
2. Invite specific users and assign roles

---

## Implementation Steps

1. Create branch `feature/add-authentication`
2. Create `gallery/staticwebapp.config.json` with the configuration above
3. Validate JSON syntax
4. Commit and push to remote
5. Create Pull Request to master
6. **Wait for Azure to deploy preview environment**
7. Test authentication in preview URL
8. **Wait for explicit merge approval from user**
9. Merge only when approved

---

## Testing Plan

### Preview Environment Testing (Before merge)
1. Azure auto-deploys preview environment when PR is created
2. Find preview URL in PR comments or Azure Portal
3. Navigate to preview URL
4. **Expected**: Redirect to Microsoft login page
5. Login with Azure AD/Entra ID credentials
6. **Expected**: Redirect back to FlowDash gallery, dashboard loads
7. Test `/.auth/me` endpoint to verify user info

### Production Testing (After merge)
1. Navigate to production URL
2. **Expected**: Redirect to Microsoft login page
3. Login and verify dashboard loads

---

## Rollback Plan

If issues occur after merge:
1. Delete `gallery/staticwebapp.config.json`
2. Commit and push to master
3. Authentication will be removed on next deployment
4. Or: Revert the merge commit

---

## Current Status

| Item | Status |
|------|--------|
| Branch | Deleted (was `feature/add-authentication`) |
| PR | [#1](https://github.com/gvieiracit/flowdash/pull/1) - **Closed** |
| Preview Test | ✅ **Passed** (2026-01-22) |
| Production | **Unchanged** |

**Status:** Implementation validated and reverted. Plan and spec retained for future implementation.

**To Implement:** Follow the steps in this spec to recreate the feature when ready.

---

## File Structure After Implementation

```
gallery/
├── staticwebapp.config.json  ← NEW FILE
├── package.json
├── README.md
├── public/
├── src/
└── ...
```
