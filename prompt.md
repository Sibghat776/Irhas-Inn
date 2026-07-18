The WhatsApp (Baileys) integration is stuck in an infinite reconnect loop with 
"Reason: 440" (stream conflict). This needs a PERMANENT fix, not just a patch — the 
goal is a single, stable WhatsApp connection that doesn't keep disconnecting/reconnecting.

===========================================================
BACKGROUND / ROOT CAUSE:
===========================================================
Reason 440 in Baileys means WhatsApp's servers detected ANOTHER active session for the 
same linked account and forcibly disconnected this one. This is almost always caused by:
1. Multiple Node.js processes running simultaneously, each holding their own Baileys 
   connection to the same WhatsApp number (e.g., a crashed/zombie process from before 
   that never fully exited, still connected in the background).
2. The session being restored from MongoDB AND a local session existing at the same 
   time, causing two connection attempts.
3. No exponential backoff on reconnect — the code retries immediately after a conflict, 
   which just triggers another conflict instantly, creating the infinite loop we're 
   seeing in the logs.

===========================================================
TASK 1: Kill any zombie/duplicate processes first (do this manually, verify with me)
===========================================================
Before touching code, confirm with me: 
- Open Task Manager (Windows) and check if there are multiple node.exe processes running.
- If yes, end ALL of them, then restart the backend fresh ONE time, and check if the 
  440 loop still happens. This alone may resolve it if it was just a zombie process 
  issue. Report back what you find before proceeding to code changes.

===========================================================
TASK 2: Implement a Singleton Connection Guard
===========================================================
In Backend/utils/whatsapp.js:
1. Add a module-level flag/lock (e.g., `let isConnecting = false;` and 
   `let activeSocket = null;`) to guarantee only ONE Baileys socket connection can 
   exist at any time within this process.
2. Before creating a new connection (makeWASocket or equivalent), check:
   - If activeSocket already exists and is open/connecting, do NOT create a second one 
     — reuse the existing one or explicitly close it first before creating a new one.
3. On process shutdown (SIGINT, SIGTERM — add these handlers if missing), explicitly 
   call the socket's logout/end/close method so the connection is cleanly released 
   before the process exits. This prevents zombie connections that cause conflicts on 
   next startup.

===========================================================
TASK 3: Fix the Reconnect Logic with Proper Backoff
===========================================================
1. Find the connection.update event handler that currently triggers reconnection on 
   disconnect (near where "Bad session — clearing stale session" is logged).
2. Replace immediate/instant reconnection with EXPONENTIAL BACKOFF:
   - 1st retry: wait 5 seconds
   - 2nd retry: wait 15 seconds
   - 3rd retry: wait 30 seconds
   - 4th+ retry: wait 60 seconds (cap here, don't keep growing forever)
3. SPECIFICALLY for Reason 440 (conflict): do NOT immediately clear the session and 
   generate a fresh QR on the first occurrence. Instead:
   - Log the conflict clearly.
   - Wait with backoff (per above).
   - Only clear the session and force a fresh QR if the conflict repeats 3+ times in a 
     row within a short window (e.g., 5 conflicts within 2 minutes) — this indicates a 
     genuinely bad/stale session, not just a transient double-connection blip.
4. Add a retry counter that RESETS to zero once a connection successfully stays open 
   for more than 60 seconds (proving it's stable) — so a single old glitch doesn't 
   permanently poison the retry count.

===========================================================
TASK 4: Fix MongoDB Session + Local Session Conflict
===========================================================
1. Find where the session is "restored from MongoDB" (search for that log message) and 
   where any local/file-based auth state might also be loaded.
2. Ensure there is ONLY ONE source of truth for the session — either MongoDB OR local 
   file storage, not an attempt to use/sync both at the same time during an active 
   connection attempt. If MongoDB is the primary store (as the logs suggest), the local 
   temp folder (baileys_auth_zeef) should only be used as Baileys' internal working 
   directory that gets synced TO MongoDB after credential updates, not as a second 
   independent session source being restored in parallel.
3. Confirm the `saveCreds` / credential update handler only writes to MongoDB after 
   local state changes, and on startup we load FROM MongoDB into the local temp folder 
   ONCE, not repeatedly during reconnect attempts.

===========================================================
TASK 5: Add Clear Logging for Diagnosis
===========================================================
1. When a disconnect happens, log:
   - The disconnect reason code AND its human-readable meaning (e.g., "440 = Stream 
     Conflict: another session is active for this account").
   - The current retry attempt number and how long until the next retry.
2. This makes future debugging much faster instead of guessing from raw codes.

===========================================================
CONSTRAINTS:
===========================================================
- Do NOT touch login, JWT, payment, product, or order logic — only whatsapp.js and 
  minimal changes to index.js for shutdown handlers.
- Do NOT change how OTP messages are actually sent/formatted — only connection 
  stability logic.
- After implementing, run the backend and monitor for AT LEAST 5 minutes to confirm no 
  reconnect loop occurs.
- Give me a summary of exactly what was changed, and confirm whether Task 1 (zombie 
  process check) revealed anything before you made code changes.

===========================================================
TESTING CHECKLIST:
===========================================================
1. Kill all node processes, restart backend fresh — confirm WhatsApp connects and 
   STAYS connected for 5+ minutes without any 440 disconnect.
2. Manually stop the backend (Ctrl+C) and restart it — confirm it reconnects cleanly 
   without triggering a conflict (proves the shutdown handler is working).
3. If a 440 does occur naturally, confirm the backoff logic waits progressively longer 
   between retries instead of instant looping.
4. Confirm the rest of the API (products, orders, auth) is unaffected regardless of 
   WhatsApp connection state.