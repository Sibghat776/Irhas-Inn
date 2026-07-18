The Users page in the Admin panel is supposed to show a role-change dropdown 
(User / Reseller Admin) for me (the super admin) so I can promote/demote users without 
touching .env. This was reportedly implemented before, but it's NOT showing up / NOT 
working for me currently. Diagnose and fix this end-to-end.

===========================================================
CONTEXT — LIKELY ROOT CAUSE:
===========================================================
We recently discovered my own user account was missing the `role` field entirely in 
MongoDB (the migration script apparently failed to set it). The dropdown UI in 
Frontend/src/app/Admin/Users/page.tsx is conditionally rendered based on:

  const isSuperAdmin = currentUserRole === "superadmin";

If `currentUserRole` was never correctly populated as "superadmin" (because my role 
field was missing/wrong), this condition would be false, and I'd only see a read-only 
badge instead of the dropdown — which matches what I'm experiencing. Confirm this is 
still the issue after the earlier role-field fix, and fix whatever is still broken.

===========================================================
STEP 1: Verify My Account's Role End-to-End
===========================================================
1. Query my user document directly in MongoDB again right now and show me the current 
   value of `role` and `isAdmin` for ullahsibghat786@gmail.com — confirm the earlier 
   fix actually stuck (role: "superadmin" should be present).
2. Trace how `currentUserRole` gets into the Frontend Users page component — find 
   where it's set (likely from Redux auth state, populated from a /me or /login 
   response). Confirm the API response for the currently logged-in user actually 
   includes `role: "superadmin"` in its JSON payload right now (test this directly, 
   don't assume).
3. If the backend user object being returned to the frontend does NOT include the 
   `role` field (e.g., a controller uses .select() with a limited field list that 
   excludes "role", or an older serialization/response shape is still in use 
   somewhere), find every place a user object is returned to the frontend after login/
   auth-check and make sure `role` is always included.

===========================================================
STEP 2: Fix Whatever Is Broken
===========================================================
Based on what Step 1 reveals, fix the specific gap — likely one of:
(a) The role field still isn't correctly set in the DB for my account → re-run/fix the 
    migration and confirm via direct DB query.
(b) The role field is correctly in the DB but isn't included in the API response the 
    frontend receives after login → update the relevant controller(s) to include role 
    in the returned user object.
(c) The role field reaches the frontend correctly but isn't being stored/read properly 
    in Redux state → find the auth slice and confirm role is captured and accessible 
    as currentUserRole in the Users page.

===========================================================
STEP 3: Confirm the Dropdown Actually Renders and Works
===========================================================
1. After the fix, log in as me (superadmin) and navigate to Admin > Users.
2. Confirm every user row EXCEPT my own shows an actual <select> dropdown (not just a 
   badge) with "User" and "Reseller Admin" options.
3. Confirm my own row shows a read-only "Super Admin" badge with NO dropdown (this 
   restriction should still work correctly).
4. Test actually changing one test user's role via the dropdown:
   - Confirm the confirmation dialog appears.
   - Confirm confirming it calls the PATCH /api/v1/admin/users/:userId/role endpoint 
     successfully.
   - Confirm the UI updates immediately to reflect the new role without a page reload.
   - Confirm a success toast appears.
5. Test changing that same user back to "User" role and confirm it also works.

===========================================================
STEP 4: Add a Safety Net So This Doesn't Silently Break Again
===========================================================
1. Add a console.log (dev-only, or behind a debug flag) in the Users page component 
   that logs the resolved currentUserRole value on mount, so if this ever silently 
   fails again, it's immediately visible in the browser console instead of just 
   quietly showing badges instead of dropdowns with no explanation.
2. Optionally, if currentUserRole is undefined/missing entirely (not just non-
   superadmin), show a small warning message in the UI like "Unable to verify admin 
   role — please refresh or log in again" instead of silently defaulting to the 
   restricted view, so it's clear something is wrong versus me just not being 
   superadmin.

===========================================================
CONSTRAINTS:
===========================================================
- Do NOT touch login, JWT, payment, WhatsApp, or email logic.
- Do NOT change the underlying role-change API logic (PATCH endpoint) unless Step 1 
  reveals it's actually broken too — focus on why the DROPDOWN ISN'T RENDERING first.
- Show me the exact root cause you find in Step 1 before making changes.
- After fixing, give me a full summary of every file changed and confirm you tested 
  the actual dropdown interaction (not just that the code compiles).

===========================================================
PRIORITY:
===========================================================
This is a continuation of the earlier role-field bug — please check if that fix fully 
resolved things or if there's still a gap between the database, the API response, and 
the frontend state. Walk through the full chain (DB → API → Redux → Component) and 
confirm each link works before declaring this done.