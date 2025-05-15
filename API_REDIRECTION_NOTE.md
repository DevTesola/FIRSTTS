# API Endpoint Redirection

## Staking API Consolidation (May 2025)

To eliminate code duplication and maintain consistency within the application, we've implemented a redirection pattern for certain API endpoints. This document explains the approach and rationale.

### Overview

Previously, some API functionality was duplicated across multiple endpoints. For example, staking statistics could be accessed from:

- `/api/getStakingStats.js` (legacy endpoint)
- `/api/staking/getStakingStats.js` (canonical endpoint)

This caused maintenance issues when changes needed to be propagated to multiple files, and sometimes led to inconsistent behavior.

### Solution

1. Designate one endpoint as the "canonical" endpoint (typically the one in a more structured path)
2. Convert the legacy endpoint to a thin redirection layer that:
   - Validates required parameters
   - Loads and executes the canonical endpoint handler
   - Returns the same response structure

### Implementation

For each redirected endpoint, we use a pattern like this:

```javascript
export default async function handler(req, res) {
  // 1. Validate method and parameters
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }
  
  try {
    // 2. Load and execute the canonical endpoint handler
    const canonicalHandler = require('../staking/getStakingStats').default;
    return await canonicalHandler(req, res);
  } catch (error) {
    // 3. Handle errors
    return sendError(res, 'Redirection error', 500, 'REDIRECT_ERROR', error);
  }
}
```

### Benefits

- **Single Source of Truth:** All business logic lives in one file
- **Consistency:** All requests are handled by the same code
- **Backward Compatibility:** Legacy endpoints continue to work
- **Future Maintainability:** Updates only need to be made in one place

### Affected Endpoints

| Legacy Endpoint | Canonical Endpoint |
|-----------------|-------------------|
| `/api/getStakingStats` | `/api/staking/getStakingStats` |
| `/api/getStakingInfo` | `/api/staking/getStakingInfo` |

### Next Steps

1. Over time, update client code to use the canonical endpoints directly
2. Add deprecation notices to legacy endpoints
3. Eventually, consider removing legacy endpoints in a future major version

For any questions, contact the development team.

---

*Last updated: May 14, 2025*