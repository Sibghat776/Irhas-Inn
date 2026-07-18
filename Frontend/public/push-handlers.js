// Push Handlers for ZeeF Trendy Store
// This file is imported by the generated Service Worker via importScripts('/push-handlers.js')

self.addEventListener('push', event => {
  // Parse notification data
  let data = { title: 'ZeeF Trendy Store', body: '', link: '/' };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (_) {
      // Fallback to text payload
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: '/Logo.png',
    badge: '/Logo.png',
    data: { link: data.link || '/' },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'ZeeF Trendy Store', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});

// Yeh file sw.js ke saath importScripts ke zariye load hoti hai
console.log("Push handler loaded");

// self.addEventListener("push", (event) => {
//   console.log("PUSH RECEIVED");

//   console.log(event);
//   if (!event.data) return;

//   let data;
//   try {
//     data = event.data.json();
//   } catch {
//     data = { title: "ZeeF Trendy Store", body: event.data.text(), link: "/" };
//   }

//   const options = {
//     body: data.body || "",
//     icon: "/Logo.png",
//     badge: "/Logo.png",
//     data: { link: data.link || "/" },
//     vibrate: [200, 100, 200],
//   };

//   event.waitUntil(
//     self.registration.showNotification(data.title || "ZeeF Trendy Store", options)
//   );
// });

self.addEventListener("push", (event) => {

    console.log("========== PUSH RECEIVED ==========");

    console.log(event);

    console.log(event.data);

    if(event.data){

        console.log(event.data.text());

    }

});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
