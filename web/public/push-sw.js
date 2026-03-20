// Push notification handler — imported by Workbox-generated service worker
// Handles push events when the app is closed or in background

self.addEventListener("push", (event) => {
  let data = { title: "Sofia EthCC", body: "New notification" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: "/Treepl/images/icon-192.png",
    badge: "/Treepl/images/icon-192.png",
    tag: data.tag || "sofia-push",
    data: { url: data.url || "/Treepl/home" },
    vibrate: [200, 100, 200],
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/Treepl/home";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes("/Treepl") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});
