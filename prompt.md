Task: Fix the push notification subscription system in this project. Users are unable to subscribe to notifications — debug and fix the issue.

Files involved:
Backend:
- Controllers/pushNotificationController.js
- Models/PushSubscription.js
- Routes/pushNotificationRoute.js
- index.js
- utils/commonFunctions.js
- utils/webpush.js

Frontend:
- next.config.ts
- public/push-handlers.js
- public/webpush-config.json
- src/app/Admin/Notifications/page.tsx
- src/app/components/Sidebar.tsx
- src/app/ClientLayout.tsx
- src/app/Components/NotificationPrompt.tsx
- src/app/layout.tsx
- src/app/utils/notificationClient.ts
- src/app/worker/index.js

Requirements:
1. Convert all Urdu text/comments in the code to English.
2. Fix the subscription bug so users can successfully subscribe.
3. Replace all error handling (currently using alert()) with toast notifications instead.
4. Do NOT make any other changes to the project.
5. Ask for my permission before making any changes — explain what you plan to do first, then wait for approval.