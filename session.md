# Session Notes

## Vercel Build Fix - Root Directory Configuration (August 20, 2026)

### Problem
Vercel deployment was failing with ENOENT error:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/vercel/path0/package.json'
```

Additionally, a schema validation error occurred when trying to fix it:
```
The `vercel.json` schema validation failed with the following message: should NOT have additional property `root`
```

### Root Cause
Repository structure:
- Root level: Static HTML files + `vercel.json`
- `next-app/` directory: Actual Next.js application + `package.json`

Vercel was looking for `package.json` at the root level, but it existed in the `next-app/` subdirectory.

### Solution
**Moved `vercel.json` configuration from root to `next-app/` directory:**

1. **Deleted**: Root `vercel.json` (had invalid `root` property)
2. **Updated**: `next-app/vercel.json` with merged configuration:
   - Build commands: `next build`, `next dev`
   - Framework: Next.js
   - Regions: iad1
   - Environment variables: `NEXT_PUBLIC_TURBOPACK_ENABLED=false`
   - Cron jobs for social publishing, syncing, and HubSpot integration

### Configuration Details

**File**: `next-app/vercel.json`
```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_TURBOPACK_ENABLED": "false"
  },
  "crons": [
    {
      "path": "/api/cron/social-publish",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/social-sync",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/hubspot-sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Outcome
- ✅ Deployment successful
- ✅ Application live at https://hopetech.me
- ✅ All 61 output items compiled correctly
- ✅ Lambda functions deployed successfully

### Key Learnings
1. Vercel doesn't support `root` property in `vercel.json`
2. For subdirectory projects, place configuration in the actual project directory
3. Vercel auto-detects Next.js apps when configuration is in the correct location
4. Cron jobs configuration should be in the same `vercel.json` as build settings

### Commit
```
Fix Vercel build - Move configuration to next-app directory

- Move vercel.json configuration from root to next-app/ directory
- Remove invalid 'root' property that caused schema validation error
- Merge build settings and cron jobs into single next-app/vercel.json
- Allows Vercel to auto-detect Next.js app in correct subdirectory
```

---
*Session maintained for tracking important fixes and solutions*
