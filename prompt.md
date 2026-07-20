The Gemini AI description generator is hitting a 429 quota-exceeded error in 
production because gemini-2.5-flash's free tier only allows 20 requests/day. Switch 
the model to gemini-2.5-flash-lite instead, which has a much higher free tier limit 
(1,000-1,500 requests/day as of mid-2026) — this should resolve the quota issue 
without needing to enable billing.

1. In Frontend/src/app/utils/useGeminiAI.ts, change the DEFAULT_MODEL constant from 
   "gemini-2.5-flash" to "gemini-2.5-flash-lite".
2. Keep everything else in the file exactly as-is (the thinkingConfig.thinkingBudget: 0 
   fix, the bullet-point prompt format, MIN_WORDS, maxOutputTokens, retry logic) — do 
   not change anything else.
3. Note: Flash-Lite is a lighter/faster model than full Flash. Confirm the bullet-point 
   description output quality is still acceptable by testing a few real product names 
   after the change — if quality is noticeably worse, we may need to slightly adjust 
   the prompt to be more explicit/directive since Flash-Lite may need clearer 
   instructions than full Flash did.
4. Also add graceful 429-error handling: in the catch block, detect a 429/quota-
   exceeded error specifically and show a clear toast like "Daily AI limit reached, 
   try again later or write manually" instead of a generic error, and don't 
   auto-retry on this specific error type (retrying wastes remaining quota).

Run a TypeScript check after the change. I will personally test generating a few 
descriptions to confirm quality and confirm the 429 error stops happening.