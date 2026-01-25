# User Audit Logging for Form Changes

## Problem Statement

When users make changes to the Neo4j database through FlowDash forms, there is no record of:
- **Who** made the change (user identity)
- **When** the change was made (timestamp)

This is needed for accountability, compliance, and debugging purposes.

---

## Prerequisites

- Entra ID authentication enabled (PR #1 - in progress)
- User info available via `/.auth/me` endpoint

---

## Options

### Option A: Frontend - Modify Forms Extension

**Approach:** Update the Forms extension to fetch the current user and inject user/timestamp into Cypher queries.

**How it works:**
1. When a form submits, fetch `/.auth/me` to get user info
2. Add `$currentUser` and `$currentTimestamp` as parameters to the Cypher query
3. Form creators use these parameters in their queries

**Example usage in form Cypher:**
```cypher
MERGE (n:Record {id: $recordId})
SET n.data = $formData,
    n.modifiedBy = $currentUser,
    n.modifiedAt = $currentTimestamp
```

**Pros:**
- Simple implementation
- Form creators have full control
- No backend changes needed

**Cons:**
- Requires form creators to remember to add audit fields
- Not automatic - can be bypassed if forgotten
- User info visible in browser (not a security issue, just visibility)

**Effort:** Low-Medium (2-4 hours)

---

### Option B: Frontend - Automatic Audit Wrapper

**Approach:** Automatically wrap all form Cypher queries with audit logging, without requiring form creators to modify their queries.

**How it works:**
1. Intercept form submission
2. Fetch user info from `/.auth/me`
3. Execute original query
4. Automatically execute an audit log query

**Audit log structure:**
```cypher
CREATE (log:AuditLog {
  timestamp: datetime(),
  user: $userEmail,
  userId: $userId,
  action: 'FORM_SUBMIT',
  formName: $formName,
  query: $executedQuery
})
```

**Pros:**
- Automatic - cannot be bypassed
- Centralized audit trail
- No changes to existing forms needed

**Cons:**
- Creates additional nodes (storage overhead)
- More complex implementation
- May need index on AuditLog for performance

**Effort:** Medium (4-8 hours)

---

### Option C: Hybrid - Parameters + Optional Auto-Logging

**Approach:** Combine Options A and B - provide user parameters AND optional automatic logging.

**How it works:**
1. Always inject `$currentUser` and `$currentTimestamp` parameters (Option A)
2. Add a form setting "Enable audit logging" (default: off)
3. When enabled, automatically create AuditLog nodes (Option B)

**Pros:**
- Flexible - form creators choose level of auditing
- Parameters always available for inline use
- Optional centralized logging for sensitive forms

**Cons:**
- More complex implementation
- Two ways to do the same thing (could cause confusion)

**Effort:** Medium-High (6-10 hours)

---

### Option D: Backend/API Approach

**Approach:** Create a serverless API (Azure Functions) that proxies Neo4j queries and adds audit logging server-side.

**How it works:**
1. Forms send queries to Azure Function instead of directly to Neo4j
2. Function extracts user from Azure SWA headers (`x-ms-client-principal`)
3. Function executes query and logs audit trail
4. Returns result to frontend

**Pros:**
- Most secure - audit cannot be bypassed from frontend
- Server-side timestamp (more reliable)
- Can add authorization rules

**Cons:**
- Requires Azure Functions setup
- Additional infrastructure cost
- More complex architecture
- Higher latency

**Effort:** High (2-4 days)

---

## Comparison Matrix

| Criteria | Option A | Option B | Option C | Option D |
|----------|----------|----------|----------|----------|
| Implementation effort | Low | Medium | Medium-High | High |
| Automatic (can't bypass) | ❌ | ✅ | Partial | ✅ |
| Requires form changes | ✅ | ❌ | Optional | ❌ |
| Infrastructure changes | ❌ | ❌ | ❌ | ✅ |
| Security level | Basic | Basic | Basic | High |
| Storage overhead | None | Medium | Configurable | Medium |

---

## Recommendation

**For most use cases:** Start with **Option A** (simplest) or **Option B** (automatic).

- If you trust form creators to add audit fields → **Option A**
- If you want guaranteed audit trail → **Option B**
- If you need high security/compliance → **Option D**

---

## Questions to Consider

1. Do you need to audit ALL form submissions or only specific forms?
2. Should users be able to see the audit log in the dashboard?
3. Is the audit for internal tracking or compliance requirements?
4. Do you need to track failed submissions as well?

---

## Next Steps

1. Review this plan
2. Choose preferred option(s)
3. Answer the questions above
4. Request specification for chosen approach
