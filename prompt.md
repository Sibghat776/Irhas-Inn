Tu mera ZeeF Trendy Store project mein Web Push Notifications implement kar.

PROJECT STRUCTURE:
Backend folder (Express.js) + Frontend folder (Next.js)

BACKEND TASKS (Express/Node.js):
1. Models/PushSubscription.js - database schema banao
   - userId, endpoint, auth, p256dh keys store karne ke liye
   - timestamps add kar
   
2. Routes/notifications.js - 3 routes create kar:
   - POST /api/notifications/subscribe - subscription save karna
   - POST /api/notifications/send - notification bhejne ke liye (admin protected)
   - POST /api/notifications/unsubscribe - unsubscribe karna

3. Controllers/notificationController.js - logic implement kar:
   - subscribeUser() - subscription object receive karke DB mein save karna
   - sendNotification() - web-push library use karke sab users ko notification bhejne ka logic
   - unsubscribeUser() - subscription delete karna
   - handlePushErrors() - subscription invalid ho to handle karna

4. utils/webpush.js - web-push configuration:
   - webpush.setVapidDetails() setup
   - sendToSubscription() function jo actual push bheje
   
5. Backend package.json mein add karo:
   - "web-push": "^3.6.x"

FRONTEND TASKS (Next.js):
1. public/sw.js (Service Worker) - background notification handler:
   - push event listener
   - notification click handler
   - notification close handler
   - background sync (optional)

2. public/webpush-config.json:
   - VAPID_PUBLIC_KEY export karna

3. src/utils/notificationClient.ts:
   - requestPermission() function
   - subscribe() function - subscription generate karke backend ko bhejne ka
   - unsubscribe() function
   - checkPermissionStatus() function

4. src/components/NotificationSetup.tsx:
   - Button: "Enable Notifications"
   - Permission check
   - Loading states
   - Success/error messages
   - Unsubscribe option

5. Frontend package.json mein add karo:
   - No extra packages needed (browser native APIs)

ENVIRONMENT VARIABLES:

Backend (.env):
VAPID_SUBJECT=mailto:ullahsibghat786@gmail.com
VAPID_PUBLIC_KEY=[user will provide]
VAPID_PRIVATE_KEY=[user will provide]
DATABASE_URL=your_mongodb_connection
NODE_ENV=development

Frontend (.env.local):
NEXT_PUBLIC_VAPID_PUBLIC_KEY=[user will provide - same as backend]
NEXT_PUBLIC_API_URL=http://localhost:5000 (ya aapka backend URL)

WORKFLOW:
1. User Frontend pe click -> "Enable Notifications"
2. Browser permission popup
3. Permission granted -> Service Worker register + subscription create
4. Subscription object backend ko bhej (POST /api/notifications/subscribe)
5. Backend DB mein save kare
6. Admin jab chaye, notification bhej sake (POST /api/notifications/send with {title, body, link})
7. Web-push service ke through sab subscribed users ko push jaaye
8. Service Worker background mein catch karke notification show kare
9. User click kare to intended page pe redirect ho

IMPORTANT:
- Error handling: subscription invalid/expired ho to gracefully handle karna
- Duplicate prevention: same user multiple subscriptions na create kare
- Security: /api/notifications/send route ko admin check ke saath protect karna
- CORS: Frontend aur Backend ke liye configure karna
- Testing: postman/curl se test karna sending notification ka

File Locations Final:

BACKEND:
Backend/
├── Models/PushSubscription.js
├── Controllers/notificationController.js
├── Routes/notifications.js
├── utils/webpush.js
└── package.json (web-push add karna)

FRONTEND:
Frontend/
├── public/
│   ├── sw.js
│   └── webpush-config.json
├── src/
│   ├── components/NotificationSetup.tsx
│   ├── utils/notificationClient.ts
│   └── app/layout.tsx (NotificationSetup component import karna)
└── .env.local (VAPID key)

Output Format:
- Har file ka complete, production-ready code
- Comments mein samjhao kya ho raha hai
- Error handling implement karna
- Mongoose schema example (MongoDB ke liye)
- Backend me subscription list + delete logic bhi de
- Database migration guide (agar zaroori ho)
- Testing guide - kaise locally test karenage
- Security best practices include kar

VAPID Keys Note:
User baad mein VAPID keys dega - main placeholder ke saath code de. User keys fill karega.

Shuru kar! 🚀