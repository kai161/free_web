import { sanitizeAnalyticsEvent } from './analytics-core.mjs';
import { CUSTOM_EVENTS_ENABLED } from './analytics-config.mjs';

// Existing Vercel HTML integration: no new SDK, identity, cookies or storage.
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.va('beforeSend', event => sanitizeAnalyticsEvent(event, {
  origin: window.location.origin,
  referrer: document.referrer,
  eventsEnabled: CUSTOM_EVENTS_ENABLED,
}));
const script = document.createElement('script');
script.src = '/_vercel/insights/script.js';
script.defer = true;
document.head.appendChild(script);

export function emitCompressorEvent(payload) {
  if (!CUSTOM_EVENTS_ENABLED || !payload) return;
  // Bound the queue when a blocker or offline device prevents loading the script.
  if (!window.vai && (window.vaq?.length || 0) >= 20) return;
  try { window.va?.('event', payload); } catch { /* Compression remains usable. */ }
}
