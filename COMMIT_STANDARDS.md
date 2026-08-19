# HopeTech Project Commit Standards

## Scope Restriction
**Only commit and push changes made to these specific files/pages:**

### Primary Focus Files (✅ Safe to modify):
- `next-app/public/bni/hospital-marketing-targets.html`
- `next-app/public/bni/hospital-marketing-performance.html` 
- `next-app/public/bni/hospital-marketing-admin.html`
- Related API files: `next-app/app/api/hopetech/marketing/*/route.ts`
- Related library files: `next-app/lib/target-management.ts`, `next-app/lib/performance-calculation.ts`
- Related database migrations: `supabase/migrations/*target*.sql`

### Restricted Files (❌ Do NOT modify):
- `next-app/public/hopetech-management-dashboard.html` 
- `next-app/public/hopetech-tablet-crm-complete.html`
- Core CRM and dashboard files
- Other project interfaces

## Commit Workflow
1. **Check scope**: Verify changes are only to approved files above
2. **Test locally**: Ensure changes work on the hospital marketing pages
3. **Commit**: Use clear commit messages describing hospital marketing features
4. **Push**: Only push when changes are within approved scope

## Approved Interface
The **Hospital Marketing Target & Performance Tracking Module** is the primary focus:
- Target management and tracking
- Performance analytics  
- Marketing executive dashboards
- Related API endpoints and business logic

## When in Doubt
Ask before modifying files outside the approved scope. The goal is to maintain stability of other systems while enhancing the hospital marketing functionality.