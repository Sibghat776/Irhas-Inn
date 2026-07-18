The backend server is crashing and exiting completely due to an unhandled error in the 
WhatsApp (Baileys) session cleanup logic. This crash brings down the entire Node process, 
which is why ALL API calls from the frontend are failing (not a separate bug — the 
server is simply not running when this happens).

===========================================================
ERROR DETAILS:
===========================================================
Error: ENOTEMPTY, Directory not empty: baileys_auth_zeef folder
at rmSync (node:fs:1222)
at clearAuthBackup (Backend/utils/whatsapp.js:154)
at EventEmitter.<anonymous> (Backend/utils/whatsapp.js:264)

Context: WhatsApp session disconnected with reason 440 (session replaced/conflict), 
triggering an attempt to clear the stale auth session folder before generating a fresh 
QR code. On Windows, files in this temp folder are sometimes still locked/in-use by 
another handle at the exact moment of deletion, causing fs.rmSync to fail with ENOTEMPTY. 
Since this happens inside an async event handler with no try-catch, it becomes an 
unhandled rejection that crashes the whole Node process.

===========================================================
TASK 1: Fix the crash at the source (whatsapp.js)
===========================================================
1. Open Backend/utils/whatsapp.js and find the clearAuthBackup function (around line 154) 
   and the event listener that calls it (around line 264).

2. Wrap the fs.rmSync call in a try-catch block so a failed deletion NEVER crashes the 
   process. On failure, just log a warning and continue (the folder can be cleaned up 
   next time, or via a retry).

3. Update the fs.rmSync call to be more resilient:
   - Ensure it uses { recursive: true, force: true, maxRetries: 3, retryDelay: 200 } — 
     the maxRetries/retryDelay options specifically help with Windows file-lock timing 
     issues by retrying the delete a few times before giving up.
   - Even with these options, still wrap in try-catch as a final safety net, since 
     maxRetries can still be exhausted.

4. If the deletion ultimately fails even after retries, do NOT throw — just console.warn 
   the failure and proceed with generating a new QR/session (Baileys can usually still 
   work with a fresh session even if the old folder wasn't fully cleaned, or fall back 
   to using a new differently-named session folder if the old one won't clear).

===========================================================
TASK 2: Add a global safety net (defense in depth)
===========================================================
1. In Backend/index.js (or wherever the Express app entry point is), check if there are 
   already handlers for:
   process.on('unhandledRejection', ...)
   process.on('uncaughtException', ...)

2. If these don't exist, add them so that ANY future unexpected error (from WhatsApp, 
   push notifications, or anywhere else) gets logged clearly instead of silently killing 
   the whole server. Log the full error with a clear "[CRITICAL]" prefix and, if using 
   nodemon in dev, let the process exit gracefully so nodemon restarts it — but in 
   production, log it to a file/monitoring service instead of just crashing silently.

3. Do NOT use this as an excuse to swallow errors everywhere — this is specifically a 
   last-resort safety net so one broken feature (WhatsApp OTP) can't take down the 
   entire API for products/orders/users/etc. The real fix is Task 1; this is backup 
   protection.

===========================================================
TASK 3: Verify other Baileys error handling
===========================================================
1. Review the rest of Backend/utils/whatsapp.js for any other fs operations (readdir, 
   writeFile, unlink, etc.) related to session management, and confirm they're all 
   wrapped in try-catch too — not just the one that crashed today.

2. Confirm that a WhatsApp disconnection/reconnection failure NEVER prevents the rest 
   of the app (products, orders, auth, push notifications) from working. WhatsApp OTP 
   should be an isolated, optional feature — if it fails, the core store must keep 
   running.

===========================================================
CONSTRAINTS:
===========================================================
- Do NOT touch login, JWT, payment, or push notification logic.
- Do NOT change how WhatsApp OTP works when it succeeds — only fix the crash-on-failure 
  behavior.
- After the fix, run the backend and manually verify: even if you delete/corrupt the 
  baileys_auth_zeef folder before starting, the server should log a warning and keep 
  running — not crash.

===========================================================
TESTING CHECKLIST:
===========================================================
1. Start the backend normally — confirm no crash on WhatsApp connect/disconnect cycles.
2. Manually lock or partially delete files in the baileys_auth_zeef temp folder while 
   the server is running, then trigger a disconnect (or restart) — confirm the server 
   logs a warning instead of crashing.
3. Confirm all other API endpoints (products, orders, auth) keep working even if 
   WhatsApp session cleanup fails.
4. Once fixed, restart the backend fully and confirm the frontend can fetch data again 
   (this failure was the actual cause of "API hit ho rahi hai lekin fail ho rahi hai" — 
   the server was down, not a separate bug).