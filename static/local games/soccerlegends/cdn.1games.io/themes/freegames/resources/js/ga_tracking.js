
function sendEventToGA(eventName, params) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    } else {
        console.warn('GA4 is not loaded. Event not sent.');
    }
}