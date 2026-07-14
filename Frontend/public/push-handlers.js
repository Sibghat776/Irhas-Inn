// Web Push Notification handlers for ZeeF Trendy Store
// Yeh file sw.js ke saath importScripts ke zariye load hoti hai

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "ZeeF Trendy Store", body: event.data.text(), link: "/" };
  }

  const options = {
    body: data.body || "",
    icon: "/Logo.png",
    badge: "/Logo.png",
    data: { link: data.link || "/" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "ZeeF Trendy Store", options)
  );
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
