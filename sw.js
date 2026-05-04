self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: 'Notification', body: event.data ? event.data.text() : '' };
    }

    const appName = data.appName || 'STIConnect';
    const baseTitle = data.title || 'Notification';
    const title = baseTitle.startsWith(appName) ? baseTitle : `${appName} — ${baseTitle}`;

    const accountEmail = data.accountEmail ? String(data.accountEmail).trim() : '';
    const baseBody = data.body || '';
    const body = accountEmail ? `Account: ${accountEmail}\n${baseBody}` : baseBody;

    const options = {
        body,
        tag: data.tag || undefined,
        data: {
            url: data.url || '/appointment_system/index.html'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification && event.notification.data && event.notification.data.url) || '/appointment_system/index.html';

    event.waitUntil((async () => {
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        const absoluteUrl = new URL(url, self.location.origin).href;

        const matching = allClients.find(c => c.url === absoluteUrl);
        if (matching) {
            await matching.focus();
            return;
        }
        await clients.openWindow(absoluteUrl);
    })());
});
