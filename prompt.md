There's another error in Backend/queues/socialPostQueue.js: "SyntaxError: The requested module 'bullmq' does not provide an export named 'QueueScheduler'". 

This means the installed version of bullmq no longer exports QueueScheduler (it was deprecated/removed in newer BullMQ versions since scheduling is now handled automatically by Queue/Worker).

Please:
1. Remove the QueueScheduler import and its usage from socialPostQueue.js entirely.
2. Confirm the Queue and Worker setup still handles retries correctly without it (attempts + backoff options on the Worker are sufficient).
3. Check package.json for the installed bullmq version to confirm this is the correct fix for that version.
4. Restart and confirm the server boots without errors.