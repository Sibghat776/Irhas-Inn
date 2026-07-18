Currently, reseller admin access is controlled via a hardcoded ADMIN_EMAILS list in the 
.env file, requiring a manual .env edit + server restart every time I want to promote/
demote a user. I want to move this to the database so I (the super admin) can change a 
user's role directly from the Admin > Users page in the UI, with no .env editing or 
redeploys needed.

===========================================================
TASK 1: Add a Role Field to the User Model (Database)
===========================================================
1. In Backend/Models/Users.js, add a new field:
   role: { 
     type: String, 
     enum: ["user", "admin", "superadmin"], 
     default: "user" 
   }

2. Write a one-time migration/seed step (a small script or a check at server startup) 
   that:
   - Finds the user matching process.env.SUPER_ADMIN_EMAIL and sets their role to 
     "superadmin" in the database (if not already set).
   - Finds any users currently matching process.env.ADMIN_EMAILS and sets their role 
     to "admin" in the database (if not already set), so existing resellers don't lose 
     access during the migration.
   - This should run automatically once on server startup (idempotent — safe to run 
     every time without creating duplicates or overwriting a manually-changed role), 
     OR as a one-time script I run manually — pick whichever is safer and explain your 
     choice.

===========================================================
TASK 2: Update the Role Resolver to Use the Database (Not .env)
===========================================================
1. Find the role-resolving logic added previously (the function that currently checks 
   process.env.SUPER_ADMIN_EMAIL and process.env.ADMIN_EMAILS to determine a user's 
   role in the auth middleware).
2. Change it to instead read req.user.role directly from the database record (since 
   the authenticated user's document is already fetched during auth, or fetch it if 
   needed).
3. IMPORTANT EXCEPTION: Keep process.env.SUPER_ADMIN_EMAIL as an additional hard-coded 
   safety check ONLY for the superadmin — meaning even if someone tampers with the 
   database and changes my role field by mistake or via a bug, if my email still 
   matches SUPER_ADMIN_EMAIL in .env, I should ALWAYS be treated as superadmin 
   (env takes priority over DB for this one specific email, as a fail-safe). For every 
   other user, the DB role field is the single source of truth.
4. ADMIN_EMAILS in .env is no longer used for authorization after this change — leave 
   it in .env untouched for now (don't delete it) but stop reading from it in the auth 
   logic, since the database role field replaces it.

===========================================================
TASK 3: Backend API — Role Management Endpoint
===========================================================
1. Create a new admin-only API endpoint (e.g., PATCH /api/v1/admin/users/:userId/role) 
   that:
   - Requires the requester to be authenticated AND have role === "superadmin" 
     (use the requireSuperAdmin middleware from before — reuse it, don't duplicate 
     logic).
   - Accepts a body like { role: "admin" } or { role: "user" }.
   - Validates the new role is one of the allowed enum values ("user" or "admin" only 
     — do NOT allow this endpoint to set someone to "superadmin"; that should never be 
     settable through the UI, only via the .env safety check in Task 2, to prevent 
     accidental or malicious privilege escalation to full superadmin).
   - Prevents the superadmin from changing their OWN role through this endpoint (add a 
     check: if userId === req.user._id, reject with a clear error like "You cannot 
     change your own role").
   - Updates the target user's role field in the database.
   - Returns the updated user object (or at least confirmation + new role) in the 
     response.
2. Add proper error handling: user not found (404), invalid role value (400), 
   unauthorized (403 if not superadmin).

===========================================================
TASK 4: Frontend — Add Role Management UI to Users Page
===========================================================
1. In Frontend/src/app/Admin/Users/page.tsx, for each user row in the table:
   - Show their current role clearly (e.g., a colored badge: "User" = gray, 
     "Admin" (Reseller) = blue, "Super Admin" = gold/purple — make superadmin visually 
     distinct and non-editable).
   - Add a role-change control (dropdown or toggle) ONLY visible to superadmin viewers, 
     with options: "User" and "Admin" (Reseller). Do NOT show an option to set someone 
     as "Super Admin" from the UI at all.
   - For the row representing the superadmin's OWN account, disable/hide the role 
     control entirely (matches the backend restriction from Task 3) — show their badge 
     as read-only "Super Admin".
   - When a role is changed via the dropdown, call the new PATCH endpoint from Task 3, 
     show a loading state on that row while the request is in flight, and show a 
     success/error toast on completion.
   - After a successful change, update the UI immediately to reflect the new role 
     (optimistic update or refetch that user's data) without requiring a full page 
     reload.

2. Add a confirmation step before changing a role (e.g., a simple confirm dialog: 
   "Make [username] an Admin? They will be able to add and manage their own products." 
   or "Remove admin access from [username]? They will lose access to the Admin panel." ) 
   — this prevents accidental clicks from instantly changing access levels.

===========================================================
TASK 5: Ensure Immediate Effect (No Re-login Required)
===========================================================
1. Check how the user's role is currently used on the frontend after login (likely 
   stored in Redux auth state from the JWT payload or a /me endpoint call).
2. If the role is embedded in the JWT itself, changing it in the database won't reflect 
   until the user gets a new token (re-login) — decide with me: either
   (a) Have the auth middleware always re-check the LATEST role from the database on 
       every request (not trust a stale value baked into the JWT), which means role 
       changes apply instantly without requiring the affected user to log out/in, OR
   (b) If role is only in the JWT and re-checking on every request is not feasible, 
       clearly tell me this limitation so I'm aware a role change requires the affected 
       user to log out and back in to take effect.
   Prefer option (a) if it doesn't require major restructuring — it's the better user 
   experience.

===========================================================
CONSTRAINTS:
===========================================================
- Do NOT touch login, signup, OTP, JWT generation, or Google OAuth logic beyond what's 
  needed for Task 5's role-checking behavior.
- Do NOT touch payment, WhatsApp, email, or push notification logic.
- Do NOT allow the "superadmin" role to be settable through any UI or API endpoint — 
  it must only ever be determined by matching process.env.SUPER_ADMIN_EMAIL, as a 
  hard-coded, non-database-editable safety mechanism.
- After implementing, run a TypeScript/syntax check on all touched files.
- Give me a full summary of every file changed and what was modified, BEFORE deploying.

===========================================================
TESTING CHECKLIST:
===========================================================
1. Restart the backend after adding the migration — confirm my account 
   (ullahsibghat786@gmail.com) shows as "superadmin" in the database automatically.
2. Confirm any previously-configured ADMIN_EMAILS users still have "admin" role in the 
   database after migration (no loss of access).
3. Log in as superadmin → go to Admin > Users → confirm I can see role badges for all 
   users, and I can change a regular user to "Admin" via the dropdown.
4. Confirm the promoted user (without logging out/in, if Task 5 option (a) was 
   implemented) can now see the Admin panel button and access their scoped Products/
   Orders/Analytics pages as built previously.
5. Confirm I (superadmin) CANNOT change my own role — the control should be disabled/
   hidden on my own row.
6. Confirm attempting to call the role-change API directly (e.g., via Postman) as a 
   non-superadmin user gets rejected with 403.
7. Confirm attempting to set someone's role to "superadmin" via the API is rejected 
   (enum validation should block this, plus the explicit endpoint restriction).
8. Demote that same user back to "User" via the dropdown → confirm they lose Admin 
   panel access.