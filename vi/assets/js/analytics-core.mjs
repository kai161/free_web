const paths = new Set(['/', '/index.html', '/nen-anh.html', '/tao-mat-khau-ngau-nhien.html', '/dem-ky-tu.html', '/dinh-dang-json.html', '/quyen-rieng-tu.html', '/gioi-thieu.html']);
const names = new Set(['image_compress_started', 'image_compress_completed', 'image_compress_failed', 'image_download_requested']);
const targets = new Set(['100kb', '200kb', '1mb', '2mb', 'custom']);
const reasons = new Set(['dimensions', 'unsupported_output', 'processing']);
const formats = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', jpg: 'jpg', png: 'png', webp: 'webp' };

export function compressorEvent(name, fields = {}) {
  if (!names.has(name)) return null;
  const data = {
    target: targets.has(fields.target) ? fields.target : 'unknown',
    format: Object.hasOwn(formats, fields.format) ? formats[fields.format] : 'unknown',
  };
  if (name === 'image_compress_completed' || name === 'image_download_requested') {
    data.result = fields.metTarget === true || fields.result === 'met' ? 'met' : 'unmet';
  }
  if (name === 'image_compress_failed') data.reason = reasons.has(fields.reason) ? fields.reason : 'processing';
  return { name, data };
}

export function sanitizeAnalyticsEvent(event, { origin, referrer = '', eventsEnabled = false }) {
  try {
    // Vercel adds document.referrer after beforeSend. Suppress events when it
    // could contain a private path/query; never patch fetch or transmit it raw.
    if (referrer) {
      const from = new URL(referrer);
      if (!['http:', 'https:'].includes(from.protocol) || from.username || from.password || from.pathname !== '/' || from.search || from.hash) return null;
    }
    const url = new URL(event.url);
    if (url.origin !== origin || url.username || url.password || !paths.has(url.pathname)) return null;
    const clean = { type: event.type, url: `${url.origin}${url.pathname}` };
    if (event.type === 'pageview') return clean;
    if (event.type !== 'event' || !eventsEnabled) return null;
    const payload = compressorEvent(event.payload?.name, event.payload?.data);
    return payload ? { ...clean, payload } : null;
  } catch {
    return null;
  }
}

export function createCompressionRun(emit, fields) {
  const context = compressorEvent('image_compress_started', fields).data;
  let status = 'running';
  let metTarget = false;
  let downloaded = false;
  const send = (name, extra = {}) => {
    try { emit(compressorEvent(name, { ...context, ...extra })); } catch { /* Metrics must never interrupt the tool. */ }
  };
  send('image_compress_started');
  return {
    complete(met) {
      if (status !== 'running') return;
      status = 'completed';
      metTarget = met === true;
      send('image_compress_completed', { metTarget });
    },
    fail(reason) {
      if (status !== 'running') return;
      status = 'failed';
      send('image_compress_failed', { reason });
    },
    download() {
      if (status !== 'completed' || downloaded) return;
      downloaded = true;
      send('image_download_requested', { metTarget });
    },
    cancel() { status = 'cancelled'; },
  };
}
