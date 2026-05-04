// Web Push subscription helper
// Uses apiCall() from shared/js/api.js

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function ensurePushSubscribed() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { ok: false, reason: 'unsupported', detail: 'Service workers or Push API not supported in this browser.' };
    }

    // Do not trigger permission prompts automatically.
    // Dashboards will only call this when permission is already granted.
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return { ok: false, reason: 'permission', detail: `Notification permission is ${('Notification' in window) ? Notification.permission : 'unsupported'}.` };
    }

    // Register SW at site root so it can receive pushes
    let registration;
    try {
        registration = await navigator.serviceWorker.register('/appointment_system/sw.js');
    } catch (e) {
        return { ok: false, reason: 'sw-failed', detail: String(e && e.message ? e.message : e) };
    }

    // If already subscribed, keep it
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
        await sendSubscriptionToServer(existing);
        return { ok: true, already: true };
    }

    const keyRes = await apiCall('/push/vapid-public-key', { method: 'GET' });
    if (!keyRes || !keyRes.ok) {
        return { ok: false, reason: 'no-key', detail: 'Server did not provide a VAPID public key (API down or not configured).' };
    }

    const { publicKey } = await keyRes.json();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    let subscription;
    try {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
        });
    } catch (e) {
        return { ok: false, reason: 'subscribe-failed', detail: String(e && e.message ? e.message : e) };
    }

    await sendSubscriptionToServer(subscription);
    return { ok: true, already: false };
}

async function sendSubscriptionToServer(subscription) {
    const json = subscription.toJSON();
    const res = await apiCall('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys
        })
    });

    if (!res || !res.ok) {
        // best-effort; don't block the UI
        console.warn('Failed to register push subscription');
    }
}

async function subscribeAndExplainOnce() {
    const result = await ensurePushSubscribed();
    return result;
}
